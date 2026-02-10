import React, { Suspense } from 'react';
import AdminSidebar from './AdminSidebar';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface AdminLayoutProps {
    children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-gray-100">
            {/* Desktop Sidebar */}
            <AdminSidebar />

            {/* Mobile Header & Content Wrapper */}
            <div className="md:ml-64 min-h-screen flex flex-col">
                {/* Mobile Header */}
                <div className="md:hidden h-16 bg-slate-900 text-white flex items-center justify-between px-4 sticky top-0 z-40 shadow-md">
                    <span className="font-bold">Admin Portal</span>
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-white hover:bg-slate-800">
                                <Menu className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 bg-slate-900 border-r-slate-800 w-64">
                            {/* Reusing Sidebar logic ideally, or just inline for now for mobile */}
                            <AdminSidebar />
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Main Content Area */}
                <main className="flex-1 p-6 md:p-8">
                    <div className="max-w-7xl mx-auto">
                        <Suspense fallback={<LoadingSpinner />}>
                            {children}
                        </Suspense>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
