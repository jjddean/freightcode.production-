import React from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '@/components/ui/brand-logo';
import {
    BarChart3,
    Box,
    Settings,
    Users,
    FileText,
    Bell,
    Search,
    Menu,
    MoreVertical,
    Ship,
    Anchor,
    Map as MapIcon,
    ChevronRight,
    ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Mock Data matching the aesthetic
const shipments = [
    { id: 'PO-4921', origin: 'Shanghai', destination: 'Los Angeles', status: 'Arrived', eta: 'Today', type: 'sea' },
    { id: 'PO-4922', origin: 'Hamburg', destination: 'New York', status: 'In Transit', eta: '2 Days', type: 'sea' },
    { id: 'PO-4923', origin: 'Mumbai', destination: 'Dubai', status: 'Customs', eta: '5 Days', type: 'air' },
    { id: 'PO-4924', origin: 'Tokyo', destination: 'Seattle', status: 'In Transit', eta: '12 Days', type: 'sea' },
    { id: 'PO-4925', origin: 'London', destination: 'Singapore', status: 'Pending', eta: 'TBD', type: 'air' },
];

const TestDashboardPage = () => {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30 flex">

            {/* SIDEBAR */}
            <aside className="w-64 border-r border-slate-800 bg-slate-900/50 backdrop-blur-xl hidden md:flex flex-col">
                <div className="h-16 flex items-center px-6 border-b border-slate-800">
                    <BrandLogo />
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">Platform</div>
                    <NavItem icon={<BarChart3 />} label="Dashboard" active />
                    <NavItem icon={<Box />} label="Shipments" />
                    <NavItem icon={<FileText />} label="Quotes" badge="5" />
                    <NavItem icon={<Users />} label="Carriers" />

                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-8 mb-2 px-2">Management</div>
                    <NavItem icon={<FileText />} label="Invoices" />
                    <NavItem icon={<Settings />} label="Settings" />
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500"></div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">Acme Corp</div>
                            <div className="text-xs text-slate-500 truncate">Enterprise Plan</div>
                        </div>
                        <MoreVertical className="w-4 h-4 text-slate-500" />
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">

                {/* TOP HEADER */}
                <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm flex items-center justify-between px-6 z-10">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="md:hidden text-slate-400">
                            <Menu className="w-5 h-5" />
                        </Button>
                        <div className="relative hidden md:block w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search shipments, quotes, or BOL numbers..."
                                className="w-full h-9 bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-full relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-950"></span>
                        </Button>
                        <Button className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 border-0">
                            + New Booking
                        </Button>
                    </div>
                </header>

                {/* SCROLLABLE VIEWPORT */}
                <main className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-8">

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-white mb-1">Command Center</h1>
                            <p className="text-slate-400">Live operational overview • <span className="text-green-400">All systems operational</span></p>
                        </div>
                        <div className="flex gap-2">
                            <span className="px-3 py-1 rounded bg-slate-900 border border-slate-800 text-xs text-slate-400 font-mono">
                                Last updated: Just now
                            </span>
                        </div>
                    </div>

                    {/* 1. STATS ROW (Replicated from Card) */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <StatCard label="Active Shipments" value="12" change="+2 from yesterday" />
                        <StatCard label="Pending Quotes" value="5" change="Waiting approval" />
                        <div className="bg-red-900/10 p-5 rounded-xl border border-red-900/20 backdrop-blur-sm">
                            <div className="text-xs text-red-300 uppercase font-semibold tracking-wider">Critical Alerts</div>
                            <div className="text-3xl font-bold text-red-500 mt-2 flex items-center gap-2">
                                1 <span className="animate-pulse">⚠️</span>
                            </div>
                            <div className="text-xs text-red-400/50 mt-1">Action required immediately</div>
                        </div>
                        <StatCard label="Total Spend (Mo)" value="$42,500" change="+12% vs last month" highlight />
                    </div>

                    {/* 2. MAIN GRID (Map + Tasks) */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">

                        {/* LARGE MAP WIDGET */}
                        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm overflow-hidden flex flex-col relative group">
                            <div className="absolute top-4 left-4 z-10 flex gap-2">
                                <div className="bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 shadow-xl">
                                    <div className="text-[10px] text-slate-500 uppercase">Selected Route</div>
                                    <div className="font-bold text-white flex items-center gap-2 mt-0.5">
                                        LND <ArrowRight className="w-3 h-3 text-slate-500" /> DXB
                                    </div>
                                </div>
                            </div>

                            {/* Map Background Mock */}
                            <div className="relative flex-1 bg-slate-950">
                                <img
                                    src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop"
                                    className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-screen"
                                    alt="Map"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                                <div className="absolute inset-0 bg-slate-950/20" /> {/* Dimmer */}

                                {/* Simulated Nodes */}
                                <div className="absolute top-1/2 left-1/4 w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-pulse"></div>
                                <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse"></div>
                            </div>

                            {/* Bottom Analysis Pane */}
                            <div className="h-24 bg-slate-900 border-t border-slate-800 p-4 flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="text-sm font-bold text-white">Route Analysis: Maersk Line • US772</span>
                                        <span className="bg-red-500/20 text-red-300 text-[10px] px-1.5 py-0.5 rounded border border-red-500/30">HIGH RISK</span>
                                    </div>
                                    <div className="text-xs text-slate-500 font-mono">ETA Deviation: +4 Days • Weather Alert in Atlantic</div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="text-right">
                                        <div className="text-[10px] text-slate-500 uppercase">Health Score</div>
                                        <div className="text-xl font-bold text-emerald-400">88<span className="text-sm text-slate-500">/100</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* UPCOMING TASKS LIST */}
                        <div className="rounded-xl border border-slate-800 bg-slate-900/30 backdrop-blur-sm flex flex-col">
                            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                                <h3 className="font-semibold text-slate-200">Action Items</h3>
                                <span className="bg-blue-900/30 text-blue-300 text-xs px-2 py-1 rounded-full border border-blue-900/50">3 Pending</span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                <TaskItem title="Upload Commercial Invoice" subtitle="PO-4923 • Mumbai" priority="high" />
                                <TaskItem title="Approve Booking Request" subtitle="Quote #Q-1029 • DHL" priority="medium" />
                                <TaskItem title="Review Customs Documents" subtitle="PO-4900 • Clearance Hold" priority="high" />
                                <TaskItem title="Confirm Delivery Slot" subtitle="PO-4899 • Warehouse A" priority="low" />
                            </div>
                        </div>

                    </div>

                    {/* 3. RECENT SHIPMENTS TABLE */}
                    <div className="rounded-xl border border-slate-800 bg-slate-900/30 backdrop-blur-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                            <h3 className="font-semibold text-slate-200">Recent Shipments</h3>
                            <Button variant="ghost" size="sm" className="text-xs text-slate-500 hover:text-white h-8">View All</Button>
                        </div>
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="bg-slate-950 text-xs uppercase font-semibold text-slate-500">
                                <tr>
                                    <th className="px-6 py-4">ID</th>
                                    <th className="px-6 py-4">Origin</th>
                                    <th className="px-6 py-4">Destination</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {shipments.map((s, i) => (
                                    <tr key={s.id} className="hover:bg-slate-800/50 transition-colors group">
                                        <td className="px-6 py-4 font-mono text-white">{s.id}</td>
                                        <td className="px-6 py-4 text-slate-300">{s.origin}</td>
                                        <td className="px-6 py-4 text-slate-300">{s.destination}</td>
                                        <td className="px-6 py-4">
                                            {s.type === 'sea' ? <span className="flex items-center gap-1 text-blue-400"><Anchor className="w-3 h-3" /> Sea</span> : <span className="flex items-center gap-1 text-sky-400"><Ship className="w-3 h-3" /> Air</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={s.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-white hover:bg-slate-700">
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                </main>
            </div>
        </div>
    );
};

// --- SUBCOMPONENTS ---

function NavItem({ icon, label, active = false, badge }: any) {
    return (
        <div className={`
      flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all group
      ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}
    `}>
            {React.cloneElement(icon, { className: `w-5 h-5 ${active ? 'text-white' : 'text-slate-500 group-hover:text-white'}` })}
            <span className="text-sm font-medium flex-1">{label}</span>
            {badge && <span className="bg-slate-800 text-slate-200 text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-700">{badge}</span>}
        </div>
    )
}

function StatCard({ label, value, change, highlight }: any) {
    return (
        <div className={`p-5 rounded-xl border backdrop-blur-sm ${highlight ? 'bg-slate-800 border-slate-700' : 'bg-slate-900/50 border-slate-800'}`}>
            <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider">{label}</div>
            <div className="text-3xl font-bold text-white mt-2">{value}</div>
            <div className="text-xs text-slate-400 mt-1">{change}</div>
        </div>
    )
}

function TaskItem({ title, subtitle, priority }: any) {
    const color = priority === 'high' ? 'bg-red-500' : priority === 'medium' ? 'bg-orange-500' : 'bg-blue-500';
    return (
        <div className="p-3 hover:bg-slate-800/50 rounded flex items-start gap-3 cursor-pointer group transition-colors">
            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${color} shadow-[0_0_8px_currentColor]`} />
            <div>
                <div className="text-sm font-medium text-slate-200 group-hover:text-white">{title}</div>
                <div className="text-xs text-slate-500">{subtitle}</div>
            </div>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    if (status === 'Arrived') return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Arrived</span>
    if (status === 'In Transit') return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">In Transit</span>
    if (status === 'Customs') return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">Customs Hold</span>
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-700/50 text-slate-400 border border-slate-600">Pending</span>
}

export default TestDashboardPage;
