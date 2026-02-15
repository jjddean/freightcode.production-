import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { SmartAuditAuditor } from "./smartaudit_auditor";

/**
 * SmartAudit AI: Compliance Auditor
 * Analyzes shipping documents for regulatory risks, data mismatches, and HS code ambiguity.
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ML_GATEWAY_URL = "http://127.0.0.1:8000";

/**
 * Validates the format of an ENS Movement Reference Number (MRN).
 * Format: 18 characters, usually starting with year (2 digits), country (2 chars), and '3' in pos 11.
 */
function validateMRN(mrn: string): { valid: boolean; message?: string } {
    if (!mrn) return { valid: false, message: "MRN is missing." };
    const cleaned = mrn.trim().toUpperCase();

    // Standard MRN length is 18 characters
    if (cleaned.length !== 18) {
        return { valid: false, message: `MRN ${cleaned} is not 18 characters (Found ${cleaned.length}).` };
    }

    // Simple regex for basic MRN structure (Alphanumeric)
    const mrnRegex = /^[0-9]{2}[A-Z]{2}[A-Z0-9]{13}[0-9]$/;
    if (!mrnRegex.test(cleaned)) {
        return { valid: false, message: "MRN format is invalid (expected YYCC...)." };
    }

    return { valid: true };
}

