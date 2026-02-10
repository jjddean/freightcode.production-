import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Search, Plane, Ship, ArrowRight, Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { HomeBackgroundMap } from './HomeBackgroundMap';
import { GeoapifyAutocomplete } from '@/components/ui/GeoapifyAutocomplete';

interface VisualQuoteInputProps {
    onSearch: (searchParams: any) => void;
}

export const VisualQuoteInput: React.FC<VisualQuoteInputProps> = ({ onSearch }) => {
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [transportMode, setTransportMode] = useState<'ocean' | 'air'>('ocean');

    const handleSearch = async () => {
        if (!origin || !destination) {
            toast.error("Please select both origin and destination");
            return;
        }

        setIsSearching(true);
        // Simulate API delay for effect
        await new Promise(resolve => setTimeout(resolve, 800));

        onSearch({
            origin,
            destination,
            mode: transportMode,
            containerSize: '20ft',
            incoterms: 'FOB'
        });
        setIsSearching(false);
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-6 relative">

                {/* Background Map Decoration */}
                <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                    <HomeBackgroundMap />
                </div>

                <div className="relative z-10 space-y-6">
                    {/* Mode Selection */}
                    <div className="flex justify-center mb-6">
                        <div className="bg-slate-100/80 p-1 rounded-lg inline-flex">
                            <button
                                onClick={() => setTransportMode('ocean')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${transportMode === 'ocean'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <Ship className="w-4 h-4" />
                                Ocean Freight
                            </button>
                            <button
                                onClick={() => setTransportMode('air')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${transportMode === 'air'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <Plane className="w-4 h-4" />
                                Air Freight
                            </button>
                        </div>
                    </div>

                    {/* Input Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-4 items-center">
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
                                <MapPin className="h-4 w-4" />
                            </div>
                            <GeoapifyAutocomplete
                                className="pl-10"
                                placeholder="Origin city or port"
                                value={origin}
                                onChange={(val) => setOrigin(val)}
                            />
                        </div>

                        <div className="hidden md:flex justify-center text-slate-300">
                            <ArrowRight className="w-5 h-5" />
                        </div>

                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
                                <MapPin className="h-4 w-4" />
                            </div>
                            <GeoapifyAutocomplete
                                className="pl-10"
                                placeholder="Destination city or port"
                                value={destination}
                                onChange={(val) => setDestination(val)}
                            />
                        </div>
                    </div>

                    {/* Search Button */}
                    <div className="mt-6">
                        <Button
                            className="w-full text-lg h-12 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20"
                            onClick={handleSearch}
                            disabled={isSearching}
                        >
                            {isSearching ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Finding Best Rates...
                                </>
                            ) : (
                                <>
                                    <Search className="mr-2 h-5 w-5" />
                                    Get Instant Quotes
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Trust Badges */}
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                <div className="p-3">
                    <div className="text-2xl font-bold text-white mb-1">50+</div>
                    <div className="text-blue-100 text-sm">Global Carriers</div>
                </div>
                <div className="p-3 border-l border-white/10">
                    <div className="text-2xl font-bold text-white mb-1">24/7</div>
                    <div className="text-blue-100 text-sm">Support</div>
                </div>
                <div className="p-3 border-l border-white/10">
                    <div className="text-2xl font-bold text-white mb-1">Instant</div>
                    <div className="text-blue-100 text-sm">Booking</div>
                </div>
            </div>
        </div>
    );
};
