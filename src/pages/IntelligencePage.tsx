import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Zap, Ship, BarChart3, Search, TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

export default function IntelligencePage() {
    const stats = useQuery(api.freightintel.queries.getDashboardStats);
    const lanes = useQuery(api.freightintel.queries.getLaneStats, {});

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">FreightIntel Dashboard</h1>
                    <p className="text-muted-foreground">
                        Monitor trade volume and identify high-value partnership opportunities.
                    </p>
                </div>
                <Link to="/intelligence/forwarders">
                    <Button className="gap-2">
                        <Search className="h-4 w-4" />
                        Launch Finder
                    </Button>
                </Link>
            </div>

            {/* Hero Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border-blue-500/20">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-blue-400">Total Analyzed</CardTitle>
                        <Ship className="h-4 w-4 text-blue-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalShipments ?? "---"}</div>
                        <p className="text-xs text-muted-foreground">Historical records</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-500/20">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-400">Prospects</CardTitle>
                        <Zap className="h-4 w-4 text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.highOpportunityForwarders ?? "---"}</div>
                        <p className="text-xs text-muted-foreground">High-need forwarders</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/5 border-purple-500/20">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-purple-400">Active Lanes</CardTitle>
                        <Globe className="h-4 w-4 text-purple-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.activeLanes ?? "---"}</div>
                        <p className="text-xs text-muted-foreground">UK-bound origins</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-amber-400">Growth</CardTitle>
                        <TrendingUp className="h-4 w-4 text-amber-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.recentShipments ?? "---"}</div>
                        <p className="text-xs text-muted-foreground">Last 30 days activity</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Top Lanes Card */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Top UK Lanes</CardTitle>
                        <CardDescription>Highest volume corridors for potential growth</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {lanes?.slice(0, 5).map((lane: any) => (
                            <div key={lane.country} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                                <div className="flex flex-col">
                                    <span className="font-semibold text-sm">{lane.country}</span>
                                    <span className="text-[10px] text-muted-foreground tracking-wide font-bold uppercase">
                                        {lane.topPorts?.[0]?.port || "Main Ports"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm font-medium">
                                    <div className="text-right">
                                        <div className="text-xs text-muted-foreground uppercase text-[10px] font-bold">Volume</div>
                                        <div>{lane.shipmentCount}</div>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Opportunity Card */}
                <Card className="shadow-sm border-emerald-500/20 bg-emerald-500/5">
                    <CardHeader>
                        <CardTitle className="text-lg">Quick Opportunity Finder</CardTitle>
                        <CardDescription>Filter and find partners instantly</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 py-6">
                        <div className="flex flex-col items-center justify-center text-center space-y-4">
                            <div className="p-4 bg-emerald-500/10 rounded-full">
                                <Search className="h-10 w-10 text-emerald-500" />
                            </div>
                            <p className="text-sm text-muted-foreground max-w-[280px]">
                                Access our database of {stats?.totalForwarders || "thousands of"} forwarders to find those with the highest partner need scores.
                            </p>
                            <Link to="/intelligence/forwarders" className="w-full">
                                <Button variant="default" className="w-full bg-emerald-600 hover:bg-emerald-700">
                                    Start Searching
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
