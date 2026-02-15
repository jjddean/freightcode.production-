// @ts-nocheck
import React, { useState } from 'react';
import { StatusBadge } from '@/components/ui/status-badge';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
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
import { useAction } from "convex/react";

const AdminCustomersPage = () => {
    // const { toast } = useToast(); // Removed
    const users = useQuery(api.admin.listUsers) || [];
    const orgs = useQuery(api.admin.listOrganizations) || [];

    const suspendOrg = useMutation(api.organizations.suspendOrganization);
    const activateOrg = useMutation(api.organizations.activateOrganization);

    const handleSuspendOrg = async (orgId: any) => {
        try {
            await suspendOrg({ orgId });
            toast({ title: "Organization Suspended", description: "Access for this organization has been blocked." });
        } catch (error) {
            toast({ title: "Error", description: "Failed to suspend organization.", variant: "destructive" });
        }
    };

    const handleActivateOrg = async (orgId: any) => {
        try {
            await activateOrg({ orgId });
            toast({ title: "Organization Activated", description: "Access restored." });
        } catch (error) {
            toast({ title: "Error", description: "Failed to activate organization.", variant: "destructive" });
        }
    };

    const userColumns: any[] = [
        {
            key: 'name',
            header: 'User',
            render: (val: string, row: any) => (
                <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-gray-200">
                        <AvatarImage src={row.imageUrl} />
                        <AvatarFallback className="bg-blue-50 text-blue-600 font-medium">{val?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="font-medium text-sm text-gray-900">{val}</div>
                        <div className="text-xs text-gray-500">{row.email}</div>
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
            render: (val: string) => <Badge variant={val === 'pro' ? 'default' : 'secondary'} className={val === 'pro' ? 'bg-slate-900 hover:bg-slate-800' : ''}>{val || 'Free'}</Badge>
        },
        {
            key: '_creationTime',
            header: 'Joined',
            render: (val: number) => <span className="text-sm text-gray-500">{new Date(val).toLocaleDateString()}</span>
        },
        {
            key: '_id',
            header: 'Actions',
            render: () => <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-600"><MoreHorizontal className="h-4 w-4" /></Button>
        }
    ];

    const orgColumns: any[] = [
        {
            key: 'name',
            header: 'Organization',
            render: (val: string) => (
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-50 rounded text-blue-600">
                        <Building2 className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-gray-900">{val}</span>
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
            render: (val: number) => <span className="text-sm text-gray-500">{new Date(val).toLocaleDateString()}</span>
        },
        {
            key: '_id',
            header: 'Actions',
            render: (_: any, row: any) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-600">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {row.status === 'suspended' ? (
                            <DropdownMenuItem onClick={() => handleActivateOrg(row._id)} className="text-green-600">
                                <CheckCircle className="mr-2 h-4 w-4" /> Activate Organization
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem onClick={() => handleSuspendOrg(row._id)} className="text-red-600">
                                <Ban className="mr-2 h-4 w-4" /> Suspend Organization
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <AdminPageHeader
                    title="Customer Management"
                    subtitle="Manage users, organizations, and access controls."
                    actionLabel="Add User"
                    onAction={() => { }}
                    icon={Users}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 bg-white shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Users</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-2">{users.length}</h3>
                        </div>
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <Users className="h-6 w-6" />
                        </div>
                    </div>
                </Card>
                <Card className="p-6 bg-white shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Organizations</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-2">{orgs.length}</h3>
                        </div>
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                            <Building2 className="h-6 w-6" />
                        </div>
                    </div>
                </Card>
            </div>

            <Tabs defaultValue="users" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2 mb-4 bg-gray-100 p-1 rounded-lg">
                    <TabsTrigger value="users" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Users</TabsTrigger>
                    <TabsTrigger value="orgs" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Organizations</TabsTrigger>
                </TabsList>

                <TabsContent value="users">
                    <Card className="overflow-hidden border border-gray-200 shadow-sm">
                        <DataTable
                            data={users}
                            columns={userColumns}
                            searchPlaceholder="Search users..."
                        />
                    </Card>
                </TabsContent>

                <TabsContent value="orgs">
                    <Card className="overflow-hidden border border-gray-200 shadow-sm">
                        <DataTable
                            data={orgs}
                            columns={orgColumns}
                            searchPlaceholder="Search organizations..."
                        />
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AdminCustomersPage;
