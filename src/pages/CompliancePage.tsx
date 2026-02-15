import React, { useState, useEffect } from 'react';
import MediaCardHeader from '@/components/ui/media-card-header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, FileBadge, FileWarning, CheckCircle, Clock } from 'lucide-react';
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link } from 'react-router-dom';
import { ComplianceKycModal } from "@/components/compliance/ComplianceKycModal";
import { toast } from 'sonner';
import { HSCodeLookup } from '@/components/tools/HSCodeLookup';
import { AuditResultsView } from '@/components/ai/AuditResultsView';
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import { DocMateUploader } from '@/components/ai/DocMateUploader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CompliancePage = () => {
  // Live documents for compliance monitoring
  const liveDocuments = useQuery(api.documents.listMyDocuments, {}) || [];
  const kycStatus = useQuery(api.compliance.getKycStatus);

  // Keep previous data pattern for KYC to prevent flash
  const [lastKycStatus, setLastKycStatus] = useState<string | null>(null);

  useEffect(() => {
    if (kycStatus !== undefined) {
      setLastKycStatus(kycStatus?.status ?? 'pending');
    }
  }, [kycStatus]);

  const pendingDocs = liveDocuments.filter((d: any) => d.status === 'draft' || d.status === 'pending');
  const signedDocs = liveDocuments.filter((d: any) => d.docusign?.status === 'completed' || d.status === 'approved');

  const [isKycOpen, setIsKycOpen] = React.useState(false);

  // Derive status UI from real data
  // If undefined (loading), verify if we have stale data. If not, default to 'loading' to avoid incorrect Action Required.
  const currentStatus = kycStatus?.status ?? (lastKycStatus ?? 'loading');
  const isVerified = currentStatus === 'verified';


  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'verified':
        return { bg: 'bg-green-100', text: 'text-green-600', label: 'VERIFIED', icon: '✅', sub: 'Valid for 365 days' };
      case 'submitted':
        return { bg: 'bg-blue-100', text: 'text-blue-600', label: 'UNDER REVIEW', icon: '⏳', sub: 'Pending approval' };
      case 'rejected':
        return { bg: 'bg-red-100', text: 'text-red-600', label: 'REJECTED', icon: '❌', sub: 'See rejection notes' };
      case 'loading':
        return { bg: 'bg-gray-100', text: 'text-gray-400', label: 'CHECKING...', icon: '...', sub: 'Syncing status...' };
      default: // pending, draft
        return { bg: 'bg-amber-100', text: 'text-amber-600', label: 'ACTION REQUIRED', icon: '⚠️', sub: 'Verification needed' };
    }
  };

  const statusConfig = getStatusConfig(currentStatus);

  const handleDownloadTemplate = (templateName: string) => {
    // Real download logic using public assets
    const fileName = templateName.replace(/ /g, '_') + '.txt'; // Mapping "Commercial Invoice" -> "Commercial_Invoice.txt"
    const link = document.createElement('a');
    link.href = `/templates/${fileName}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Download Started", {
      description: `Downloading ${templateName}...`
    });

  };

  // Removed isLoading check to render immediately with skeletons/loading states inline where needed
  // const isLoading = liveDocuments === undefined || kycStatus === undefined;



  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <MediaCardHeader
          title="Compliance"
          subtitle="Regulatory Center"
          description="Manage KYC, document uploads, and trade compliance tasks."
          backgroundImage="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
          overlayOpacity={0.6}
          className="mb-8"
        />

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                    <span className="text-sm">⏳</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Pending Reviews</h3>
                  <p className="text-2xl font-semibold text-gray-900">{pendingDocs.length}</p>
                  <p className="text-xs text-gray-400">Actions required</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                    <span className="text-sm">✅</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Verified Docs</h3>
                  <p className="text-2xl font-semibold text-gray-900">{signedDocs.length}</p>
                  <p className="text-xs text-gray-400">Cleared & validated</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center translate-y-1 ${statusConfig.bg} ${statusConfig.text}`}>
                    <span className="text-sm">{statusConfig.icon}</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">KYC Status</h3>
                  <p className={`text-xl font-semibold ${statusConfig.text}`}>
                    {statusConfig.label}
                  </p>
                  <p className="text-xs text-gray-400">
                    {statusConfig.sub}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                    <span className="text-sm">⚠️</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Expiring Soon</h3>
                  <p className="text-2xl font-semibold text-gray-900">0</p>
                  <p className="text-xs text-gray-400">Renewals due &lt; 30d</p>
                </div>
              </div>
            </div>
          </div>

          {/* 1. Urgent Tasks (Top Priority) */}
          <div className="bg-white rounded-lg border p-6 shadow-sm mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Urgent Compliance Tasks</h2>
              {pendingDocs.length > 0 && (
                <span className="bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded-full font-medium">
                  {pendingDocs.length} Pending
                </span>
              )}
            </div>
            <div className="space-y-4">
              {pendingDocs.length > 0 ? pendingDocs.map((doc: any) => (
                <div key={doc._id} className="flex items-center justify-between p-4 bg-orange-50 border border-orange-100 rounded-lg">
                  <div className="flex items-center">
                    <FileWarning className="h-5 w-5 text-orange-500 mr-3" />
                    <div>
                      <p className="font-medium text-orange-900 text-sm">{doc.type.replace(/_/g, ' ').toUpperCase()}</p>
                      <p className="text-xs text-orange-700">Needs signature or review: {doc.documentData?.documentNumber}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" asChild className="border-orange-200 text-orange-800 hover:bg-orange-100">
                    <Link to="/documents">Resolve</Link>
                  </Button>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center py-6 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <CheckCircle className="h-8 w-8 text-green-500 mb-2 opacity-50" />
                  <p className="font-medium">All clear</p>
                  <p className="text-sm">No urgent compliance actions required.</p>
                </div>
              )}
            </div>
          </div>

          {/* 2. Middle Section: Compliance Hub & Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="md:col-span-2 bg-blue-600 text-white rounded-lg p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                  <span>🛡️</span> Compliance Hub
                </h3>
                <p className="text-blue-100 text-sm max-w-xl">
                  Keep your KYC documentation up to date to ensure seamless customs clearance.
                  Active verification reduces shipment delays by up to 40%.
                </p>
              </div>
              <Button
                className="whitespace-nowrap bg-white text-blue-600 hover:bg-blue-50 font-semibold shadow-sm w-full md:w-auto"
                onClick={() => setIsKycOpen(true)}
                disabled={isVerified}
              >
                {isVerified ? 'Verification Active' : 'Start KYC Process'}
              </Button>
            </div>

            <div className="bg-white border rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide">Quick Links</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a
                    href="https://www.gov.uk/export-goods"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-gray-600 hover:text-blue-600 cursor-pointer group"
                  >
                    <div className="w-1.5 h-1.5 bg-gray-300 group-hover:bg-blue-600 rounded-full mr-2 transition-colors"></div>
                    UK Government Export Guide
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.gov.uk/trade-tariff"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-gray-600 hover:text-blue-600 cursor-pointer group"
                  >
                    <div className="w-1.5 h-1.5 bg-gray-300 group-hover:bg-blue-600 rounded-full mr-2 transition-colors"></div>
                    Trade Tariff Codes (HS Codes)
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.gov.uk/government/publications/the-uk-sanctions-list"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-gray-600 hover:text-blue-600 cursor-pointer group"
                  >
                    <div className="w-1.5 h-1.5 bg-gray-300 group-hover:bg-blue-600 rounded-full mr-2 transition-colors"></div>
                    Sanctions Search Engine
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* HS Code Lookup Tool */}
          <div className="mb-8">
            <HSCodeLookup />
          </div>

          {/* SmartAudit™ AI Auditor */}
          <div className="mb-8">
            <SmartAuditSection />
          </div>

          {/* 4. Document Templates (Bottom Row) */}
          <div className="bg-white rounded-lg border bg-card text-card-foreground p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">Document Templates</h2>
              <p className="text-muted-foreground mt-1 text-sm">Download templates for commonly required shipping documents.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: 'Commercial Invoice Template', icon: '📄', description: 'Value declaration' },
                { name: 'Bill of Lading Template', icon: '🚢', description: 'Freight receipt' },
                { name: 'Certificate of Origin Template', icon: '🌍', description: 'Source validation' },
                { name: 'Dangerous Goods Declaration', icon: '⚠️', description: 'Hazmat declaration' }
              ].map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleDownloadTemplate(item.name)}
                  className="rounded-lg border p-4 hover:bg-gray-50 flex items-center gap-3 cursor-pointer transition-all hover:border-blue-200 hover:shadow-sm group h-full"
                >
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex-shrink-0 flex items-center justify-center text-xl group-hover:scale-105 transition-transform">
                    {item.icon}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900 block text-sm">{item.name.replace(' Template', '')}</span>
                    <span className="text-xs text-gray-500">{item.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Customs Clearance Checklist (New) */}
          <Card className="bg-amber-50 border-amber-200">
            <CardHeader>
              <CardTitle className="text-amber-800 flex items-center gap-2">
                <span>📋</span> Customs Clearance Checklist
              </CardTitle>
              <CardDescription className="text-amber-700">Crucial steps before submitting documents to customs/carriers</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-amber-900">
                <li className="flex items-start gap-2">
                  <Checkbox id="hs-code" className="data-[state=checked]:bg-amber-600 border-amber-400" />
                  <label htmlFor="hs-code" className="cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 pt-0.5"> Did you include HS code / commodity code?</label>
                </li>
                <li className="flex items-start gap-2">
                  <Checkbox id="incoterms" className="data-[state=checked]:bg-amber-600 border-amber-400" />
                  <label htmlFor="incoterms" className="cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 pt-0.5">Are Incoterms clearly stated (e.g., EXW, FOB, DAP)?</label>
                </li>
                <li className="flex items-start gap-2">
                  <Checkbox id="origin-cert" className="data-[state=checked]:bg-amber-600 border-amber-400" />
                  <label htmlFor="origin-cert" className="cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 pt-0.5">Do you have Certificate of Origin (if required)?</label>
                </li>
                <li className="flex items-start gap-2">
                  <Checkbox id="commercial-invoice" className="data-[state=checked]:bg-amber-600 border-amber-400" />
                  <label htmlFor="commercial-invoice" className="cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 pt-0.5">Commercial Invoice uploaded & complete?</label>
                </li>
                <li className="flex items-start gap-2">
                  <Checkbox id="packing-list" className="data-[state=checked]:bg-amber-600 border-amber-400" />
                  <label htmlFor="packing-list" className="cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 pt-0.5">Packing List attached?</label>
                </li>
                <li className="flex items-start gap-2">
                  <Checkbox id="sanctions" className="data-[state=checked]:bg-amber-600 border-amber-400" />
                  <label htmlFor="sanctions" className="cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 pt-0.5">Checked sanctions/denied parties list?</label>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="text-xs text-amber-700 font-medium">
              Missing any? Add now in <Link to="/documents" className="underline ml-1 hover:text-amber-900">Documents → Upload & Autofill</Link>
            </CardFooter>
          </Card>
          {/* End of content */}
        </div>
        <ComplianceKycModal open={isKycOpen} onOpenChange={setIsKycOpen} />
      </div>
    </div>
  );
};



