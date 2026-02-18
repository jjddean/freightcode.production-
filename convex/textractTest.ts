"use node";
import { internalAction } from "./_generated/server";
import { TextractExtractor } from "./lib/TextractExtractor";

export const testTextractConnection = internalAction({
    args: {},
    handler: async (ctx) => {
        console.log("Testing Textract Connection...");

        const accessKey = process.env.AWS_ACCESS_KEY_ID || "";
        const secretKey = process.env.AWS_SECRET_ACCESS_KEY || "";
        const region = process.env.AWS_REGION || "";

        console.log("AWS Access Key Length:", accessKey.length);
        console.log("AWS Secret Key Length:", secretKey.length);
        console.log("AWS Region:", region);

        if (accessKey.length === 0 || secretKey.length === 0) {
            return { success: false, error: "AWS Keys are missing or empty" };
        }

        try {
            const extractor = new TextractExtractor();
            // 1x1 transparent PNG as Uint8Array
            const mockBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0, 144, 119, 83, 222, 0, 0, 0, 9, 112, 72, 89, 115, 0, 0, 14, 196, 0, 0, 14, 196, 1, 149, 43, 14, 27, 0, 0, 0, 12, 73, 68, 65, 84, 8, 215, 99, 248, 255, 255, 63, 0, 5, 254, 2, 254, 220, 204, 59, 231, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);

            console.log("Sending mock document to Textract...");
            const result = await extractor.extractDocument(mockBytes);

            return {
                success: true,
                documentType: result.documentType,
                confidence: result.confidence,
                isMock: result.rawText.includes("MOCK INVOICE")
            };
        } catch (error: any) {
            console.error("Textract Test Failed:", error);
            return {
                success: false,
                error: error.message,
                name: error.name,
                stack: error.stack
            };
        }
    }
});
