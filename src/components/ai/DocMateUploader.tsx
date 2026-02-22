import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Loader2 } from "lucide-react";
import { useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface DocMateUploaderProps {
    onExtractionComplete: (data: any) => void;
}

export const DocMateUploader: React.FC<DocMateUploaderProps> = ({
    onExtractionComplete,
}) => {
    const SUPPORTED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".tif", ".tiff"];
    const SUPPORTED_MIME_TYPES = new Set([
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/tiff",
    ]);
    const EXTRACTION_TIMEOUT_MS = 90000;
    const SMARTAUDIT_TIMEOUT_MS = 180000;
    const SAVE_TIMEOUT_MS = 30000;

    const withTimeout = async <T,>(promise: Promise<T>, label: string, timeoutMs: number): Promise<T> => {
        let timeout: ReturnType<typeof setTimeout> | undefined;
        try {
            return await Promise.race([
                promise,
                new Promise<T>((_, reject) => {
                    timeout = setTimeout(() => reject(new Error(`${label} timed out after ${Math.floor(timeoutMs / 1000)}s.`)), timeoutMs);
                }),
            ]);
        } finally {
            if (timeout) clearTimeout(timeout);
        }
    };

    const getFileExtension = (fileName: string): string => {
        const lastDot = fileName.lastIndexOf(".");
        return lastDot >= 0 ? fileName.slice(lastDot).toLowerCase() : "";
    };

    const isSupportedFile = (file: File): boolean => {
        const extension = getFileExtension(file.name);
        const mimeType = (file.type || "").toLowerCase();
        return SUPPORTED_EXTENSIONS.includes(extension) || SUPPORTED_MIME_TYPES.has(mimeType);
    };

    const formatUploadError = (error: any): string => {
        const rawMessage = String(error?.message || "Failed to process document. Please try again.");
        const cleanMessage = rawMessage.replace(/^.*Uncaught Error:\s*/i, "");
        const lowered = cleanMessage.toLowerCase();

        if (lowered.includes("unsupported document format")) {
            return "Unsupported document format. Please upload PDF, JPG, JPEG, PNG, or TIFF. If using PDF, make sure it is not password-protected.";
        }

        return cleanMessage;
    };

    const [uploading, setUploading] = useState(false);
    const [uploadStage, setUploadStage] = useState("");
    const [dragActive, setDragActive] = useState(false);
    const [selectedDocType, setSelectedDocType] = useState<string>("auto");

    const extractMetadata = useAction(api.docmate.extractDocumentMetadata);
    const auditDocument = useAction(api.smartaudit.auditDocument);
    const saveDocument = useMutation(api.docmate_db.saveProcessedDocument);

    const handleFile = async (file: File) => {
        setUploading(true);
        setUploadStage("Preparing upload...");
        try {
            if (!isSupportedFile(file)) {
                throw new Error("Unsupported document format. Please upload PDF, JPG, JPEG, PNG, or TIFF.");
            }

            const arrayBuffer = await file.arrayBuffer();

            // Step 1: Extract Text (Cloud Backend - "The Eyes")
            setUploadStage("Extracting text via Textract...");
            const extraction = await withTimeout(
                extractMetadata({
                    documentBytes: arrayBuffer,
                    fileName: file.name,
                }),
                "Document extraction",
                EXTRACTION_TIMEOUT_MS
            );

            // Step 2: Audit in Convex action (uses OLLAMA_HOST on backend)
            setUploadStage("Running SmartAudit via Convex/Ollama...");

            // Determine docType: Use manual selection if not "auto", else use Textract detection
            const docType = selectedDocType === "auto" ? extraction.documentType : selectedDocType;

            const auditResult = await withTimeout(
                auditDocument({
                    rawText: extraction.rawText,
                    docType: docType,
                }),
                "SmartAudit analysis",
                SMARTAUDIT_TIMEOUT_MS
            );

            // Step 3: Save results to database (Cloud Backend)
            setUploadStage("Saving extracted results...");
            const docId = await withTimeout(
                saveDocument({
                    fileName: file.name,
                    documentType: docType, // Use the same type here
                    rawText: extraction.rawText,
                    extractedFields: extraction.fields,
                    tables: extraction.tables,
                    confidence: extraction.confidence,
                    auditResult,
                }),
                "Saving extracted document",
                SAVE_TIMEOUT_MS
            );

            onExtractionComplete({ documentId: docId, extraction, auditResult });
        } catch (error: any) {
            console.error("Upload error:", error);
            alert(formatUploadError(error));
        } finally {
            setUploading(false);
            setUploadStage("");
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    return (
        <div className="space-y-4">
            {/* Document Type Selector */}
            <div className="flex items-center justify-between px-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Document Type</label>
                <div className="w-48">
                    <select
                        className="w-full text-xs border rounded px-2 py-1 bg-white"
                        value={selectedDocType}
                        onChange={(e) => setSelectedDocType(e.target.value)}
                    >
                        <option value="auto">Auto-detect Type</option>
                        <option value="commercial_invoice">Commercial Invoice</option>
                        <option value="packing_list">Packing List</option>
                        <option value="bol">Bill of Lading</option>
                    </select>
                </div>
            </div>

            <Card
                className={`border-2 border-dashed transition-colors ${dragActive ? "border-purple-500 bg-purple-50" : "border-gray-300"
                    }`}
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
            >
                <CardContent className="p-8 text-center bg-gray-50/50 hover:bg-gray-100/50 transition-colors cursor-pointer" onClick={() => document.getElementById("file-upload")?.click()}>
                    {uploading ? (
                        <div className="space-y-4 py-8">
                            <Loader2 className="h-12 w-12 mx-auto animate-spin text-purple-600" />
                            <p className="text-sm text-gray-600 font-medium">
                                {uploadStage || "Processing document with AI (Textract + SmartAudit)..."}
                            </p>
                            <p className="text-xs text-gray-400">This can take up to 2-3 minutes if the model is cold.</p>
                        </div>
                    ) : (
                        <div className="py-4">
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Upload className="h-8 w-8 text-purple-600" />
                            </div>
                            <p className="text-lg font-semibold mb-2 text-gray-900">
                                Upload Shipping Document
                            </p>
                            <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                                Drag & drop PDFs or images here to automatically extract data and run compliance checks.
                            </p>
                            <input
                                type="file"
                                id="file-upload"
                                className="hidden"
                                accept=".pdf,.jpg,.jpeg,.png,.tif,.tiff"
                                onChange={handleFileInput}
                            />
                            <Button variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50">
                                <FileText className="h-4 w-4 mr-2" />
                                Select File
                            </Button>
                            <p className="text-xs text-gray-400 mt-4">
                                Supported formats: PDF, JPG, PNG, TIFF
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
