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
            <main className="min-h-screen">
                <Suspense fallback={<LoadingSpinner />}>
                    <Outlet />
                </Suspense>
            </main>
        </>
    );
}
