import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Search, ArrowRight, CheckCircle2 } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export const InstantQuoteWidget = ({ onSearch, compact = false }: { onSearch?: () => void, compact?: boolean }) => {
    const [origin, setOrigin] = useState("");
    const [destination, setDestination] = useState("");
    const [serviceType, setServiceType] = useState("");
    const [cargoType, setCargoType] = useState("");
    const [showResults, setShowResults] = useState(false);

    const handleSearch = () => {
        if (!origin) return;
        setTimeout(() => {
            setShowResults(true);
            if (onSearch) onSearch();
        }, 1200);
    };

    const [openOrigin, setOpenOrigin] = useState(false);
    const [openDest, setOpenDest] = useState(false);

    const locations = [
        { value: "shanghai_cn", label: "Shanghai, CN (PVG/SHA)" },
        { value: "ningbo_cn", label: "Ningbo, CN (NGB)" },
        { value: "shenzhen_cn", label: "Shenzhen, CN (SZX)" },
        { value: "hongkong_hk", label: "Hong Kong, HK (HKG)" },
        { value: "singapore_sg", label: "Singapore, SG (SIN)" },
        { value: "losangeles_us", label: "Los Angeles, US (LAX)" },
        { value: "longbeach_us", label: "Long Beach, US (LGB)" },
        { value: "newyork_us", label: "New York, US (JFK/NYC)" },
        { value: "london_uk", label: "London, UK (LHR)" },
        { value: "manchester_uk", label: "Manchester, UK (MAN)" },
        { value: "rotterdam_nl", label: "Rotterdam, NL (RTM)" },
        { value: "hamburg_de", label: "Hamburg, DE (HAM)" },
        { value: "dubai_ae", label: "Dubai, AE (DXB)" },
        { value: "mumbai_in", label: "Mumbai, IN (BOM)" },
        { value: "tokyo_jp", label: "Tokyo, JP (NRT/HND)" },
    ];

    const LocationCombobox = ({ value, setValue, open, setOpen, placeholder }: any) => (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between !bg-[#0a1628] border-slate-700 !text-white h-10 rounded-lg hover:bg-[#0f2038] hover:text-white font-medium text-sm transition-all shadow-sm"
                >
                    {value
                        ? locations.find((loc) => loc.value === value)?.label
                        : <span className="text-slate-500 font-normal">{placeholder}</span>}
                    <Search className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-[#0d1f35] border-slate-700 text-white z-[10000]">
                <Command className="bg-transparent">
                    <CommandInput placeholder="Search location..." className="text-white placeholder:text-slate-500 border-slate-700 h-9" />
                    <CommandList>
                        <CommandEmpty>No location found.</CommandEmpty>
                        <CommandGroup>
                            {locations.map((loc) => (
                                <CommandItem
                                    key={loc.value}
                                    value={loc.label}
                                    onSelect={(currentValue) => {
                                        const selected = locations.find(l => l.label.toLowerCase() === currentValue.toLowerCase());
                                        setValue(selected ? selected.value : "");
                                        setOpen(false);
                                    }}
                                    className="text-slate-200 aria-selected:bg-[#1e3a5f] aria-selected:text-white cursor-pointer py-2 text-xs"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/50"></div>
                                        {loc.label}
                                    </div>
                                    <CheckCircle2
                                        className={cn(
                                            "ml-auto h-3 w-3 text-cyan-500",
                                            value === loc.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );

    return (
        <div className="relative w-full max-w-[380px]">
            <Card className="!bg-[#0d1f35] border-slate-700 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden backdrop-blur-sm">
                <CardContent className="p-6 pt-8 !bg-[#0d1f35]">
                    {/* Header Section */}
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-[#1e3a5f] rounded-lg flex items-center justify-center shadow-inner border border-slate-700/40 flex-shrink-0">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                </span>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold tracking-tight text-white mb-0.5">Get Instant Quotes</h2>
                                <p className="text-slate-400 text-[9px] leading-tight font-medium uppercase tracking-wider">Live Rate Engine</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div className="space-y-3">
                            <div>
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Origin</label>
                                <LocationCombobox
                                    value={origin}
                                    setValue={setOrigin}
                                    open={openOrigin}
                                    setOpen={setOpenOrigin}
                                    placeholder="Select Origin..."
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Destination</label>
                                <LocationCombobox
                                    value={destination}
                                    setValue={setDestination}
                                    open={openDest}
                                    setOpen={setOpenDest}
                                    placeholder="Select Destination..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Service Type</label>
                                    <Select value={serviceType} onValueChange={setServiceType}>
                                        <SelectTrigger className="!bg-[#0a1628] border-slate-700 !text-white h-10 rounded-lg focus:ring-0 focus:border-cyan-500 font-medium text-sm">
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
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Cargo Type</label>
                                    <Select value={cargoType} onValueChange={setCargoType}>
                                        <SelectTrigger className="!bg-[#0a1628] border-slate-700 !text-white h-10 rounded-lg focus:ring-0 focus:border-cyan-500 font-medium text-sm">
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
                            className="w-full h-12 bg-cyan-500 hover:bg-cyan-600 !text-white text-sm font-bold rounded-lg transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 border-0 mt-1"
                            onClick={handleSearch}
                        >
                            <Search className="w-4 h-4 mr-2" />
                            Search Routes
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Simulated Results Overlay */}
            {showResults && (
                <div className="absolute top-[80px] left-0 right-0 z-20 px-0 animate-in slide-in-from-bottom-5 fade-in duration-300 rounded-b-xl overflow-hidden">
                    <div className="bg-white/95 backdrop-blur-md h-full w-full p-4 shadow-xl border-t border-slate-100">
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
                                className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
                            >
                                Unlock & Book these Rates
                                <ArrowRight className="w-3 h-3 ml-1.5" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


const MockQuoteCard = ({ carrier, type, days, price, badges, logo }: any) => (
    <div className="flex items-center justify-between p-3.5 bg-white rounded-lg border border-slate-100 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group">
        <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${type === 'sea' ? 'bg-blue-50' : 'bg-purple-50'}`}>
                {logo}
            </div>
            <div>
                <p className="font-bold text-slate-900 text-sm flex items-center gap-1">
                    {carrier}
                    {type === 'air' && <Zap className="w-3 h-3 text-purple-500 fill-purple-500" />}
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
            <p className="font-bold text-blue-600 text-base">{price}</p>
            <span className="text-[10px] text-slate-400 font-medium">USD</span>
        </div>
    </div>
);
