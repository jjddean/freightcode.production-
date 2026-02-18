"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";

/**
 * AI Document Parser
 * Uses OpenAI GPT-4 to extract structured data from shipping documents
 */

// Check if OpenAI API key is configured
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS || 180000);

function getOllamaHeaders(ollamaUrl: string): Record<string, string> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    try {
        const hostname = new URL(ollamaUrl).hostname;
        if (hostname.endsWith(".ngrok-free.app") || hostname.endsWith(".ngrok.app")) {
            headers["ngrok-skip-browser-warning"] = "1";
        }
    } catch {
        // Ignore invalid URL parsing and use default headers.
    }
    return headers;
}

export const parseDocument = action({
    args: {
        fileData: v.string(), // Base64 or text content
        fileName: v.string(),
    },
    handler: async (ctx, args) => {
        console.log(`Analyzing document: ${args.fileName}`);

        const ollamaUrl = process.env.OLLAMA_HOST || "http://localhost:11434";
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

        try {
            const systemPrompt = `You are an AI that extracts structured data from shipping documents. 
            Return ONLY a JSON object: 
            {
                "type": "bill_of_lading" | "air_waybill" | "commercial_invoice",
                "confidence": number,
                "data": { ... }
            }`;

            const response = await fetch(`${ollamaUrl}/api/generate`, {
                method: "POST",
                headers: getOllamaHeaders(ollamaUrl),
                body: JSON.stringify({
                    model: "phi3:mini",
                    prompt: `${systemPrompt}\n\nParse this shipping document:\nFilename: ${args.fileName}\nContent: ${args.fileData.substring(0, 5000)}`,
                    stream: false,
                    format: "json"
                }),
                signal: controller.signal,
            });

            if (!response.ok) throw new Error(`Ollama failed: ${response.statusText}`);

            const result = await response.json();
            return JSON.parse(result.response);
        } catch (error: any) {
            if (error.name === 'AbortError') {
                throw new Error(`Ollama request timed out (${Math.floor(OLLAMA_TIMEOUT_MS / 1000)}s).`);
            }
            console.error("Ollama parsing failed:", error);
            throw new Error(`Document parsing failed. Ensure Ollama is running at ${ollamaUrl}`);
        } finally {
            clearTimeout(timeoutId);
        }
    },
});

// Real OpenAI parsing
async function parseWithOpenAI(fileData: string, fileName: string) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `You are an AI that extracts structured data from shipping documents (Bill of Lading, Air Waybill, Commercial Invoice, etc.). 
          
Extract the following information and return as JSON:
{
  "type": "bill_of_lading" | "air_waybill" | "commercial_invoice" | "unknown",
  "confidence": 0.0-1.0,
  "data": {
    "shipper": { "name": string, "address": string },
    "consignee": { "name": string, "address": string },
    "cargoDetails": {
      "description": string,
      "weight": string,
      "dimensions": string,
      "value": string
    },
    "routeDetails": {
      "origin": string,
      "destination": string
    },
    "documentNumber": string (if available),
    "date": string (if available)
  }
}

If information is missing, use null. Be accurate and extract only what you see.`,
                },
                {
                    role: "user",
                    content: `Parse this shipping document:\n\nFilename: ${fileName}\n\nContent:\n${fileData.substring(0, 10000)}`,
                },
            ],
            temperature: 0.1, // Low temperature for consistent extraction
            response_format: { type: "json_object" },
        }),
    });

    if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const result = await response.json();
    const content = result.choices[0].message.content;

    return JSON.parse(content);
}



// Helper action to check if AI is configured
export const checkAIStatus = action({
    args: {},
    handler: async () => {
        const ollamaUrl = process.env.OLLAMA_HOST || "http://localhost:11434";
        return {
            configured: true,
            provider: "Ollama (phi3:mini)",
            endpoint: ollamaUrl
        };
    },
});

export const generateAdvisory = action({
    args: { prompt: v.string() },
    handler: async (ctx, args) => {
        throw new Error("Advisory generation requires OpenAI. Local path not yet implemented.");
    }
});
