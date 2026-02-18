import { TextractClient, AnalyzeDocumentCommand, FeatureType } from "@aws-sdk/client-textract";
import dotenv from "dotenv";

dotenv.config();

async function testTextract() {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const region = process.env.AWS_REGION || "us-east-1";

    console.log("Testing AWS Textract with:");
    console.log("Access Key:", accessKeyId ? accessKeyId.substring(0, 5) + "..." : "MISSING");
    console.log("Region:", region);

    if (!accessKeyId || !secretAccessKey) {
        console.error("AWS credentials missing from .env");
        return;
    }

    const client = new TextractClient({
        region,
        credentials: {
            accessKeyId,
            secretAccessKey,
        },
    });

    const mockBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0, 144, 119, 83, 222, 0, 0, 0, 9, 112, 72, 89, 115, 0, 0, 14, 196, 0, 0, 14, 196, 1, 149, 43, 14, 27, 0, 0, 0, 12, 73, 68, 65, 84, 8, 215, 99, 248, 255, 255, 63, 0, 5, 254, 2, 254, 220, 204, 59, 231, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);

    try {
        const command = new AnalyzeDocumentCommand({
            Document: { Bytes: mockBytes },
            FeatureTypes: [FeatureType.TABLES, FeatureType.FORMS],
        });

        console.log("Sending request...");
        const response = await client.send(command);
        console.log("Success! Response received.");
        console.log("Raw Text Sample:", response.Blocks?.filter(b => b.BlockType === 'LINE').map(b => b.Text).slice(0, 3));
    } catch (error: any) {
        console.error("Test Failed!");
        console.error("Name:", error.name);
        console.error("Message:", error.message);
        if (error.$metadata) {
            console.error("Request ID:", error.$metadata.requestId);
            console.error("HTTP Status Code:", error.$metadata.httpStatusCode);
        }
    }
}

testTextract();
