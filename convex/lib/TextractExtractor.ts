"use node";
import { TextractClient, AnalyzeDocumentCommand, FeatureType, Block } from "@aws-sdk/client-textract";

export interface DocumentExtractionResult {
    documentType: "commercial_invoice" | "packing_list" | "bol" | "unknown";
    rawText: string;
    fields: Array<{ key: string, value: string, confidence: number }>;
    tables: Record<string, string>[][];
    confidence: number;
}

export class TextractExtractor {
    private client: TextractClient;
    private textractTimeoutMs: number;

    constructor(region: string = process.env.AWS_REGION || "us-east-1") {
        console.log("TextractExtractor: Initializing with Region:", region);
        this.textractTimeoutMs = Number(process.env.TEXTRACT_TIMEOUT_MS || 60000);

        this.client = new TextractClient({
            region,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            },
        });
    }

    /**
     * Extract data from document bytes (PDF or image)
     */
    async extractDocument(
        documentBytes: Buffer | Uint8Array
    ): Promise<DocumentExtractionResult> {
        console.log("TextractExtractor: extractDocument started. Bytes length:", documentBytes.length);

        // Use live AWS Textract if keys are present
        const hasKeys = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;
        const buf = Buffer.from(documentBytes);

        console.log("TextractExtractor: Buffer prepared. Size:", buf.length, "bytes");
        if (buf.length > 0) {
            console.log("TextractExtractor: First bytes:", buf.slice(0, 10).toString('hex'));
        }

        if (!hasKeys) {
            throw new Error("AWS Textract Keys missing. Live extraction required.");
        }

        try {
            const command = new AnalyzeDocumentCommand({
                Document: { Bytes: Buffer.from(documentBytes) },
                FeatureTypes: [FeatureType.TABLES, FeatureType.FORMS],
            });

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.textractTimeoutMs);

            const response = await (async () => {
                try {
                    return await this.client.send(command, { abortSignal: controller.signal });
                } finally {
                    clearTimeout(timeoutId);
                }
            })();

            // Extract raw text
            const rawText = this.extractRawText(response.Blocks || []);

            // Classify document type
            const documentType = this.classifyDocument(rawText);

            // Extract key-value pairs
            const fields = this.extractFields(response.Blocks || []);

            // Extract tables
            const tables = this.extractTables(response.Blocks || []);

            // Calculate overall confidence
            const confidence = this.calculateConfidence(response.Blocks || []);

            return {
                documentType,
                rawText,
                fields,
                tables,
                confidence,
            };
        } catch (error: any) {
            if (error?.name === "AbortError") {
                throw new Error(`Textract timed out after ${Math.floor(this.textractTimeoutMs / 1000)}s.`);
            }
            console.error("Textract extraction error:", error);

            throw new Error(`Document extraction failed: ${error.message}`);
        }
    }

    private extractRawText(blocks: Block[]): string {
        return blocks
            .filter((b) => b.BlockType === "LINE")
            .map((b) => b.Text)
            .join("\n");
    }

    private classifyDocument(text: string): "commercial_invoice" | "packing_list" | "bol" | "unknown" {
        const lower = text.toLowerCase();
        if (lower.includes("invoice") || lower.includes("commercial invoice")) return "commercial_invoice";
        if (lower.includes("packing list") || lower.includes("packing slip")) return "packing_list";
        if (lower.includes("bill of lading") || lower.includes("bol") || lower.includes("waybill")) return "bol";
        return "unknown";
    }

    private extractFields(blocks: Block[]): Array<{ key: string, value: string, confidence: number }> {
        const keyMap: Record<string, { text: string; confidence: number }> = {};
        const valueMap: Record<string, { text: string; confidence: number }> = {};
        const fields: Array<{ key: string, value: string, confidence: number }> = [];

        blocks.forEach((block) => {
            if (block.BlockType === "KEY_VALUE_SET") {
                const text = this.getBlockText(block, blocks);
                const confidence = block.Confidence || 0;
                if (block.EntityTypes?.includes("KEY")) {
                    keyMap[block.Id!] = { text, confidence };
                } else {
                    valueMap[block.Id!] = { text, confidence };
                }
            }
        });

        blocks.forEach((block) => {
            if (block.BlockType === "KEY_VALUE_SET" && block.EntityTypes?.includes("KEY")) {
                const keyData = keyMap[block.Id!];
                const valueRel = block.Relationships?.find((r) => r.Type === "VALUE");
                if (valueRel && valueRel.Ids && valueRel.Ids.length > 0) {
                    const valueId = valueRel.Ids[0];
                    const valueData = valueMap[valueId];
                    if (keyData && valueData) {
                        fields.push({
                            key: keyData.text,
                            value: valueData.text,
                            confidence: (keyData.confidence + valueData.confidence) / 2
                        });
                    }
                }
            }
        });

        return fields;
    }

    private getBlockText(block: Block, allBlocks: Block[]): string {
        if (!block.Relationships) return "";
        return block.Relationships
            .filter((r) => r.Type === "CHILD")
            .flatMap((r) => r.Ids?.map((id) => allBlocks.find((b) => b.Id === id)?.Text).filter((t) => t) || [])
            .join(" ");
    }

    private extractTables(blocks: Block[]): Record<string, string>[][] {
        const tables: Record<string, string>[][] = [];

        const tableBlocks = blocks.filter(b => b.BlockType === "TABLE");

        for (const tableBlock of tableBlocks) {
            const rowBlocks = blocks.filter(b => b.BlockType === "CELL" && tableBlock.Relationships?.some(r => r.Ids?.includes(b.Id!)));
            // Simple simplified table extraction for now
            // Mapping rows by RowIndex
            const rows: Record<number, Record<number, string>> = {};

            rowBlocks.forEach(cell => {
                const rowIdx = cell.RowIndex!;
                const colIdx = cell.ColumnIndex!;
                const text = this.getBlockText(cell, blocks);
                if (!rows[rowIdx]) rows[rowIdx] = {};
                rows[rowIdx][colIdx] = text;
            });

            const tableData: Record<string, string>[] = [];
            // Assuming first row is header
            const headerRow = rows[1];
            if (headerRow) {
                Object.keys(rows).forEach(rIdx => {
                    const rowIndex = parseInt(rIdx);
                    if (rowIndex > 1) {
                        const rowData: Record<string, string> = {};
                        const row = rows[rowIndex];
                        Object.keys(row).forEach(cIdx => {
                            const colIndex = parseInt(cIdx);
                            const header = headerRow[colIndex] || `Column_${colIndex}`;
                            rowData[header] = row[colIndex];
                        });
                        tableData.push(rowData);
                    }
                });
            }
            tables.push(tableData);
        }

        return tables;
    }

    private calculateConfidence(blocks: Block[]): number {
        if (blocks.length === 0) return 0;
        const totalConf = blocks.reduce((sum, b) => sum + (b.Confidence || 0), 0);
        return totalConf / blocks.length;
    }
}
