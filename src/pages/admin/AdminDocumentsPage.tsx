import React, { useMemo, useState } from 'react';
import { StatusBadge } from '@/components/ui/status-badge';
import DataTable from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useStickyQueryData } from '@/hooks/useStickyQueryData';
import { Eye, FileText } from 'lucide-react';
import AdminPageHeader from '@/components/layout/admin/AdminPageHeader';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription
} from '@/components/ui/sheet';

const AdminDocumentsPage = () => {
    // Live documents from Convex (Admin Query)
    const allDocumentsQuery = useQuery(api.admin.listAllDocuments);
    const allDocuments = useStickyQueryData("admin:documents:list", allDocumentsQuery, []);

    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<any>(null);

    const handleOpenDetail = (doc: any) => {
        setSelectedDoc(doc);
        setDetailOpen(true);
    };

    // Format Data
    const tableData = useMemo(() => {
        return allDocuments.map((doc: any) => ({
            ...doc,
            id: doc._id,
            documentNumber: doc.documentData?.documentNumber || '-',
            issueDate: doc.documentData?.issueDate || '-',
            owner: doc.orgId ? `Org (${doc.orgId.substring(0, 12)}...)` : (doc.userId ? 'Personal' : 'System'),
            type: doc.type?.replace(/_/g, ' ').toUpperCase() || 'UNKNOWN'
        }));
    }, [allDocuments]);

    const columns = [
        {
            key: 'documentNumber',
            header: 'Document #',
            sortable: true,
            mono: true,
            render: (val: string, row: any) => (
                <span className="text-blue-600 cursor-pointer hover:underline text-xs" onClick={() => handleOpenDetail(row)}>
                    {val}
                </span>
            )
        },
        {
            key: 'type',
            header: 'Type',
            sortable: true,
            render: (val: string) => <span className="text-[11px] font-medium">{val}</span>
        },
        {
            key: 'owner',
            header: 'Owner',
            sortable: true,
            render: (val: string) => <span className="text-[10px] text-gray-500 font-mono" title={val}>{val}</span>
        },
        {
            key: 'issueDate',
            header: 'Date',
            sortable: true,
            render: (val: string) => <span className="text-[11px]">{val !== '-' ? new Date(val).toLocaleDateString() : '-'}</span>
        },
        {
            key: 'status',
            header: 'Status',
            sortable: true,
            render: (value: string) => <StatusBadge status={value} />
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (_: string, row: any) => (
                <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleOpenDetail(row)} title="View Details">
                        <Eye className="h-3.5 w-3.5 text-gray-400" />
                    </Button>
                </div>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="All Documents"
                subtitle="View and manage documents from all organizations."
                actionLabel="Export CSV"
                onAction={() => { }}
                icon={FileText}
            />

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <DataTable
                    data={tableData}
                    columns={columns}
                    rowKey="_id"
                    searchPlaceholder="Search docs..."
                    rowsPerPage={20}
                    className="border-0"
                />
            </div>

            <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
                <SheetContent side="right" className="w-[400px] sm:w-[480px] overflow-y-auto p-6">
                    <SheetHeader>
                        <SheetTitle className="text-base font-bold">Document Details</SheetTitle>
                        <SheetDescription className="text-xs">{selectedDoc?.documentData?.documentNumber}</SheetDescription>
                    </SheetHeader>
                    {selectedDoc && (
                        <div className="mt-6 space-y-6">
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-4 text-xs">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <span className="block text-[10px] text-gray-500 uppercase font-bold tracking-tight mb-1">Document Type</span>
                                        <span className="font-bold text-gray-900">{selectedDoc.type}</span>
                                    </div>

                                    <div className="col-span-2">
                                        <span className="block text-[10px] text-gray-500 uppercase font-bold tracking-tight mb-1">Internal ID</span>
                                        <span className="font-mono text-[10px] block bg-white border border-gray-200 px-2 py-1.5 rounded break-all select-all text-gray-600">
                                            {selectedDoc._id}
                                        </span>
                                    </div>

                                    <div className="col-span-2">
                                        <span className="block text-[10px] text-gray-500 uppercase font-bold tracking-tight mb-1">Organization ID</span>
                                        <span className="font-mono text-[10px] block bg-white border border-gray-200 px-2 py-1.5 rounded break-all select-all text-gray-600">
                                            {selectedDoc.orgId || 'N/A (Personal or System)'}
                                        </span>
                                    </div>

                                    <div>
                                        <span className="block text-[10px] text-gray-500 uppercase font-bold tracking-tight mb-1">Created At</span>
                                        <span className="font-medium text-gray-900">{new Date(selectedDoc.createdAt).toLocaleString()}</span>
                                    </div>

                                    <div>
                                        <span className="block text-[10px] text-gray-500 uppercase font-bold tracking-tight mb-1">User ID</span>
                                        <span className="text-[10px] font-mono text-gray-600 truncate block" title={selectedDoc.userId}>
                                            {selectedDoc.userId || 'N/A'}
                                        </span>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-gray-200">
                                    <h4 className="font-bold mb-3 text-gray-900 uppercase text-[10px] tracking-tight">Entities</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase font-bold">Shipper</p>
                                            <p className="font-medium text-gray-900">{selectedDoc.documentData?.parties?.shipper?.name || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase font-bold">Consignee</p>
                                            <p className="font-medium text-gray-900">{selectedDoc.documentData?.parties?.consignee?.name || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default AdminDocumentsPage;
