import React from 'react';
// import { useMutation } from "convex/react";
// import { api } from "../../../convex/_generated/api";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Settings, Database } from 'lucide-react';
import AdminPageHeader from '@/components/layout/admin/AdminPageHeader';
import { toast } from "sonner";

const AdminSettingsPage = () => {
    const handleSeedData = async () => {
        toast.info("Seed functionality is currently disabled");
    };

    return (
        <div className="space-y-6 max-w-4xl">
            <AdminPageHeader
                title="Platform Settings"
                subtitle="Configure global application parameters."
                icon={Settings}
            />

            <Card>
                <CardHeader className="p-4 bg-slate-50/50 border-b">
                    <CardTitle className="text-sm font-bold">General Configuration</CardTitle>
                    <CardDescription className="text-[10px]">Basic system settings and branding.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-slate-500">Platform Name</Label>
                            <Input defaultValue="FreightFlow Logistics" className="h-8 text-xs" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-slate-500">Support Email</Label>
                            <Input defaultValue="support@freightflow.com" className="h-8 text-xs" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="p-4 bg-slate-50/50 border-b">
                    <CardTitle className="text-sm font-bold">Feature Flags</CardTitle>
                    <CardDescription className="text-[10px]">Toggle system capabilities.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-medium">New Booking Engine</Label>
                            <p className="text-xs text-slate-500">Enable v2 quote request flow</p>
                        </div>
                        <Switch checked={true} />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-medium">Maintenance Mode</Label>
                            <p className="text-xs text-slate-500">Disable client access temporarily</p>
                        </div>
                        <Switch checked={false} />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50">
                <CardHeader className="p-4 border-b">
                    <CardTitle className="text-sm font-bold text-orange-900">Development Tools</CardTitle>
                    <CardDescription className="text-[10px] text-orange-700">Utilities for testing and seeding data.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 bg-white hover:bg-orange-100 border-orange-200 text-orange-900 text-[10px] font-bold"
                        onClick={handleSeedData}
                    >
                        <Database className="mr-2 h-3.5 w-3.5" />
                        Seed Test Data (Admin)
                    </Button>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button size="sm" className="h-9 px-6 text-xs font-bold bg-[#003057] hover:bg-[#004e8a] text-white">Save Changes</Button>
            </div>
        </div>
    );
};

export default AdminSettingsPage;
