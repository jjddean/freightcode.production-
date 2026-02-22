import React, { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useStickyQueryData } from '@/hooks/useStickyQueryData';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
    Check,
    X,
    AlertTriangle,
    FileText,
    Users,
    Truck,
    Clock,
    ChevronRight,
    ArrowUpRight,
    CreditCard
} from 'lucide-react';
import AdminPageHeader from '@/components/layout/admin/AdminPageHeader';

const AdminApprovalsPage = () => {
    const pendingActionsQuery = useQuery(api.admin.getPendingActions);
    const pendingActions = useStickyQueryData("admin:approvals:pending", pendingActionsQuery, []);

    const approveBooking = useMutation(api.bookings.approveBooking);
    const rejectBooking = useMutation(api.bookings.rejectBooking);
    const approveKyc = useMutation(api.compliance.approveKyc);
    const rejectKyc = useMutation(api.compliance.rejectKyc);

    const [processingId, setProcessingId] = useState<string | null>(null);

    const handleAction = async (item: any, action: 'approve' | 'reject') => {
        setProcessingId(item.id);
        try {
            if (item.type === 'booking') {
                if (action === 'approve') await approveBooking({ bookingId: item.id });
                else await rejectBooking({ bookingId: item.id, reason: "Admin rejected from inbox" });
            } else if (item.type === 'kyc') {
                if (action === 'approve') await approveKyc({ id: item.id });
                else await rejectKyc({ id: item.id, reason: "Admin rejected from inbox" });
            } else {
                toast.info("Document actions must be done in the Details view for now.");
                return;
            }
            toast.success(`${action === 'approve' ? 'Approved' : 'Rejected'} ${item.type}`);
        } catch (error) {
            console.error(error);
            toast.error("Action failed");
        } finally {
            setProcessingId(null);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'booking': return <Truck className="h-4 w-4 text-primary-500" />;
            case 'kyc': return <Users className="h-4 w-4 text-purple-500" />;
            case 'document': return <FileText className="h-4 w-4 text-orange-500" />;
            case 'payment': return <CreditCard className="h-4 w-4 text-red-500" />;
            default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <AdminPageHeader
                title="Inbox"
                subtitle="Unified queue for all pending approvals and high-risk items."
                icon={FileText}
            >
                <div className="flex space-x-2">
                    <Badge variant="outline" className="px-2 py-0.5 text-[10px] bg-white font-bold uppercase tracking-tight">
                        {pendingActions.length} Pending
                    </Badge>
                </div>
            </AdminPageHeader>

            {pendingActions.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="bg-emerald-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="h-6 w-6 text-emerald-500" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900">All caught up!</h3>
                    <p className="text-xs text-gray-500">No pending actions requiring your attention.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {pendingActions.map((item: any) => (
                        <Card key={item.id} className="p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                                <div className="flex gap-4">
                                    <div className="mt-1 p-2 bg-gray-50 rounded-lg">
                                        {getIcon(item.type)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant={item.priority === 'critical' ? 'destructive' : 'secondary'} className="uppercase text-[9px] px-1.5 py-0 font-bold">
                                                {item.priority}
                                            </Badge>
                                            <span className="text-[10px] text-gray-400 flex items-center">
                                                <Clock className="h-3 w-3 mr-1" />
                                                {new Date(item.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-gray-900 text-sm">{item.title}</h3>
                                        <p className="text-xs text-gray-600">{item.subtitle}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-[10px] font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-3"
                                        onClick={() => handleAction(item, 'reject')}
                                        disabled={!!processingId}
                                    >
                                        Reject
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="h-8 text-[10px] font-bold bg-slate-900 hover:bg-slate-800 text-white px-3"
                                        onClick={() => handleAction(item, 'approve')}
                                        disabled={!!processingId}
                                    >
                                        {processingId === item.id ? '...' : 'Approve'}
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-300">
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminApprovalsPage;
