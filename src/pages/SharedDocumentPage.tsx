import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Printer, Share2, FileText } from 'lucide-react';

export default function SharedDocumentPage() {
    const { token } = useParams<{ token: string }>();
    const doc = useQuery(api.documents.getSharedDocument, { shareToken: token || '' });

    if (doc === undefined) {
        return <div className="min-h-screen flex items-center justify-center">Loading document...</div>;
    }

    if (doc === null) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
                <FileText className="h-16 w-16 text-gray-300 mb-4" />
                <h1 className="text-xl font-bold text-gray-900">Document Not Found</h1>
                <p className="text-gray-500 mt-2">The link might be invalid or expired.</p>
            </div>
        );
    }

    const { documentData } = doc;

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded uppercase tracking-wider">Shared</span>
                            {doc.type.replace(/_/g, ' ')}
                        </h1>
                        <p className="text-sm text-gray-500">Document #{documentData.documentNumber}</p>
                    </div>
                    <Button onClick={() => window.print()} variant="outline">
                        <Printer className="mr-2 h-4 w-4" /> Print
                    </Button>
                </div>

                {/* Document Content */}
                <Card className="shadow-lg border-t-4 border-t-blue-600">
                    <CardHeader className="border-b bg-gray-50/50">
                        <div className="flex justify-between">
                            <div>
                                <h2 className="text-lg font-bold">Bill of Lading</h2>
                                <p className="text-sm text-gray-500">Issued: {documentData.issueDate}</p>
                            </div>
                            <div className="text-right">
                                <div className="font-mono text-sm font-bold">{documentData.documentNumber}</div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                        {/* Parties */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Shipper</h3>
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                    <div className="font-medium">{documentData.parties.shipper.name}</div>
                                    <div className="text-sm text-gray-600 whitespace-pre-line">{documentData.parties.shipper.address}</div>
                                    <div className="text-sm text-gray-500 mt-2">{documentData.parties.shipper.contact}</div>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Consignee</h3>
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                    <div className="font-medium">{documentData.parties.consignee.name}</div>
                                    <div className="text-sm text-gray-600 whitespace-pre-line">{documentData.parties.consignee.address}</div>
                                    <div className="text-sm text-gray-500 mt-2">{documentData.parties.consignee.contact}</div>
                                </div>
                            </div>
                        </div>

                        {/* Route */}
                        <div className="border rounded-lg p-6 bg-blue-50/30">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Routing Details</h3>
                            <div className="flex flex-wrap gap-8 items-center">
                                <div>
                                    <div className="text-xs text-gray-500">Origin</div>
                                    <div className="font-semibold text-lg">{documentData.routeDetails.origin}</div>
                                </div>
                                <div className="text-gray-300">→</div>
                                <div>
                                    <div className="text-xs text-gray-500">Destination</div>
                                    <div className="font-semibold text-lg">{documentData.routeDetails.destination}</div>
                                </div>
                            </div>
                        </div>

                        {/* Cargo */}
                        <div>
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Cargo Particulars</h3>
                            <table className="w-full text-sm">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="text-left p-3 rounded-l">Description</th>
                                        <th className="text-left p-3">Weight</th>
                                        <th className="text-left p-3 rounded-r">Dimensions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b">
                                        <td className="p-3 font-medium">{documentData.cargoDetails.description}</td>
                                        <td className="p-3">{documentData.cargoDetails.weight}</td>
                                        <td className="p-3">{documentData.cargoDetails.dimensions}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Footer */}
                        <div className="text-center text-xs text-gray-400 pt-8 border-t mt-8">
                            Electronic Document generated by freightcode Logistics Platform.
                            <br />
                            Share Token: {token}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
