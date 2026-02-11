import React from 'react';
import { HSCodeLookup } from '@/components/tools/HSCodeLookup';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const HSCodePage = () => {
    return (
        <div className="container mx-auto py-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">HS Code Lookup</h1>
                <p className="text-muted-foreground mt-1">
                    Find Harmonized System codes for your shipments.
                </p>
            </div>

            <div className="max-w-3xl">
                <div className="rounded-xl border bg-card text-card-foreground shadow">
                    <div className="p-6">
                        <div className="flex flex-col space-y-1.5 pb-6">
                            <h3 className="font-semibold leading-none tracking-tight">Search Database</h3>
                            <p className="text-sm text-muted-foreground">Search by keyword or code.</p>
                        </div>
                        <HSCodeLookup variant="minimal" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HSCodePage;
