// Fix: Implement Gemini API call to analyze invoice images
import { GoogleGenAI, Type } from '@google/genai';

// Assume this is run in a server-side environment where process.env.API_KEY is available.
if (!process.env.API_KEY) {
    console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const invoiceSchema = {
    type: Type.OBJECT,
    properties: {
        invoiceNumber: { type: Type.STRING, description: 'The invoice number. Can be null if not found.' },
        customerName: { type: Type.STRING, description: 'The name of the customer. Can be null if not found.' },
        date: { type: Type.STRING, description: 'The date of the invoice in YYYY-MM-DD format. Can be null if not found.' },
        totalAmount: { type: Type.NUMBER, description: 'The total amount of the invoice. Can be null if not found.' },
        items: {
            type: Type.ARRAY,
            description: 'List of items in the invoice',
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: 'Name of the item' },
                    quantity: { type: Type.NUMBER, description: 'Quantity of the item' },
                    purchasePrice: { type: Type.NUMBER, description: 'Unit price of the item' },
                },
                required: ['name', 'quantity', 'purchasePrice'],
            },
        },
    },
    required: ['items'],
};

// This is a generic handler function for a serverless environment (e.g., Vercel, Netlify, Cloudflare).
// The actual signature may vary. We'll assume a Request -> Response model compatible with Fetch API.
export default async function handler(req: Request): Promise<Response> {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
            status: 405, 
            headers: { 'Content-Type': 'application/json' } 
        });
    }

    try {
        const { image, mimeType } = await req.json();

        if (!image || !mimeType) {
            return new Response(JSON.stringify({ error: 'Missing image or mimeType' }), { 
                status: 400, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        const imagePart = {
            inlineData: {
                data: image,
                mimeType: mimeType,
            },
        };

        const textPart = {
            text: `Analyze the provided invoice image. Extract the following details: invoice number, customer's name, invoice date, total amount, and a list of all line items. For each item, extract its name, quantity, and unit price (purchase price). If a value is not present, you can return null for that field. Structure the output as a JSON object that conforms to the provided schema.`,
        };

        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: 'application/json',
                responseSchema: invoiceSchema,
            },
        });

        const jsonString = result.text;
        
        const data = JSON.parse(jsonString);

        return new Response(JSON.stringify(data), { 
            status: 200, 
            headers: { 'Content-Type': 'application/json' } 
        });

    } catch (error: any) {
        console.error('Error in /api/analyze-image:', error);
        return new Response(JSON.stringify({ error: 'Failed to analyze image', details: error.message }), { 
            status: 500, 
            headers: { 'Content-Type': 'application/json' } 
        });
    }
}
