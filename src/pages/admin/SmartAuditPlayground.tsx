import React, { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    AlertCircle,
    CheckCircle2,
    ShieldCheck,
    FileText,
    Play,
    Trash2,
    Clipboard,
    ChevronDown,
    ChevronUp,
    BadgeAlert,
    BadgeInfo,
    BadgeCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import AdminPageHeader from "@/components/layout/admin/AdminPageHeader";

export default function SmartAuditPlayground() {
    const [rawText, setRawText] = useState("");
    const [docType, setDocType] = useState("commercial_invoice");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [showExtracted, setShowExtracted] = useState(true);

    const auditAction = useAction(api.smartaudit.auditDocument);

    const handleAudit = async () => {
        if (!rawText.trim()) {
            toast.error("Please enter some document text to audit.");
            return;
        }

        setLoading(true);
        const toastId = toast.loading("SmartAudit is analyzing text...");

        try {
            const auditResult = await auditAction({
                rawText: rawText,
                docType: docType
            });

            setResult(auditResult);
            toast.success("Audit complete!", { id: toastId });
        } catch (error: any) {
            console.error(error);
            toast.error("Audit failed", {
                id: toastId,
                description: error.message || "An unexpected error occurred during analysis."
            });
        } finally {
            setLoading(false);
        }
    };

    const clearAll = () => {
        setRawText("");
        setResult(null);
    };

    const pasteSample = () => {
        setRawText(`COMMERCIAL INVOICE
Invoice No: CI-2024-001
Date: 2024-02-22
Shipper: Global Tech Solutions Ltd, 123 Industrial Rd, Shenzhen, China
Consignee: UK Logistics Hub, Gateway Park, London, United Kingdom

Description of Goods: Assorted Electronic Parts
HS Code: 85
Quantity: 500 PCS
Unit Price: 10.00 USD
Total Value: 5,000.00 USD
Incoterms: EXW
Weight: 120 KG`);
        setDocType("commercial_invoice");
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <AdminPageHeader
                title="SmartAudit Playground"
                subtitle="Live AI Testing & Prompt Verification Environment"
                icon={ShieldCheck}
            >
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={pasteSample}>
                        <Clipboard className="w-4 h-4 mr-2" />
                        Paste Sample
                    </Button>
                    <Button variant="outline" size="sm" onClick={clearAll}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear
                    </Button>
                </div>
            </AdminPageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Section */}
                <div className="space-y-6">
                    <Card className="border-slate-200">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" />
                                Input Document Text
                            </CardTitle>
                            <CardDescription>Paste raw text extracted from OCR or Textract.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Document Type</label>
                                <select
                                    className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                                    value={docType}
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDocType(e.target.value)}
                                >
                                    <option value="commercial_invoice">Commercial Invoice</option>
                                    <option value="packing_list">Packing List</option>
                                    <option value="bol">Bill of Lading</option>
                                    <option value="air_waybill">Air Waybill</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Raw Text Content</label>
                                <Textarea
                                    placeholder="Paste OCR output here..."
                                    className="min-h-[400px] font-mono text-xs leading-relaxed"
                                    value={rawText}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRawText(e.target.value)}
                                />
                            </div>
                        </CardContent>
                        <CardContent className="pt-0">
                            <Button
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={handleAudit}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>Running Intelligence Audit...</>
                                ) : (
                                    <>
                                        <Play className="w-4 h-4 mr-2" />
                                        Run SmartAudit
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Results Section */}
                <div className="space-y-6">
                    {!result && (
                        <div className="h-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-xl border-slate-200 text-slate-400">
                            <ShieldCheck className="w-12 h-12 mb-4 opacity-20" />
                            <p className="font-medium">Run an audit to see AI analysis results here.</p>
                        </div>
                    )}

                    {result && (
                        <>
                            {/* Summary Card */}
                            <Card className={result.status === 'passed' ? 'border-emerald-200 bg-emerald-50/10' : 'border-amber-200 bg-amber-50/10'}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-center">
                                        <Badge className={`px-2 py-1 ${result.status === 'passed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                            {result.status === 'passed' ? (
                                                <BadgeCheck className="w-3 h-3 mr-1" />
                                            ) : (
                                                <BadgeAlert className="w-3 h-3 mr-1" />
                                            )}
                                            {result.status.toUpperCase()}
                                        </Badge>
                                        <span className="text-xs text-slate-500 font-mono">Process ID: {Date.now().toString().slice(-6)}</span>
                                    </div>
                                    <CardTitle className="text-lg mt-2">Compliance Review Summary</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {result.riskChecklist.length === 0 ? (
                                            <div className="text-sm text-emerald-600 flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4" />
                                                No compliance risks detected.
                                            </div>
                                        ) : (
                                            result.riskChecklist.map((risk: any, i: number) => (
                                                <div key={i} className={`p-3 rounded-lg flex gap-3 border ${risk.severity === 'high' ? 'bg-red-50 border-red-100 text-red-900' :
                                                    risk.severity === 'medium' ? 'bg-orange-50 border-orange-100 text-orange-900' :
                                                        'bg-blue-50 border-blue-100 text-blue-900'
                                                    }`}>
                                                    <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${risk.severity === 'high' ? 'text-red-500' :
                                                        risk.severity === 'medium' ? 'text-orange-500' :
                                                            'text-blue-500'
                                                        }`} />
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-bold uppercase tracking-tight opacity-70">
                                                            {risk.type} • {risk.field || 'General'}
                                                        </p>
                                                        <p className="text-sm leading-tight">{risk.message}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Data Extraction Card */}
                            <Card className="border-slate-200">
                                <CardHeader className="pb-2 flex flex-row items-center justify-between cursor-pointer" onClick={(e: React.MouseEvent) => setShowExtracted(!showExtracted)}>
                                    <div className="space-y-1">
                                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                                            <BadgeInfo className="w-4 h-4 text-blue-600" />
                                            Extracted Metadata (JSON)
                                        </CardTitle>
                                        <CardDescription>AI-parsed fields from the document.</CardDescription>
                                    </div>
                                    {showExtracted ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                </CardHeader>
                                {showExtracted && (
                                    <CardContent>
                                        <pre className="p-4 bg-slate-950 text-emerald-400 rounded-lg text-[10px] font-mono overflow-x-auto border border-slate-800">
                                            {JSON.stringify(result.extractedData, null, 2)}
                                        </pre>
                                    </CardContent>
                                )}
                            </Card>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