function SmartAuditSection() {
  const [rawText, setRawText] = useState("");
  const [docType, setDocType] = useState("commercial_invoice");
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);

  // Smart Upload State
  const [extractedData, setExtractedData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("manual");

  const auditAction = useAction(api.smartaudit.auditDocument);
  const generateCorrectionAction = useAction(api.smartaudit.generateRawCorrection);
  const saveAuditMutation = useMutation(api.smartaudit.saveAudit);

  const handleAudit = async () => {
    if (!rawText.trim()) {
      toast.error("Input Required", { description: "Please paste document text to audit." });
      return;
    }

    setIsAuditing(true);
    setAuditResult(null);
    try {
      const result = await auditAction({ rawText, docType });
      setAuditResult(result);
      toast.success("Audit Complete", { description: "SmartAudit AI has finished the analysis." });

      // Auto-save the audit result
      await saveAuditMutation({
        type: docType,
        status: result.status,
        extractedData: result.extractedData,
        riskChecklist: result.riskChecklist,
        correctedData: result.correctedData,
        rawText: rawText,
      });
    } catch (error: any) {
      console.error(error);
      toast.error("Audit Failed", { description: error.message });
    } finally {
      setIsAuditing(false);
    }
  };

  const handleSmartUploadComplete = (data: any) => {
    setExtractedData(data);
    setAuditResult(data.auditResult);
    toast.success("Analysis Complete", { description: `Extracted ${data.extraction.fields.length} fields.` });
  };

  return (
    <Card className="border-purple-200 overflow-hidden shadow-lg transition-all hover:shadow-purple-100/50">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-white pb-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-purple-900 flex items-center gap-2 text-2xl">
              <Sparkles className="h-6 w-6 text-purple-600 animate-pulse" />
              SmartAudit™
            </CardTitle>
            <CardDescription className="text-purple-700 mt-1">
              Analyze Commercial Invoices & Packing Lists for customs compliance errors.
            </CardDescription>
          </div>
          <Badge className="bg-purple-600 hover:bg-purple-700 text-white border-0 py-1 px-3">BETA</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="manual">Manual Paste</TabsTrigger>
            <TabsTrigger value="upload" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-900">
              <Wand2 className="w-3 h-3 mr-2" />
              Smart Upload (AI)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="mt-0">
            {!auditResult ? (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex gap-4">
                  <Select value={docType} onValueChange={setDocType}>
                    <SelectTrigger className="w-[200px] border-purple-100 focus:ring-purple-500">
                      <SelectValue placeholder="Document Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="commercial_invoice">Commercial Invoice</SelectItem>
                      <SelectItem value="packing_list">Packing List</SelectItem>
                      <SelectItem value="bol">Bill of Lading</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="relative">
                  <textarea
                    placeholder="Paste the text content of your document here for a compliance risk analysis..."
                    className="flex min-h-[200px] w-full rounded-md border border-purple-100 bg-gray-50/30 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                  />
                  {rawText.length > 0 && (
                    <div className="absolute bottom-2 right-2 text-[10px] text-gray-400">
                      {rawText.length} characters
                    </div>
                  )}
                </div>

                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow-md transition-all active:scale-[0.98]"
                  disabled={isAuditing}
                  onClick={handleAudit}
                >
                  {isAuditing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing Risk Profiles...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Run SmartAudit™ Audit
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <AuditResultsView {...auditResult} />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-purple-200 text-purple-700 hover:bg-purple-50"
                    onClick={() => setAuditResult(null)}
                  >
                    New Audit
                  </Button>
                  <Button
                    className="flex-1 bg-purple-600 text-white hover:bg-purple-700"
                    disabled={isAuditing}
                    onClick={async () => {
                      setIsAuditing(true);
                      try {
                        const correctedText = await generateCorrectionAction({
                          rawText,
                          correctedData: auditResult.correctedData
                        });

                        // Treat it like a "Smart Upload" result so we can use the nice viewer
                        setExtractedData({
                          extraction: {
                            rawText,
                            fields: auditResult.extractedData ? Object.entries(auditResult.extractedData).map(([k, v]) => ({ key: k, value: String(v), confidence: 100 })) : [],
                            tables: [],
                            confidence: 100,
                            documentType: docType
                          },
                          auditResult,
                          correctedText
                        });
                        setActiveTab("upload");
                        toast.success("Correction Drafted", { description: "Switching to AI Analysis view." });
                      } catch (error: any) {
                        toast.error("Correction Failed", { description: error.message });
                      } finally {
                        setIsAuditing(false);
                      }
                    }}
                  >
                    Draft Correction
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload" className="mt-0">
            {!extractedData ? (
              <div className="animate-in fade-in duration-300">
                <DocMateUploader onExtractionComplete={handleSmartUploadComplete} />
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {/* Extraction Summary */}
                <Card className="border-purple-200 bg-purple-50/30">
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm font-semibold flex items-center justify-between">
                      <span className="flex items-center gap-2">📄 Document Extraction Analysis</span>
                      <Badge variant="outline" className="bg-white">
                        {Math.round(extractedData.extraction.confidence)}% Confidence
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <Tabs defaultValue="fields">
                      <TabsList className="h-8 mb-2">
                        <TabsTrigger value="fields" className="text-xs h-6">Extracted Fields</TabsTrigger>
                        <TabsTrigger value="tables" className="text-xs h-6">Tables ({extractedData.extraction.tables.length})</TabsTrigger>
                        <TabsTrigger value="raw" className="text-xs h-6">Raw Text</TabsTrigger>
                        {extractedData.correctedText && (
                          <TabsTrigger value="corrected" className="text-xs h-6 bg-green-50 text-green-700 data-[state=active]:bg-green-600 data-[state=active]:text-white ml-2">
                            ✨ Corrected Doc
                          </TabsTrigger>
                        )}
                      </TabsList>

                      <TabsContent value="fields" className="max-h-60 overflow-y-auto pr-1">
                        {extractedData.extraction?.fields?.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {extractedData.extraction.fields.map((field: any, idx: number) => (
                              <div key={idx} className="flex flex-col p-2 bg-white rounded border border-purple-100 hover:border-purple-300 transition-colors">
                                <div className="flex justify-between items-start">
                                  <span className="font-medium text-xs text-gray-500 uppercase">{field.key}</span>
                                  <Badge variant="secondary" className="text-[10px] h-4 leading-none">{Math.round(field.confidence)}%</Badge>
                                </div>
                                <span className="text-sm text-gray-900 font-medium truncate mt-1" title={field.value}>{field.value}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic py-4 text-center">No key-value pairs detected.</p>
                        )}
                      </TabsContent>

                      <TabsContent value="tables" className="max-h-60 overflow-y-auto">
                        {extractedData.extraction?.tables?.length > 0 ? extractedData.extraction.tables.map((table: any, idx: number) => (
                          <div key={idx} className="mb-4 last:mb-0 border rounded-md overflow-hidden">
                            <table className="min-w-full text-xs text-left">
                              <tbody>
                                {table.rows?.map((row: string[], rowIdx: number) => (
                                  <tr key={rowIdx} className="border-b last:border-0 hover:bg-gray-50">
                                    {row.map((cell: string, cellIdx: number) => (
                                      <td key={cellIdx} className="px-3 py-2 border-r last:border-0 truncate max-w-[150px]" title={cell}>
                                        {cell}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )) : (
                          <p className="text-sm text-gray-500 italic py-4 text-center">No tables detected.</p>
                        )}
                      </TabsContent>

                      <TabsContent value="raw">
                        <div className="bg-slate-900 text-slate-300 p-3 rounded-md overflow-x-auto text-xs font-mono max-h-60">
                          <pre>{extractedData.extraction?.rawText}</pre>
                        </div>
                      </TabsContent>

                      {extractedData.correctedText && (
                        <TabsContent value="corrected">
                          <div className="bg-white border-2 border-green-200 p-4 rounded-md overflow-y-auto text-sm font-sans max-h-80 shadow-inner">
                            <div className="flex items-center gap-2 mb-3 text-green-700 font-semibold border-b border-green-100 pb-2">
                              <CheckCircle className="w-4 h-4" />
                              AI Corrected Document (Customs Ready)
                            </div>
                            <pre className="whitespace-pre-wrap text-gray-800 leading-relaxed font-mono text-xs">
                              {extractedData.correctedText}
                            </pre>
                          </div>
                        </TabsContent>
                      )}
                    </Tabs>
                  </CardContent>
                </Card>

                {/* Audit Result */}
                {extractedData.auditResult && (
                  <AuditResultsView {...extractedData.auditResult} />
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setExtractedData(null);
                      setAuditResult(null);
                    }}
                  >
                    Process Another Document
                  </Button>
                  {!extractedData.correctedText && (
                    <Button
                      className="flex-1 bg-purple-600 text-white hover:bg-purple-700"
                      disabled={isAuditing}
                      onClick={async () => {
                        setIsAuditing(true);
                        try {
                          const correctedText = await generateCorrectionAction({
                            rawText: extractedData.extraction.rawText,
                            correctedData: extractedData.auditResult.correctedData
                          });
                          setExtractedData({
                            ...extractedData,
                            correctedText
                          });
                          toast.success("Correction Generated", { description: "You can now view the 'Corrected Doc' tab." });
                        } catch (error: any) {
                          toast.error("Correction Failed", { description: error.message });
                        } finally {
                          setIsAuditing(false);
                        }
                      }}
                    >
                      <Wand2 className="w-4 h-4 mr-2" />
                      Draft Correction
                    </Button>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

      </CardContent>
    </Card>
  );
}

export default CompliancePage;