export const auditDocument = action({
    args: {
        rawText: v.string(),
        docType: v.string(), // "commercial_invoice", "packing_list", "bol"
    },
    handler: async (ctx, args) => {
        if (!OPENAI_API_KEY) {
            console.log("No OpenAI API key configured, using mock auditor");
            return getMockAudit(args.docType);
        }

        const auditor = new SmartAuditAuditor(OPENAI_API_KEY);
        const result = await auditor.audit(args.rawText, args.docType);

        // STAGE 2: ML Brain Integration (Specialized Intelligence)
        // We use our custom ML models to provide more accurate HS suggestions and detect anomalies.
        if (result.extractedData?.description) {
            try {
                // Call ML Brain for HS Classification Suggestion
                const hsResponse = await fetch(`${ML_GATEWAY_URL}/classify-hs`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ description: result.extractedData.description }),
                });

                if (hsResponse.ok) {
                    const hsResult = await hsResponse.json();
                    const suggestedCode = hsResult.hs_code;

                    // If AI missed the HS code, use the ML Brain's suggestion
                    if (!result.extractedData.hsCode || result.extractedData.hsCode === "unknown") {
                        result.extractedData.hsCode = suggestedCode;
                        result.riskChecklist.push({
                            type: "system",
                            severity: "low",
                            message: `ML BRAIN SUGGESTION: Assigned HS Code ${suggestedCode} based on product description.`,
                            field: "hsCode"
                        });
                    } else if (result.extractedData.hsCode.substring(0, 6) !== suggestedCode) {
                        // If they differ significantly, flag it for review
                        result.riskChecklist.push({
                            type: "mismatch",
                            severity: "medium",
                            message: `HS CODE VARIANCE: Auditor Brain suggests ${suggestedCode} instead of ${result.extractedData.hsCode}.`,
                            field: "hsCode"
                        });
                    }
                }
            } catch (err) {
                console.error("ML Brain HS Error:", err);
            }
        }

        // STAGE 3: HMRC Integration (HS Code Fact-Checking)
        // If the AI extracted an HS code, we verify it against the official HMRC Trade Tariff.
        if (result.extractedData?.hsCode) {
            try {
                const hmrcValidation = await ctx.runAction(api.hmrc_actions.validateHSCode, {
                    code: result.extractedData.hsCode
                }) as any;

                if (hmrcValidation.valid) {
                    result.riskChecklist.push({
                        type: "system",
                        severity: "low",
                        message: `HMRC VERIFIED: ${hmrcValidation.description}`,
                        field: "hsCode"
                    });

                    // Add regulatory insights (Section/Chapter) if available
                    if (hmrcValidation.regulatoryInsights) {
                        result.correctedData = {
                            ...result.correctedData,
                            regulatoryContext: `${hmrcValidation.regulatoryInsights.section} > ${hmrcValidation.regulatoryInsights.chapter}`
                        };
                    }

                    // Add official measures to the corrected data if available
                    if (hmrcValidation.measures?.length > 0) {
                        const duty = hmrcValidation.measures.find((m: any) => m.measureType?.includes("Third country duty"));
                        if (duty) {
                            result.correctedData = {
                                ...result.correctedData,
                                estimatedDuty: duty.dutyRate
                            };
                        }
                    }
                } else {
                    result.status = "flagged";
                    result.riskChecklist.push({
                        type: "compliance",
                        severity: "high",
                        message: `HMRC INVALID: The HS code ${result.extractedData.hsCode} was not found in the official UK Trade Tariff database.`,
                        field: "hsCode"
                    });
                }
            } catch (error) {
                console.error("HMRC Integration Error during audit:", error);
            }
        }

        // STAGE 4: ENS Compliance (Safety & Security)
        // Check for presence and validity of Movement Reference Numbers (MRNs)
        if (args.docType === "bol" || args.docType === "commercial_invoice") {
            const mrn = result.extractedData?.ensMRN;
            if (mrn) {
                const mrnValidation = validateMRN(mrn);
                if (mrnValidation.valid) {
                    // REACH OUT TO HMRC FOR COMPLIANCE
                    try {
                        const ensStatus = await ctx.runAction(api.hmrc_actions.getENSStatus, {
                            mrn: mrn
                        }) as any;

                        if (ensStatus.success) {
                            result.riskChecklist.push({
                                type: "compliance",
                                severity: "low",
                                message: `ENS COMPLIANT: HMRC Status [${ensStatus.status}] received at ${new Date(ensStatus.receivedDateTime).toLocaleString()}.`,
                                field: "ensMRN"
                            });
                        } else {
                            result.status = "flagged";
                            result.riskChecklist.push({
                                type: "compliance",
                                severity: "high",
                                message: `ENS AUDIT FAILED: ${ensStatus.message}`,
                                field: "ensMRN"
                            });
                        }
                    } catch (error) {
                        console.error("HMRC ENS Status Error during audit:", error);
                        result.riskChecklist.push({
                            type: "compliance",
                            severity: "low",
                            message: `ENS VERIFIED: Format only (HMRC Status Check Offline).`,
                            field: "ensMRN"
                        });
                    }
                } else {
                    result.status = "flagged";
                    result.riskChecklist.push({
                        type: "compliance",
                        severity: "high",
                        message: `ENS INVALID: ${mrnValidation.message}`,
                        field: "ensMRN"
                    });
                }
            } else {
                // Warning for missing ENS on international documents
                result.riskChecklist.push({
                    type: "missing_data",
                    severity: "medium",
                    message: "ENS MISSING: No Safety & Security MRN detected. Mandatory for UK/EU imports as of 2025.",
                    field: "ensMRN"
                });
            }
        }

        // STAGE 5: HMRC EORI Validation
        if (result.extractedData?.eoriNumber) {
            try {
                const eoriValidation = await ctx.runAction(api.hmrc_actions.validateEORI, {
                    eori: result.extractedData.eoriNumber
                }) as any;

                if (eoriValidation.valid) {
                    result.riskChecklist.push({
                        type: "compliance",
                        severity: "low",
                        message: `EORI VERIFIED: Registered to ${eoriValidation.companyName}.`,
                        field: "eoriNumber"
                    });
                } else {
                    result.status = "flagged";
                    result.riskChecklist.push({
                        type: "compliance",
                        severity: "high",
                        message: `EORI INVALID: The number ${result.extractedData.eoriNumber} is not a valid UK EORI registration.`,
                        field: "eoriNumber"
                    });
                }
            } catch (error) {
                console.error("HMRC EORI Integration Error:", error);
            }
        }

        return result;
    },
});

/**
 * Saves an audit result to the database
 */
