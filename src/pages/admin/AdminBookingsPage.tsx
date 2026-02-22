import React, { useState } from 'react';
import { StatusBadge } from '@/components/ui/status-badge';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useStickyQueryData } from '@/hooks/useStickyQueryData';
import DataTable from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Check, X, FileText, AlertCircle } from 'lucide-react';
import AdminPageHeader from '@/components/layout/admin/AdminPageHeader';

const AdminBookingsPage = () => {
    const bookingsQuery = useQuery(api.admin.listAllBookings);
    const pendingApprovalsQuery = useQuery(api.bookings.listPendingApprovals);
    const bookings = useStickyQueryData("admin:bookings:list", bookingsQuery, []);
    const pendingApprovals = useStickyQueryData("admin:bookings:pending", pendingApprovalsQuery, []);

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
            toast.success(`Booking ${id} approved!`);
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
            toast.error(`Booking rejected.`);
            setRejectDialogOpen(false);
        } catch (e: any) {
            toast.error(e.message || "Failed to reject booking");
        } finally {
            setProcessingId(null);
        }
    };

    const columns: any[] = [
        {
            key: 'bookingId',
            header: 'Ref',
            mono: true,
            render: (value: string) => <span className="text-[11px] font-mono font-bold text-gray-900">{value}</span>
        },
        {
            key: 'customerDetails',
            header: 'Customer',
            render: (val: any) => (
                <div>
                    <div className="font-bold text-gray-900 text-xs">{val?.name}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-tight">{val?.company}</div>
                </div>
            )
        },
        {
            key: 'pickupDetails',
            header: 'Route',
            render: (_: any, row: any) => (
                <div className="text-[11px]">
                    <div className="flex items-center text-gray-900 font-bold">
                        <span className="w-12 text-[10px] text-gray-400 uppercase tracking-tighter">Origin</span>
                        {row.pickupDetails?.address?.split(',')[0]}
                    </div>
                    <div className="flex items-center text-gray-900 font-bold mt-0.5">
                        <span className="w-12 text-[10px] text-gray-400 uppercase tracking-tighter">Dest</span>
                        {row.deliveryDetails?.address?.split(',')[0]}
                    </div>
                </div>
            )
        },
        {
            key: 'status',
            header: 'Status',
            render: (value: string) => <StatusBadge status={value} />
        },
        {
            key: 'createdAt',
            header: 'Date',
            render: (value: number) => <span className="text-[11px] text-gray-500">{new Date(value).toLocaleDateString()}</span>
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
                                    className="bg-slate-900 hover:bg-slate-800 h-7 w-7 p-0"
                                    onClick={() => handleApprove(id)}
                                    disabled={processingId !== null}
                                >
                                    {isProcessing ? <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" /> : <Check className="h-3.5 w-3.5" />}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    className="h-7 w-7 p-0"
                                    onClick={() => handleOpenRejectDialog(id)}
                                    disabled={processingId !== null}
                                >
                                    <X className="h-3.5 w-3.5" />
                                </Button>
                            </>
                        )}
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600">
                            <FileText className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                );
            }
        }
    ];

    return (
        <div className="space-y-6">
            {pendingApprovals.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center shadow-sm">
                    <AlertCircle className="h-4 w-4 text-amber-600 mr-3" />
                    <div>
                        <p className="font-bold text-amber-900 text-xs">
                            {pendingApprovals.length} booking{pendingApprovals.length > 1 ? 's' : ''} pending approval
                        </p>
                        <p className="text-[10px] text-amber-700">Review and approve or reject these requests.</p>
                    </div>
                </div>
            )}

            <AdminPageHeader
                title="Booking Requests"
                subtitle="Manage incoming booking approvals and shipment requests."
                icon={FileText}
            />

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <DataTable
                    data={bookings}
                    columns={columns}
                    rowKey="bookingId"
                    searchPlaceholder="Search bookings..."
                    rowsPerPage={15}
                    className="border-0"
                />
            </div>

            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">Reject Booking</DialogTitle>
                        <DialogDescription className="text-xs">Provide a reason for rejection.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-gray-500">Reason</Label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" size="sm" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" size="sm" onClick={handleReject} disabled={processingId !== null}>
                            {processingId ? '...' : 'Reject Booking'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminBookingsPage;
