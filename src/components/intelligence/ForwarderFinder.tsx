import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Ship, Zap, Globe } from 'lucide-react';

export default function ForwarderFinder() {
    const [originFilter, setOriginFilter] = useState<string>("all");
    const [minScore, setMinScore] = useState<number>(0);

    const forwarders = useQuery(api.freightintel.queries.searchForwarders, {
        originCountry: originFilter === "all" ? undefined : originFilter,
        minScore: minScore === 0 ? undefined : minScore,
        paginationOpts: { numItems: 10, cursor: null }
    });

    const analytics = useQuery(api.freightintel.queries.getLaneAnalytics);

    return (
        <div className="space-y-6">
            {/* Search & Filters */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Find Prospects
                    </CardTitle>
                    <CardDescription>Filter by origin lane and partner need score</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4">
                        <div className="w-full md:w-64">
                            <Select onValueChange={setOriginFilter} defaultValue="all">
                                <SelectTrigger>
                                    <SelectValue placeholder="Origin Country" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Origins</SelectItem>
                                    {analytics?.map(a => (
                                        <SelectItem key={a.country} value={a.country}>{a.country}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="w-full md:w-64">
                            <Select onValueChange={(val) => setMinScore(parseInt(val))} defaultValue="0">
                                <SelectTrigger>
                                    <SelectValue placeholder="Min Partner Score" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">Any Score</SelectItem>
                                    <SelectItem value="50">50+ (High Need)</SelectItem>
                                    <SelectItem value="75">75+ (Critical Need)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button variant="outline" className="ml-auto">
                            <Search className="mr-2 h-4 w-4" />
                            Refresh Data
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Results Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Forwarder</TableHead>
                                <TableHead>Origin</TableHead>
                                <TableHead>UK Vol (LTM)</TableHead>
                                <TableHead>Last Ship</TableHead>
                                <TableHead>Need Score</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {forwarders?.page.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        No forwarders found matching these criteria.
                                    </TableCell>
                                </TableRow>
                            )}
                            {forwarders?.page.map((f) => (
                                <TableRow key={f._id}>
                                    <TableCell className="font-medium">{f.name}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Globe className="h-3 w-3 text-muted-foreground" />
                                            {f.originCountry}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Ship className="h-3 w-3 text-muted-foreground" />
                                            {f.shipmentsToUK}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(f.lastShipmentDate).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={f.partnerNeedScore > 70 ? "destructive" : f.partnerNeedScore > 40 ? "secondary" : "outline"}
                                            className="px-2"
                                        >
                                            {f.partnerNeedScore} / 100
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button size="sm" variant="ghost">View Lane Details</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
