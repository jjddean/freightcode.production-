import React from 'react';
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
    BarChart3,
    Box,
    FileText,
    Users,
    Ship,
    Anchor,
    ChevronRight,
    ArrowRight,
    ShoppingBag,
    Shield,
    Activity,
    AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/currency';
import { useStickyQueryData } from '@/hooks/useStickyQueryData';

// --- Subcomponents from Command Center ---

function StatCard({ label, value, change, highlight, trend }: any) {
    return (
        <div className={`p-5 rounded-xl border backdrop-blur-sm transition-all hover:shadow-lg ${highlight ? 'bg-slate-800 border-slate-700 shadow-blue-500/5' : 'bg-slate-900/50 border-slate-800'}`}>
            <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider">{label}</div>
            <div className="text-2xl font-bold text-white mt-1 tracking-tight">{value}</div>
            <div className={`text-[10px] mt-1 font-medium ${trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400'}`}>
                {change}
            </div>
        </div>
    )
}

function TaskItem({ title, subtitle, priority, type }: any) {
    const color = priority === 'critical' || priority === 'high' ? 'bg-red-500' : priority === 'medium' ? 'bg-orange-500' : 'bg-blue-500';
    const Icon = type === 'booking' ? ShoppingBag : type === 'kyc' ? Shield : FileText;

    return (
        <div className="p-3 hover:bg-slate-800/50 rounded-lg flex items-start gap-3 cursor-pointer group transition-colors border border-transparent hover:border-slate-800">
            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${color} shadow-[0_0_8px_currentColor]`} />
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-200 group-hover:text-white truncate">{title}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate">{subtitle}</div>
            </div>
            <Icon className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 mt-1" />
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const s = status?.toLowerCase() || '';
    if (s === 'arrived' || s === 'delivered' || s === 'paid')
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">Arrived</span>
    if (s === 'in transit' || s === 'in_transit' || s === 'shipped')
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">In Transit</span>
    if (s === 'customs' || s === 'customs clearance' || s === 'pending_review')
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 uppercase tracking-wider">Hold</span>
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700/50 text-slate-400 border border-slate-600 uppercase tracking-wider">Pending</span>
}

// --- Main Page Component ---

const AdminDashboardPage = () => {
    // 1. Data Fetching
    const statsQuery = useQuery(api.admin.getDashboardStats);
    const shipmentsQuery = useQuery(api.admin.listAllShipments);
    const actionsQuery = useQuery(api.admin.getPendingActions);

    const stableStats = useStickyQueryData("admin:dashboard:stats", statsQuery, {
        activeShipments: 0,
        pendingApprovals: 0,
        totalCustomers: 0,
        totalBookings: 0,
        trends: {
            bookings: "+0%",
            shipments: "+0",
            customers: "+0%",
            approvals: "0"
        }
    });

    const shipments = useStickyQueryData("admin:dashboard:shipments", shipmentsQuery, []);
    const actions = useStickyQueryData("admin:dashboard:actions", actionsQuery, []);

    return (
        <div className="-m-8 p-8 min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30 space-y-8">

            {/* Header Area */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-white mb-1 tracking-tight">Command Center</h1>
                    <p className="text-slate-400 text-xs text-opacity-80">Live operational overview • <span className="text-green-400 font-medium text-opacity-100">All systems operational</span></p>
                </div>
                <div className="flex gap-3">
                    <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[9px] text-slate-500 font-mono flex items-center">
                        Snapshot: Feb 2026
                    </span>
                    <Button className="bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/10 border-0 text-[10px] font-bold px-4 h-8 rounded-lg">
                        + New Operation
                    </Button>
                </div>
            </div>

            {/* 1. STATS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    label="Active Shipments"
                    value={String(stableStats.activeShipments)}
                    change={`${stableStats.trends?.shipments} from yesterday`}
                    trend={stableStats.trends?.shipments?.startsWith('+') ? 'up' : 'down'}
                />
                <StatCard
                    label="Pending Actions"
                    value={String(stableStats.pendingApprovals)}
                    change="Waiting internal review"
                    trend={stableStats.pendingApprovals > 5 ? 'down' : 'up'}
                />
                <div className="bg-red-900/10 p-5 rounded-xl border border-red-900/20 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <AlertTriangle className="w-12 h-12 text-red-500" />
                    </div>
                    <div className="text-xs text-red-300 uppercase font-semibold tracking-wider">Critical Risks</div>
                    <div className="text-2xl font-bold text-red-500 mt-1 flex items-center gap-2">
                        {stableStats.pendingApprovals > 2 ? 'High' : 'Low'} <span className="animate-pulse">⚠️</span>
                    </div>
                    <div className="text-[10px] text-red-400/50 mt-1 uppercase font-bold tracking-widest">Action Required</div>
                </div>
                <StatCard
                    label="Active Carriers"
                    value="14"
                    change="Live integration active"
                    highlight
                    trend="up"
                />
            </div>

            {/* 2. MAIN GRID (Mapping + Tasks) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LARGE MAP/OPERATIONS WIDGET */}
                <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm overflow-hidden flex flex-col relative group min-h-[450px]">
                    <div className="absolute top-4 left-4 z-10 flex gap-2">
                        <div className="bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 shadow-xl">
                            <div className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Global Traffic</div>
                            <div className="font-bold text-white flex items-center gap-2">
                                <Activity className="w-3 h-3 text-cyan-400 animate-pulse" /> Live Deployment
                            </div>
                        </div>
                    </div>

                    {/* Operational Visuals (Mocking the dark futuristic feel) */}
                    <div className="relative flex-1 bg-slate-950 overflow-hidden">
                        <img
                            src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop"
                            className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-screen scale-110 group-hover:scale-100 transition-transform duration-1000"
                            alt="Operational Map"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />

                        {/* Static points representing data hubs */}
                        <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-pulse" />
                        <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse" />
                        <div className="absolute bottom-1/4 left-1/2 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.8)] animate-pulse" />
                    </div>

                    {/* Bottom Data Strip */}
                    <div className="h-20 bg-slate-900/90 border-t border-slate-800 p-4 flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className="text-xs font-bold text-white uppercase tracking-wider">System Health</span>
                                <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/30">OPTIMIZED</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                                API Latency: 24ms • Uptime: 99.98% • Active Webhooks: 42
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Risk Score</div>
                            <div className="text-xl font-bold text-cyan-400">08<span className="text-xs text-slate-600">/100</span></div>
                        </div>
                    </div>
                </div>

                {/* ACTION ITEMS (Live from convex/admin.ts:getPendingActions) */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/30 backdrop-blur-sm flex flex-col min-h-[450px]">
                    <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/20">
                        <h3 className="font-bold text-slate-200 text-sm tracking-tight">Queue Management</h3>
                        <span className="bg-blue-900/30 text-blue-300 text-[10px] font-bold px-2 py-1 rounded-full border border-blue-900/50 uppercase tracking-wider">
                            {actions?.length || 0} Pending
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                        {actions && actions.length > 0 ? (
                            actions.slice(0, 10).map((action: any) => (
                                <TaskItem
                                    key={action.id}
                                    title={action.title}
                                    subtitle={action.subtitle}
                                    priority={action.priority}
                                    type={action.type}
                                />
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-600">
                                <Activity className="w-8 h-8 mb-2 opacity-20" />
                                <p className="text-xs font-medium uppercase tracking-widest">Queue Clear</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* 3. RECENT SHIPMENTS TABLE (Live from convex/admin.ts:listAllShipments) */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/30 backdrop-blur-sm overflow-hidden">
                <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/40">
                    <h3 className="font-bold text-slate-200 text-sm tracking-tight flex items-center gap-2">
                        <Box className="w-4 h-4 text-slate-500" /> Operational Log
                    </h3>
                    <Button variant="ghost" size="sm" className="text-[9px] uppercase font-bold text-slate-600 hover:text-white h-7 tracking-widest px-2">
                        Access Archive <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-slate-950/50 text-[10px] uppercase font-bold text-slate-500 tracking-widest border-b border-slate-800">
                            <tr>
                                <th className="px-6 py-4">Ref ID</th>
                                <th className="px-6 py-4">Origin</th>
                                <th className="px-6 py-4">Destination</th>
                                <th className="px-6 py-4">Carrier</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Verification</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {shipments && shipments.length > 0 ? (
                                shipments.slice(0, 8).map((s: any) => (
                                    <tr key={s._id} className="hover:bg-slate-800/30 transition-colors group border-transparent">
                                        <td className="px-6 py-4 font-mono text-white text-xs">{s.shipmentId || s._id.slice(0, 8)}</td>
                                        <td className="px-6 py-4 text-slate-300 text-xs">{s.shipmentDetails?.origin || s.origin || 'Unknown'}</td>
                                        <td className="px-6 py-4 text-slate-300 text-xs">{s.shipmentDetails?.destination || s.destination || 'Unknown'}</td>
                                        <td className="px-6 py-4">
                                            <span className="flex items-center gap-2 text-xs text-slate-400">
                                                <Ship className="w-3 h-3 text-slate-600" /> {s.carrier || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={s.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-700 hover:text-white hover:bg-slate-800">
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-600 font-medium uppercase tracking-widest text-xs">
                                        No active deployments found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

export default AdminDashboardPage;
