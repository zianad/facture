import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// This file acts as a serverless function (e.g., on Vercel or Netlify).
// It expects a POST request with a JSON body: { "prompt": "Your prompt here" }

export default async (req: Request): Promise<Response> => {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const { prompt } = await req.json();

        if (!prompt) {
            return new Response(JSON.stringify({ error: 'Missing prompt' }), {
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
        
        // Generate content using the specified model and prompt
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const text = response.text;

        return new Response(JSON.stringify({ result: text }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error generating content:', error);
        return new Response(JSON.stringify({ error: 'Failed to generate content' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
