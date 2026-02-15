import React, { useMemo, useState } from 'react';
import { StatusBadge } from '@/components/ui/status-badge';
import DataTable from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
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
    const allDocuments = useQuery(api.admin.listAllDocuments) || [];

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
            // Try to show context
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
                <span className="text-blue-600 cursor-pointer hover:underline" onClick={() => handleOpenDetail(row)}>
                    {val}
                </span>
            )
        },
        {
            key: 'type',
            header: 'Type',
            sortable: true,
            render: (val: string) => <span className="text-xs font-medium">{val}</span>
        },
        {
            key: 'owner',
            header: 'Owner',
            sortable: true,
            render: (val: string) => <span className="text-xs text-gray-500 font-mono" title={val}>{val}</span>
        },
        {
            key: 'issueDate',
            header: 'Date',
            sortable: true,
            render: (val: string) => <span className="text-xs">{val !== '-' ? new Date(val).toLocaleDateString() : '-'}</span>
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
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleOpenDetail(row)} title="View Details">
                        <Eye className="h-4 w-4 text-gray-500" />
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
                    searchPlaceholder="Search by document # or type..."
                    rowsPerPage={20}
                    className="border-0"
                />
            </div>

            <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
                <SheetContent className="sm:max-w-md w-full overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>Document Details</SheetTitle>
                        <SheetDescription>{selectedDoc?.documentData?.documentNumber}</SheetDescription>
                    </SheetHeader>
                    {selectedDoc && (
                        <div className="mt-6 space-y-6">
                            <div className="p-4 bg-gray-50 rounded-lg border space-y-2 text-sm">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <span className="block text-xs text-gray-500 mb-1">Document Type</span>
                                        <span className="font-medium text-lg text-gray-900">{selectedDoc.type}</span>
                                    </div>

                                    <div className="col-span-2">
                                        <span className="block text-xs text-gray-500 mb-1">Internal ID</span>
                                        <span className="font-mono text-xs block bg-gray-50 border border-gray-200 px-2 py-1.5 rounded break-all select-all text-gray-600">
                                            {selectedDoc._id}
                                        </span>
                                    </div>

                                    <div className="col-span-2">
                                        <span className="block text-xs text-gray-500 mb-1">Organization ID</span>
                                        <span className="font-mono text-xs block bg-gray-50 border border-gray-200 px-2 py-1.5 rounded break-all select-all text-gray-600">
                                            {selectedDoc.orgId || 'N/A (Personal or System)'}
                                        </span>
                                    </div>

                                    <div>
                                        <span className="block text-xs text-gray-500 mb-1">Created At</span>
                                        <span className="text-sm font-medium">{new Date(selectedDoc.createdAt).toLocaleString()}</span>
                                    </div>

                                    <div>
                                        <span className="block text-xs text-gray-500 mb-1">User ID</span>
                                        <span className="text-xs font-mono text-gray-600 truncate block" title={selectedDoc.userId}>
                                            {selectedDoc.userId || 'N/A'}
                                        </span>
                                    </div>
                                </div>
                                <div className="pt-4 border-t mt-4">
                                    <h4 className="font-semibold mb-3 text-gray-900">Entities</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs text-gray-500">Shipper</p>
                                            <p className="font-medium">{selectedDoc.documentData?.parties?.shipper?.name || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Consignee</p>
                                            <p className="font-medium">{selectedDoc.documentData?.parties?.consignee?.name || 'N/A'}</p>
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
