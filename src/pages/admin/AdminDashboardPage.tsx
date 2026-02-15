import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
    LayoutDashboard,
    Users,
    ShoppingBag,
    TrendingUp,
    AlertTriangle,
    Inbox,
    ArrowRight,
    FileText,
    Shield
} from 'lucide-react';
import AdminPageHeader from '@/components/layout/admin/AdminPageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/currency';

const StatCardSkeleton = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-32" />
    </div>
);

const PendingActionsSkeleton = () => (
    <div className="divide-y divide-gray-100">
        {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                </div>
            </div>
        ))}
    </div>
);

const RecentActivitySkeleton = () => (
    <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start space-x-3 pb-3 border-b border-gray-50 last:border-0">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-64" />
                </div>
                <Skeleton className="h-3 w-12" />
            </div>
        ))}
    </div>
);

const StatCard = ({ title, value, change, icon: Icon, trend }: any) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${trend === 'up' ? 'bg-emerald-50 text-emerald-600' :
                trend === 'down' ? 'bg-red-50 text-red-600' : 'bg-primary-50 text-primary-600'}`}>
                <Icon className="h-6 w-6" />
            </div>
            <span className={`text-sm font-medium ${trend === 'up' ? 'text-emerald-600' :
                trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                {change}
            </span>
        </div>
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
);

const AdminDashboardPage = () => {
    const navigate = useNavigate();
    const stats = useQuery(api.admin.getDashboardStats);

    return (
        <div className="space-y-8">
            {/* Header */}
            <AdminPageHeader
                title="Dashboard Overview"
                subtitle="Welcome back, Administrator. Here is your platform summary."
                icon={LayoutDashboard}
            />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {!stats ? (
                    <>
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                    </>
                ) : (
                    <>
                        <StatCard
                            title="Total Bookings"
                            value={stats.totalBookings.toLocaleString()}
                            change={stats.trends.bookings}
                            icon={ShoppingBag}
                            trend="up"
                        />
                        <StatCard
                            title="Active Shipments"
                            value={stats.activeShipments.toString()}
                            change={stats.trends.shipments}
                            icon={TrendingUp}
                            trend="up"
                        />
                        <StatCard
                            title="Total Customers"
                            value={stats.totalCustomers.toLocaleString()}
                            change={stats.trends.customers}
                            icon={Users}
                            trend="up"
                        />
                        <StatCard
                            title="Pending Approvals"
                            value={stats.pendingApprovals.toString()}
                            change={stats.trends.approvals}
                            icon={AlertTriangle}
                            trend={stats.pendingApprovals > 5 ? 'down' : 'up'}
                        />
                    </>
                )}
            </div>


            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* Left Column Item 1: Inbox / Priority Actions */}
                <Card className="xl:col-span-2 border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div>
                            <h2 className="text-lg font-bold text-primary-800 flex items-center">
                                <Inbox className="w-5 h-5 mr-2 text-primary" />
                                Inbox & Priority Actions
                            </h2>
                            <p className="text-sm text-gray-500">Items requiring your immediate approval.</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => navigate('/admin/approvals')}>
                            View All <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                    <PendingActionsWidget />
                </Card>

                {/* Right Column Item 1: Revenue */}
                <Card className="border-blue-100 shadow-sm overflow-hidden bg-blue-50/50">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 rounded-lg bg-primary-50 text-primary-600">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                            <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                +12.5% vs last month
                            </span>
                        </div>
                        <h3 className="text-sm font-medium text-gray-500">Total Revenue (MTD)</h3>
                        <div className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(124500, ((stats as any)?.currency || 'USD') as any)}</div>
                    </div>
                    <div className="bg-gray-50 p-4 border-t border-gray-100">
                        <Button
                            className="w-full bg-primary hover:bg-primary-700 text-white shadow-sm"
                            onClick={() => navigate('/admin/payments')}
                        >
                            View Financial Reports
                        </Button>
                    </div>
                </Card>

                {/* Left Column Item 2: Recent Activity */}
                <Card className="xl:col-span-2 border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
                    </div>
                    <div className="p-6">
                        <RecentActivityFeed />
                    </div>
                </Card>

                {/* Right Column Item 2: System Status */}
                <Card className="border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6">
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">System Status</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-700 flex items-center"><div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div> API Gateway</span>
                                <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">Operational</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-700 flex items-center"><div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div> Database</span>
                                <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">Operational</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-700 flex items-center"><div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div> Email Service</span>
                                <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">Operational</Badge>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

const PendingActionsWidget = () => {
    const actions = useQuery(api.admin.getPendingActions);

    if (actions === undefined) {
        return <PendingActionsSkeleton />;
    }

    if (actions.length === 0) {
        return <div className="p-8 text-center text-gray-500">All caught up! No pending actions.</div>;
    }

    return (
        <div className="divide-y divide-gray-100">
            {actions.slice(0, 5).map((action: any) => (
                <div key={action.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${action.type === 'booking' ? 'bg-primary-100 text-primary-600' :
                            action.type === 'kyc' ? 'bg-purple-100 text-purple-600' :
                                'bg-orange-100 text-orange-600'
                            }`}>
                            {action.type === 'booking' ? <ShoppingBag className="w-5 h-5" /> :
                                action.type === 'kyc' ? <Shield className="w-5 h-5" /> :
                                    <FileText className="w-5 h-5" />}
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-primary-800">{action.title}</h4>
                            <p className="text-xs text-gray-500">{action.subtitle}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant={action.priority === 'critical' ? 'destructive' : 'secondary'} className="capitalize">
                            {action.priority}
                        </Badge>
                        <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            Review
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
};

const RecentActivityFeed = () => {
    const activity = useQuery(api.admin.getRecentActivity);

    if (activity === undefined) {
        return <RecentActivitySkeleton />;
    }

    if (!activity || activity.length === 0) {
        return <div className="text-sm text-gray-500 text-center py-8">No recent activity found.</div>;
    }

    return (
        <div className="space-y-4">
            {activity.map((log: any) => {
                const isEmail = log.action === 'email.sent';
                const isBooking = log.action.startsWith('booking.');
                const isUser = log.action.startsWith('user.');

                return (
                    <div key={log._id} className="flex items-start space-x-3 pb-3 border-b border-gray-50 last:border-0">
                        <div className={`mt-0.5 p-1.5 rounded-full flex-shrink-0 
                            ${isEmail ? 'bg-primary-50 text-primary-600' :
                                isBooking ? 'bg-emerald-50 text-emerald-600' :
                                    'bg-gray-100 text-gray-600'}`}>
                            {isEmail ? <div className="w-4 h-4">✉️</div> :
                                isBooking ? <div className="w-4 h-4">📦</div> :
                                    <div className="w-4 h-4">👤</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {formatActionLabel(log.action)}
                            </p>
                            <p className="text-xs text-gray-500 truncate mt-0.5">
                                {formatActionDetails(log)}
                            </p>
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

function formatActionLabel(action: string) {
    switch (action) {
        case 'email.sent': return 'Email Notification Sent';
        case 'booking.created': return 'New Booking Received';
        case 'booking.approved': return 'Booking Approved';
        case 'booking.rejected': return 'Booking Rejected';
        default: return action;
    }
}

function formatActionDetails(log: any) {
    if (log.action === 'email.sent') return `To: ${log.details?.recipient || 'Unknown'}`;
    if (log.action.startsWith('booking.')) return `Ref: ${log.entityId} • ${log.details?.customer || ''}`;
    return log.details ? JSON.stringify(log.details) : '';
}


export default AdminDashboardPage;
