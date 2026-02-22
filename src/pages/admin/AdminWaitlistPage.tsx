import React, { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useStickyQueryData } from '@/hooks/useStickyQueryData';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Mail, Clock, CheckCircle2, History } from 'lucide-react';
import DataTable from '@/components/ui/data-table';
import AdminPageHeader from '@/components/layout/admin/AdminPageHeader';

const AdminWaitlistPage = () => {
    const waitlistQuery = useQuery(api.admin.listWaitlist);
    const waitlist = useStickyQueryData("admin:waitlist:list", waitlistQuery, []);
    const approveUser = useMutation(api.admin.approveWaitlistUser);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const handleInvite = async (id: string, email: string) => {
        setProcessingId(id);
        try {
            await approveUser({ id } as any);
            toast.success(`Invite sent to ${email}`);
        } catch (e) {
            toast.error("Failed to send invite");
        } finally {
            setProcessingId(null);
        }
    };

    const columns: any[] = [
        {
            key: 'email',
            header: 'Email / Identity',
            render: (val: string) => <span className="font-bold text-xs text-slate-900 tracking-tight">{val}</span>
        },
        {
            key: 'company',
            header: 'Entity',
            render: (val: string) => (
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-tight">
                    {val || "Individual"}
                </span>
            )
        },
        {
            key: 'status',
            header: 'Queue Status',
            render: (val: string) => (
                <Badge variant="outline" className={`
                    text-[9px] font-bold uppercase px-1.5 h-4
                    ${val === 'invited' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        val === 'pending' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-slate-50 text-slate-600 border-slate-200'}
                `}>
                    {val === 'invited' ? <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> : <Clock className="w-2.5 h-2.5 mr-1" />}
                    {val}
                </Badge>
            )
        },
        {
            key: 'createdAt',
            header: 'Auth Date',
            render: (val: number) => <span className="text-[11px] text-slate-500 font-medium">{new Date(val).toLocaleDateString()}</span>
        },
        {
            key: '_id',
            header: 'Actions',
            render: (id: string, row: any) => (
                <div className="flex gap-2">
                    {row.status !== 'invited' && (
                        <Button
                            size="sm"
                            className="bg-slate-900 hover:bg-slate-800 text-white h-7 text-[10px] font-bold uppercase tracking-tight px-3 shadow-sm"
                            onClick={() => handleInvite(id, row.email)}
                            disabled={processingId === id}
                        >
                            <Mail className="w-3 h-3 mr-1.5" />
                            {processingId === id ? '···' : 'Invite'}
                        </Button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Waitlist Management"
                subtitle="Manage early access requests and user onboarding."
                icon={History}
            >
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-tight text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                    <span className="text-blue-600 font-black">{waitlist.length}</span> Total
                    <span className="text-slate-200">|</span>
                    <span className="text-emerald-600 font-black">{waitlist.filter((w: any) => w.status === 'invited').length}</span> Invited
                </div>
            </AdminPageHeader>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <DataTable
                    data={waitlist}
                    columns={columns}
                    rowKey="_id"
                    searchPlaceholder="Filter queue..."
                    className="border-0"
                    rowsPerPage={20}
                />
            </div>
        </div>
    );
};

export default AdminWaitlistPage;
