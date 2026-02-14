import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, BookOpen, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface HSCode {
    code: string;
    description: string;
    isOfficial?: boolean;
}

interface HSCodeLookupProps {
    variant?: 'default' | 'minimal';
    className?: string;
}

export const HSCodeLookup = ({ variant = 'default', className }: HSCodeLookupProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [allCodes, setAllCodes] = useState<{ code: string, desc: string }[]>([]);
    const [results, setResults] = useState<HSCode[]>([]);
    const [loading, setLoading] = useState(false);
    const [isDbLoaded, setIsDbLoaded] = useState(false);
    const [searched, setSearched] = useState(false);

    const searchHMRC = useAction(api.hmrc_actions.searchHSCode);

    // Load HS Codes lazily on first interaction or mount
    useEffect(() => {
        const loadDatabase = async () => {
            try {
                const response = await fetch('/hs-codes.json');
                if (!response.ok) throw new Error('Failed to load HS codes');
                const data = await response.json();
                setAllCodes(data);
                setIsDbLoaded(true);
            } catch (error) {
                console.error("Failed to load HS provider:", error);
                toast.error("Offline HS database failed to load.");
            }
        };

        loadDatabase();
    }, []);

    const handleSearch = async () => {
        if (!searchTerm.trim()) return;

        setLoading(true);
        setSearched(true);

        try {
            // 1. Try Live HMRC Search
            const officialResults = await searchHMRC({ query: searchTerm });
            const formattedOfficial = (officialResults || []).map((r: any) => ({
                code: r.code,
                description: r.description,
                isOfficial: true
            }));

            // 2. Fallback/Supplement with Local DB
            const lowerTerm = searchTerm.toLowerCase();
            const localResults = allCodes.filter(item =>
                item.desc.toLowerCase().includes(lowerTerm) ||
                item.code.startsWith(lowerTerm)
            ).slice(0, 50).map(item => ({
                code: item.code,
                description: item.desc,
                isOfficial: false
            }));

            // Combine results, prioritizing official ones
            const combined = [...formattedOfficial, ...localResults.filter(l =>
                !formattedOfficial.some(o => o.code === l.code)
            )].slice(0, 50);

            setResults(combined);
        } catch (error) {
            console.error("HMRC Search failed:", error);
            // Fallback to local only
            const lowerTerm = searchTerm.toLowerCase();
            const filtered = allCodes.filter(item =>
                item.desc.toLowerCase().includes(lowerTerm) ||
                item.code.startsWith(lowerTerm)
            ).slice(0, 50).map(item => ({
                code: item.code,
                description: item.desc,
                isOfficial: false
            }));
            setResults(filtered);
        } finally {
            setLoading(false);
        }
    };

    const containerClasses = variant === 'default'
        ? "bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        : "";

    return (
        <div className={cn(containerClasses, className)}>
            <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-medium text-gray-900">HS Code Lookup</h3>
                {!isDbLoaded && <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Loading Database...</span>}
            </div>

            <div className="flex gap-2 mb-6">
                <Input
                    placeholder="Enter product description or HS Code (e.g. 'Coffee', '8517')"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    disabled={!isDbLoaded}
                />
                <Button onClick={handleSearch} disabled={loading || !isDbLoaded}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
            </div>

            {searched && results.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>No HS Codes found for "{searchTerm}"</p>
                </div>
            )}

            {results.length > 0 && (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {results.map((item, idx) => (
                        <div key={idx} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors flex justify-between items-start group cursor-pointer" onClick={() => {
                            navigator.clipboard.writeText(item.code);
                            toast.success(`Code ${item.code} copied to clipboard`);
                        }}>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="font-mono text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded inline-block">
                                        {item.code}
                                    </div>
                                    {item.isOfficial && (
                                        <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-100 uppercase font-bold py-0">
                                            Official
                                        </Badge>
                                    )}
                                </div>
                                <div className="text-sm text-gray-700 leading-snug">{item.description}</div>
                            </div>
                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 h-8 text-xs">
                                Copy
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-4 text-xs text-gray-400 text-right flex justify-between items-center border-t pt-3">
                <span>{isDbLoaded ? `Database Ready (${allCodes.length.toLocaleString()} codes)` : 'Initializing...'}</span>
                <span>Source: HMRC Official Trade Tariff API</span>
            </div>
        </div>
    );
};
