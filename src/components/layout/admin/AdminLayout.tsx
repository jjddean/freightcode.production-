import React, { Suspense } from 'react';
import AdminSidebar from './AdminSidebar';
import { Menu, Search, Bell, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { UserButton } from '@clerk/clerk-react';
import { useLocation } from 'react-router-dom';

interface AdminLayoutProps {
    children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    const location = useLocation();

    // Get page title from path
    const getPageTitle = (path: string) => {
        const segments = path.split('/').filter(Boolean);
        if (segments.length <= 1) return 'Dashboard';
        const last = segments[segments.length - 1];
        return last.charAt(0).toUpperCase() + last.slice(1);
    };

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            {/* Desktop Sidebar */}
            <AdminSidebar />

            {/* Main Content Wrapper */}
            <div className="md:ml-64 min-h-screen flex flex-col">

                {/* Top Header */}
                <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40 flex items-center justify-between px-6">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="md:hidden">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-slate-600">
                                        <Menu className="h-5 w-5" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="p-0 bg-slate-950 border-r-slate-800 w-64">
                                    <AdminSidebar />
                                </SheetContent>
                            </Sheet>
                        </div>

                        <h1 className="text-lg font-semibold text-slate-800 hidden sm:block">
                            {getPageTitle(location.pathname)}
                        </h1>

                        <div className="max-w-md w-full ml-4 hidden md:block">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search shipments, docs, HS codes..."
                                    className="pl-10 h-10 bg-slate-50 border-slate-200 focus:ring-accent w-full"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="text-slate-500 relative">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </Button>

                        <div className="h-8 w-px bg-slate-200 mx-1"></div>

                        <div className="flex items-center gap-3 pl-2">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold text-slate-800 leading-none">Jason Dean</p>
                                <p className="text-[10px] font-medium text-slate-500 mt-1">Admin</p>
                            </div>
                            <UserButton afterSignOutUrl="/" appearance={{
                                elements: {
                                    avatarBox: "w-9 h-9 ring-2 ring-slate-100 ring-offset-1"
                                }
                            }} />
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-x-hidden">
                    <div className="max-w-screen-2xl mx-auto p-6 md:p-8">
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
