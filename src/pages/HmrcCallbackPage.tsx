import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const HmrcCallbackPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState('');

    const exchangeCode = useAction(api.hmrc_actions.exchangeAuthorizationCode);

    useEffect(() => {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        if (error) {
            setStatus('error');
            setErrorMessage(searchParams.get('error_description') || 'Authentication failed');
            return;
        }

        if (!code) {
            setStatus('error');
            setErrorMessage('No authorization code received from HMRC');
            return;
        }

        const handleExchange = async () => {
            try {
                console.log("Exchanging HMRC Auth Code:", code);

                const result = await exchangeCode({ code });

                if (result.success) {
                    setStatus('success');
                    toast.success("HMRC Connected", {
                        description: result.message || "Your account has been successfully linked with HMRC."
                    });

                    // Redirect after 2 seconds
                    setTimeout(() => {
                        navigate('/compliance');
                    }, 2000);
                } else {
                    throw new Error(result.message || "Exchange failed");
                }
            } catch (err: any) {
                console.error("HMRC Callback Error:", err);
                setStatus('error');
                setErrorMessage(err.message || "Failed to finalize HMRC connection");
            }
        };

        handleExchange();
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center center p-4">
            <Card className="max-w-md w-full shadow-lg">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">HMRC Authorization</CardTitle>
                    <CardDescription>UK Trade Tariff & Customs Integration</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center py-8">
                    {status === 'loading' && (
                        <div className="flex flex-col items-center space-y-4">
                            <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
                            <p className="text-gray-600">Finalizing connection with HMRC...</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="flex flex-col items-center space-y-4 text-center">
                            <CheckCircle2 className="h-16 w-16 text-green-500" />
                            <div className="space-y-2">
                                <h3 className="text-xl font-semibold text-gray-900">Success!</h3>
                                <p className="text-gray-600">Your HMRC connection is active. You can now access deeper regulatory data.</p>
                            </div>
                            <Button
                                variant="outline"
                                className="mt-4"
                                onClick={() => navigate('/compliance')}
                            >
                                Return to Compliance
                            </Button>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="flex flex-col items-center space-y-4 text-center">
                            <AlertCircle className="h-16 w-16 text-red-500" />
                            <div className="space-y-2">
                                <h3 className="text-xl font-semibold text-gray-900">Connection Failed</h3>
                                <p className="text-red-600">{errorMessage}</p>
                            </div>
                            <Button
                                className="mt-4"
                                onClick={() => navigate('/compliance')}
                            >
                                Try Again
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default HmrcCallbackPage;
