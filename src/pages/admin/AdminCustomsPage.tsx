import React, { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import DataTable from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
    ExternalLink,
    FileCheck,
    AlertCircle,
    ClipboardCheck,
    Clock,
    FileSearch,
    History
} from 'lucide-react';
import AdminPageHeader from '@/components/layout/admin/AdminPageHeader';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter
} from "@/components/ui/card";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const AdminCustomsPage = () => {
    const pendingShipments = useQuery(api.customs.getPendingCustoms) || [];
    const submitFiling = useMutation(api.customs.submitCustomsFiling);

    const [selectedShipment, setSelectedShipment] = useState<any>(null);
    const [isFilingModalOpen, setIsFilingModalOpen] = useState(false);
    const [hmrcRef, setHmrcRef] = useState('');
    const [filingNotes, setFilingNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleOpenFilingModal = (shipment: any) => {
        setSelectedShipment(shipment);
        setHmrcRef('');
        setFilingNotes('');
        setIsFilingModalOpen(true);
    };

    const handleSubmitFiling = async () => {
        if (!hmrcRef.trim()) {
            toast.error("HMRC Reference is required");
            return;
        }

        setIsSubmitting(true);
        try {
            await submitFiling({
                shipmentId: selectedShipment._id,
                reference: hmrcRef,
                filedAt: Date.now(),
                notes: filingNotes
            });
            toast.success("Shipment marked as filed!");
            setIsFilingModalOpen(false);
        } catch (error) {
            toast.error("Failed to update filing status");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const columns: any[] = [
        {
            key: 'trackingNumber',
            header: 'Tracking & Ref',
            render: (val: string, row: any) => (
                <div className="flex flex-col">
                    <span className="font-mono font-bold text-slate-900 text-xs">{val}</span>
                    <span className="text-[10px] text-slate-400 font-mono uppercase tracking-tighter">{row.shipmentId}</span>
                </div>
            )
        },
        {
            key: 'shipmentDetails',
            header: 'Route & Value',
            render: (details: any) => (
                <div className="text-xs">
                    <div className="flex items-center text-slate-600">
                        <span className="w-12 text-slate-400 uppercase font-bold text-[9px]">Route</span>
                        {details.origin} → {details.destination}
                    </div>
                    <div className="flex items-center text-slate-900 mt-1 font-medium">
                        <span className="w-12 text-slate-400 uppercase font-bold text-[9px]">Value</span>
                        {details.value}
                    </div>
                </div>
            )
        },
        {
            key: 'customs',
            header: 'Status',
            render: (customs: any) => (
                <Badge variant="outline" className={
                    customs?.filingStatus === 'review'
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                }>
                    {customs?.filingStatus === 'review' ? <History className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                    {customs?.filingStatus || 'pending'}
                </Badge>
            )
        },
        {
            key: 'riskLevel',
            header: 'Risk',
            render: (risk: string) => (
                <Badge variant={risk === 'high' ? 'destructive' : 'outline'} className="text-[10px]">
                    {risk === 'high' ? 'HIGH RISK' : 'SAFE'}
                </Badge>
            )
        },
        {
            key: 'actions',
            header: 'Filing Actions',
            render: (_: any, row: any) => (
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs font-semibold border-slate-200 hover:bg-slate-50 transition-colors"
                        onClick={() => window.open("https://import-notifications.service.gov.uk", "_blank")}
                    >
                        <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                        File in HMRC
                    </Button>
                    <Button
                        size="sm"
                        className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                        onClick={() => handleOpenFilingModal(row)}
                    >
                        <ClipboardCheck className="w-3.5 h-3.5 mr-1.5" />
                        Mark Filed
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Customs Filing Queue"
                subtitle="Manage and file import/export declarations in the official HMRC portal."
                icon={FileSearch}
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 bg-white border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Clock className="w-5 h-5" /></div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Filing</p>
                            <p className="text-xl font-bold text-slate-900">{pendingShipments.length}</p>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <DataTable
                    data={pendingShipments}
                    columns={columns}
                    searchPlaceholder="Search shipments to file..."
                    rowsPerPage={10}
                />
            </div>

            {/* Filing Modal */}
            <Dialog open={isFilingModalOpen} onOpenChange={setIsFilingModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileCheck className="w-5 h-5 text-emerald-600" />
                            Confirm Customs Filing
                        </DialogTitle>
                        <DialogDescription>
                            Enter the official HMRC reference number provided after submission.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="hmrcRef">HMRC Reference (CDS/IPAFFS)</Label>
                            <Input
                                id="hmrcRef"
                                placeholder="e.g. GB-2026-XXXXXXX"
                                value={hmrcRef}
                                onChange={(e) => setHmrcRef(e.target.value)}
                                className="font-mono text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">Filing Notes (Optional)</Label>
                            <textarea
                                id="notes"
                                placeholder="Any specific details or warnings for this filing..."
                                value={filingNotes}
                                onChange={(e) => setFilingNotes(e.target.value)}
                                rows={3}
                                className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        {selectedShipment?.riskLevel === 'high' && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex gap-3 text-red-800">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <div className="text-xs">
                                    <p className="font-bold">Caution: High Risk Shipment</p>
                                    <p className="opacity-90">Please double check all HS codes and compliance flags before filing.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsFilingModalOpen(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={handleSubmitFiling}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Submitting..." : "Confirm Filing"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminCustomsPage;
