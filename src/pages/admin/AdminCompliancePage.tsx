import React from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useStickyQueryData } from '@/hooks/useStickyQueryData';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ShieldAlert, CheckCircle, FileWarning } from 'lucide-react';
import { toast } from 'sonner';
import AdminPageHeader from '@/components/layout/admin/AdminPageHeader';

const AdminCompliancePage = () => {
    const kyQueueQuery = useQuery(api.compliance.listPendingKyc);
    const kyQueue = useStickyQueryData("admin:compliance:kyc", kyQueueQuery, []);

    const approveKyc = useMutation(api.compliance.approveKyc);
    const rejectKyc = useMutation(api.compliance.rejectKyc);

    const handleApproveKYC = async (id: string) => {
        try {
            await approveKyc({ id: id as any });
            toast.success(`KYC Request Approved`);
        } catch (error) {
            toast.error("Failed to approve");
            console.error(error);
        }
    };

    const handleRejectKYC = async (id: string) => {
        const reason = prompt("Enter rejection reason:");
        if (!reason) return;

        try {
            await rejectKyc({ id: id as any, reason });
            toast.success("KYC Request Rejected");
        } catch (error) {
            toast.error("Failed to reject");
        }
    };

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Compliance & KYC"
                subtitle="Review identity verifications and compliance alerts."
                icon={ShieldAlert}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-5 bg-white shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                            <ShieldAlert className="h-4 w-4" />
                        </div>
                        <span className="text-[10px] font-bold text-orange-600 uppercase tracking-tight">
                            Action Required
                        </span>
                    </div>
                    <h3 className="text-gray-500 text-[10px] uppercase font-bold tracking-tight">Pending Reviews</h3>
                    <div className="text-xl font-bold text-gray-900 mt-0.5 tracking-tight">{kyQueue.length}</div>
                </Card>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-xs font-bold text-gray-900 mb-4 uppercase tracking-tight">KYC Approval Queue</h3>

                {kyQueue.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-400" />
                        <p className="text-xs font-medium">All clean. No pending compliance reviews.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {kyQueue.map((item: any) => (
                            <div key={item._id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-gray-50 transition-colors">
                                <div className="flex items-center space-x-4">
                                    <div className="p-2 bg-orange-50 rounded-lg">
                                        <FileWarning className="h-4 w-4 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">Verifying: {item.companyName}</p>
                                        <div className="text-[11px] text-gray-500 flex gap-2">
                                            <span>Reg: {item.registrationNumber}</span>
                                            <span className="text-gray-300">•</span>
                                            <span>Country: {item.country}</span>
                                        </div>
                                        <div className="text-[10px] text-primary-600 mt-1 font-bold">
                                            Docs: {item.documents?.length || 0} attached
                                        </div>
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <Button size="sm" variant="outline" className="h-8 text-[11px] font-bold px-3" onClick={() => handleRejectKYC(item._id)}>Reject</Button>
                                    <Button size="sm" className="h-8 text-[11px] font-bold bg-slate-900 hover:bg-slate-800 text-white px-3" onClick={() => handleApproveKYC(item._id)}>Approve</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminCompliancePage;
