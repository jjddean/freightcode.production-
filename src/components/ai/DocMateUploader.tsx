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
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const processDocument = useAction(api.docmate.processDocument);

    const handleFile = async (file: File) => {
        setUploading(true);
        try {
            const arrayBuffer = await file.arrayBuffer();
            // processDocument expects argument 'documentBytes' as Bytes (ArrayBuffer)

            const result = await processDocument({
                documentBytes: arrayBuffer,
                fileName: file.name,
            });

            onExtractionComplete(result);
        } catch (error) {
            console.error("Upload error:", error);
            alert("Failed to process document. Please try again or check console for details.");
        } finally {
            setUploading(false);
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
                            Processing document with AI (Textract + SmartAudit)...
                        </p>
                        <p className="text-xs text-gray-400">This may take 10-20 seconds</p>
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
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileInput}
                        />
                        <Button variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50">
                            <FileText className="h-4 w-4 mr-2" />
                            Select File
                        </Button>
                        <p className="text-xs text-gray-400 mt-4">
                            Supported formats: PDF, JPG, PNG
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
