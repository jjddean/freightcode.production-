import React, { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { cn } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import DataTable from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { MapPin, Navigation, Package, Truck, MoreHorizontal, AlertTriangle, CheckCircle } from 'lucide-react';
import AdminPageHeader from '@/components/layout/admin/AdminPageHeader';
import { Badge } from '@/components/ui/badge';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription
} from '@/components/ui/sheet';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ExternalLink, ClipboardCheck, History, Clock, FileCheck } from 'lucide-react';

const AdminShipmentsPage = () => {
    // const { toast } = useToast(); // Removed
    const shipments = useQuery(api.admin.listAllShipments, {}) || [];
    const flagShipment = useMutation(api.shipments.flagShipment);
    const clearFlag = useMutation(api.shipments.clearShipmentFlag);
    const submitFiling = useMutation(api.customs.submitCustomsFiling);

    const [selectedShipment, setSelectedShipment] = useState<any>(null);
    const [isFilingModalOpen, setIsFilingModalOpen] = useState(false);
    const [hmrcRef, setHmrcRef] = useState('');
    const [filingNotes, setFilingNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFlag = async (shipmentId: Id<"shipments">) => {
        try {
            await flagShipment({ shipmentId: shipmentId, shipmentIdString: shipmentId, riskLevel: 'high', reason: 'Manual Admin Flag' });
            toast.success("Shipment Flagged: Marked as High Risk.");
        } catch (error) {
            toast.error("Failed to flag shipment.");
        }
    };

    const handleClear = async (shipmentId: Id<"shipments">) => {
        try {
            await clearFlag({ shipmentIdString: shipmentId });
            toast.success("Risk Cleared: Shipment marked as safe.");
        } catch (error) {
            toast.error("Failed to clear flag.");
        }
    };

    const handleOpenFilingModal = () => {
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
            // Refresh selected shipment in the sheet by finding it in the list
            const updated = shipments.find((s: any) => s._id === selectedShipment._id);
            if (updated) setSelectedShipment(updated);
        } catch (error) {
            toast.error("Failed to update filing status");
        } finally {
            setIsSubmitting(false);
        }
    };

    const columns = [
        {
            key: 'trackingNumber',
            header: 'Tracking #',
            render: (value: string) => <span className="font-mono font-medium text-primary-600">{value}</span>
        },
        {
            key: 'riskLevel',
            header: 'Risk',
            render: (val: string) => (
                val === 'high' ? <Badge variant="destructive" className="flex w-fit items-center gap-1"><AlertTriangle className="h-3 w-3" /> High</Badge> :
                    val === 'medium' ? <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Medium</Badge> :
                        <Badge variant="outline" className="text-gray-500 border-gray-200">Safe</Badge>
            )
        },
        {
            key: 'carrier',
            header: 'Carrier',
            render: (value: string) => (
                <div className="flex items-center space-x-2">
                    <span className="text-lg">{
                        value?.toLowerCase().includes('fedex') ? '🟣' :
                            value?.toLowerCase().includes('dhl') ? '🟡' : '📦'
                    }</span>
                    <span>{value}</span>
                </div>
            )
        },
        {
            key: 'currentLocation',
            header: 'Current Location',
            render: (location: any) => (
                <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                    {location?.city || 'In Transit'}, {location?.country || ''}
                </div>
            )
        },
        {
            key: 'customs',
            header: 'Customs',
            render: (customs: any) => (
                <Badge variant="outline" className={cn(
                    "text-[10px] uppercase font-bold",
                    customs?.filingStatus === 'filed' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                        customs?.filingStatus === 'pending' ? "bg-amber-50 text-amber-700 border-amber-100" :
                            "bg-slate-50 text-slate-500"
                )}>
                    {customs?.filingStatus || 'None'}
                </Badge>
            )
        },
        {
            key: 'status',
            header: 'Status',
            render: (value: string) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
          ${value === 'delivered' ? 'bg-green-100 text-green-800' :
                        value === 'transit' ? 'bg-primary-100 text-primary-800' :
                            'bg-gray-100 text-gray-800'}`}>
                    {value}
                </span>
            )
        },
        {
            key: 'shipmentId',
            header: 'Actions',
            render: (id: string, row: any) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-600">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => { }}>View Details</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {row.riskLevel === 'high' ? (
                            <DropdownMenuItem onClick={() => handleClear(row.shipmentId)} className="text-green-600">
                                <CheckCircle className="mr-2 h-4 w-4" /> Clear Risk Flag
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem onClick={() => handleFlag(row.shipmentId)} className="text-red-600">
                                <AlertTriangle className="mr-2 h-4 w-4" /> Flag as High Risk
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Fleet Oversight"
                subtitle="Real-time tracking of active shipments."
                actionLabel="Add Shipment"
                onAction={() => { }}
                icon={Truck}
            >
                <Button variant="outline">
                    <Navigation className="h-4 w-4 mr-2" /> Live Map
                </Button>
            </AdminPageHeader>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <DataTable
                    data={shipments}
                    columns={columns as any}
                    searchPlaceholder="Search tracking number or carrier..."
                    rowsPerPage={10}
                    onRowClick={(row) => setSelectedShipment(row)}
                />
            </div>

            {/* Shipment Detail Sheet */}
            <Sheet open={!!selectedShipment} onOpenChange={(open) => !open && setSelectedShipment(null)}>
                <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto p-6">
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-primary-600" />
                            Shipment Details
                        </SheetTitle>
                        <SheetDescription>
                            Shipment ID: {selectedShipment?.shipmentId}
                        </SheetDescription>
                    </SheetHeader>

                    {selectedShipment && (
                        <div className="py-6 space-y-8">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <span className="text-gray-500 block text-xs uppercase font-bold tracking-tight mb-1">Status</span>
                                    <span className="font-semibold text-gray-900">{selectedShipment.status}</span>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <span className="text-gray-500 block text-xs uppercase font-bold tracking-tight mb-1">Carrier</span>
                                    <span className="font-semibold text-gray-900">{selectedShipment.carrier}</span>
                                </div>
                            </div>

                            {/* Customs Filing Section */}
                            <div className="space-y-4 border rounded-xl p-4 bg-slate-50/50">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <FileCheck className="h-4 w-4 text-primary-600" />
                                        Customs & Compliance
                                    </h3>
                                    <Badge variant="outline" className={
                                        selectedShipment.customs?.filingStatus === 'filed' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                            selectedShipment.customs?.filingStatus === 'pending' ? "bg-amber-50 text-amber-700 border-amber-200" :
                                                "bg-slate-100 text-slate-500"
                                    }>
                                        {selectedShipment.customs?.filingStatus || 'UNSET'}
                                    </Badge>
                                </div>

                                {selectedShipment.customs?.filingStatus === 'filed' ? (
                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">HMRC Reference:</span>
                                            <span className="font-mono font-bold text-slate-900">{selectedShipment.customs.entryNumber}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Filed On:</span>
                                            <span className="font-medium">{new Date(selectedShipment.customs.filedAt).toLocaleString()}</span>
                                        </div>
                                        {selectedShipment.customs.notes && (
                                            <div className="mt-2 p-2 bg-white rounded border text-slate-600 italic">
                                                "{selectedShipment.customs.notes}"
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <p className="text-xs text-slate-600">
                                            This shipment requires customs filing. You can open the HMRC portal to file manually, then mark it as filed here.
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full h-8 text-xs font-semibold"
                                                onClick={() => window.open("https://import-notifications.service.gov.uk", "_blank")}
                                            >
                                                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                                                HMRC Portal
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="w-full h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                                                onClick={handleOpenFilingModal}
                                            >
                                                <ClipboardCheck className="w-3.5 h-3.5 mr-1.5" />
                                                Mark Filed
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-2">
                                {selectedShipment.riskLevel === 'high' ? (
                                    <Button variant="outline" className="w-full text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleClear(selectedShipment.shipmentId)}>
                                        <CheckCircle className="mr-2 h-4 w-4" /> Clear Risk Flag
                                    </Button>
                                ) : (
                                    <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleFlag(selectedShipment.shipmentId)}>
                                        <AlertTriangle className="mr-2 h-4 w-4" /> Flag as High Risk
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            {/* Filing Modal */}
            <Dialog open={isFilingModalOpen} onOpenChange={setIsFilingModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Customs Filing</DialogTitle>
                        <DialogDescription>
                            Enter the HMRC reference number for {selectedShipment?.shipmentId}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="ref">HMRC Reference (CDS/IPAFFS)</Label>
                            <Input
                                id="ref"
                                value={hmrcRef}
                                onChange={(e) => setHmrcRef(e.target.value)}
                                placeholder="e.g. GB-2026-..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <textarea
                                id="notes"
                                value={filingNotes}
                                onChange={(e) => setFilingNotes(e.target.value)}
                                placeholder="Optional filing notes..."
                                className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsFilingModalOpen(false)}>Cancel</Button>
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSubmitFiling} disabled={isSubmitting}>
                            {isSubmitting ? 'Submitting...' : 'Confirm'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminShipmentsPage;
