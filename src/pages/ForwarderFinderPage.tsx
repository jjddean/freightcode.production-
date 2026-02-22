import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Ship,
    UserPlus,
    Building2,
    Globe,
    ChevronRight,
    Star,
    LayoutDashboard,
    Download,
    RefreshCw,
    Loader2,
    Search,
    Filter,
    ArrowUpRight,
    Bell,
    ExternalLink,
    MapPin,
    HelpCircle,
    ArrowRight,
    Zap,
    Mail,
    Phone,
    Database,
    Upload
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const USER_ID = "demo_user_123"; // Using stable demo ID since auth is optional

const LANES = [
    "All Countries",
    "India",
    "Pakistan",
    "Bangladesh",
    "Vietnam",
    "China",
    "Brazil",
    "Mexico",
    "Caribbean",
    "Africa-East",
    "Africa-West",
    "Africa-South",
];

export default function ForwarderFinderPage() {
    const [activeMainTab, setActiveMainTab] = useState("forwarders");
    const [activeTab, setActiveTab] = useState("discovery");
    const [isDiscovering, setIsDiscovering] = useState(false);
    const triggerDiscovery = useAction(api.freightintel.management.runContactDiscovery);
    const [selectedCountry, setSelectedCountry] = useState<string>("All Countries");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState<"shipments" | "score" | "recent">("score");
    const [selectedForwarderId, setSelectedForwarderId] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isBuildingProfiles, setIsBuildingProfiles] = useState(false);
    const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Queries & Mutations
    const buildShippers = useMutation(api.freightintel.build_profiles.buildShipperProfiles);
    const buildConsignees = useMutation(api.freightintel.build_profiles.buildConsigneeProfiles);

    const shippers = useQuery(api.freightintel.queries.findShippers, {
        originCountry: selectedCountry === "All Countries" ? undefined : selectedCountry,
        minShipments: 1
    });

    const consignees = useQuery(api.freightintel.queries.findConsignees, {
        minShipments: 1
    });

    const handleDiscovery = async () => {
        if (!selectedForwarderId) return;
        setIsDiscovering(true);
        const toastId = toast.loading("Initializing Discovery Engine...", {
            description: "Searching global registries and trade directories.",
        });

        try {
            const result = await triggerDiscovery({ profileId: selectedForwarderId as any });
            toast.success("Intelligence successfully refined!", {
                id: toastId,
                description: "Verified contact data and social markers added.",
            });
        } catch (error) {
            toast.error("Discovery failed", {
                id: toastId,
                description: "Check the console or try again later.",
            });
        } finally {
            setIsDiscovering(false);
        }
    };

    const forwarders = useQuery(api.freightintel.queries.findForwarders, {
        originCountry: selectedCountry === "All Countries" ? undefined : selectedCountry,
        minShipments: 1,
        sortBy,
    });

    const watchlist = useQuery(api.freightintel.queries.getWatchlist, { userId: USER_ID });
    const alerts = useQuery(api.freightintel.queries.getAlerts, { userId: USER_ID, onlyUnread: true });

    const dashboardStats = useQuery(api.freightintel.queries.getDashboardStats);
    const triggerSync = useAction(api.freightintel.management.triggerUSAIngest);
    const toggleWatchlist = useMutation(api.freightintel.mutations.toggleWatchlist);
    const ingestManualBatch = useMutation(api.freightintel.mutations.ingestManualBatch);
    const triggerProfileRebuild = useAction(api.freightintel.management.triggerProfileRebuild);

    const handleManualSync = async () => {
        setIsSyncing(true);

        const syncPromise = triggerSync();

        toast.promise(syncPromise, {
            loading: "Triggering USA AMS Sync... Fetching latest records.",
            success: "Synchronization complete! New trade records have been ingested.",
            error: "Synchronization failed. Please check the console for details.",
        });

        try {
            await syncPromise;
        } catch (error) {
            console.error("Sync failed:", error);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleToggleWatchlist = async (profileId: string) => {
        const toastId = toast.loading("Updating Watchlist...");
        try {
            const result = await toggleWatchlist({ userId: USER_ID, profileId: profileId as any });
            toast.success(result.action === "added" ? "Added to watchlist" : "Removed from watchlist", {
                id: toastId
            });
        } catch (error) {
            toast.error("Failed to update watchlist", { id: toastId });
        }
    };

    // Get details for the selected forwarder
    const selectedForwarderDetails = useQuery(
        api.freightintel.queries.getForwarderDetails,
        selectedForwarderId ? { forwarderId: selectedForwarderId as any } : "skip"
    );

    // Get multi-lane footprint
    const multiLanePresence = useQuery(
        api.freightintel.queries.getMultiLanePresence,
        selectedForwarderDetails?.canonicalName
            ? { canonicalName: selectedForwarderDetails.canonicalName, excludeProfileId: selectedForwarderId as any }
            : "skip"
    );

    const filteredForwarders = (activeTab === "discovery" ? forwarders : watchlist)?.filter((f: any) =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getScoreBadge = (score: number) => {
        if (score >= 70) return { color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", label: "High Priority" };
        if (score >= 40) return { color: "bg-amber-500/10 text-amber-500 border-amber-500/20", label: "Medium" };
        return { color: "bg-slate-500/10 text-slate-500 border-slate-500/20", label: "Low Priority" };
    };

    const isWatchlisted = (id: string) => watchlist?.some(w => w._id === id);

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                        <span className="text-lg">🔍</span> FreightIntel™ Intelligence Center
                    </h1>
                    <p className="text-muted-foreground">
                        Discover and monitor high-value freight partners with verified trade intelligence.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2 rounded-xl border-dashed border-primary/30 hover:border-primary/60 transition-colors">
                                <HelpCircle className="h-4 w-4 text-primary" />
                                <span className="hidden sm:inline">User Guide</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                            <div className="bg-gradient-to-br from-primary/10 via-background to-background p-8">
                                <DialogHeader className="mb-6">
                                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <HelpCircle className="h-5 w-5 text-primary" />
                                        </div>
                                        Intelligence Center Guide
                                    </DialogTitle>
                                    <DialogDescription>
                                        Master the FreightIntel™ workflow in 4 simple steps.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-6">
                                    {[
                                        {
                                            step: "01",
                                            title: "Sync Live Manifests",
                                            desc: "Scroll to 'Data Management' and click 'Trigger Manual Refetch'. This pulls real-time trade manifests (e.g., USA AMS) and builds new forwarder profiles automatically."
                                        },
                                        {
                                            step: "02",
                                            title: "Upload Custom Data",
                                            desc: "Already have a CSV from Panjiva or ImportGenius? Use the 'Custom Lane Ingestion' tool at the bottom to bulk-import specialized trade lanes in seconds."
                                        },
                                        {
                                            step: "03",
                                            title: "Target High-Need Partners",
                                            desc: "Look for high 'Partner Need Scores'. A score of 70+ indicates a forwarder with heavy UK volume who likely needs your local handling expertise."
                                        },
                                        {
                                            step: "04",
                                            title: "Enrich & Outreach",
                                            desc: "Click 'Analyze' on a lead, then 'Trigger Discovery'. Our AI scans global registries to find verified emails and LinkedIn profiles for direct outreach."
                                        }
                                    ].map((s, i) => (
                                        <div key={i} className="flex gap-4 group">
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary border border-primary/20 group-hover:bg-primary group-hover:text-white transition-colors uppercase italic shadow-sm">
                                                {s.step}
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-bold leading-none text-foreground">{s.title}</h4>
                                                <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">{s.desc}</p>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Pro Tip Section */}
                                    <div className="mt-2 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-2">
                                        <div className="flex items-center gap-2 text-amber-600">
                                            <Zap className="h-3.5 w-3.5 fill-current" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Pro Tip</span>
                                        </div>
                                        <p className="text-[11px] text-amber-700/80 leading-snug font-medium italic">
                                            "Filter by 'India' or 'Vietnam' to find regional specialists. A high 'UK Agents Used' count means they are already comfortable shipping to the UK but haven't chosen a single partner yet."
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-border/40">
                                    <Button className="w-full rounded-xl font-bold shadow-lg shadow-primary/20" onClick={() => (document.querySelector('[data-state="open"]') as any)?.click()}>
                                        Got it, let's go!
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Button variant="outline" size="icon" className="relative rounded-xl border-border/40">
                        <Bell className="h-5 w-5" />
                        {alerts && alerts.length > 0 && (
                            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-background animate-pulse" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Dashboard Stats */}
            {dashboardStats ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-blue-500/5 to-transparent shadow-sm">
                        <CardContent className="pt-6">
                            <div className="text-2xl font-semibold">{dashboardStats.totalForwarders}</div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Forwarders</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-emerald-500/5 to-transparent shadow-sm">
                        <CardContent className="pt-6">
                            <div className="text-2xl font-semibold text-emerald-500">
                                {dashboardStats.highOpportunityForwarders}
                            </div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">High Opportunity</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-purple-500/5 to-transparent shadow-sm">
                        <CardContent className="pt-6">
                            <div className="text-2xl font-semibold">{dashboardStats.activeLanes}</div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Active Lanes</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-amber-500/5 to-transparent shadow-sm">
                        <CardContent className="pt-6">
                            <div className="text-2xl font-semibold">{dashboardStats.recentShipments}</div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Recent Shipments (30d)</p>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-24">
                    {[1, 2, 3, 4].map(i => <Card key={i} className="animate-pulse" />)}
                </div>
            )}

            {/* Main Navigation Tabs */}
            <Tabs defaultValue="forwarders" value={activeMainTab} onValueChange={setActiveMainTab} className="space-y-6">
                <TabsList className="bg-muted/50 p-1 h-11 w-full md:w-auto inline-flex rounded-xl border border-border/40 gap-1">
                    <TabsTrigger value="forwarders" className="rounded-lg px-5 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold gap-2 text-sm transition-all">
                        <Ship className="h-4 w-4" />
                        Forwarders
                    </TabsTrigger>
                    <TabsTrigger value="shippers" className="rounded-lg px-5 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold gap-2 text-sm transition-all">
                        <UserPlus className="h-4 w-4" />
                        Shippers
                    </TabsTrigger>
                    <TabsTrigger value="importers" className="rounded-lg px-5 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold gap-2 text-sm transition-all">
                        <Building2 className="h-4 w-4" />
                        Importers
                    </TabsTrigger>
                </TabsList>

                {/* Sub-Tabs (Discovery vs Watchlist) - Only for Forwarders */}
                {activeMainTab === "forwarders" && (
                    <Tabs defaultValue="discovery" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                        <TabsList className="bg-muted/50 p-1 h-10 w-full md:w-auto inline-flex rounded-lg border border-border/40">
                            <TabsTrigger value="discovery" className="rounded-md px-4 text-xs font-bold gap-2">
                                <LayoutDashboard className="h-3.5 w-3.5" />
                                Discovery
                            </TabsTrigger>
                            <TabsTrigger value="watchlist" className="rounded-md px-4 text-xs font-bold gap-2">
                                <Star className="h-3.5 w-3.5" />
                                My Watchlist
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                )}

                {/* Dashboard Content */}
                <TabsContent value="forwarders" className="mt-0 space-y-6">
                    {/* Filters */}
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder={`Search ${activeTab === 'discovery' ? 'forwarders' : 'watchlist'}...`}
                                        className="pl-10 bg-background/50 border-border/50"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                <Select value={selectedCountry} onValueChange={setSelectedCountry} disabled={activeTab === "watchlist"}>
                                    <SelectTrigger className="bg-background/50 border-border/50">
                                        <SelectValue placeholder="Select origin country" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {LANES.map((lane) => (
                                            <SelectItem key={lane} value={lane}>{lane}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                                    <SelectTrigger className="bg-background/50 border-border/50">
                                        <SelectValue placeholder="Sort by" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="score">Partner Need Score</SelectItem>
                                        <SelectItem value="shipments">Total Shipments</SelectItem>
                                        <SelectItem value="recent">Most Recent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex items-center justify-between px-1">
                        <p className="text-sm font-medium text-muted-foreground italic">
                            Showing <span className="text-foreground font-bold">{filteredForwarders?.length || 0}</span> {activeTab === "discovery" ? "leads" : "followed items"}
                        </p>
                    </div>

                    <div className="grid gap-4">
                        {filteredForwarders?.length === 0 && (
                            <Card className="border-dashed border-2">
                                <CardContent className="pt-12 pb-12 text-center text-muted-foreground italic text-sm">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="p-3 bg-muted rounded-full">
                                            <Database className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <p className="max-w-[250px]">
                                            {activeTab === "discovery"
                                                ? "No forwarders found. Try adjusting your filters or importing more trade data."
                                                : "Your watchlist is empty. Follow forwarders from the discovery tab to track them here."}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {filteredForwarders?.map((forwarder: any) => {
                            const scoreBadge = getScoreBadge(forwarder.partnerNeedScore);
                            return (
                                <Card key={forwarder._id} className="group hover:border-primary/50 transition-all duration-300 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
                                    <CardContent className="pt-6">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors shadow-inner">
                                                        <Ship className="h-5 w-5 text-blue-500" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <h3 className="text-lg font-bold group-hover:text-primary transition-colors tracking-tight">{forwarder.name}</h3>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className={`h-8 w-8 rounded-full ${isWatchlisted(forwarder._id) ? 'text-amber-500 hover:text-amber-600' : 'text-muted-foreground hover:text-primary'}`}
                                                                onClick={(e) => { e.stopPropagation(); handleToggleWatchlist(forwarder._id); }}
                                                            >
                                                                <Star className={`h-4 w-4 ${isWatchlisted(forwarder._id) ? 'fill-current' : ''}`} />
                                                            </Button>
                                                        </div>
                                                        <Badge variant="outline" className={`${scoreBadge.color} mt-1 border-none font-semibold text-[10px] uppercase tracking-wider`}>
                                                            {scoreBadge.label}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Origin</p>
                                                        <p className="font-semibold text-sm flex items-center gap-2">
                                                            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                                                            {forwarder.originCountry}
                                                        </p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">UK Shipments</p>
                                                        <p className="font-semibold text-sm flex items-center gap-2">
                                                            <ArrowRight className="h-3.5 w-3.5 text-sky-500" />
                                                            {forwarder.shipmentsToUK}
                                                        </p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">UK Agents Used</p>
                                                        <p className="font-semibold text-sm">{forwarder.uniqueUKAgents}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Partner Score</p>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-lg text-emerald-500">{forwarder.partnerNeedScore}</span>
                                                            <span className="text-xs text-muted-foreground">/ 100</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                                                onClick={() => setSelectedForwarderId(forwarder._id)}
                                            >
                                                View Details
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </TabsContent>

                <TabsContent value="shippers" className="mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {shippers?.map((shipper) => (
                            <Card key={shipper._id} className="hover:border-primary/50 transition-all bg-card/50 backdrop-blur-sm">
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <div className="p-2 bg-blue-500/10 rounded-lg">
                                            <UserPlus className="h-4 w-4 text-blue-500" />
                                        </div>
                                        <Badge variant="outline" className="text-[10px] font-bold">
                                            {shipper.shipmentsToUK} UK SHIPMENTS
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-sm font-bold mt-2">{shipper.name}</CardTitle>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Globe className="h-3 w-3" /> {shipper.originCountry}
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Top Forwarders Used</p>
                                            <div className="flex flex-wrap gap-1">
                                                {shipper.topForwarders.slice(0, 2).map((f, i) => (
                                                    <Badge key={i} variant="secondary" className="text-[9px] bg-muted/50">{f}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" className="w-full text-xs h-8 hover:bg-primary/5">
                                            Analyze Trade Pattern <ChevronRight className="h-3 w-3 ml-1" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="importers" className="mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {consignees?.map((consignee) => (
                            <Card key={consignee._id} className="hover:border-primary/50 transition-all bg-card/50 backdrop-blur-sm">
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                                            <Building2 className="h-4 w-4 text-indigo-500" />
                                        </div>
                                        <Badge variant="outline" className="text-[10px] font-bold">
                                            {consignee.totalShipments} TOTAL
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-sm font-bold mt-2">{consignee.name}</CardTitle>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <MapPin className="h-3 w-3" /> {consignee.ukLocation}
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Key Sources</p>
                                            <div className="flex flex-wrap gap-1">
                                                {consignee.topOrigins.slice(0, 2).map((o, i) => (
                                                    <Badge key={i} variant="secondary" className="text-[9px] bg-muted/50">{o}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" className="w-full text-xs h-8 hover:bg-primary/5">
                                            Cross-Reference Importer <ChevronRight className="h-3 w-3 ml-1" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Data Management Section */}
            <div className="pt-12 border-t border-border/50">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
                            <Download className="h-5 w-5 text-muted-foreground" />
                            Data Management
                        </h2>
                        <p className="text-sm text-muted-foreground">Manage and import trade intelligence datasets.</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={async () => {
                        setIsBuildingProfiles(true);
                        try {
                            await buildShippers();
                            await buildConsignees();
                            toast.success("Intelligence profiles rebuilt from raw shipment data.");
                        } finally {
                            setIsBuildingProfiles(false);
                        }
                    }} disabled={isBuildingProfiles}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${isBuildingProfiles ? 'animate-spin' : ''}`} />
                        {isBuildingProfiles ? "Rebuilding..." : "Rebuild Intelligence"}
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                    <Card className="bg-card/50 backdrop-blur-sm shadow-sm border-border/40 overflow-hidden group">
                        <CardHeader className="pb-3 border-b border-border/20 bg-muted/20">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Download className="h-4 w-4 text-emerald-500" />
                                Automated Sources (USA AMS)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Last Sync:</span>
                                <span className="font-medium">2 hours ago</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Status:</span>
                                <span className="text-emerald-500 font-bold flex items-center gap-1.5">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                    Operational
                                </span>
                            </div>
                            <Button
                                variant="outline"
                                className="w-full mt-2 group-hover:border-primary/50 transition-colors"
                                onClick={handleManualSync}
                                disabled={isSyncing}
                            >
                                {isSyncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2 text-primary" />}
                                {isSyncing ? "Syncing..." : "Trigger Manual Refetch"}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-card/50 backdrop-blur-sm shadow-sm border-border/40 overflow-hidden group">
                        <CardHeader className="pb-3 border-b border-border/20 bg-muted/20">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Globe className="h-4 w-4 text-blue-500" />
                                Custom Lane Ingestion
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Upload custom CSV or JSON shipment data for specific trade lanes (e.g. India DGCIS, China SCM).
                            </p>
                            <div className="flex flex-col gap-3">
                                <div className="flex gap-2">
                                    <div
                                        className="flex-1 h-9 px-3 rounded-md border border-input bg-background/50 flex items-center text-xs text-muted-foreground cursor-pointer hover:bg-accent/50 transition-colors truncate"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Upload className="h-3.5 w-3.5 mr-2 shrink-0" />
                                        {selectedFileName || "Choose CSV/JSON file..."}
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept=".csv,.json"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) setSelectedFileName(file.name);
                                        }}
                                    />
                                    <Button
                                        size="sm"
                                        className="h-9 px-4 font-bold"
                                        onClick={() => {
                                            if (!fileInputRef.current?.files?.[0]) return;

                                            const file = fileInputRef.current.files[0];
                                            const reader = new FileReader();
                                            const toastId = toast.loading(`Parsing ${file.name}...`);

                                            reader.onload = async (e) => {
                                                const text = e.target?.result as string;
                                                const lines = text.split(/\r?\n/).filter(l => l.trim());
                                                if (lines.length < 2) {
                                                    toast.error("Invalid file format", { id: toastId });
                                                    return;
                                                }

                                                // Simple CSV parser
                                                const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/["']/g, ""));
                                                const rows = lines.slice(1).map(line => {
                                                    const values = line.split(',').map(v => v.trim().replace(/["']/g, ""));
                                                    const row: any = {};
                                                    headers.forEach((h, i) => row[h] = values[i]);
                                                    return row;
                                                });

                                                // Map to schema
                                                const shipments = rows.map(r => ({
                                                    billOfLading: r.bl || r.bill_of_lading || r.bol || `MAN-${Date.now()}-${Math.random()}`,
                                                    shipper: r.shipper || r.exporter || "Unknown Shipper",
                                                    consignee: r.consignee || r.importer || "Unknown Consignee",
                                                    forwarder: r.forwarder || r.agent || r.notify_party,
                                                    originCountry: r.origin || r.origin_country || "India", // Defaulting if missing
                                                    destinationCountry: r.destination || r.destination_country || "United Kingdom",
                                                    commodity: r.commodity || r.description,
                                                    hsCode: r.hscode || r.hs_code,
                                                    weight: parseFloat(r.weight) || 0,
                                                    shipmentDate: r.date ? new Date(r.date).getTime() : Date.now(),
                                                })).filter(s => s.forwarder && s.forwarder.length > 2);

                                                if (shipments.length === 0) {
                                                    toast.error("No valid shipment records found", {
                                                        id: toastId,
                                                        description: "Ensure your CSV has 'Forwarder' and 'Origin' columns."
                                                    });
                                                    return;
                                                }

                                                try {
                                                    toast.loading(`Ingesting ${shipments.length} records...`, { id: toastId });
                                                    const result = await ingestManualBatch({
                                                        shipments,
                                                        dataSource: `manual_upload_${file.name}`,
                                                    });

                                                    toast.success("Ingestion Complete!", {
                                                        id: toastId,
                                                        description: `Successfully imported ${result.imported} new leads from ${file.name}.`
                                                    });

                                                    // Rebuild profiles to show new data
                                                    await triggerProfileRebuild();
                                                    setSelectedFileName(null);
                                                } catch (error) {
                                                    toast.error("Ingestion failed", { id: toastId });
                                                }
                                            };
                                            reader.readAsText(file);
                                        }}
                                    >
                                        Import
                                    </Button>
                                </div>
                                <p className="text-[10px] text-muted-foreground italic px-1">
                                    Direct upload supports India DGCIS and China SCM standard exports.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Forwarder Details Sheet */}
            <Sheet open={!!selectedForwarderId} onOpenChange={(open) => !open && setSelectedForwarderId(null)}>
                <SheetContent className="sm:max-w-xl w-full p-0 flex flex-col h-full bg-card/95 backdrop-blur-xl border-l border-border/40">
                    {selectedForwarderDetails ? (
                        <>
                            <div className="p-8 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                                <SheetHeader className="text-left space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="p-4 bg-primary/10 rounded-2xl shadow-inner">
                                                <Ship className="h-8 w-8 text-primary" />
                                            </div>
                                            <div className="space-y-1">
                                                <SheetTitle className="text-xl font-black tracking-tight leading-none group flex items-center gap-2 cursor-pointer">
                                                    {selectedForwarderDetails.name}
                                                    <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </SheetTitle>
                                                <Badge variant="outline" className={`${getScoreBadge(selectedForwarderDetails.partnerNeedScore).color} border-none font-bold uppercase tracking-tight text-[10px]`}>
                                                    {getScoreBadge(selectedForwarderDetails.partnerNeedScore).label}
                                                </Badge>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className={`rounded-xl h-10 w-10 ${isWatchlisted(selectedForwarderDetails._id) ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : ''}`}
                                            onClick={() => handleToggleWatchlist(selectedForwarderDetails._id)}
                                        >
                                            <Star className={`h-5 w-5 ${isWatchlisted(selectedForwarderDetails._id) ? 'fill-current' : ''}`} />
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <Card className="bg-muted/30 border-none shadow-none">
                                            <CardContent className="p-4">
                                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Partner Need Score</p>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-3xl font-bold text-emerald-500 italic">
                                                        {selectedForwarderDetails.partnerNeedScore}
                                                    </span>
                                                    <span className="text-sm text-muted-foreground font-medium">/ 100</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card className="bg-muted/30 border-none shadow-none">
                                            <CardContent className="p-4">
                                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">UK Volume</p>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-3xl font-bold italic">
                                                        {selectedForwarderDetails.shipmentsToUK}
                                                    </span>
                                                    <span className="text-sm text-muted-foreground font-medium">LANE CAP</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </SheetHeader>

                                {/* Contact Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                            <div className="h-1 w-1 rounded-full bg-primary" />
                                            Actionable Intelligence
                                        </h4>
                                        {selectedForwarderDetails.discoveryStatus !== "verified" && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-[10px] font-bold uppercase tracking-wider text-primary h-6 px-2 hover:bg-primary/5"
                                                onClick={handleDiscovery}
                                                disabled={isDiscovering}
                                            >
                                                {isDiscovering ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Zap className="h-3 w-3 mr-1" />}
                                                {isDiscovering ? "Discovering..." : "Trigger Discovery"}
                                            </Button>
                                        )}
                                    </div>
                                    <Card className="border-border/40 bg-background/50 overflow-hidden shadow-sm">
                                        <CardContent className="p-0">
                                            <div className="divide-y divide-border/20">
                                                <div className="p-4 flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2.5 text-muted-foreground font-medium">
                                                        <Globe className="h-4 w-4 text-blue-500" />
                                                        Origin HQ
                                                    </div>
                                                    <span className="font-bold tracking-tight">{selectedForwarderDetails.originCountry}</span>
                                                </div>
                                                <div className="p-4 flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2.5 text-muted-foreground font-medium">
                                                        <Mail className="h-4 w-4 text-amber-500" />
                                                        Verified Email
                                                    </div>
                                                    <span className="font-bold tracking-tight">
                                                        {selectedForwarderDetails.email || "Discovery Required"}
                                                    </span>
                                                </div>
                                                <div className="p-4 flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2.5 text-muted-foreground font-medium">
                                                        <Phone className="h-4 w-4 text-emerald-500" />
                                                        Phone
                                                    </div>
                                                    <span className="font-bold tracking-tight">{selectedForwarderDetails.phone || "Lookup Pending"}</span>
                                                </div>
                                                {selectedForwarderDetails.website && (
                                                    <div className="p-4 flex items-center justify-between text-sm">
                                                        <div className="flex items-center gap-2.5 text-muted-foreground font-medium">
                                                            <ExternalLink className="h-4 w-4 text-sky-500" />
                                                            Website
                                                        </div>
                                                        <a href={selectedForwarderDetails.website} target="_blank" rel="noreferrer" className="font-bold tracking-tight text-primary hover:underline">
                                                            Visit Site
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                            {(selectedForwarderDetails.confidenceScore ?? 0) > 0 && (
                                                <div className="px-4 py-2 bg-muted/30 border-t border-border/10 flex items-center justify-between">
                                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Confidence Score</span>
                                                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 text-[10px] font-bold border-none px-2 py-0">
                                                        {selectedForwarderDetails.confidenceScore}% Accurate
                                                    </Badge>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Global Footprint */}
                                {multiLanePresence && multiLanePresence.length > 0 && (
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                            <div className="h-1 w-1 rounded-full bg-blue-500" />
                                            Global Footprint
                                        </h4>
                                        <div className="grid grid-cols-1 gap-2">
                                            {multiLanePresence.map((lane: any) => (
                                                <div
                                                    key={lane.id}
                                                    className="p-3 rounded-xl border border-border/20 bg-muted/10 flex items-center justify-between hover:bg-muted/20 cursor-pointer transition-colors"
                                                    onClick={() => setSelectedForwarderId(lane.id)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-1.5 bg-background rounded-lg shadow-sm">
                                                            <Globe className="h-3.5 w-3.5 text-blue-500" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold">{lane.originCountry}</p>
                                                            <p className="text-[10px] text-muted-foreground uppercase">{lane.shipmentsToUK} UK Shipments</p>
                                                        </div>
                                                    </div>
                                                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[10px]">
                                                        Need: {lane.partnerNeedScore}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* AI Outreach Engine */}
                                <div className="space-y-4 pt-6 border-t border-border/20">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                            <div className="h-1 w-1 rounded-full bg-purple-500" />
                                            AI Outreach Engine
                                        </h4>
                                        <Badge variant="outline" className="text-[9px] font-bold text-purple-500 border-purple-500/20 bg-purple-500/5">
                                            GPT-4o POWERED
                                        </Badge>
                                    </div>

                                    <Tabs defaultValue="email" className="space-y-4">
                                        <TabsList className="grid grid-cols-3 h-9 w-full bg-muted/30 p-1">
                                            <TabsTrigger value="email" className="text-[10px] font-bold uppercase tracking-tight">Email</TabsTrigger>
                                            <TabsTrigger value="linkedin" className="text-[10px] font-bold uppercase tracking-tight">LinkedIn</TabsTrigger>
                                            <TabsTrigger value="whatsapp" className="text-[10px] font-bold uppercase tracking-tight">WhatsApp</TabsTrigger>
                                        </TabsList>

                                        <TabsContent value="email" className="mt-0">
                                            <Card className="bg-muted/10 border-dashed border-border/60">
                                                <CardContent className="p-4">
                                                    <div className="space-y-3">
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] text-muted-foreground font-bold italic uppercase">Subject: Partnering on {selectedForwarderDetails.originCountry} → UK lane</p>
                                                            <p className="text-xs leading-relaxed text-foreground/80">
                                                                "Hi {selectedForwarderDetails.name} Team, noticed your high volume on the {selectedForwarderDetails.originCountry} lane. We are top-tier UK agents with capacity for your shipments..."
                                                            </p>
                                                        </div>
                                                        <Button className="w-full bg-purple-600 hover:bg-purple-700 text-xs font-bold h-9">
                                                            <Mail className="h-3.5 w-3.5 mr-2" />
                                                            Copy Email Template
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </TabsContent>

                                        <TabsContent value="linkedin" className="mt-0">
                                            <Card className="bg-muted/10 border-dashed border-border/60">
                                                <CardContent className="p-4">
                                                    <div className="space-y-3">
                                                        <p className="text-xs leading-relaxed text-foreground/80 italic">
                                                            "Hi, saw your impressive {selectedForwarderDetails.shipmentsToUK} shipments to the UK this month. I'd love to connect and discuss how we can streamline your UK logistics."
                                                        </p>
                                                        <Button variant="outline" className="w-full text-xs font-bold h-9 border-blue-500/50 text-blue-600 hover:bg-blue-500/5">
                                                            <ExternalLink className="h-3.5 w-3.5 mr-2" />
                                                            Generate Connection Note
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </TabsContent>

                                        <TabsContent value="whatsapp" className="mt-0">
                                            <Card className="bg-muted/10 border-dashed border-border/60">
                                                <CardContent className="p-4 text-center py-8">
                                                    <Phone className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-50" />
                                                    <p className="text-[10px] text-muted-foreground font-medium">WhatsApp sequence generation requires verified mobile contact data.</p>
                                                </CardContent>
                                            </Card>
                                        </TabsContent>
                                    </Tabs>
                                </div>

                                {/* Intelligence Blocks: Exporters & Importers */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Top Exporters */}
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                            <div className="h-1 w-1 rounded-full bg-sky-500" />
                                            Top Shippers (Origin)
                                        </h4>
                                        <Card className="border-border/40 bg-background/50 shadow-sm">
                                            <CardContent className="p-4 space-y-3">
                                                {selectedForwarderDetails.topExporters?.map((exp: any, i: number) => (
                                                    <div key={i} className="flex items-center justify-between group/row">
                                                        <span className="text-xs font-bold truncate max-w-[150px]">{exp.name}</span>
                                                        <Badge variant="secondary" className="text-[9px] h-4 px-1">{exp.count} shipments</Badge>
                                                    </div>
                                                ))}
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Top Importers */}
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                            <div className="h-1 w-1 rounded-full bg-indigo-500" />
                                            Target UK Importers
                                        </h4>
                                        <Card className="border-border/40 bg-background/50 shadow-sm">
                                            <CardContent className="p-4 space-y-3">
                                                {selectedForwarderDetails.topImporters?.map((imp: any, i: number) => (
                                                    <div key={i} className="flex items-center justify-between">
                                                        <span className="text-xs font-bold truncate max-w-[150px]">{imp.name}</span>
                                                        <Badge variant="secondary" className="text-[9px] h-4 px-1">{imp.count} items</Badge>
                                                    </div>
                                                ))}
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>

                                {/* Commodity Expertise */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                        <div className="h-1 w-1 rounded-full bg-amber-500" />
                                        Commodity Expertise
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedForwarderDetails.topHS?.map((hs: any, i: number) => (
                                            <Badge key={i} variant="outline" className="bg-amber-500/5 text-amber-600 border-amber-500/20 font-bold px-3 py-1">
                                                HS {hs.code} <span className="opacity-40 mx-1">|</span> {hs.count}
                                            </Badge>
                                        ))}
                                        {(!selectedForwarderDetails.topHS || selectedForwarderDetails.topHS.length === 0) && (
                                            <p className="text-[10px] text-muted-foreground italic pl-3">No commodity patterns analyzed yet.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Recent Activity */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                        <div className="h-1 w-1 rounded-full bg-primary" />
                                        Shipment Timeline
                                    </h4>
                                    <div className="border border-border/40 rounded-xl overflow-hidden shadow-sm">
                                        <Table>
                                            <TableHeader className="bg-muted/40 font-bold uppercase tracking-wider text-[10px]">
                                                <TableRow className="border-b-border/30">
                                                    <TableHead className="font-bold">Date</TableHead>
                                                    <TableHead className="font-bold">Destination</TableHead>
                                                    <TableHead className="font-bold">Commodity</TableHead>
                                                    <TableHead className="text-right font-bold w-12"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedForwarderDetails.recentShipments?.map((shipment: any) => (
                                                    <TableRow key={shipment._id} className="border-b-border/10 hover:bg-muted/10 transition-colors">
                                                        <TableCell className="py-3 font-medium tabular-nums text-xs">
                                                            {new Date(shipment.shipmentDate).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell className="py-3 text-xs font-bold flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-sky-500/20 flex items-center justify-center border border-sky-500/30">
                                                                <div className="w-0.5 h-0.5 rounded-full bg-sky-500" />
                                                            </div>
                                                            {shipment.destinationPort || "UK Base"}
                                                        </TableCell>
                                                        <TableCell className="py-3 text-xs text-muted-foreground truncate max-w-[120px]">
                                                            {shipment.commodity}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <ArrowRight className="h-3 w-3 text-muted-foreground/30" />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                {(!selectedForwarderDetails.recentShipments || selectedForwarderDetails.recentShipments.length === 0) && (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="text-center py-12 text-muted-foreground italic text-sm">
                                                            No recent shipments detected.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-border/40 bg-background/50 backdrop-blur-md flex gap-3 shadow-2xl">
                                <Button className="flex-1 font-bold shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all uppercase tracking-wider">
                                    <Zap className="h-4 w-4 mr-2 text-amber-500" />
                                    Generate Intro Email
                                </Button>
                                <Button variant="outline" className="px-3">
                                    <MapPin className="h-4 w-4" />
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="p-8 space-y-8 animate-pulse">
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 bg-muted rounded-2xl" />
                                <div className="space-y-2">
                                    <div className="h-6 w-48 bg-muted rounded" />
                                    <div className="h-4 w-24 bg-muted rounded" />
                                </div>
                            </div>
                            <div className="h-32 bg-muted rounded-2xl" />
                            <div className="space-y-4">
                                <div className="h-4 w-32 bg-muted rounded" />
                                <div className="h-48 bg-muted rounded-2xl" />
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet >
        </div >
    );
}
