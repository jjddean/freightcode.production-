import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { SmartAuditAuditor } from "./smartaudit_auditor";

/**
 * SmartAudit AI: Compliance Auditor
 * Analyzes shipping documents for regulatory risks, data mismatches, and HS code ambiguity.
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

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

        // STAGE 2: HMRC Integration (HS Code Fact-Checking)
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

const generateCorrectedDocHandler = async (ctx: any, args: any): Promise<string> => {
    const audit = await ctx.runQuery(api.smartaudit.getAudit, { id: args.auditId });
    if (!audit) throw new Error("Audit not found");

    if (!OPENAI_API_KEY) {
        return "MOCK CORRECTED DOC: All fields have been normalized for customs safety.";
    }

    const auditor = new SmartAuditAuditor(OPENAI_API_KEY);
    return await auditor.generateCorrectedText(audit.rawText || "", audit.correctedData);
};

/**
 * Generates a clean, corrected version of the document text
 */
export const generateCorrectedDoc = action({
    args: {
        auditId: v.id("compliance_audits"),
    },
    handler: generateCorrectedDocHandler,
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
