import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SUPPORTED_PORTS } from '@/lib/ports';
import { toast } from 'sonner';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Check, ChevronsUpDown, Ship, Box, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickQuoteFormProps {
    onSelectRate: (data: {
        origin: string;
        destination: string;
        weight: string;
        dimensions: { length: string; width: string; height: string };
        selectedRate: any;
    }) => void;
}

const MOCK_RATES = [
    { id: 'm1', carrier: 'Maersk', price: 1250, transitTime: '28 days', logo: '🚢' },
    { id: 'm2', carrier: 'MSC', price: 1180, transitTime: '32 days', logo: '🌊' },
    { id: 'm3', carrier: 'Hapag-Lloyd', price: 1320, transitTime: '25 days', logo: '📦' },
    { id: 'm4', carrier: 'CMA CGM', price: 1210, transitTime: '30 days', logo: '⚡' },
];

const QuickQuoteForm: React.FC<QuickQuoteFormProps> = ({ onSelectRate }) => {
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    const [weight, setWeight] = useState('1000');
    const [dimensions, setDimensions] = useState({ length: '120', width: '100', height: '100' });
    const [showResults, setShowResults] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [originOpen, setOriginOpen] = useState(false);
    const [destOpen, setDestOpen] = useState(false);
    const resultsRef = React.useRef<HTMLDivElement>(null);

    const handleGetQuote = (e: React.FormEvent) => {
        e.preventDefault();
        if (!origin || !destination) {
            toast.error("Please select both Origin and Destination ports.");
            return;
        }

        setIsLoading(true);
        setShowResults(false);

        // Fake loading delay for "searching" effect
        setTimeout(() => {
            setIsLoading(false);
            setShowResults(true);
            // Brief delay to ensure DOM is rendered before scrolling
            setTimeout(() => {
                if (resultsRef.current) {
                    const yOffset = -20;
                    const y = resultsRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                }
            }, 100);
        }, 1200);
    };

    const handleRateSelect = (rate: any) => {
        onSelectRate({
            origin,
            destination,
            weight,
            dimensions,
            selectedRate: rate,
        });
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border shadow-lg bg-white/50 backdrop-blur-sm overflow-hidden border-indigo-100/50">
                <CardContent className="p-6">
                    <form onSubmit={handleGetQuote} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Origin</label>
                            <Popover open={originOpen} onOpenChange={setOriginOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={originOpen}
                                        disabled={isLoading}
                                        className="w-full justify-between bg-white border-slate-200 hover:border-indigo-300 transition-colors"
                                    >
                                        {origin ? origin : <span className="text-slate-400">Select port...</span>}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[250px] p-0 z-50">
                                    <Command>
                                        <CommandInput placeholder="Search origin..." />
                                        <CommandList>
                                            <CommandEmpty>No port found.</CommandEmpty>
                                            <CommandGroup>
                                                {SUPPORTED_PORTS.map((port) => (
                                                    <CommandItem
                                                        key={port}
                                                        value={port}
                                                        onSelect={() => {
                                                            setOrigin(port);
                                                            setOriginOpen(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                origin === port ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {port}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Destination</label>
                            <Popover open={destOpen} onOpenChange={setDestOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={destOpen}
                                        disabled={isLoading}
                                        className="w-full justify-between bg-white border-slate-200 hover:border-indigo-300 transition-colors"
                                    >
                                        {destination ? destination : <span className="text-slate-400">Select port...</span>}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[250px] p-0 z-50">
                                    <Command>
                                        <CommandInput placeholder="Search destination..." />
                                        <CommandList>
                                            <CommandEmpty>No port found.</CommandEmpty>
                                            <CommandGroup>
                                                {SUPPORTED_PORTS.map((port) => (
                                                    <CommandItem
                                                        key={port}
                                                        value={port}
                                                        onSelect={() => {
                                                            setDestination(port);
                                                            setDestOpen(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                destination === port ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {port}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Cargo Details</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        type="number"
                                        value={weight}
                                        disabled={isLoading}
                                        onChange={(e) => setWeight(e.target.value)}
                                        placeholder="kg"
                                        className="bg-white border-slate-200 pr-8"
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">KG</span>
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className={cn(
                                "w-full transition-all duration-300 h-10 group shadow-md dark:shadow-none",
                                (!origin || !destination)
                                    ? "bg-slate-200 text-slate-500 hover:bg-slate-300"
                                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100"
                            )}
                        >
                            {isLoading ? (
                                <span className="flex items-center">
                                    <span className="animate-spin mr-2 h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                                    Searching...
                                </span>
                            ) : (
                                <>
                                    Get Instant Quote
                                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </>
                            )}
                        </Button>
                    </form>

                    {/* Inline Dimensions (shown in smaller text if weight is active) */}
                    <div className="mt-4 flex flex-wrap gap-4 px-1">
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                            <Box className="w-3.5 h-3.5" />
                            <span>Dimensions (cm):</span>
                            <div className="flex gap-1">
                                <input
                                    className="w-10 border-b border-slate-200 focus:border-indigo-400 outline-none bg-transparent text-center"
                                    value={dimensions.length}
                                    disabled={isLoading}
                                    onChange={(e) => setDimensions({ ...dimensions, length: e.target.value })}
                                />
                                <span>x</span>
                                <input
                                    className="w-10 border-b border-slate-200 focus:border-indigo-400 outline-none bg-transparent text-center"
                                    value={dimensions.width}
                                    disabled={isLoading}
                                    onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })}
                                />
                                <span>x</span>
                                <input
                                    className="w-10 border-b border-slate-200 focus:border-indigo-400 outline-none bg-transparent text-center"
                                    value={dimensions.height}
                                    disabled={isLoading}
                                    onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div ref={resultsRef} className="scroll-mt-6">
                {showResults && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-500 delay-150">
                        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-5 py-4 border-b border-gray-100">
                                <div>
                                    <h3 className="text-base font-semibold text-primary-800">Available Freight Rates</h3>
                                    <p className="text-xs text-muted-foreground">
                                        {origin} to {destination} • {weight} kg
                                    </p>
                                </div>
                                <span className="inline-flex items-center rounded-full bg-secondary-100 text-secondary-800 px-2.5 py-1 text-xs font-medium w-fit">
                                    {MOCK_RATES.length} options
                                </span>
                            </div>

                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {MOCK_RATES.map((rate) => (
                                    <Card
                                        key={rate.id}
                                        className="cursor-pointer border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all group bg-white"
                                        onClick={() => handleRateSelect(rate)}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center text-lg">
                                                        {rate.logo}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-primary-800">{rate.carrier}</h4>
                                                        <p className="text-xs text-muted-foreground">Direct routing</p>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Estimated</p>
                                                    <p className="text-lg font-bold text-primary-800">${rate.price}</p>
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600">
                                                    <Ship className="h-3.5 w-3.5 text-primary-600" />
                                                    {rate.transitTime}
                                                </span>
                                                <span className="inline-flex items-center rounded-full bg-primary-50 text-primary-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                                                    Market Rate
                                                </span>
                                            </div>

                                            <Button
                                                type="button"
                                                className="w-full mt-4 h-9 bg-primary hover:bg-primary-700 text-white"
                                            >
                                                Select This Rate
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuickQuoteForm;
