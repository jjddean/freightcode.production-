import React, { Suspense } from 'react';
import Navbar from '../Navbar';
import MobileNavigation from '../mobile/MobileNavigation';
import { Outlet } from 'react-router-dom';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export default function PublicLayout() {
    return (
        <>
            <Navbar />
            <MobileNavigation />
            <main className="min-h-screen pt-16 pb-16 md:pb-0">
                <Suspense fallback={<LoadingSpinner />}>
                    <Outlet />
                </Suspense>
            </main>
        </>
    );
}
