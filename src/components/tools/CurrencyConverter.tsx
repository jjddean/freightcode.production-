import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeftRight, Clock, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface ExchangeData {
    base: string;
    date: string;
    rates: Record<string, number>;
}

// Common currencies for quick selection
const COMMON_CURRENCIES = [
    { code: 'USD', name: 'US Dollar', flag: '🇺🇸' },
    { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
    { code: 'GBP', name: 'British Pound', flag: '🇬🇧' },
    { code: 'CNY', name: 'Chinese Yuan', flag: '🇨🇳' },
    { code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵' },
    { code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦' },
    { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺' },
    { code: 'SGD', name: 'Singapore Dollar', flag: '🇸🇬' },
    { code: 'HKD', name: 'Hong Kong Dollar', flag: '🇭🇰' },
    { code: 'INR', name: 'Indian Rupee', flag: '🇮🇳' },
];

export const CurrencyConverter = () => {
    const [amount, setAmount] = useState<string>('1000');
    const [fromCurrency, setFromCurrency] = useState<string>('USD');
    const [toCurrency, setToCurrency] = useState<string>('GBP');
    const [rates, setRates] = useState<ExchangeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<string>('');

    const fetchRates = async () => {
        setLoading(true);
        try {
            // In a real app, this file is updated daily by a backend script
            const response = await fetch('/exchange-rates.json');
            if (!response.ok) throw new Error('Failed to load rates');
            const data: ExchangeData = await response.json();
            setRates(data);
            setLastUpdated(data.date);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load exchange rates");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRates();
    }, []);

    const convert = (val: string, from: string, to: string) => {
        if (!rates || !rates.rates) return '---';
        const amountNum = parseFloat(val);
        if (isNaN(amountNum)) return '---';

        // Convert to base (EUR) then to target
        const fromRate = rates.rates[from]; // e.g. 1.08 USD per EUR
        const toRate = rates.rates[to];     // e.g. 0.85 GBP per EUR

        // If base is EUR, rate is 1. If not found, default 1 (risk)
        const baseAmount = from === 'EUR' ? amountNum : amountNum / (fromRate || 1);
        const targetAmount = to === 'EUR' ? baseAmount : baseAmount * (toRate || 1);

        return targetAmount.toLocaleString('en-US', {
            style: 'currency',
            currency: to,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const handleSwap = () => {
        setFromCurrency(toCurrency);
        setToCurrency(fromCurrency);
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Rates as of: {lastUpdated || 'Loading...'}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={fetchRates}>
                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            <div className="grid gap-2">
                <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700">Amount</label>
                    <Input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="text-base font-mono h-9"
                    />
                </div>

                <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-end">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700">From</label>
                        <Select value={fromCurrency} onValueChange={setFromCurrency}>
                            <SelectTrigger className="h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {COMMON_CURRENCIES.map(c => (
                                    <SelectItem key={c.code} value={c.code}>
                                        <span className="mr-2">{c.flag}</span>
                                        {c.code}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button variant="ghost" size="icon" className="mb-0.5 h-8 w-8" onClick={handleSwap}>
                        <ArrowLeftRight className="w-3 h-3 text-muted-foreground" />
                    </Button>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700">To</label>
                        <Select value={toCurrency} onValueChange={setToCurrency}>
                            <SelectTrigger className="h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {COMMON_CURRENCIES.map(c => (
                                    <SelectItem key={c.code} value={c.code}>
                                        <span className="mr-2">{c.flag}</span>
                                        {c.code}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center mt-1">
                    <div className="text-xs text-slate-500 mb-1">Estimated Exchange Value</div>
                    {loading ? (
                        <div className="h-7 flex items-center justify-center">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        </div>
                    ) : (
                        <div className="text-xl font-bold text-slate-900">
                            {convert(amount, fromCurrency, toCurrency)}
                        </div>
                    )}
                    <div className="text-[10px] text-slate-400 mt-1">
                        1 {fromCurrency} = {convert('1', fromCurrency, toCurrency)}
                    </div>
                </div>
            </div>
        </div>
    );
};
