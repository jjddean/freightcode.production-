import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Search, Plane, Ship, ArrowRight, Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { HomeBackgroundMap } from './HomeBackgroundMap';

const PORTS: Record<string, [number, number]> = {
    'London': [-0.1278, 51.5074],
    'New York': [-74.0060, 40.7128],
    'Shanghai': [121.4737, 31.2304],
    'Singapore': [103.8198, 1.3521],
    'Dubai': [55.2708, 25.2048],
    'Los Angeles': [-118.2437, 34.0522],
    'Hamburg': [9.9937, 53.5511],
    'Mumbai': [72.8777, 19.0760]
};

interface VisualQuoteInputProps {
    onSearch: (data: { origin: string; destination: string; weight: string; dimensions: string }) => void;
}

export const VisualQuoteInput: React.FC<VisualQuoteInputProps> = ({ onSearch }) => {
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    const [weight, setWeight] = useState('');
    const [dimensions, setDimensions] = useState('');
    const [searching, setSearching] = useState(false);

    const coordsOrigin = useMemo(() =>
        PORTS[Object.keys(PORTS).find(k => k.toLowerCase() === origin.toLowerCase()) || ''],
        [origin]);

    const coordsDest = useMemo(() =>
        PORTS[Object.keys(PORTS).find(k => k.toLowerCase() === destination.toLowerCase()) || ''],
        [destination]);

    const handleSearch = () => {
        if (!origin || !destination) {
            toast.error("Please enter both Origin and Destination");
            return;
        }

        setSearching(true);
        setTimeout(() => {
            setSearching(false);
            onSearch({ origin, destination, weight, dimensions });
        }, 1500);
    };

    const project = (lng: number, lat: number) => {
        const x = (lng + 180) * (100 / 360);
        const y = (90 - lat) * (100 / 180);
        return { x, y };
    };

    return (
        <div className="relative w-full h-[500px] lg:h-[600px] rounded-xl overflow-hidden shadow-2xl border border-gray-200 bg-[#0B1026]">
            {/* 1. SVG Map Background (Non-WebGL replacement) */}
            {/* 1. Mapbox Background */}
            <div className="absolute inset-0">
                <HomeBackgroundMap focusedLocation={coordsDest || coordsOrigin} />
                {/* Overlay Gradient for readability */}
                <div className="absolute inset-0 bg-[#0B1026]/40 pointer-events-none" />
            </div>

            {/* 2. Floating Glassmorphism Input Bar */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl z-10 px-4">
                <div className="bg-white/90 backdrop-blur-md p-5 rounded-xl shadow-2xl border border-white/40 space-y-4">
                    <div className="text-center mb-1">
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Where are you shipping?</h2>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Instant Multi-Modal Quotes</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 items-stretch relative">
                        <div className="flex-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <div className="h-1.5 w-1.5 bg-primary rounded-full animate-pulse shadow-sm"></div>
                            </div>
                            <input
                                type="text"
                                list="ports"
                                className="block w-full pl-7 pr-3 py-2.5 text-sm font-medium border border-gray-200 bg-white/50 focus:bg-white rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm placeholder:text-gray-400"
                                placeholder="Origin city"
                                value={origin}
                                onChange={(e) => setOrigin(e.target.value)}
                            />
                        </div>

                        <div className="hidden sm:flex items-center text-slate-300">
                            <ArrowRight className="w-4 h-4" />
                        </div>

                        <div className="flex-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <div className="h-1.5 w-1.5 bg-secondary rounded-full shadow-sm"></div>
                            </div>
                            <input
                                type="text"
                                list="ports"
                                className="block w-full pl-7 pr-3 py-2.5 text-sm font-medium border border-gray-200 bg-white/50 focus:bg-white rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm placeholder:text-gray-400"
                                placeholder="Destination city"
                                value={destination}
                                onChange={(e) => setDestination(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                        <div className="flex-1 relative">
                            <input
                                type="number"
                                className="block w-full px-3 py-2.5 text-sm font-medium border border-gray-200 bg-white/50 focus:bg-white rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm placeholder:text-gray-400"
                                placeholder="Weight (kg)"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                            />
                        </div>
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                className="block w-full px-3 py-2.5 text-sm font-medium border border-gray-200 bg-white/50 focus:bg-white rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm placeholder:text-gray-400"
                                placeholder="Dimensions (L x W x H)"
                                value={dimensions}
                                onChange={(e) => setDimensions(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                        <div className="flex gap-4 text-xs font-medium text-slate-500 order-2 sm:order-1">
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-slate-50 cursor-pointer transition-colors">
                                <Ship className="w-3.5 h-3.5 text-primary" />
                                <span>Ocean</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-slate-50 cursor-pointer transition-colors">
                                <Plane className="w-3.5 h-3.5 text-secondary" />
                                <span>Air</span>
                            </div>
                        </div>

                        <Button
                            size="sm"
                            className="w-full sm:w-auto h-9 px-6 text-sm font-semibold bg-primary hover:bg-primary-700 shadow-md shadow-primary/10 transition-all hover:scale-[1.01] order-1 sm:order-2"
                            onClick={handleSearch}
                            disabled={searching}
                        >
                            {searching ? (
                                <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Check Rates</>
                            ) : (
                                <><Search className="w-3.5 h-3.5 mr-2" /> Search Rates</>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            <datalist id="ports">
                {Object.keys(PORTS).map(port => (
                    <option key={port} value={port} />
                ))}
            </datalist>
        </div>
    );
};
