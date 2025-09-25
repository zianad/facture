import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

// This file acts as a serverless function (e.g., on Vercel or Netlify).
// It expects a POST request with a JSON body: { "image": "base64-string", "mimeType": "image/png" }

export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { image, mimeType } = await req.json();

    if (!image || !mimeType) {
      return new Response(JSON.stringify({ error: 'Missing image data or mimeType' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!process.env.API_KEY) {
        return new Response(JSON.stringify({ error: 'Server configuration error: API_KEY is not set.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // Initialize the Gemini client
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const imagePart = {
        inlineData: {
            data: image,
            mimeType: mimeType,
        },
    };

    const textPart = {
        text: `From the provided image of an invoice or receipt, extract the following details: invoice number, customer name, date (in YYYY-MM-DD format), total amount, and a list of all items. For each item, provide its name, quantity, and purchase price. If a value is not present, use null. Return the result as a single JSON object.`,
    };
    
    // Define the expected JSON output schema for the model
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
          invoiceNumber: { type: Type.STRING, description: "The invoice number." },
          customerName: { type: Type.STRING, description: "The customer's name." },
          date: { type: Type.STRING, description: "The date of the invoice in YYYY-MM-DD format." },
          totalAmount: { type: Type.NUMBER, description: "The total amount of the invoice." },
          items: {
            type: Type.ARRAY,
            description: "List of items on the invoice.",
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Name of the item." },
                quantity: { type: Type.NUMBER, description: "Quantity of the item." },
                purchasePrice: { type: Type.NUMBER, description: "Price per unit of the item." },
              }
            }
          }
        }
      };

    // Generate content using the vision model and JSON schema
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        }
    });

    const text = response.text;
    
    // The response text is a JSON string guaranteed by the responseSchema config
    const jsonData = JSON.parse(text);

    return new Response(JSON.stringify(jsonData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error analyzing image:', error);
    return new Response(JSON.stringify({ error: 'Failed to analyze image' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
