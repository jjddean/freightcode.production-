// @ts-nocheck
import React, { useState } from 'react';
import { StatusBadge } from '@/components/ui/status-badge';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useStickyQueryData } from '@/hooks/useStickyQueryData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
    Users,
    Building2,
    MoreHorizontal,
    Shield,
    UserCog,
    Ban,
    CheckCircle
} from 'lucide-react';
import DataTable from '@/components/ui/data-table';
import AdminPageHeader from '@/components/layout/admin/AdminPageHeader';

const AdminCustomersPage = () => {
    const usersQuery = useQuery(api.admin.listUsers);
    const orgsQuery = useQuery(api.admin.listOrganizations);
    const users = useStickyQueryData("admin:customers:users", usersQuery, []);
    const orgs = useStickyQueryData("admin:customers:orgs", orgsQuery, []);

    const suspendOrg = useMutation(api.organizations.suspendOrganization);
    const activateOrg = useMutation(api.organizations.activateOrganization);

    const handleSuspendOrg = async (orgId: any) => {
        try {
            await suspendOrg({ orgId });
            toast.success("Organization Suspended");
        } catch (error) {
            toast.error("Failed to suspend organization");
        }
    };

    const handleActivateOrg = async (orgId: any) => {
        try {
            await activateOrg({ orgId });
            toast.success("Organization Activated");
        } catch (error) {
            toast.error("Failed to activate organization");
        }
    };

    const userColumns: any[] = [
        {
            key: 'name',
            header: 'User',
            render: (val: string, row: any) => (
                <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border border-gray-200">
                        <AvatarImage src={row.imageUrl} />
                        <AvatarFallback className="bg-blue-50 text-blue-600 font-bold text-[10px]">{val?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="font-bold text-xs text-gray-900 tracking-tight">{val}</div>
                        <div className="text-[10px] text-gray-500 font-medium">{row.email}</div>
                    </div>
                </div>
            )
        },
        {
            key: 'role',
            header: 'Role',
            render: (val: string) => <StatusBadge status={val} />
        },
        {
            key: 'subscriptionTier',
            header: 'Plan',
            render: (val: string) => (
                <Badge
                    variant={val === 'pro' ? 'default' : 'secondary'}
                    className={val === 'pro' ? 'bg-slate-900 hover:bg-slate-800 text-[9px] h-4 px-1.5' : 'text-[9px] h-4 px-1.5'}
                >
                    {val || 'Free'}
                </Badge>
            )
        },
        {
            key: '_creationTime',
            header: 'Joined',
            render: (val: number) => <span className="text-[11px] text-gray-500 font-medium">{new Date(val).toLocaleDateString()}</span>
        },
        {
            key: '_id',
            header: 'Actions',
            render: () => (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-blue-600">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
            )
        }
    ];

    const orgColumns: any[] = [
        {
            key: 'name',
            header: 'Organization',
            render: (val: string) => (
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-50/50 rounded text-blue-600 border border-blue-100">
                        <Building2 className="h-3 w-3" />
                    </div>
                    <span className="font-bold text-xs text-gray-900 tracking-tight">{val}</span>
                </div>
            )
        },
        {
            key: 'status',
            header: 'Status',
            render: (val: string) => <StatusBadge status={val || 'active'} />
        },
        {
            key: '_creationTime',
            header: 'Created',
            render: (val: number) => <span className="text-[11px] text-gray-500 font-medium">{new Date(val).toLocaleDateString()}</span>
        },
        {
            key: '_id',
            header: 'Actions',
            render: (_: any, row: any) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-blue-600">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel className="text-[10px] uppercase font-bold text-gray-400">Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {row.status === 'suspended' ? (
                            <DropdownMenuItem onClick={() => handleActivateOrg(row._id)} className="text-green-600 text-xs">
                                <CheckCircle className="mr-2 h-3.5 w-3.5" /> Activate Organization
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem onClick={() => handleSuspendOrg(row._id)} className="text-red-600 text-xs">
                                <Ban className="mr-2 h-3.5 w-3.5" /> Suspend Organization
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Customer Management"
                subtitle="Manage users, organizations, and access controls."
                actionLabel="Add User"
                onAction={() => { }}
                icon={Users}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 bg-white shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-tight">Total Users</p>
                            <h3 className="text-xl font-bold text-slate-900 mt-0.5 tracking-tight">{users.length}</h3>
                        </div>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <Users className="h-4 w-4" />
                        </div>
                    </div>
                </Card>
                <Card className="p-4 bg-white shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-tight">Organizations</p>
                            <h3 className="text-xl font-bold text-slate-900 mt-0.5 tracking-tight">{orgs.length}</h3>
                        </div>
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                            <Building2 className="h-4 w-4" />
                        </div>
                    </div>
                </Card>
            </div>

            <Tabs defaultValue="users" className="w-full">
                <TabsList className="grid w-full max-w-[200px] grid-cols-2 mb-4 bg-slate-100/50 p-1 rounded-lg h-8">
                    <TabsTrigger value="users" className="h-6 text-[11px] font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Users</TabsTrigger>
                    <TabsTrigger value="orgs" className="h-6 text-[11px] font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Orgs</TabsTrigger>
                </TabsList>

                <TabsContent value="users">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <DataTable
                            data={users}
                            columns={userColumns}
                            rowKey="_id"
                            searchPlaceholder="Search users..."
                            rowsPerPage={15}
                            className="border-0"
                        />
                    </div>
                </TabsContent>

                <TabsContent value="orgs">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <DataTable
                            data={orgs}
                            columns={orgColumns}
                            rowKey="_id"
                            searchPlaceholder="Search organizations..."
                            rowsPerPage={15}
                            className="border-0"
                        />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AdminCustomersPage;
