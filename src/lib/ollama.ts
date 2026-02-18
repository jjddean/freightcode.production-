export interface OllamaResponse {
    model: string;
    created_at: string;
    response: string;
    done: boolean;
}

function getOllamaHeaders(ollamaUrl: string): Record<string, string> {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };
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

export async function askOllama(prompt: string, model?: string, format: string | undefined = "json"): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    try {
        const body: any = {
            model,
            prompt,
            stream: false
        };
        if (format) body.format = format;

        const OLLAMA_URL = import.meta.env.VITE_OLLAMA_URL || "http://localhost:11434";
        const OLLAMA_MODEL = import.meta.env.VITE_OLLAMA_MODEL || "phi3:mini";

        const response = await fetch(`${OLLAMA_URL}/api/generate`, {
            method: "POST",
            headers: getOllamaHeaders(OLLAMA_URL),
            body: JSON.stringify({
                ...body,
                model: body.model || OLLAMA_MODEL
            }),
            signal: controller.signal,
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`Model '${body.model || OLLAMA_MODEL}' not found. Try 'ollama pull ${body.model || OLLAMA_MODEL}'`);
            }
            throw new Error(`Ollama failed (Status ${response.status}).`);
        }

        const data = await response.json();
        return data.response;
    } catch (error: any) {
        if (error.name === 'AbortError') {
            throw new Error("Ollama request timed out (60s). Check if service is responsive.");
        }
        console.error("Ollama Error:", error);
        throw new Error(`Ollama connection failed: ${error.message}. Check if Ollama is running at http://localhost:11434`);
    } finally {
        clearTimeout(timeoutId);
    }
}

export const FREIGHT_PROMPT = `
You are a sophisticated FreightOps AI. 
Generate a JSON object representing a shipping document based on the filename provided.
The JSON must strictly follow this structure:
{
  "type": "bill_of_lading",
  "data": {
    "shipper": { "name": "...", "address": "..." },
    "consignee": { "name": "...", "address": "..." },
    "cargoDetails": { "description": "...", "weight": "...", "dimensions": "...", "value": "..." },
    "routeDetails": { "origin": "...", "destination": "..." }
  }
}
Generate realistic data (companies, addresses, cargo) based on the filename keywords.
Filename: 
`;
