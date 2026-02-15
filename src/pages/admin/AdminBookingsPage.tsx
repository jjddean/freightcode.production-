import React, { useState } from 'react';
import { StatusBadge } from '@/components/ui/status-badge';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import DataTable from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Check, X, FileText, AlertCircle } from 'lucide-react';
import AdminPageHeader from '@/components/layout/admin/AdminPageHeader';

const AdminBookingsPage = () => {
    const bookings = useQuery(api.admin.listAllBookings) || [];
    const pendingApprovals = useQuery(api.bookings.listPendingApprovals) || [];

    const approveBooking = useMutation(api.bookings.approveBooking);
    const rejectBooking = useMutation(api.bookings.rejectBooking);

    const [processingId, setProcessingId] = useState<string | null>(null);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    const handleApprove = async (id: string) => {
        setProcessingId(id);
        try {
            await approveBooking({ bookingId: id });
            toast.success(`Booking ${id} approved! Customer notified.`);
        } catch (e: any) {
            toast.error(e.message || "Failed to approve booking");
        } finally {
            setProcessingId(null);
        }
    };

    const handleOpenRejectDialog = (id: string) => {
        setSelectedBookingId(id);
        setRejectReason('');
        setRejectDialogOpen(true);
    };

    const handleReject = async () => {
        if (!selectedBookingId || !rejectReason.trim()) {
            toast.error("Please provide a rejection reason");
            return;
        }
        setProcessingId(selectedBookingId);
        try {
            await rejectBooking({ bookingId: selectedBookingId, reason: rejectReason });
            toast.error(`Booking ${selectedBookingId} rejected. Customer notified.`);
            setRejectDialogOpen(false);
        } catch (e: any) {
            toast.error(e.message || "Failed to reject booking");
        } finally {
            setProcessingId(null);
        }
    };

    // Combine and sort - pending approvals first
    const pendingIds = new Set(pendingApprovals.map((b: any) => b.bookingId));

    const columns: any[] = [
        {
            key: 'bookingId',
            header: 'Booking Ref',
            mono: true,
            render: (value: string) => value
        },
        {
            key: 'customerDetails',
            header: 'Customer',
            render: (val: any) => (
                <div>
                    <div className="font-medium text-gray-900">{val.name}</div>
                    <div className="text-xs text-gray-500">{val.company}</div>
                </div>
            )
        },
        {
            key: 'pickupDetails',
            header: 'Route',
            render: (_: any, row: any) => (
                <div className="text-sm">
                    <div className="flex items-center text-gray-900">
                        <span className="w-16 text-xs text-gray-500">Origin:</span>
                        {row.pickupDetails?.address?.split(',')[0]}
                    </div>
                    <div className="flex items-center text-gray-900 mt-1">
                        <span className="w-16 text-xs text-gray-500">Dest:</span>
                        {row.deliveryDetails?.address?.split(',')[0]}
                    </div>
                </div>
            )
        },
        {
            key: 'status',
            header: 'Status',
            render: (value: string, row: any) => {
                const isPending = value === 'pending' || row.approvalStatus === 'pending';
                const statusValue = isPending ? 'pending' : value;

                return (
                    <div className="flex items-center">
                        <StatusBadge status={statusValue} />
                    </div>
                );
            }
        },
        {
            key: 'createdAt',
            header: 'Submitted',
            render: (value: number) => new Date(value).toLocaleDateString()
        },
        {
            key: 'bookingId',
            header: 'Actions',
            render: (id: string, row: any) => {
                const isProcessing = processingId === id;
                const isPending = row.status === 'pending' || row.approvalStatus === 'pending';

                return (
                    <div className="flex space-x-2">
                        {isPending && (
                            <>
                                <Button
                                    size="sm"
                                    className="bg-primary hover:bg-primary-700 h-8 px-2"
                                    onClick={() => handleApprove(id)}
                                    disabled={processingId !== null}
                                    title="Approve Booking"
                                >
                                    {isProcessing ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Check className="h-4 w-4" />}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    className="h-8 px-2"
                                    onClick={() => handleOpenRejectDialog(id)}
                                    disabled={processingId !== null}
                                    title="Reject Booking"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </>
                        )}
                        <Button size="sm" variant="outline" className="h-8 px-2" title="View Details">
                            <FileText className="h-4 w-4" />
                        </Button>
                    </div>
                );
            }
        }
    ];

    return (
        <div className="space-y-6">
            {/* Pending Approvals Alert */}
            {pendingApprovals.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mr-3" />
                    <div>
                        <p className="font-medium text-yellow-800">
                            {pendingApprovals.length} booking{pendingApprovals.length > 1 ? 's' : ''} pending approval
                        </p>
                        <p className="text-sm text-yellow-700">Review and approve or reject these requests.</p>
                    </div>
                </div>
            )}

            <AdminPageHeader
                title="Booking Requests"
                subtitle="Manage incoming booking approvals and shipment requests."
                actionLabel="Export CSV"
                onAction={() => { }}
                icon={FileText}
            />

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <DataTable
                    data={bookings}
                    columns={columns}
                    searchPlaceholder="Search bookings..."
                    rowsPerPage={10}
                />
            </div>

            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Booking</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this booking. The customer will be notified.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="rejectReason">Rejection Reason</Label>
                            <textarea
                                id="rejectReason"
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="e.g., Route not serviceable, cargo type not supported..."
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleReject} disabled={processingId !== null}>
                            {processingId ? 'Rejecting...' : 'Reject Booking'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminBookingsPage;

