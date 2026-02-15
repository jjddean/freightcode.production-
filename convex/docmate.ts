"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
// import { api } from "./_generated/api";
// import { TextractClient } from "@aws-sdk/client-textract"; // Keep import to test bundling? No, comment out first.
import { TextractExtractor, DocumentExtractionResult } from "./lib/TextractExtractor";

export interface DocumentExtractionResult {
  documentType: "commercial_invoice" | "packing_list" | "bol" | "unknown";
  rawText: string;
  fields: Record<string, string>;
  tables: Record<string, string>[][];
  confidence: number;
}


export const processDocument = action({
  args: {
    documentBytes: v.bytes(), // PDF or image as binary
    fileName: v.string(),
  },
  handler: async (ctx, args): Promise<{
    documentId: string;
    extraction: DocumentExtractionResult;
    auditResult: any;
  }> => {
    try {
      // Step 1: Extract using Textract
      const extractor = new TextractExtractor();
      // Convert ArrayBuffer to Uint8Array/Buffer as expected by TextractClient
      const bytes = new Uint8Array(args.documentBytes);
      const extraction = await extractor.extractDocument(bytes);

      // Step 2: Auto-run SmartAudit
      const { api } = await import("./_generated/api");
      const auditResult = await ctx.runAction(api.smartaudit.auditDocument, {
        rawText: extraction.rawText,
        docType: extraction.documentType,
      });

      // Step 3: Optional AI Correction (if flagged)
      let correctedText = undefined;
      if (auditResult.status === "flagged") {
        correctedText = await ctx.runAction(api.smartaudit.generateRawCorrection, {
          rawText: extraction.rawText,
          correctedData: auditResult.correctedData,
        });
      }

      // Step 4: Save to database using the new mutation file
      const docId = await ctx.runMutation((api as any).docmate_db.saveProcessedDocument, {
        fileName: args.fileName,
        documentType: extraction.documentType,
        rawText: extraction.rawText,
        extractedFields: extraction.fields,
        tables: extraction.tables,
        confidence: extraction.confidence,
        auditResult,
        correctedText,
      });

      return {
        documentId: docId,
        extraction,
        auditResult,
      };
    } catch (error: any) {
      console.error("Document processing error:", error);
      throw new Error(`Failed to process document: ${error.message}`);
    }
  },
});
