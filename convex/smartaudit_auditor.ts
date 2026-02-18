"use node";
/**
 * SMARTAUDIT AI: THE MODULAR BRAIN
 * 
 * This file is built to be 100% portable. You can copy this into any Node.js,
 * Next.js, or React project.
 */

export interface SmartAuditResult {
    status: "passed" | "flagged";
    type: "audit_result";
    riskChecklist: Array<{
        type: "mismatch" | "compliance" | "missing_data" | "system";
        severity: "low" | "medium" | "high";
        message: string;
        field?: string;
    }>;
    extractedData: Record<string, any>;
    correctedData: Record<string, any>;
}

export class SmartAuditAuditor {
    private apiKey: string;
    private model: string = "gpt-4o-mini";
    private ollamaTimeoutMs: number;

    constructor(apiKey: string | undefined) {
        // No longer strictly required if using local mode (Ollama)
        this.apiKey = apiKey || "placeholder";
        this.ollamaTimeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS || 180000);
    }

    private getOllamaHeaders(ollamaUrl: string): Record<string, string> {
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

    /**
     * The Core Audit Logic
     * Detects HS code errors, description vagueness, and Incoterm mismatches.
     */
    async audit(rawText: string, docType: string = "commercial_invoice"): Promise<SmartAuditResult> {
        const systemPrompt = `You are a Senior Customs Compliance Auditor for SmartAudit AI. 
    Your goal is to find errors in shipping documents that lead to customs fines and delays.
    
    AUDIT RULES:
    1. HS CODES: Check if they are 6-10 digits. Flag if missing or too broad (less than 6 digits).
    2. DESCRIPTIONS: Flag vague terms like "General Cargo," "Assorted Goods," "Gift," "Parts," "Electronics."
    3. INCOTERMS: Verify the 3-letter code (EXW, FOB, CIF, DDP, etc.).
    4. VALUE: Flag if the value seems unusually low for the described goods.
    5. SHIPPER/CONSIGNEE: Flag if company names or addresses seem incomplete or missing.
    6. ENS/MRN: Identification of safety and security (ENS) Movement Reference Numbers (18-character string).
    
    Return a JSON object:
    {
      "status": "passed" | "flagged",
      "type": "audit_result",
      "riskChecklist": [
        { "type": "mismatch" | "compliance" | "missing_data", "severity": "low" | "medium" | "high", "message": "string", "field": "string" }
      ],
      "extractedData": { 
        "hsCode": "string",
        "description": "string",
        "incoterms": "string",
        "value": number,
        "ensMRN": "string (optional)",
        "eoriNumber": "string (optional)"
      },
      "correctedData": { ...suggested fixes for the fields... }
    }`;

        // Fallback to Ollama if no API Key is provided
        if (!this.apiKey || this.apiKey.includes("placeholder")) {
            return await this.auditWithOllama(rawText, docType, systemPrompt);
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        { role: "system", content: systemPrompt },
                        {
                            role: "user",
                            content: `Audit this document (${docType}):\n\nContent:\n${rawText.substring(0, 15000)}`
                        }
                    ],
                    response_format: { type: "json_object" },
                }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`OpenAI Error: ${error.error?.message || response.statusText}`);
            }

            const result = await response.json();
            const content = JSON.parse(result.choices[0].message.content);

            return content as SmartAuditResult;
        } catch (error: any) {
            if (error.name === 'AbortError') {
                throw new Error("SmartAudit: OpenAI request timed out (60s).");
            }
            console.error("SmartAudit Audit Error:", error);
            throw error;
        }
    }

    /**
     * Local AI Fallback using Ollama
     */
    private async auditWithOllama(rawText: string, docType: string, systemPrompt: string): Promise<SmartAuditResult> {
        const ollamaUrl = (typeof process !== "undefined" && process.env.OLLAMA_HOST) || "http://localhost:11434";
        console.log(`SmartAudit: Attempting local audit via ${ollamaUrl}/api/generate`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.ollamaTimeoutMs);

        try {
            const response = await fetch(`${ollamaUrl}/api/generate`, {
                method: "POST",
                headers: this.getOllamaHeaders(ollamaUrl),
                body: JSON.stringify({
                    model: "phi3:mini",
                    prompt: `${systemPrompt}\n\nAudit this document (${docType}):\n\nContent:\n${rawText.substring(0, 5000)}\n\nIMPORTANT: Return ONLY the raw JSON object.`,
                    stream: false,
                    format: "json"
                }),
                signal: controller.signal,
            });

            if (!response.ok) {
                throw new Error(`Ollama Error: ${response.statusText}`);
            }

            const result = await response.json();
            const content = JSON.parse(result.response);

            if (content.riskChecklist) {
                content.riskChecklist.push({
                    type: "system",
                    severity: "low",
                    message: "AUDIT BRAIN: Processed locally via Ollama."
                });
            }

            return content as SmartAuditResult;
        } catch (error: any) {
            if (error.name === 'AbortError') {
                throw new Error(`SmartAudit: Local Ollama request timed out (${Math.floor(this.ollamaTimeoutMs / 1000)}s).`);
            }
            console.error("Ollama Local Brain Error:", error);
            throw new Error(`Local Brain Offline: ${error.message}. Please ensure Ollama is running at ${ollamaUrl}`);
        } finally {
            clearTimeout(timeoutId);
        }
    }

    /**
     * The Correction Engine
     * Generates formatted document text based on audit results.
     */
    async generateCorrectedText(originalText: string, correctedData: any): Promise<string> {
        // Fallback for correction
        if (!this.apiKey || this.apiKey.includes("placeholder")) {
            const ollamaUrl = (typeof process !== "undefined" && process.env.OLLAMA_HOST) || "http://localhost:11434";
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.ollamaTimeoutMs);

            try {
                const response = await fetch(`${ollamaUrl}/api/generate`, {
                    method: "POST",
                    headers: this.getOllamaHeaders(ollamaUrl),
                    body: JSON.stringify({
                        model: "phi3:mini",
                        prompt: `You are a Logistics Document Specialist. Take the original document and the corrected data provided, and generate a clean, professional, and compliant document text block. Use a structured, tabular layout for the itemized list.\n\nOriginal: ${originalText}\n\nCorrected Data: ${JSON.stringify(correctedData)}`,
                        stream: false
                    }),
                    signal: controller.signal,
                });
                const result = await response.json();
                return result.response;
            } catch (e: any) {
                if (e.name === "AbortError") {
                    throw new Error(`Correction Generation timed out (${Math.floor(this.ollamaTimeoutMs / 1000)}s).`);
                }
                throw new Error(`Correction Generation Failed: ${e.message}`);
            } finally {
                clearTimeout(timeoutId);
            }
        }

        try {
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: "system",
                            content: "You are a Logistics Document Specialist. Take the original document and the corrected data provided, and generate a clean, professional, and compliant document text block. Use a structured, tabular layout for the itemized list."
                        },
                        {
                            role: "user",
                            content: `Original: ${originalText}\n\nCorrected Data: ${JSON.stringify(correctedData)}`
                        }
                    ],
                }),
            });

            const result = await response.json();
            return result.choices[0].message.content;
        } catch (error) {
            console.error("Correction Generation Error:", error);
            return "Error generating corrected document text.";
        }
    }
}
