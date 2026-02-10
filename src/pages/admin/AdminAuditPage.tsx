import React from 'react';
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    ShieldAlert,
    ShieldCheck,
    User,
    CreditCard,
    Activity,
    Shield
} from 'lucide-react';
import DataTable from '@/components/ui/data-table';
import AdminPageHeader from '@/components/layout/admin/AdminPageHeader';

const AdminAuditPage = () => {
    const logs = useQuery(api.auditLogs.listLogs, {}) || [];

    const getIcon = (action: string) => {
        if (action.includes('error') || action.includes('failed') || action.includes('rejected')) return <ShieldAlert className="h-4 w-4 text-red-500" />;
        if (action.includes('payment')) return <CreditCard className="h-4 w-4 text-blue-500" />;
        if (action.includes('login') || action.includes('user')) return <User className="h-4 w-4 text-gray-500" />;
        return <Activity className="h-4 w-4 text-emerald-500" />;
    };

    const columns: any[] = [
        {
            key: 'action',
            header: 'Action / Event',
            render: (val: string, row: any) => (
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-gray-50 rounded-md border border-gray-100">
                        {getIcon(val)}
                    </div>
                    <span className="font-medium text-sm text-gray-900">{val}</span>
                </div>
            )
        },
        {
            key: 'entityType',
            header: 'Module',
            render: (val: string) => <Badge variant="outline" className="text-xs uppercase bg-gray-50 text-gray-600 border-gray-200">{val}</Badge>
        },
        {
            key: 'userId',
            header: 'User / Actor',
            render: (val: string, row: any) => (
                <div className="text-xs">
                    <div className="font-mono text-gray-600">{val?.substring(0, 12)}...</div>
                    {(row.userEmail) && <div className="text-gray-400">{row.userEmail}</div>}
                </div>
            )
        },
        {
            key: 'details',
            header: 'Details',
            render: (val: any) => (
                <div className="max-w-xs truncate text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded">
                    {JSON.stringify(val)}
                </div>
            )
        },
        {
            key: 'timestamp',
            header: 'Time',
            render: (val: number) => <span className="text-sm text-gray-500">{new Date(val).toLocaleString()}</span>
        }
    ];

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Audit & Security Logs"
                subtitle="Monitor system activity, compliance events, and user actions."
                icon={Shield}
            />

            <Card className="overflow-hidden border-gray-200 shadow-sm bg-white">
                <DataTable
                    data={logs}
                    columns={columns}
                    searchPlaceholder="Filter logs..."
                    rowsPerPage={15}
                />
            </Card>
        </div>
    );
};

export default AdminAuditPage;
