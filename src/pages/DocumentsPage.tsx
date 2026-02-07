import React, { useState, useMemo, useEffect } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { useNavigate, useSearchParams } from 'react-router-dom';
import MediaCardHeader from '@/components/ui/media-card-header';
import DataTable from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { createCSVUrl } from '@/lib/export';
import { simulateDocuSignUpdate } from '@/lib/docusign';
import Footer from '@/components/layout/Footer';
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser, useAuth } from "@clerk/clerk-react";
import { Sparkles } from "lucide-react";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger
} from '@/components/ui/drawer';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, FileBadge, FileWarning, Upload, Eye, Send, RefreshCw, CheckCircle, Share2, Printer, Users } from 'lucide-react';
import { toast } from 'sonner';

const DocumentsPage = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState('documents');
    const [docTypeFilter, setDocTypeFilter] = useState('all');

    // Notifications
    const createNotification = useMutation(api.notifications.create);
    const markDocumentSigned = useMutation((api as any).documents.markDocumentSigned);
    const sendEmail = useAction((api as any).emails.sendEmail);
    const { user } = useUser();

    const [processingReturn, setProcessingReturn] = useState(false);

    // Check for DocuSign Return
    useEffect(() => {
        const event = searchParams.get('event');
        const docId = searchParams.get('documentId');

        if (event === 'signing_complete') {
            setProcessingReturn(true);

            // Auto-update status if docId is present
            if (docId) {
                markDocumentSigned({ documentId: docId as any })
                    .then(async () => {
                        toast.success("Document Signed!", {
                            duration: 5000,
                            icon: '✅'
                        });

                        // Send Email Confirmation
                        if (user?.primaryEmailAddress?.emailAddress) {
                            await sendEmail({
                                to: user.primaryEmailAddress.emailAddress,
                                subject: "Document Successfully Signed - freightcode",
                                html: `
                                    <h1>Document Signed</h1>
                                    <p>Your document (ID: ${docId}) has been successfully signed and processed.</p>
                                    <p>You can view and downlaod it from your dashboard.</p>
                                    <br/>
                                    <p>Best,<br/>freightcode team</p>
                                `
                            });
                        }
                    })
                    .catch(console.error)
                    .finally(() => {
                        // Delay clearing the overlay slightly for visual smoothness
                        setTimeout(() => {
                            setProcessingReturn(false);
                            // Clean up URL
                            setSearchParams(params => {
                                params.delete('event');
                                params.delete('documentId');
                                return params;
                            });
                        }, 2000);
                    });
            } else {
                toast.success("Document Signed Successfully!", { duration: 5000 });
                setProcessingReturn(false);
                setSearchParams(params => { params.delete('event'); return params; });
            }

            // Create Persistent Notification
            createNotification({
                title: 'Document Signed',
                message: 'Your document has been successfully signed and processed.',
                type: 'document',
                priority: 'medium',
                actionUrl: '/documents'
            });
        }
    }, [searchParams, setSearchParams, createNotification, markDocumentSigned, sendEmail, user]);

    // Live documents from Convex
    const { orgId } = useAuth();
    const liveDocuments = useQuery(api.documents.listDocuments, {
        type: docTypeFilter === 'all' ? undefined : docTypeFilter,
        orgId: orgId ?? null
    });

    const tableData = useMemo(() => {
        return (liveDocuments || []).map((doc: any) => ({
            ...doc,
            documentNumber: doc.documentData?.documentNumber || '-',
            issueDate: doc.documentData?.issueDate || '-',
        }));
    }, [liveDocuments]);

    // State for Create Drawer
    const [createOpen, setCreateOpen] = useState(false);
    const [autofillData, setAutofillData] = useState<any>(null); // New state for AI data

    // State for Detail Sheet
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<any>(null);

    // State for Send Signature Drawer
    const [sendOpen, setSendOpen] = useState(false);
    const [sendDoc, setSendDoc] = useState<any>(null);
    const [recipientName, setRecipientName] = useState('');
    const [recipientEmail, setRecipientEmail] = useState('');
    const [recipientCompany, setRecipientCompany] = useState('');
    const [saveToContacts, setSaveToContacts] = useState(false);
    const [sending, setSending] = useState(false);

    const [refreshingId, setRefreshingId] = useState<string | null>(null);
    const [lastError, setLastError] = useState<string | null>(null);

    // Mutations
    const createDocument = useMutation(api.documents.createDocument);
    const setDocusignEnvelope = useMutation(api.documents.setDocusignEnvelope);
    const generateShareLink = useMutation((api as any).documents.generateShareLink);
    const sendEnvelope = useAction((api as any).docusign.sendEnvelope);

    // Contacts
    const contacts = useQuery((api as any).contacts.listContacts) || [];
    const createContact = useMutation((api as any).contacts.createContact);

    // --- Actions ---

    const handleOpenDetail = (doc: any) => {
        setSelectedDoc(doc);
        setDetailOpen(true);
    };

    const handleOpenSend = (doc: any) => {
        setSendDoc(doc);
        setSendOpen(true);
        setDetailOpen(false);
        // Reset form
        setRecipientName('');
        setRecipientEmail('');
        setRecipientCompany('');
        setSaveToContacts(false);
    };

    const handleSendForSignature = async () => {
        if (!sendDoc) return;
        if (!recipientEmail) {
            toast.error("Please enter Email.");
            return;
        }

        setSending(true);
        toast.info("Connecting to DocuSign...");

        try {
            // 1. Save Contact if Requested
            if (saveToContacts) {
                try {
                    await createContact({
                        name: recipientName,
                        email: recipientEmail,
                        company: recipientCompany || undefined
                    });
                    toast.success("Contact Saved to Address Book");
                } catch (cErr) {
                    console.error("Failed to save contact:", cErr);
                    // Don't block sending
                }
            }

            // REAL DOCUSIGN INTEGRATION
            console.log("Calling api.docusign.sendEnvelope...");

            const result: any = await sendEnvelope({
                documentId: sendDoc._id,
                signerName: recipientName,
                signerEmail: recipientEmail,
                returnUrl: `${window.location.origin}/documents?event=signing_complete&documentId=${sendDoc._id}`
            });

            console.log("Msg Sent Result:", result);
            const finalEnvelopeId = typeof result === 'string' ? result : (result.envelopeId || result.id);

            // Update Database with the returned Envelope ID
            await setDocusignEnvelope({
                documentId: sendDoc._id,
                envelopeId: finalEnvelopeId as string,
                status: 'sent',
                recipients: [{
                    name: recipientName,
                    email: recipientEmail,
                    role: 'Signer',
                    status: 'sent'
                }]
            });


            toast.success(`Success! Envelope ID: ${finalEnvelopeId}`);
            setSendOpen(false);
            setRecipientName('');
            setRecipientEmail('');

            // NEW: Embedded Signing Redirect
            if (result.signingUrl) {
                toast.info("Redirecting to Signature Page...");
                setTimeout(() => {
                    window.location.href = result.signingUrl;
                }, 1000);
            }
        } catch (e: any) {
            console.error("DOCUSIGN ERROR:", e);
            toast.error(`DocuSign Failed: ${e.message || "Unknown Error"}`);
        } finally {
            setSending(false);
        }
    };

    const handleShare = async (doc: any) => {
        try {
            const token = await generateShareLink({ documentId: doc._id });
            const url = `${window.location.origin}/shared/${token}`;
            await navigator.clipboard.writeText(url);
            toast.success("Share link copied to clipboard!");
        } catch (e) {
            toast.error("Failed to generate link");
        }
    };

    const handleRefreshStatus = async (doc: any) => {
        if (!doc.docusign?.envelopeId) return;
        setRefreshingId(doc._id);
        try {
            const newStatus = await simulateDocuSignUpdate(doc._id, doc.docusign.status);

            // Update local state via mutation (live query will auto-update UI)
            await setDocusignEnvelope({
                documentId: doc._id,
                envelopeId: doc.docusign.envelopeId,
                status: newStatus,
                recipients: doc.docusign.recipients
            });

            toast.success(`Status updated: ${newStatus.toUpperCase()}`);
        } catch (e: any) {
            toast.error("Failed to refresh status");
        } finally {
            setRefreshingId(null);
        }
    };

    // --- Columns ---

    const documentColumns = [
        {
            key: 'documentNumber',
            header: 'Document #',
            sortable: true,
            render: (val: string, row: any) => (
                <span className="font-medium text-primary cursor-pointer hover:underline" onClick={() => handleOpenDetail(row)}>
                    {val || row._id.substring(0, 8)}
                </span>
            )
        },
        {
            key: 'type',
            header: 'Type',
            sortable: true,
            render: (val: string) => val ? val.replace(/_/g, ' ').toUpperCase() : '-'
        },
        {
            key: 'issueDate',
            header: 'Date',
            sortable: true,
            render: (val: string) => val !== '-' ? new Date(val).toLocaleDateString() : '-'
        },
        {
            key: 'status',
            header: 'Status',
            sortable: true,
            render: (value: string, row: any) => {
                const dsStatus = row.docusign?.status;
                const display = dsStatus ? `${value} (${dsStatus})` : value;

                let color = 'bg-gray-100 text-gray-800';
                if (value === 'approved' || dsStatus === 'signed' || dsStatus === 'completed') color = 'bg-green-100 text-green-800';
                else if (value === 'pending' || dsStatus === 'sent') color = 'bg-blue-100 text-blue-800';

                return <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${color}`}>{display}</span>;
            }
        },
        {
            key: '_id',
            header: 'Actions',
            render: (_: string, row: any) => {
                // Hybrid model: Only allow sending for signature if:
                // 1. Document doesn't have an envelope already
                // 2. Document was uploaded by client OR uploadedBy is undefined (legacy docs)
                const canSendForSignature = !row.docusign?.envelopeId &&
                    (row.uploadedBy === 'client' || row.uploadedBy === undefined);

                const isPlatformDoc = row.uploadedBy === 'system';

                return (
                    <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenDetail(row)} title="View Details">
                            <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/documents/print/${row._id}`)} title="Print / PDF">
                            <Printer className="h-4 w-4" />
                        </Button>
                        {row.docusign?.envelopeId ? (
                            <Button variant="ghost" size="sm" onClick={() => handleRefreshStatus(row)} disabled={refreshingId === row._id} title="Refresh Status">
                                <RefreshCw className={`h-4 w-4 ${refreshingId === row._id ? 'animate-spin' : ''}`} />
                            </Button>
                        ) : canSendForSignature ? (
                            <Button variant="ghost" size="sm" onClick={() => handleOpenSend(row)} title="Send for Signature">
                                <Send className="h-4 w-4" />
                            </Button>
                        ) : isPlatformDoc ? (
                            <span className="px-2 py-1 text-xs text-gray-400" title="Platform-generated docs are sent by admin">
                                Admin Only
                            </span>
                        ) : null}
                        <Button variant="ghost" size="sm" onClick={() => handleShare(row)} title="Share Public Link">
                            <Share2 className="h-4 w-4" />
                        </Button>
                    </div>
                );
            }
        },
    ];

    // Export ref
    const downloadRef = React.useRef<HTMLAnchorElement>(null);

    // --- Render ---

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="px-4 sm:px-6 lg:px-8 py-4">

                <MediaCardHeader
                    title="Documents"
                    subtitle="Management Center"
                    description="Create and manage Bills of Lading, AWBs, and Invoices."
                    backgroundImage="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
                    overlayOpacity={0.6}
                    className="mb-8"
                />

                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {/* 1. Total Documents */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <span className="text-blue-600 text-sm">📄</span>
                                </div>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-sm font-medium text-gray-500">Total Documents</h3>
                                <p className="text-2xl font-semibold text-gray-900">{liveDocuments?.length || 0}</p>
                            </div>
                        </div>
                    </div>

                    {/* 2. Pending Signatures */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <span className="text-blue-600 text-sm">✍️</span>
                                </div>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-sm font-medium text-gray-500">Pending Signatures</h3>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {liveDocuments?.filter((d: any) => d.docusign?.status === 'sent' || d.status === 'pending').length || 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 3. Completed */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <span className="text-blue-600 text-sm">✅</span>
                                </div>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-sm font-medium text-gray-500">Completed</h3>
                                <p className="text-sm font-medium text-gray-500">Fully executed</p>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {liveDocuments?.filter((d: any) => d.docusign?.status === 'completed' || d.status === 'approved').length || 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 4. Drafts */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <span className="text-blue-600 text-sm">📝</span>
                                </div>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-sm font-medium text-gray-500">Drafts</h3>
                                <p className="text-sm font-medium text-gray-500">In progress</p>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {liveDocuments?.filter((d: any) => d.status === 'draft').length || 0}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters & Actions */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-semibold text-gray-900">Documents</h2>
                        <select
                            value={docTypeFilter}
                            onChange={(e) => setDocTypeFilter(e.target.value)}
                            className="border rounded-md px-3 py-1.5 text-sm bg-white"
                        >
                            <option value="all">All Types</option>
                            <option value="bill_of_lading">Bill of Lading</option>
                            <option value="commercial_invoice">Commercial Invoice</option>
                            <option value="air_waybill">Air Waybill</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <SmartUploadButton onParse={async (data) => {
                            setAutofillData(data);
                            setCreateOpen(true);
                        }} />

                        <Button variant="outline" size="sm" className="gap-2" onClick={() => {
                            if (tableData.length === 0) {
                                toast.error("No documents to export");
                                return;
                            }
                            const exportData = tableData.map((d: any) => ({
                                DocumentNumber: d.documentNumber,
                                Type: d.type,
                                Date: d.issueDate,
                                Status: d.status,
                                SignerStatus: d.docusign?.status || 'N/A'
                            }));

                            const url = createCSVUrl(exportData);
                            if (url && downloadRef.current) {
                                downloadRef.current.href = url;
                                downloadRef.current.download = `Documents_${new Date().toISOString().split('T')[0]}.csv`;
                                downloadRef.current.click();
                                URL.revokeObjectURL(url);
                                toast.success("Exporting documents...");
                            }
                        }}>
                            <Upload className="h-4 w-4 rotate-180" />
                            Export CSV
                        </Button>
                        <a ref={downloadRef} style={{ display: 'none' }} />

                        <Button size="sm" className="gap-2" onClick={() => setCreateOpen(true)}>
                            <Upload className="h-4 w-4" />
                            Upload Invoice/List
                        </Button>
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden min-h-[400px]">
                    {liveDocuments === undefined ? (
                        <div className="p-4 space-y-4 animate-pulse">
                            <div className="h-10 bg-gray-100 rounded w-full mb-4" />
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="h-12 bg-gray-50 rounded w-full border-b border-gray-100" />
                            ))}
                        </div>
                    ) : (
                        <DataTable
                            data={tableData}
                            columns={documentColumns}
                            searchPlaceholder="Search documents..."
                            rowsPerPage={10}
                            className="border-0 shadow-none"
                        />
                    )}
                </div>

            </div>



            {/* --- DRAWERS & SHEETS --- */}

            <CreateDocumentDrawer
                open={createOpen}
                onOpenChange={(val: boolean) => {
                    setCreateOpen(val);
                    if (!val) setAutofillData(null); // Clear on close
                }}
                createDocument={createDocument}
                initialData={autofillData} // Pass the data
                orgId={orgId} // Pass implicit Org ID
            />

            <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
                <SheetContent className="sm:max-w-md w-full overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>Document Details</SheetTitle>
                        <SheetDescription>{selectedDoc?.documentData?.documentNumber}</SheetDescription>
                    </SheetHeader>
                    {selectedDoc && (
                        <div className="mt-6 space-y-6 pb-20">
                            <div className="p-4 bg-gray-50 rounded-lg border space-y-4">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <span className="text-gray-500">Type:</span>
                                    <span className="font-medium capitalize">{selectedDoc.type?.replace(/_/g, ' ')}</span>
                                    <span className="text-gray-500">Status:</span>
                                    <span className="font-medium capitalize">{selectedDoc.status}</span>
                                </div>

                                {selectedDoc.documentData?.parties && (
                                    <div className="space-y-4 pt-4 border-t">
                                        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider text-[10px]">Parties</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-xs text-gray-500 block mb-1">Shipper</span>
                                                <div className="text-sm font-medium">{selectedDoc.documentData.parties.shipper?.name || '-'}</div>
                                                <div className="text-[10px] text-gray-400 line-clamp-2">{selectedDoc.documentData.parties.shipper?.address}</div>
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-500 block mb-1">Consignee</span>
                                                <div className="text-sm font-medium">{selectedDoc.documentData.parties.consignee?.name || '-'}</div>
                                                <div className="text-[10px] text-gray-400 line-clamp-2">{selectedDoc.documentData.parties.consignee?.address}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selectedDoc.documentData?.cargoDetails && (
                                    <div className="space-y-4 pt-4 border-t">
                                        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider text-[10px]">Cargo Details</h4>
                                        <p className="text-sm font-medium">{selectedDoc.documentData.cargoDetails.description}</p>
                                        <div className="grid grid-cols-3 gap-2 text-[11px]">
                                            <div className="bg-white p-2 border rounded shadow-sm">
                                                <span className="text-gray-500 block">Weight</span>
                                                <span className="font-semibold">{selectedDoc.documentData.cargoDetails.weight}</span>
                                            </div>
                                            <div className="bg-white p-2 border rounded shadow-sm">
                                                <span className="text-gray-500 block">Dims</span>
                                                <span className="font-semibold">{selectedDoc.documentData.cargoDetails.dimensions}</span>
                                            </div>
                                            <div className="bg-white p-2 border rounded shadow-sm">
                                                <span className="text-gray-500 block">Value</span>
                                                <span className="font-semibold text-primary">{selectedDoc.documentData.cargoDetails.value}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selectedDoc.documentData?.routeDetails && (
                                    <div className="space-y-4 pt-4 border-t">
                                        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider text-[10px]">Route Details</h4>
                                        <div className="flex items-center gap-2 text-sm">
                                            <div className="flex-1">
                                                <div className="text-xs text-gray-500">Origin</div>
                                                <div className="font-medium truncate">{selectedDoc.documentData.routeDetails.origin}</div>
                                            </div>
                                            <div className="text-gray-400">→</div>
                                            <div className="flex-1">
                                                <div className="text-xs text-gray-500 text-right">Destination</div>
                                                <div className="font-medium truncate text-right">{selectedDoc.documentData.routeDetails.destination}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-6 border-t font-semibold text-xs tracking-wider uppercase text-gray-500 mb-2">Actions</div>
                                <div className="space-y-2">
                                    {selectedDoc.docusign?.envelopeId ? (
                                        <Button size="sm" variant="outline" className="w-full" onClick={() => handleRefreshStatus(selectedDoc)} disabled={refreshingId === selectedDoc._id}>
                                            <RefreshCw className={`h-4 w-4 mr-2 ${refreshingId === selectedDoc._id ? 'animate-spin' : ''}`} /> Refresh Status
                                        </Button>
                                    ) : (
                                        <Button size="sm" className="w-full" onClick={() => handleOpenSend(selectedDoc)}>
                                            <Send className="h-4 w-4 mr-2" /> Send for Signature
                                        </Button>
                                    )}
                                </div>
                                {selectedDoc.docusign && (
                                    <div className="text-xs bg-blue-50 p-2 rounded text-blue-700 mt-2">
                                        Envelope: {selectedDoc.docusign.envelopeId}<br />
                                        Status: {selectedDoc.docusign.status}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            {/* --- PROCESSING OVERLAY --- */}
            {
                processingReturn && (
                    <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center animate-in fade-in duration-300">
                        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-6"></div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Finalizing Signature</h2>
                        <p className="text-gray-500">Securely updating document status...</p>
                    </div>
                )
            }

            <Drawer open={sendOpen} onOpenChange={setSendOpen} shouldScaleBackground={false}>
                <DrawerContent className="max-w-md mx-auto">
                    <DrawerHeader>
                        <DrawerTitle>Send for E-Signature</DrawerTitle>
                        <DrawerDescription>Simulate sending via DocuSign</DrawerDescription>
                    </DrawerHeader>
                    <div className="p-4 space-y-4">
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-start gap-3">
                            <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-blue-900">Send to Contact</p>
                                <p className="text-xs text-blue-700">Select a saved contact or enter new details.</p>
                            </div>
                        </div>

                        {/* Saved Contacts Dropdown */}
                        {contacts && contacts.length > 0 && (
                            <div className="space-y-2">
                                <Label>Load from Address Book</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    onChange={(e) => {
                                        const contact = contacts.find((c: any) => c._id === e.target.value);
                                        if (contact) {
                                            setRecipientName(contact.name);
                                            setRecipientEmail(contact.email);
                                            setRecipientCompany(contact.company || '');
                                        }
                                    }}
                                    defaultValue=""
                                >
                                    <option value="" disabled>-- Select a Contact --</option>
                                    {contacts.map((c: any) => (
                                        <option key={c._id} value={c._id}>
                                            {c.name} ({c.email}) {c.company ? `- ${c.company}` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Recipient Name</Label>
                            <Input value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="e.g. John Doe" />
                        </div>
                        <div className="space-y-2">
                            <Label>Recipient Email</Label>
                            <Input value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} placeholder="name@company.com" />
                        </div>
                        <div className="space-y-2">
                            <Label>Company (Optional)</Label>
                            <Input value={recipientCompany} onChange={e => setRecipientCompany(e.target.value)} placeholder="e.g. Acme Inc." />
                        </div>

                        {/* Save Checkbox */}
                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox
                                id="saveContact"
                                checked={saveToContacts}
                                onCheckedChange={(checked) => setSaveToContacts(checked as boolean)}
                            />
                            <Label htmlFor="saveContact" className="cursor-pointer font-normal text-gray-600">
                                Save to my Address Book?
                            </Label>
                        </div>
                    </div>
                    <DrawerFooter>
                        <Button onClick={handleSendForSignature} disabled={sending}>
                            {sending ? 'Sending...' : 'Send Envelope'}
                        </Button>
                        <DrawerClose asChild><Button variant="outline">Cancel</Button></DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>

        </div >
    );
};

// Reuse CreateDocumentDrawer (copy paste full implementation or import if extracted, I'll allow copy here for safety)
function CreateDocumentDrawer({ open, onOpenChange, createDocument, initialData, orgId }: any) {
    const defaultState = {
        type: 'commercial_invoice',
        documentNumber: `CI-${Date.now().toString().slice(-6)}`,
        issueDate: new Date().toISOString().split('T')[0],
        shipperName: '', shipperAddress: '',
        consigneeName: '', consigneeAddress: '',
        description: '', weight: '', dimensions: '', value: '',
        origin: '', destination: ''
    };

    const [formData, setFormData] = useState(defaultState);
    const [loading, setLoading] = useState(false);

    // Auto-fill effect
    React.useEffect(() => {
        if (initialData && initialData.data) {
            const d = initialData.data;
            setFormData({
                type: initialData.type || 'commercial_invoice',
                documentNumber: `AI-${Date.now().toString().slice(-6)}`, // New number
                issueDate: new Date().toISOString().split('T')[0],
                shipperName: d.shipper?.name || '',
                shipperAddress: d.shipper?.address || '',
                consigneeName: d.consignee?.name || '',
                consigneeAddress: d.consignee?.address || '',
                description: d.cargoDetails?.description || '',
                weight: d.cargoDetails?.weight || '',
                dimensions: d.cargoDetails?.dimensions || '',
                value: d.cargoDetails?.value || '',
                origin: d.routeDetails?.origin || '',
                destination: d.routeDetails?.destination || ''
            });
        } else if (open && !initialData) {
            // Reset if opening without data (optional, but good UX)
            setFormData(prev => ({
                ...defaultState,
                documentNumber: `CI-${Date.now().toString().slice(-6)}`
            }));
        }
    }, [initialData, open]);
    // Duplicate loading removed

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await createDocument({
                type: formData.type,
                documentData: {
                    documentNumber: formData.documentNumber,
                    issueDate: formData.issueDate,
                    parties: {
                        shipper: { name: formData.shipperName, address: formData.shipperAddress, contact: '' },
                        consignee: { name: formData.consigneeName, address: formData.consigneeAddress, contact: '' },
                        carrier: undefined,
                    },
                    cargoDetails: {
                        description: formData.description,
                        weight: formData.weight,
                        dimensions: formData.dimensions,
                        value: formData.value,
                    },
                    routeDetails: {
                        origin: formData.origin,
                        destination: formData.destination,
                    },
                    terms: 'Standard Terms'
                },
                status: 'draft',
                orgId: orgId ?? undefined // Pass orgId explicitly
            });
            toast.success("Document Uploaded for Review");
            onOpenChange(false);
        } catch (e: any) {
            toast.error(`Error: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
            <DrawerContent className="max-w-4xl mx-auto h-[85vh]">
                <DrawerHeader>
                    <DrawerTitle>Upload Document</DrawerTitle>
                </DrawerHeader>
                <div className="px-6 py-4 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <Label>Type</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(value) => handleChange('type', value)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select document type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="commercial_invoice">Commercial Invoice</SelectItem>
                                    <SelectItem value="packing_list">Packing List</SelectItem>
                                    <SelectItem value="bill_of_lading">Bill of Lading</SelectItem>
                                    <SelectItem value="air_waybill">Air Waybill</SelectItem>
                                    <SelectItem value="certificate_of_origin">Certificate of Origin</SelectItem>
                                    <SelectItem value="insurance_certificate">Insurance Certificate</SelectItem>
                                </SelectContent>
                            </Select>
                            <Label>Number</Label><Input value={formData.documentNumber} onChange={e => handleChange('documentNumber', e.target.value)} />
                            <Label>Shipper</Label><Input value={formData.shipperName} onChange={e => handleChange('shipperName', e.target.value)} />
                        </div>
                        <div className="space-y-4">
                            <Label>Consignee</Label><Input value={formData.consigneeName} onChange={e => handleChange('consigneeName', e.target.value)} />
                            <Label>Description</Label><Input value={formData.description} onChange={e => handleChange('description', e.target.value)} />
                            <Label>Origin</Label><Input value={formData.origin} onChange={e => handleChange('origin', e.target.value)} />
                            <Label>Destination</Label><Input value={formData.destination} onChange={e => handleChange('destination', e.target.value)} />
                        </div>
                    </div>
                </div>
                <DrawerFooter>
                    <Button onClick={handleSubmit} disabled={loading}>Submit for Processing</Button>
                    <DrawerClose asChild><Button variant="outline">Cancel</Button></DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}

// AI Upload Button Component

function SmartUploadButton({ onParse }: { onParse: (data: any) => void }) {
    const parseDocument = useAction((api as any).ai.parseDocument);
    const [analyzing, setAnalyzing] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        console.log("File selected:", file.name);
        const toastId = toast.loading("🤖 AI is reading your document...");
        setAnalyzing(true);

        try {
            // 1. Try Local Ollama First
            try {
                const { askOllama, FREIGHT_PROMPT } = await import('@/lib/ollama');

                const jsonStr = await askOllama(FREIGHT_PROMPT + file.name, "llama3");
                const result = JSON.parse(jsonStr);

                toast.dismiss(toastId);
                toast.success("Processed by Local Llama 3!");
                onParse(result);
                return;
            } catch (ollamaErr: any) {
                console.warn("Ollama failed, falling back to basic mock:", ollamaErr);
                // Silent fallback
            }

            // 2. Fallback to Cloud Mock/Real AI

            // Read file as base64
            const fileData = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            const result = await parseDocument({
                fileData: fileData,
                fileName: file.name
            });
            onParse(result);

            toast.dismiss(toastId);
            if (result.confidence > 0.8) {
                toast.success(`Data extracted for ${result.data.shipper.name}`);
            } else {
                toast.warning("AI confidence low - please verify fields");
            }

        } catch (err: any) {
            toast.dismiss(toastId);
            toast.error(`Cloud AI Failed: ${err.message}`);
            console.error(err);
        } finally {
            setAnalyzing(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,.png,.jpg"
                onChange={handleFileChange}
            />
            <Button
                variant="secondary"
                size="sm"
                className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200"
                onClick={() => fileInputRef.current?.click()}
                disabled={analyzing}
            >
                {analyzing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                {analyzing ? "Analyzing..." : "Smart Upload"}
            </Button>
        </>
    );
}

export default DocumentsPage;
