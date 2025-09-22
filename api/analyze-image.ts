import { GoogleGenAI, Type } from "@google/genai";

export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: { 'Allow': 'POST' } });
  }

  try {
    const { mimeType, data } = await req.json() as { mimeType: string, data: string };

    if (!mimeType || !data) {
        return new Response(JSON.stringify({ error: 'Invalid input: mimeType and data are required.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.error("API_KEY environment variable is not set.");
        return new Response(JSON.stringify({ error: 'Server configuration error.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const ai = new GoogleGenAI({ apiKey });

    const imagePart = { inlineData: { mimeType, data } };
    const textPart = { text: "Analyze this image of a spreadsheet. Extract the data from rows under the columns titled 'REFERENCE', 'DESIGNATION', 'QUANTITE', and 'PRIX UNITAIRE'. Convert this data into a JSON array of objects according to the provided schema. Each object should represent one row. Ignore the header row and any empty or invalid rows." };
            
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [imagePart, textPart] },
        config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                reference: { type: Type.STRING, description: "From 'REFERENCE' column" },
                name: { type: Type.STRING, description: "From 'DESIGNATION' column" },
                quantity: { type: Type.INTEGER, description: "From 'QUANTITE' column" },
                price: { type: Type.NUMBER, description: "From 'PRIX UNITAIRE' column" },
                },
                required: ["reference", "name", "quantity", "price"],
            },
        },
        },
    });

    const jsonText = response.text.trim();
    if (!jsonText) {
        return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(jsonText, { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error("Error in serverless function (analyze-image):", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred with the AI service.';
    return new Response(JSON.stringify({ error: 'Failed to analyze image.', details: errorMessage }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
