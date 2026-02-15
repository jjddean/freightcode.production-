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

    constructor(apiKey: string) {
        if (!apiKey) throw new Error("SmartAuditAuditor requires an OpenAI API Key");
        this.apiKey = apiKey;
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
        "eoriNumber": "string (optional)",
        ...normalized fields... 
      },
      "correctedData": { ...suggested fixes for the fields... }
    }`;

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
                        { role: "system", content: systemPrompt },
                        {
                            role: "user",
                            content: `Audit this document (${docType}):\n\nContent:\n${rawText.substring(0, 15000)}`
                        }
                    ],
                    response_format: { type: "json_object" },
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`OpenAI Error: ${error.error?.message || response.statusText}`);
            }

            const result = await response.json();
            const content = JSON.parse(result.choices[0].message.content);

            return content as SmartAuditResult;
        } catch (error: any) {
            console.error("SmartAudit Audit Error:", error);
            return {
                status: "flagged",
                type: "audit_result",
                riskChecklist: [{
                    type: "system",
                    severity: "high",
                    message: `Internal processing error: ${error.message}`,
                }],
                extractedData: {},
                correctedData: {},
            };
        }
    }

    /**
     * The Correction Engine
     * Generates formatted document text based on audit results.
     */
    async generateCorrectedText(originalText: string, correctedData: any): Promise<string> {
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
