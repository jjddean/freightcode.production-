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

    constructor(region: string = process.env.AWS_REGION || "us-east-1") {
        console.log("TextractExtractor: Initializing with Region:", region);

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

        // TEMPORARY: Back to Mock mode until AWS billing/subscription is resolved.
        const USE_MOCK = true;
        if (USE_MOCK) {
            console.log("TextractExtractor: Using MOCK data (USE_MOCK=true)");
            return {
                documentType: "commercial_invoice",
                rawText: "MOCK INVOICE\nInvoice Number: INV-2024-001\nDate: 2024-02-14\nTotal: $1,250.00\n\nItems:\n1. Widget A - $500\n2. Widget B - $750",
                fields: [
                    { key: "Invoice Number", value: "INV-2024-001", confidence: 100 },
                    { key: "Date", value: "2024-02-14", confidence: 100 },
                    { key: "Total", value: "$1,250.00", confidence: 100 }
                ],
                tables: [],
                confidence: 0.99
            };
        }

        try {
            const command = new AnalyzeDocumentCommand({
                Document: { Bytes: documentBytes },
                FeatureTypes: [FeatureType.TABLES, FeatureType.FORMS],
            });

            const response = await this.client.send(command);

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
        } catch (error) {
            console.error("Textract extraction error:", error);
            throw new Error(`Document extraction failed: ${error}`);
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
