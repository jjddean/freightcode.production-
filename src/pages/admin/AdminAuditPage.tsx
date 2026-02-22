import React from 'react';
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useStickyQueryData } from '@/hooks/useStickyQueryData';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    ShieldAlert,
    User,
    CreditCard,
    Activity,
    Shield
} from 'lucide-react';
import DataTable from '@/components/ui/data-table';
import AdminPageHeader from '@/components/layout/admin/AdminPageHeader';

const AdminAuditPage = () => {
    const logsQuery = useQuery(api.auditLogs.listLogs, {});
    const logs = useStickyQueryData("admin:audit:logs", logsQuery, []);

    const getIcon = (action: string) => {
        const a = action.toLowerCase();
        if (a.includes('error') || a.includes('failed') || a.includes('rejected')) return <ShieldAlert className="h-3.5 w-3.5 text-red-500" />;
        if (a.includes('payment') || a.includes('finance')) return <CreditCard className="h-3.5 w-3.5 text-blue-500" />;
        if (a.includes('login') || a.includes('user') || a.includes('auth')) return <User className="h-3.5 w-3.5 text-gray-400" />;
        return <Activity className="h-3.5 w-3.5 text-emerald-500" />;
    };

    const columns: any[] = [
        {
            key: 'action',
            header: 'Action / Event',
            render: (val: string) => (
                <div className="flex items-center gap-3">
                    <div className="p-1 bg-white rounded-lg border border-gray-100 shadow-sm">
                        {getIcon(val)}
                    </div>
                    <span className="font-bold text-[11px] text-gray-900 tracking-tight">{val}</span>
                </div>
            )
        },
        {
            key: 'entityType',
            header: 'Module',
            render: (val: string) => <Badge variant="outline" className="text-[10px] font-bold uppercase bg-slate-50 text-slate-500 border-slate-200 px-1.5 py-0">{val}</Badge>
        },
        {
            key: 'userId',
            header: 'User / Actor',
            render: (val: string, row: any) => (
                <div className="text-[11px]">
                    <div className="font-mono text-gray-600 font-bold">{val?.substring(0, 12)}...</div>
                    {(row.userEmail) && <div className="text-gray-400 text-[10px]">{row.userEmail}</div>}
                </div>
            )
        },
        {
            key: 'details',
            header: 'Details',
            render: (val: any) => (
                <div className="max-w-xs truncate text-[10px] text-gray-400 font-mono bg-white px-2 py-1 rounded border border-gray-100">
                    {JSON.stringify(val)}
                </div>
            )
        },
        {
            key: 'timestamp',
            header: 'Time',
            render: (val: number) => <span className="text-[11px] text-gray-500">{new Date(val).toLocaleString()}</span>
        }
    ];

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Audit & Security Logs"
                subtitle="Monitor system activity, compliance events, and user actions."
                icon={Shield}
            />

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <DataTable
                    data={logs}
                    columns={columns}
                    rowKey="_id"
                    searchPlaceholder="Filter logs..."
                    rowsPerPage={20}
                    className="border-0"
                />
            </div>
        </div>
    );
};

export default AdminAuditPage;
