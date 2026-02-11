import React from 'react';
import { CurrencyConverter } from '@/components/tools/CurrencyConverter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const CurrencyPage = () => {
    return (
        <div className="container mx-auto py-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Currency Converter</h1>
                <p className="text-muted-foreground mt-1">
                    Real-time exchange rates for logistics planning.
                </p>
            </div>

            <div className="max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle>Converter</CardTitle>
                        <CardDescription>Convert between major currencies instantly.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <CurrencyConverter />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default CurrencyPage;
