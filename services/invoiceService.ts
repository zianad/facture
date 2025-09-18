import { GoogleGenAI, Type } from "@google/genai";
import type { Item } from '../types';

// The local solver logic is now moved to a Web Worker to prevent UI blocking.
const solveLocallyWithWorker = async (items: Item[], target: number): Promise<Item[] | null> => {
  let worker: Worker | undefined;
  let objectURL: string | undefined;

  try {
    const response = await fetch('/services/solver.worker.ts');
    if (!response.ok) {
      throw new Error(`Failed to fetch worker script: ${response.statusText}`);
    }
    const scriptText = await response.text();
    const blob = new Blob([scriptText], { type: 'application/javascript' });
    objectURL = URL.createObjectURL(blob);

    // Create the worker using the Object URL.
    worker = new Worker(objectURL);

    // This promise will resolve/reject when the worker sends a message or errors.
    const result = await new Promise<Item[] | null>((resolve, reject) => {
      worker!.onmessage = (event: MessageEvent<Item[] | null>) => {
        resolve(event.data);
      };

      worker!.onerror = (error) => {
        console.error("Error in local solver worker:", error.message);
        reject(new Error(error.message));
      };

      worker!.postMessage({ items, target });
    });

    return result;

  } catch (error: any) {
    console.error("Failed to create or execute worker:", error.message || error);
    return null; // On failure, return null to match the expected return type.
  } finally {
    // This block ensures cleanup happens whether the promise resolves or rejects.
    if (worker) {
      worker.terminate();
    }
    if (objectURL) {
      URL.revokeObjectURL(objectURL);
    }
  }
};


// --- Heuristics for Solver Selection ---
// Threshold for switching to the AI based on item count, ONLY if the target is also high.
const HYBRID_THRESHOLD = 25;
// The local DP solver is very fast, but its memory/time usage scales with the target amount.
// We set a generous threshold below which we ALWAYS prefer the faster, more accurate local solver.
const LOCAL_SOLVER_TARGET_THRESHOLD = 50000;
// Timeout for the AI to prevent indefinite waiting.
const AI_TIMEOUT_MS = 90000; // 90 seconds


export const generateInvoiceItems = async (
  inventory: Item[],
  targetTotal: number,
  invoiceDate: string
): Promise<Item[] | null> => {
  const availableItems = inventory.filter(
    (item) => new Date(item.purchaseDate) <= new Date(invoiceDate)
  );

  if (availableItems.length === 0) {
    return null;
  }

  // --- ENHANCED HYBRID LOGIC ---
  // We use a combination of target amount and item count to decide the best solver.

  // Case 1: Target amount is within the optimal range for the local solver.
  // The local DP solver is extremely fast and provides the mathematically best answer.
  // We always prefer it for reasonably sized targets, regardless of item count.
  if (targetTotal <= LOCAL_SOLVER_TARGET_THRESHOLD) {
    console.log(`Target total (${targetTotal.toFixed(2)}) is within the optimal range for the local DP solver. Using local worker.`);
    return solveLocallyWithWorker(availableItems, targetTotal);
  }

  // Case 2: Target amount is very high. Now we consider the number of unique items.
  // If the item count is still low, the local solver can likely handle it.
  if (availableItems.length <= HYBRID_THRESHOLD) {
    console.log(`Target total is high, but inventory size (${availableItems.length}) is small. Using local worker solver.`);
    return solveLocallyWithWorker(availableItems, targetTotal);
  }

  // Case 3: Both target amount AND item count are high.
  // This is the only scenario where we rely on the AI, as the problem's complexity
  // is too high for a browser-based exact solver.
  console.log(`Problem is complex (High target and large inventory). Using Gemini AI.`);
  
  // OPTIMIZATION: Pre-filter items to reduce the search space for the AI.
  const relevantItems = availableItems.filter(item => item.price <= targetTotal);
  if (relevantItems.length === 0) {
      console.log("No relevant items found after pre-filtering.");
      return null;
  }
  
  const itemsForPrompt = relevantItems.map(({ id, name, price, quantity }) => ({
      id,
      name,
      price,
      quantity,
  }));

  const prompt = `From the following list of inventory items, select a combination whose total price is as close as possible to ${targetTotal.toFixed(2)}. You must respect the available quantity for each item. The final total can be slightly higher or lower. Prioritize getting as close as possible. Return a JSON array of the selected item objects, where each object represents one unit. For example, if you use an item twice, include its object two times in the array. If the inventory is empty or no combination can be made, return an empty array.

  Available Items: ${JSON.stringify(itemsForPrompt)}`;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // OPTIMIZATION: Add a timeout to the AI request.
    const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('AI request timed out')), AI_TIMEOUT_MS)
    );

    const aiPromise = ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              price: { type: Type.NUMBER },
            },
          },
        },
      },
    });

    const response = await Promise.race([aiPromise, timeoutPromise]);

    const jsonText = response.text.trim();
    if (!jsonText) {
      return null;
    }
    
    let selectedItemsFromAI: { id: string; price: number }[] = [];
    try {
        selectedItemsFromAI = JSON.parse(jsonText);
    } catch(e) {
        console.error("Failed to parse AI JSON response:", jsonText);
        return null; // AI response was not valid JSON
    }
    
    if (!Array.isArray(selectedItemsFromAI)) {
        console.error("AI response is not an array");
        return null;
    }

    if (selectedItemsFromAI.length === 0) {
        return null; // AI explicitly said no combination found.
    }


    // --- VALIDATION ---
    const selectedItemCounts: { [id: string]: number } = {};

    for (const aiItem of selectedItemsFromAI) {
      if (!aiItem.id || typeof aiItem.price !== 'number') {
        console.error("AI result validation failed: Malformed item object from AI.", aiItem);
        return null;
      }
      selectedItemCounts[aiItem.id] = (selectedItemCounts[aiItem.id] || 0) + 1;
    }

    // Validate quantities and existence
    const finalItems: Item[] = [];
    const inventoryMap = new Map(inventory.map(item => [item.id, item]));

    for (const id in selectedItemCounts) {
      const originalItem = inventoryMap.get(id);
      const count = selectedItemCounts[id];

      if (!originalItem) {
        console.error(`AI result validation failed: Item with id ${id} not found in inventory.`);
        return null;
      }
      if (originalItem.quantity < count) {
        console.error(`AI result validation failed: Quantity exceeded for item ${originalItem.name}. Available: ${originalItem.quantity}, Requested: ${count}`);
        return null;
      }
      
      for (let i = 0; i < count; i++) {
        finalItems.push(originalItem);
      }
    }

    return finalItems.length > 0 ? finalItems : null;

  } catch (error) {
    console.error("Error calling Gemini API or parsing response:", error);
    return null;
  }
};