import React, { Suspense } from 'react';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"

interface ClientSidebarProps {
    children: React.ReactNode
}

export default function ClientSidebar({ children }: ClientSidebarProps) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <div className="app-header h-14 min-h-[3.5rem]">
                    <SiteHeader />
                </div>
                <div className="app-page-content flex flex-1 flex-col gap-4 px-4 pb-4 !pt-0">
                    <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><LoadingSpinner /></div>}>
                        {children}
                    </Suspense>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
