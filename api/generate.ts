// Vercel's Edge Functions don't support the full Node.js API, 
// so we'll use a standard Request/Response model compatible with their runtime.
// No need for @vercel/node dependency.

import { GoogleGenAI, Type } from "@google/genai";

// A simplified version of the Item type needed for the prompt
interface PromptItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: { 'Allow': 'POST' } });
  }

  try {
    const { itemsForPrompt, targetTotal } = await req.json() as { itemsForPrompt: PromptItem[], targetTotal: number };

    if (!itemsForPrompt || !targetTotal || !Array.isArray(itemsForPrompt) || typeof targetTotal !== 'number') {
        return new Response(JSON.stringify({ error: 'Invalid input: itemsForPrompt array and targetTotal number are required.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // In Vercel, environment variables are accessed via process.env
    // FIX: Use API_KEY as per guidelines, not GEMINI_API_KEY.
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
        // FIX: Update error message to reflect the correct environment variable name.
        console.error("API_KEY environment variable is not set.");
        return new Response(JSON.stringify({ error: 'Server configuration error.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const prompt = `From the following list of inventory items, select a combination whose total price is as close as possible to ${targetTotal.toFixed(2)}. You must respect the available quantity for each item. The final total can be slightly higher or lower. Prioritize getting as close as possible. Return a JSON array of the selected item objects, where each object represents one unit. For example, if you use an item twice, include its object two times in the array. If the inventory is empty or no combination can be made, return an empty array.

    Available Items: ${JSON.stringify(itemsForPrompt)}`;

    
      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
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

      const jsonText = response.text.trim();
      if (!jsonText) {
        // Return an empty array if AI gives no response, which the frontend handles as "not found"
        return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      
      // We don't need to parse it here, just pass the raw JSON string through.
      // The frontend can parse it.
      return new Response(jsonText, { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error("Error in serverless function:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred with the AI service.';
    return new Response(JSON.stringify({ error: 'Failed to generate invoice items.', details: errorMessage }), { status: 500, headers: { 'Content-