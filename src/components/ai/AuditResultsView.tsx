import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { cn } from "@/lib/utils";

interface RiskItem {
    type: string;
    severity: string;
    message: string;
    field?: string;
}

interface AuditResultsViewProps {
    status: "passed" | "flagged";
    riskChecklist: RiskItem[];
    extractedData: Record<string, any>;
    correctedData: Record<string, any>;
}

export const AuditResultsView: React.FC<AuditResultsViewProps> = ({
    status = "passed",
    riskChecklist = [],
    extractedData = {},
    correctedData = {}
}) => {
    const getSeverityColor = (severity: string) => {
        switch (severity.toLowerCase()) {
            case 'high': return 'bg-red-100 text-red-800 border-red-200';
            case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity.toLowerCase()) {
            case 'high': return <AlertCircle className="h-4 w-4 text-red-600" />;
            case 'medium': return <AlertTriangle className="h-4 w-4 text-amber-600" />;
            case 'low': return <Info className="h-4 w-4 text-blue-600" />;
            default: return <Info className="h-4 w-4 text-gray-600" />;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Status Banner */}
            <div className={cn(
                "p-4 rounded-lg border flex items-center gap-3",
                status === 'passed' ? "bg-green-50 border-green-100 text-green-800" : "bg-red-50 border-red-100 text-red-800"
            )}>
                {status === 'passed' ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                ) : (
                    <AlertCircle className="h-6 w-6 text-red-600" />
                )}
                <div>
                    <h3 className="font-bold">SmartAudit™ Compliance Audit: {status.toUpperCase()}</h3>
                    <p className="text-sm opacity-90">
                        {status === 'passed'
                            ? "Document aligns with customs standards. No major risks detected."
                            : `${riskChecklist.length} potential issues identified that may cause customs delays.`}
                    </p>
                </div>
            </div>

            {/* Risk Checklist */}
            {riskChecklist.length > 0 && (
                <Card className="border-red-100 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <span>🚨</span> Risk Checklist
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {riskChecklist.map((risk, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 rounded-md border bg-white shadow-sm">
                                <div className="mt-0.5">{risk.message.includes("HMRC VERIFIED") ? <CheckCircle2 className="h-4 w-4 text-blue-600" /> : getSeverityIcon(risk.severity)}</div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <Badge variant="outline" className={cn(
                                            "text-[10px] uppercase font-bold px-1.5 py-0",
                                            risk.message.includes("HMRC VERIFIED") ? "bg-blue-50 text-blue-700 border-blue-100" : getSeverityColor(risk.severity)
                                        )}>
                                            {risk.message.includes("HMRC VERIFIED") ? "OFFICIAL DATA" : `${risk.severity} RISK`}
                                        </Badge>
                                        <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">{risk.type}</span>
                                    </div>
                                    <p className={cn(
                                        "text-sm font-medium",
                                        risk.message.includes("HMRC VERIFIED") ? "text-blue-900" : "text-gray-900"
                                    )}>{risk.message}</p>
                                    {risk.field && (
                                        <p className="text-xs text-blue-600 mt-1">Field: <span className="font-mono bg-blue-50 px-1 rounded">{risk.field}</span></p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Data Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-gray-50/50">
                    <CardHeader className="py-3 px-4">
                        <CardTitle className="text-sm font-semibold text-gray-500 uppercase flex items-center gap-2">
                            <span className="text-xs">📄</span> Extracted Data
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="space-y-2">
                            {Object.entries(extractedData).map(([key, val]) => (
                                <div key={key} className="flex flex-col border-b border-gray-100 pb-1 last:border-0">
                                    <span className="text-[10px] text-gray-400 uppercase font-medium">{key.replace(/([A-Z])/g, ' $1')}</span>
                                    <span className="text-sm text-gray-700 truncate">{String(val)}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-green-100 bg-green-50/20">
                    <CardHeader className="py-3 px-4">
                        <CardTitle className="text-sm font-semibold text-green-700 uppercase flex items-center gap-2">
                            <span className="text-xs">✨</span> Recommended Fixes
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="space-y-2">
                            {Object.entries(correctedData).map(([key, val]) => (
                                <div key={key} className="flex flex-col border-b border-green-100 pb-1 last:border-0">
                                    <span className={cn(
                                        "text-[10px] uppercase font-medium",
                                        key === 'estimatedDuty' || key === 'regulatoryContext' ? 'text-blue-600' : 'text-green-600'
                                    )}>
                                        {key === 'estimatedDuty' ? 'HMRC ESTIMATED DUTY' :
                                            key === 'regulatoryContext' ? 'HMRC REGULATORY CONTEXT' :
                                                key.replace(/([A-Z])/g, ' $1')}
                                    </span>
                                    <span className={cn(
                                        "text-sm font-medium",
                                        key === 'estimatedDuty' || key === 'regulatoryContext' ? "text-blue-700" : "text-green-900"
                                    )}>{String(val)}</span>
                                </div>
                            ))}
                            {Object.keys(correctedData).length === 0 && (
                                <p className="text-xs text-gray-400 italic">No automated corrections needed.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
