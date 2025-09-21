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
  console.log(`Problem is complex (High target and large inventory). Using secure serverless function.`);
  
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
  
  // The API call is now made to our secure backend function, not directly to Google.
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
    
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        itemsForPrompt,
        targetTotal,
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    const selectedItemsFromAI: { id: string; price: number }[] = await response.json();

    if (!Array.isArray(selectedItemsFromAI)) {
        console.error("API response is not an array");
        return null;
    }
    
    if (selectedItemsFromAI.length === 0) {
        return null; // AI explicitly said no combination found.
    }

    // --- VALIDATION ---
    const selectedItemCounts: { [id: string]: number } = {};

    for (const aiItem of selectedItemsFromAI) {
      if (!aiItem.id || typeof aiItem.price !== 'number') {
        console.error("API result validation failed: Malformed item object from API.", aiItem);
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
        console.error(`API result validation failed: Item with id ${id} not found in inventory.`);
        return null;
      }
      if (originalItem.quantity < count) {
        console.error(`API result validation failed: Quantity exceeded for item ${originalItem.name}. Available: ${originalItem.quantity}, Requested: ${count}`);
        return null;
      }
      
      for (let i = 0; i < count; i++) {
        finalItems.push(originalItem);
      }
    }

    return finalItems.length > 0 ? finalItems : null;

  } catch (error) {
     if (error instanceof Error && error.name === 'AbortError') {
        console.error("Error: API request timed out.");
    } else {
        console.error("Error calling serverless function or parsing response:", error);
    }
    return null;
  }
};
