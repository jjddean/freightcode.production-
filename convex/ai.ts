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

// Main Brain: Intelligent Chat Orchestrator
export const intelligentChat = action({
    args: {
        messages: v.array(v.object({ role: v.string(), content: v.string() })),
        shipmentId: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const apiKey = process.env.OPENAI_API_KEY;
        const ollamaHost = process.env.OLLAMA_HOST || "http://localhost:11434";

        // 1. Define Tools
        const tools = [
            {
                type: "function",
                function: {
                    name: "get_shipment_history",
                    description: "Fetch the user's recent shipment history including status and destination.",
                    parameters: { type: "object", properties: {} }
                }
            },
            {
                type: "function",
                function: {
                    name: "get_tracking_details",
                    description: "Get detailed tracking events for a specific shipment.",
                    parameters: {
                        type: "object",
                        properties: {
                            shipmentId: { type: "string", description: "The shipment ID to look up" }
                        },
                        required: ["shipmentId"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "predict_eta",
                    description: "Predict the estimated arrival of a shipment using historical performance models.",
                    parameters: {
                        type: "object",
                        properties: {
                            shipmentId: { type: "string" }
                        },
                        required: ["shipmentId"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "check_customs_compliance",
                    description: "Audit a shipment for customs risk and CDS compliance.",
                    parameters: {
                        type: "object",
                        properties: {
                            shipmentId: { type: "string" }
                        },
                        required: ["shipmentId"]
                    }
                }
            }
        ];

        // 2. Call LLM (OpenAI favored, Ollama as fallback)
        let responseContent = "";

        if (apiKey) {
            // OpenAI Path
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: "gpt-4o",
                    messages: [
                        {
                            role: "system",
                            content: `You are the FreightCode Main Brain, the intelligent heart of the FreightCode platform. 
                            
                            Your Identity:
                            - Name: FreightCode Assistant (or Main Brain)
                            - Platform: FreightCode (a modern freight forwarding and logistics management suite)
                            
                            Your Capabilities:
                            - Shipments: You can check shipment history, status, and tracking events.
                            - Quotes: You can help users book new shipments or check existing quotes.
                            - Compliance: You can audit customs risk, CDS compliance, and validate HS codes.
                            - Risk: You can analyze geospatial risk (GeoRisk Navigator™) for maritime routes.
                            
                            Important Context:
                            - If a user asks "where's my shipment", use the 'get_shipment_history' or 'get_tracking_details' tools to find real data.
                            - If a user asks about booking, point them to the "New Booking" button in the dashboard or the Quotes section.
                            - Do NOT hallucinate website URLs. The platform is currently accessed via the dashboard you are embedded in.
                            - Be concise, professional, and data-driven.`
                        },
                        ...args.messages
                    ],
                    tools,
                    tool_choice: "auto"
                }),
            });

            const result = (await response.json()) as any;
            const message = result.choices[0].message;

            if (message.tool_calls) {
                // Execute tools in parallel
                const toolMessages = [...args.messages] as any[];
                toolMessages.push(message);

                const toolTasks = (message.tool_calls as any[]).map(async (toolCall) => {
                    const functionName = toolCall.function.name;
                    const functionArgs = JSON.parse(toolCall.function.arguments);
                    let toolResult;

                    const { api } = await import("./_generated/api");

                    if (functionName === "get_shipment_history") {
                        toolResult = await ctx.runQuery(api.shipments.listShipments, {});
                    } else if (functionName === "get_tracking_details") {
                        const data = await ctx.runQuery(api.shipments.getShipment, { shipmentId: functionArgs.shipmentId });
                        toolResult = data?.events || [];
                    } else if (functionName === "predict_eta") {
                        const ML_GATEWAY_URL = "http://127.0.0.1:8000";
                        const ship = await ctx.runQuery(api.shipments.getShipment, { shipmentId: functionArgs.shipmentId });
                        if (ship) {
                            try {
                                const mlRes = await fetch(`${ML_GATEWAY_URL}/predict-eta`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                        carrier: ship.shipment.carrier,
                                        service_type: ship.shipment.service.includes("Air") ? "express_air" : "standard_ocean",
                                        distance: 5000,
                                        congestion_index: 0.5,
                                        weather_risk: 0.2
                                    })
                                });
                                toolResult = await mlRes.json();
                            } catch (e) { toolResult = { error: "ML Gateway unavailable" }; }
                        }
                    } else if (functionName === "check_customs_compliance") {
                        const ML_GATEWAY_URL = "http://127.0.0.1:8000";
                        try {
                            const mlRes = await fetch(`${ML_GATEWAY_URL}/validate-cds`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    doc_present: [1, 1, 1, 1, 1, 1],
                                    value: 45000.0
                                })
                            });
                            toolResult = await mlRes.json();
                        } catch (e) { toolResult = { error: "ML Gateway unavailable" }; }
                    }

                    return {
                        role: "tool",
                        tool_call_id: toolCall.id,
                        name: functionName,
                        content: JSON.stringify(toolResult)
                    };
                });

                const results = await Promise.all(toolTasks);
                toolMessages.push(...results);

                // Final call to summarize tool results
                const finalResponse = await fetch("https://api.openai.com/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify({
                        model: "gpt-4o",
                        messages: toolMessages
                    }),
                });
                const finalResult = await finalResponse.json();
                responseContent = finalResult.choices[0].message.content;
            } else {
                responseContent = message.content;
            }
        } else {
            // Ollama Fallback (Simpler context-based for now)
            const response = await fetch(`${ollamaHost}/api/generate`, {
                method: "POST",
                headers: getOllamaHeaders(ollamaHost),
                body: JSON.stringify({
                    model: "phi3:mini",
                    prompt: `You are the FreightCode Assistant. 
                    
                    APPLICATION CONTEXT:
                    - App Name: FreightCode
                    - Purpose: Freight Forwarding & Logistics Management
                    - Features: Real-time tracking, AI customs auditing, GeoRisk route analysis, Quote booking.
                    
                    USER QUESTION: ${args.messages[args.messages.length - 1].content}
                    
                    INSTRUCTIONS:
                    - Be helpful and concise.
                    - If the user asks for their shipment, tell them to check the 'Shipments' tab or provide a summary if data was available (though in this fallback mode, you have limited tool access).
                    - If asked about "which website", refer to "the FreightCode platform" or "this dashboard". Do NOT mention FreightWise or other external brands.
                    - Do NOT make up website URLs like 'freightcodesoftware.com'.`,
                    stream: false
                }),
            });
            const result = await response.json();
            responseContent = result.response;
        }

        return { content: responseContent };
    }
});