export const saveAudit = mutation({
    args: {
        type: v.string(),
        status: v.string(),
        extractedData: v.any(),
        riskChecklist: v.array(v.object({
            type: v.string(),
            severity: v.string(),
            message: v.string(),
            field: v.optional(v.string()),
        })),
        correctedData: v.optional(v.any()),
        rawText: v.optional(v.string()),
        shipmentId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("byExternalId", (q) => q.eq("externalId", identity.subject))
            .unique();

        const userId = user?._id;

        const auditId = await ctx.db.insert("compliance_audits", {
            ...args,
            userId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return auditId;
    },
});

/**
 * Gets a specific audit result
 */
export const getAudit = query({
    args: { id: v.id("compliance_audits") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

/**
 * Gets all audits for a specific shipment
 */
export const getShipmentAudits = query({
    args: { shipmentId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("compliance_audits")
            .withIndex("byShipmentId", (q) => q.eq("shipmentId", args.shipmentId))
            .collect();
    },
});

/**
 * Shared helper for generating corrected document text
 */
export const generateCorrectedTextInternal = async (rawText: string, correctedData: any): Promise<string> => {
    if (!OPENAI_API_KEY) {
        return "MOCK CORRECTED DOC: All fields have been normalized for customs safety.";
    }
    const auditor = new SmartAuditAuditor(OPENAI_API_KEY);
    return await auditor.generateCorrectedText(rawText, correctedData);
};

/**
 * Generates a clean, corrected version of the document text
 */
export const generateCorrectedDoc = action({
    args: {
        auditId: v.id("compliance_audits"),
    },
    handler: async (ctx, args): Promise<string> => {
        const audit = await ctx.runQuery(api.smartaudit.getAudit, { id: args.auditId });
        if (!audit) throw new Error("Audit not found");
        return await generateCorrectedTextInternal(audit.rawText || "", audit.correctedData);
    },
});

/**
 * Internal action to generate corrected text without database lookup (for DocMate)
 */
export const generateRawCorrection = action({
    args: {
        rawText: v.string(),
        correctedData: v.any(),
    },
    handler: async (ctx, args): Promise<string> => {
        return await generateCorrectedTextInternal(args.rawText, args.correctedData);
    }
});

function getMockAudit(docType: string) {
    return {
        status: "flagged",
        type: "audit_result",
        riskChecklist: [
            {
                type: "compliance",
                severity: "high",
                message: `MOCK AUDIT: Mismatched HS Code detected for ${docType}.`,
                field: "hsCode"
            }
        ],
        extractedData: {
            type: docType,
            value: "10,000",
            description: "Sample Electronics"
        },
        correctedData: {
            description: "Calculators and Data Processing units"
        }
    };
}

/**
 * Cross-references multiple documents for a shipment to detect compliance anomalies.
 */
export const triangulateShipmentDocuments = action({
    args: { shipmentId: v.string() },
    handler: async (ctx, args) => {
        // 1. Get all audits for this shipment
        const audits = await ctx.runQuery(api.smartaudit.getShipmentAudits, { shipmentId: args.shipmentId });
        if (audits.length < 2) return { status: "insufficient_data", message: "Need at least 2 documents to triangulate." };

        // 2. Extract features for ML model
        // We look for weight and value across BOL, CI, and PL
        let bol_weight = 0;
        let pl_weight = 0;
        let inv_value = 0;

        for (const audit of audits) {
            const data = audit.extractedData || {};
            if (audit.type === "bol") bol_weight = parseFloat(String(data.weight || 0));
            if (audit.type === "packing_list") pl_weight = parseFloat(String(data.totalWeight || data.weight || 0));
            if (audit.type === "commercial_invoice") inv_value = parseFloat(String(data.totalValue || data.totalValueUSD || data.value || 0));
        }

        const weight_diff = Math.abs(bol_weight - pl_weight);

        // 3. Call ML Brain for Anomaly Detection
        try {
            const response = await fetch(`${ML_GATEWAY_URL}/detect-anomalies`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bol_weight, inv_value, pl_weight, weight_diff }),
            });

            if (response.ok) {
                const mlResult = await response.json();
                if (mlResult.is_anomaly) {
                    // Flag the shipment in the DB
                    await ctx.runMutation(api.shipments.flagShipment, {
                        shipmentIdString: args.shipmentId,
                        riskLevel: "high",
                        reason: `ML BRAIN FLAG: Statistical anomaly detected in document triangulation. Weight Mismatch: ${weight_diff}kg. Value/Weight Ratio Outlier.`
                    });
                    return { status: "anomaly_detected", mlResult };
                }
            }
        } catch (err) {
            console.error("ML Brain Anomaly Error:", err);
        }

        return { status: "passed" };
    }
});


