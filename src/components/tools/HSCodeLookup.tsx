import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2, BookOpen, AlertCircle } from 'lucide-react';
import { comtradeService } from '@/services/comtrade';
import { toast } from 'sonner';

export const HSCodeLookup = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async () => {
        if (!searchTerm) return;

        setLoading(true);
        try {
            // First try local mock search for description matching
            const localResults = await comtradeService.searchHSCodes(searchTerm);

            // If the user entered a code directly (digits), try fetching live tariff data
            let liveData = [];
            if (/^\d+$/.test(searchTerm)) {
                liveData = await comtradeService.getTariffLine({ cmdCode: searchTerm });
            }

            // Merge or prioritize
            setResults(localResults.length > 0 ? localResults : liveData);
            setSearched(true);
        } catch (error) {
            toast.error("Failed to fetch HS Codes");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-medium text-gray-900">HS Code Lookup</h3>
            </div>

            <div className="flex gap-2 mb-6">
                <Input
                    placeholder="Enter product description or HS Code (e.g. 8471)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
            </div>

            {searched && results.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>No HS Codes found for "{searchTerm}"</p>
                </div>
            )}

            {results.length > 0 && (
                <div className="space-y-2">
                    {results.map((item, idx) => (
                        <div key={idx} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors flex justify-between items-center group cursor-pointer">
                            <div>
                                <div className="font-mono text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded inline-block mb-1">
                                    {item.code || item.cmdCode}
                                </div>
                                <div className="text-sm text-gray-700">{item.desc || item.cmdDesc}</div>
                            </div>
                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100" onClick={() => {
                                navigator.clipboard.writeText(item.code || item.cmdCode);
                                toast.success("Code copied to clipboard");
                            }}>
                                Copy
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-4 text-xs text-gray-400 text-right">
                Powered by UN Comtrade
            </div>
        </div>
    );
};
