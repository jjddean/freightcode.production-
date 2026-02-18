"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
// import { api } from "./_generated/api";
// import { TextractClient } from "@aws-sdk/client-textract"; // Keep import to test bundling? No, comment out first.
import { TextractExtractor as TextractExtractorLib, DocumentExtractionResult as TextractExtractionResult } from "./lib/TextractExtractor";

const SUPPORTED_TEXTRACT_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".tif", ".tiff"];

function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  return lastDot >= 0 ? fileName.slice(lastDot).toLowerCase() : "";
}

function isTextractSupportedFileName(fileName: string): boolean {
  return SUPPORTED_TEXTRACT_EXTENSIONS.includes(getFileExtension(fileName));
}

function normalizeExtractionError(error: any): string {
  const rawMessage = String(error?.message || "Unknown extraction error.");
  const cleanedMessage = rawMessage.replace(/^Document extraction failed:\s*/i, "");
  const lowered = cleanedMessage.toLowerCase();

  if (lowered.includes("unsupported document format")) {
    return "Unsupported document format. Supported formats: PDF, JPG, JPEG, PNG, TIFF. PDF files must not be password-protected.";
  }

  return `Document extraction failed: ${cleanedMessage}`;
}




export const processDocument = action({
  args: {
    documentBytes: v.bytes(),
    fileName: v.string(),
  },
  handler: async (ctx, args): Promise<{
    documentId: string;
    extraction: TextractExtractionResult;
    auditResult: any;
  }> => {
    // Legacy support: Keep this working as-is for now (Cloud-only path)
    try {
      if (!isTextractSupportedFileName(args.fileName)) {
        throw new Error("Unsupported document format. Supported formats: PDF, JPG, JPEG, PNG, TIFF.");
      }

      const extractor = new TextractExtractorLib();
      const bytes = new Uint8Array(args.documentBytes);
      const extraction = await extractor.extractDocument(bytes);
      const { api } = await import("./_generated/api");
      const auditResult = await ctx.runAction(api.smartaudit.auditDocument, {
        rawText: extraction.rawText,
        docType: extraction.documentType,
      });
      let correctedText = undefined;
      if (auditResult.status === "flagged") {
        correctedText = await ctx.runAction(api.smartaudit.generateRawCorrection, {
          rawText: extraction.rawText,
          correctedData: auditResult.correctedData,
        });
      }
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
      return { documentId: docId, extraction, auditResult };
    } catch (error: any) {
      console.error("Document processing error:", error);
      throw new Error(`Failed to process document: ${normalizeExtractionError(error)}`);
    }
  },
});

/**
 * Step 1 for Frontend Auditing: Extract text using Textract (Cloud)
 */
export const extractDocumentMetadata = action({
  args: {
    documentBytes: v.bytes(),
    fileName: v.string(),
  },
  handler: async (_ctx, args): Promise<TextractExtractionResult> => {
    if (!isTextractSupportedFileName(args.fileName)) {
      throw new Error("Unsupported document format. Supported formats: PDF, JPG, JPEG, PNG, TIFF.");
    }

    try {
      const extractor = new TextractExtractorLib();
      const bytes = new Uint8Array(args.documentBytes);
      return await extractor.extractDocument(bytes);
    } catch (error: any) {
      console.error("extractDocumentMetadata error:", error);
      throw new Error(normalizeExtractionError(error));
    }
  },
});
