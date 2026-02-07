
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Search, ArrowRight, Ship, Package } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export const InteractiveHero = () => {
    const [origin, setOrigin] = useState("");
    const [destination, setDestination] = useState("");
    const [serviceType, setServiceType] = useState("");
    const [cargoType, setCargoType] = useState("");
    const [showResults, setShowResults] = useState(false);

    const handleSearch = () => {
        if (!origin) return;
        setTimeout(() => setShowResults(true), 1200);
    };

    return (
        <div className="relative w-full h-[600px] bg-[#0B1026] rounded-xl overflow-hidden shadow-2xl border border-slate-700">
            {/* Premium Animated Background (Non-WebGL replacement for Mapbox) */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 opacity-30">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </div>

                {/* Simulated Data Streams / Routes */}
                <div className="absolute inset-0">
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent w-full animate-data-flow"
                            style={{
                                top: `${20 + (i * 15)}%`,
                                left: '-100%',
                                animationDelay: `${i * 1.5}s`,
                                animationDuration: `${5 + (i * 2)}s`
                            }}
                        />
                    ))}
                </div>

                {/* Decorative Glowing Orbs */}
                <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            {/* Overlay UI: Quote Search */}
            <div className="absolute top-8 left-8 z-10 w-full max-w-[420px] p-4 sm:p-0">
                <Card className="!bg-[#0d1f35] border-slate-700 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden backdrop-blur-sm">
                    <CardContent className="p-8 pt-10 !bg-[#0d1f35]">
                        {/* Header Section */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#1e3a5f] rounded-xl flex items-center justify-center shadow-inner border border-slate-700/40 flex-shrink-0">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                    </span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold tracking-tight text-white mb-0.5">Get Instant Quotes</h2>
                                    <p className="text-slate-400 text-[10px] leading-tight font-medium uppercase tracking-wider">Live Rate Engine</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Origin</label>
                                    <Input
                                        placeholder="e.g. Shanghai, China"
                                        className="!bg-[#0a1628] border-slate-700 !text-white placeholder:text-slate-600 h-12 rounded-xl focus:border-cyan-500 focus:ring-0 transition-all shadow-sm font-medium"
                                        value={origin}
                                        onChange={e => setOrigin(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Destination</label>
                                    <Input
                                        placeholder="e.g. Manchester, UK"
                                        className="!bg-[#0a1628] border-slate-700 !text-white placeholder:text-slate-600 h-12 rounded-xl focus:border-cyan-500 focus:ring-0 transition-all shadow-sm font-medium"
                                        value={destination}
                                        onChange={e => setDestination(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Service Type</label>
                                        <Select value={serviceType} onValueChange={setServiceType}>
                                            <SelectTrigger className="!bg-[#0a1628] border-slate-700 !text-white h-12 rounded-xl focus:ring-0 focus:border-cyan-500 font-medium">
                                                <SelectValue placeholder="Select..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#0d1f35] border-slate-700 text-white">
                                                <SelectItem value="ocean" className="text-white hover:bg-slate-800 focus:bg-slate-800 cursor-pointer">Ocean</SelectItem>
                                                <SelectItem value="air" className="text-white hover:bg-slate-800 focus:bg-slate-800 cursor-pointer">Air</SelectItem>
                                                <SelectItem value="road" className="text-white hover:bg-slate-800 focus:bg-slate-800 cursor-pointer">Road</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Cargo Type</label>
                                        <Select value={cargoType} onValueChange={setCargoType}>
                                            <SelectTrigger className="!bg-[#0a1628] border-slate-700 !text-white h-12 rounded-xl focus:ring-0 focus:border-cyan-500 font-medium">
                                                <SelectValue placeholder="Select..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#0d1f35] border-slate-700 text-white">
                                                <SelectItem value="general" className="text-white hover:bg-slate-800 focus:bg-slate-800 cursor-pointer">General</SelectItem>
                                                <SelectItem value="perishable" className="text-white hover:bg-slate-800 focus:bg-slate-800 cursor-pointer">Perishable</SelectItem>
                                                <SelectItem value="hazardous" className="text-white hover:bg-slate-800 focus:bg-slate-800 cursor-pointer">Hazardous</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <Button
                                size="lg"
                                className="w-full h-14 bg-cyan-500 hover:bg-cyan-600 !text-white text-base font-bold rounded-xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 border-0 mt-2"
                                onClick={handleSearch}
                            >
                                <Search className="w-4 h-4 mr-2" />
                                Search Routes
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Simulated Results */}
            {showResults && (
                <div className="absolute bottom-6 right-6 z-10 w-full max-w-[360px] p-4 sm:p-0 animate-in slide-in-from-bottom-5 fade-in duration-500">
                    <div className="bg-white/95 backdrop-blur-md rounded-xl p-4 shadow-xl border border-blue-100/50">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
                                </span>
                                <h3 className="font-bold text-slate-800 text-sm">Live Rates Found</h3>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">ID: Q-29482</span>
                        </div>
                        <div className="space-y-3">
                            <MockQuoteCard
                                carrier="Maersk Line"
                                type="sea"
                                days="32 days"
                                price="$1,240"
                                badges={['Direct', 'Carbon Neutral']}
                                logo="🚢"
                            />
                            <MockQuoteCard
                                carrier="Qatar Airways"
                                type="air"
                                days="3 days"
                                price="$4,850"
                                badges={['Express', 'Door-to-Door']}
                                logo="✈️"
                            />
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100/50 text-center">
                            <Button
                                size="sm"
                                className="w-full bg-primary hover:bg-primary-700 text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
                            >
                                Unlock & Book these Rates
                                <ArrowRight className="w-3 h-3 ml-1.5" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes dataFlow {
                    0% { left: -100%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { left: 100%; opacity: 0; }
                }
                .animate-data-flow {
                    animation: dataFlow linear infinite;
                }
            `}</style>
        </div>
    );
};

const MockQuoteCard = ({ carrier, type, days, price, badges, logo }: any) => (
    <div className="flex items-center justify-between p-3.5 bg-white rounded-lg border border-slate-100 hover:border-primary-400 hover:shadow-md transition-all cursor-pointer group">
        <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${type === 'sea' ? 'bg-primary-50' : 'bg-secondary-50'}`}>
                {logo}
            </div>
            <div>
                <p className="font-bold text-slate-900 text-sm flex items-center gap-1">
                    {carrier}
                    {type === 'air' && <Zap className="w-3 h-3 text-secondary-500 fill-secondary-500" />}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-medium text-slate-500">{days}</span>
                    <div className="flex gap-1">
                        {badges.map((b: string) => (
                            <span key={b} className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium border border-slate-200">
                                {b}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
        <div className="text-right">
            <p className="font-bold text-primary-600 text-base">{price}</p>
            <span className="text-[10px] text-slate-400 font-medium">USD</span>
        </div>
    </div>
);
