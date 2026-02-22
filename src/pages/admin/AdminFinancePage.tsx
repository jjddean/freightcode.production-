import React, { useState } from 'react';
import { StatusBadge } from '@/components/ui/status-badge';
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useStickyQueryData } from '@/hooks/useStickyQueryData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, FileText, Download, Filter, TrendingUp } from 'lucide-react';
import AdminPageHeader from '@/components/layout/admin/AdminPageHeader';
import DataTable from '@/components/ui/data-table';
import { Checkbox } from "@/components/ui/checkbox";

const AdminFinancePage = () => {
    const invoicesQuery = useQuery(api.paymentsData.listAllInvoices);
    const paymentsQuery = useQuery(api.paymentsData.listAllPayments);
    const invoices = useStickyQueryData("admin:finance:invoices", invoicesQuery, []);
    const payments = useStickyQueryData("admin:finance:payments", paymentsQuery, []);

    const formatCurrency = (amount: number, currency: string) => {
        try {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
        } catch (e) {
            return `${currency} ${amount}`;
        }
    };

    const invoiceColumns: any[] = [
        { key: 'invoiceNumber', header: 'Invoice #', mono: true },
        {
            key: 'status',
            header: 'Status',
            render: (val: string) => <StatusBadge status={val} />
        },
        {
            key: 'amount',
            header: 'Amount',
            align: 'right',
            render: (val: number, row: any) => <span className="font-medium text-xs">{formatCurrency(val, row.currency)}</span>
        },
        { key: 'dueDate', header: 'Due Date', render: (val: string) => val ? new Date(val).toLocaleDateString() : '-' },
        {
            key: 'invoiceNumber',
            header: 'Actions',
            render: () => <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Download className="h-3.5 w-3.5" /></Button>
        }
    ];

    const paymentColumns: any[] = [
        { key: 'payment_id', header: 'Transaction ID', mono: true },
        { key: 'status', header: 'Status', render: (val: string) => <StatusBadge status={val} /> },
        {
            key: 'totals',
            header: 'Amount',
            render: (val: any) => <span className="font-medium text-xs">{val?.grand_total?.amount_formatted}</span>
        },
        { key: 'payer', header: 'Customer', render: (val: any) => <div className="text-xs">{val?.email}</div> },
        { key: 'created_at', header: 'Date', render: (val: number) => new Date(val).toLocaleDateString() }
    ];

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Finance & Billing"
                subtitle="Manage invoices, payment reconciliation, and refunds."
                icon={CreditCard}
                actionLabel="Generate Invoice"
                onAction={() => { }}
            >
                <Button variant="outline" size="sm" className="h-9 px-4 text-xs font-bold"><Filter className="mr-2 h-3.5 w-3.5" /> Filter</Button>
            </AdminPageHeader>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-5 bg-white shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                            <TrendingUp className="h-4 w-4" />
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-tight">
                            +12% vs last month
                        </span>
                    </div>
                    <h3 className="text-gray-500 text-[10px] uppercase font-bold tracking-tight">Revenue (MTD)</h3>
                    <div className="text-xl font-bold text-gray-900 mt-1 tracking-tight">$124,500</div>
                </Card>

                <Card className="p-5 bg-white shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-lg bg-slate-50 text-slate-600">
                            <FileText className="h-4 w-4" />
                        </div>
                        <span className="text-[10px] font-medium text-gray-500">
                            8 accounts
                        </span>
                    </div>
                    <h3 className="text-gray-500 text-[10px] uppercase font-bold tracking-tight">Pending Invoices</h3>
                    <div className="text-xl font-bold text-gray-900 mt-1 tracking-tight">$12,250</div>
                </Card>
            </div>

            <Card className="bg-slate-50 border-slate-200">
                <div className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
                    <div className="shrink-0 flex items-center gap-2">
                        <div className="p-2 bg-white border border-slate-200 rounded text-slate-600">
                            <FileText className="h-4 w-4" />
                        </div>
                        <div>
                            <h3 className="text-slate-900 font-bold text-xs">Invoice Approval Checklist</h3>
                            <p className="text-slate-500 text-[10px]">Verify before reconciliation</p>
                        </div>
                    </div>
                    <div className="w-px h-8 bg-slate-200 hidden md:block"></div>
                    <div className="flex-1 w-full">
                        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 text-xs text-slate-700">
                            <li className="flex items-center gap-2">
                                <Checkbox id="po-match" className="h-3.5 w-3.5" />
                                <label htmlFor="po-match" className="cursor-pointer text-[10px] font-medium">PO Number matches?</label>
                            </li>
                            <li className="flex items-center gap-2">
                                <Checkbox id="weight-var" className="h-3.5 w-3.5" />
                                <label htmlFor="weight-var" className="cursor-pointer text-[10px] font-medium">Weight variance checked?</label>
                            </li>
                            <li className="flex items-center gap-2">
                                <Checkbox id="accessorials" className="h-3.5 w-3.5" />
                                <label htmlFor="accessorials" className="cursor-pointer text-[10px] font-medium">Accessorials verified?</label>
                            </li>
                            <li className="flex items-center gap-2">
                                <Checkbox id="vat-duty" className="h-3.5 w-3.5" />
                                <label htmlFor="vat-duty" className="cursor-pointer text-[10px] font-medium">VAT/Duty amount correct?</label>
                            </li>
                            <li className="flex items-center gap-2">
                                <Checkbox id="disputes" className="h-3.5 w-3.5" />
                                <label htmlFor="disputes" className="cursor-pointer text-[10px] font-medium">Disputes flagged?</label>
                            </li>
                        </ul>
                    </div>
                </div>
            </Card>

            <Tabs defaultValue="invoices" className="w-full">
                <TabsList className="h-9">
                    <TabsTrigger value="invoices" className="text-xs">Invoices</TabsTrigger>
                    <TabsTrigger value="payments" className="text-xs">Transactions</TabsTrigger>
                </TabsList>

                <TabsContent value="invoices" className="mt-4">
                    <Card className="p-0 overflow-hidden border-gray-200 shadow-sm">
                        <div className="p-3 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900 flex items-center text-xs">
                                <FileText className="h-3.5 w-3.5 mr-2" /> Recent Invoices
                            </h3>
                        </div>
                        <DataTable
                            data={invoices}
                            columns={invoiceColumns}
                            rowKey="invoiceNumber"
                            searchPlaceholder="Search invoices..."
                        />
                    </Card>
                </TabsContent>

                <TabsContent value="payments" className="mt-4">
                    <Card className="p-0 overflow-hidden border-gray-200 shadow-sm">
                        <div className="p-3 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900 flex items-center text-xs">
                                <CreditCard className="h-3.5 w-3.5 mr-2" /> Payment History
                            </h3>
                        </div>
                        <DataTable
                            data={payments}
                            columns={paymentColumns}
                            rowKey="payment_id"
                            searchPlaceholder="Search transactions..."
                        />
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AdminFinancePage;
