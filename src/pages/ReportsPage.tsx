import React, { useState, useMemo } from 'react';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import MediaCardHeader from '@/components/ui/media-card-header';
import DataTable from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { createCSVUrl } from '@/lib/export';
import { toast } from 'sonner';
import Footer from '@/components/layout/Footer';
import AnalyticsDashboard from '@/components/charts/AnalyticsDashboard';
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useStickyQueryData } from '@/hooks/useStickyQueryData';

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const downloadRef = React.useRef<HTMLAnchorElement>(null);

  // Live data from Convex for analytics
  const shipmentsQuery = useQuery(api.shipments.listShipments, {});
  const quotesQuery = useQuery(api.quotes.listMyQuotes);
  const bookingsQuery = useQuery(api.bookings.listMyBookings, {});
  const shipments = useStickyQueryData("reports:shipments", shipmentsQuery, []);
  const quotes = useStickyQueryData("reports:quotes", quotesQuery, []);
  const bookings = useStickyQueryData("reports:bookings", bookingsQuery, []);

  // Compute live stats
  const liveStats = useMemo(() => ({
    totalShipments: shipments.length,
    totalQuotes: quotes.length,
    totalBookings: bookings.length,
  }), [shipments, quotes, bookings]);

  // Dynamic Reports Data
  // In V1, we don't have a backend for "saved reports" yet, so this should be empty
  // unless we want to show generated ones. For now, let's keep it clean.
  const recentReports: any[] = [];

  // Aggregated Analytics Data
  const monthlyShipments = useMemo(() => {
    if (!shipments.length) {
      // Return empty placeholder structure for charts to render "0" states comfortably
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      return months.map(m => ({ month: m, count: 0, value: 0 }));
    }

    // Simple aggregation by month (mocking the date parsing slightly as we rely on createdAt)
    const monthMap = new Map<string, { count: number, value: number }>();

    shipments.forEach((s: any) => {
      const date = new Date(s._creationTime || Date.now());
      const month = date.toLocaleString('default', { month: 'short' });
      const current = monthMap.get(month) || { count: 0, value: 0 };

      // Parse value if possible, else 0
      const valStr = s.shipmentDetails?.value || "0";
      const val = parseFloat(valStr.replace(/[^0-9.]/g, '')) || 0;

      monthMap.set(month, {
        count: current.count + 1,
        value: current.value + val
      });
    });

    return Array.from(monthMap.entries()).map(([month, data]) => ({
      month,
      count: data.count,
      value: data.value
    }));
  }, [shipments]);

  const carrierDistribution = useMemo(() => {
    if (!shipments.length) return [];

    const carrierCounts = new Map<string, number>();
    shipments.forEach((s: any) => {
      const c = s.carrier || 'Unknown';
      carrierCounts.set(c, (carrierCounts.get(c) || 0) + 1);
    });

    const total = shipments.length;
    return Array.from(carrierCounts.entries()).map(([carrier, count]) => ({
      carrier,
      percentage: Math.round((count / total) * 100),
      shipments: count
    })).sort((a, b) => b.shipments - a.shipments);
  }, [shipments]);

  const reportColumns = [
    { key: 'id' as keyof typeof recentReports[0], header: 'Report ID', sortable: true, mono: true },
    { key: 'name' as keyof typeof recentReports[0], header: 'Report Name', sortable: true },
    { key: 'date' as keyof typeof recentReports[0], header: 'Generated', sortable: true },
    {
      key: 'type' as keyof typeof recentReports[0],
      header: 'Type',
      sortable: true,
      render: (value: string) => <StatusBadge status={value} />
    },
    { key: 'size' as keyof typeof recentReports[0], header: 'Size', sortable: true },
    {
      key: 'id' as keyof typeof recentReports[0],
      header: 'Actions',
      render: (value: string, row: any) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Mock export data for this specific report
              const mockData = [
                { id: row.id, name: row.name, date: row.date, status: row.status, metric: 'Value', value: 12345 },
                { id: row.id, name: row.name, date: row.date, status: row.status, metric: 'Volume', value: 67890 }
              ];
              const url = createCSVUrl(mockData);
              if (url && downloadRef.current) {
                downloadRef.current.href = url;
                downloadRef.current.download = `${row.name.replace(/\s+/g, '_')}_${row.date}.csv`;
                downloadRef.current.click();
                URL.revokeObjectURL(url); // Clean up the object URL
                toast.success(`Downloading ${row.name}...`);
              }
            }}
          >
            Download
          </Button>
          <Button variant="outline" size="sm">View</Button>
        </div>
      )
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Hidden download anchor */}
      <a ref={downloadRef} style={{ display: 'none' }} />
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        {/* Reports Header */}
        <MediaCardHeader
          title="Analytics & Reports"
          subtitle="Business Intelligence"
          description="Comprehensive analytics, performance metrics, and detailed reporting."
          backgroundImage="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
          overlayOpacity={0.6}
          className="mb-8"
        />
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'dashboard'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Analytics Dashboard
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'reports'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Reports Library
              </button>
              <button
                onClick={() => setActiveTab('custom')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'custom'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Custom Reports
              </button>
            </nav>
          </div>
        </div>

        {/* Content Sections */}
        {activeTab === 'dashboard' && (
          <AnalyticsDashboard
            data={{
              metrics: [
                { title: 'Total Shipments', value: liveStats.totalShipments.toString(), change: 12, trend: 'up', icon: '📦' },
                { title: 'Active Quotes', value: liveStats.totalQuotes.toString(), change: 5, trend: 'up', icon: '💬' },
                { title: 'Bookings', value: liveStats.totalBookings.toString(), change: -2, trend: 'down', icon: '📅' },
                { title: 'On-Time', value: '94%', change: 1.2, trend: 'up', icon: '⚡' }
              ],
              shipmentData: monthlyShipments.map(d => ({ label: d.month, value: d.count })),
              revenueData: carrierDistribution.map((d, i) => ({
                label: d.carrier,
                value: d.percentage,
                color: ['#0ea5e9', '#22c55e', '#eab308', '#f97316', '#64748b'][i]
              })),
              routeData: [
                { label: 'UK-EU', value: 45, color: '#3b82f6' },
                { label: 'UK-US', value: 30, color: '#22c55e' },
                { label: 'UK-Asia', value: 25, color: '#f59e0b' }
              ]
            }}
          />
        )}
        {activeTab === 'reports' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Reports Library</h2>
              <Button>Generate New Report</Button>
            </div>

            <DataTable
              data={recentReports}
              columns={reportColumns}
              searchPlaceholder="Search reports by name or type..."
              rowsPerPage={10}
            />
          </div>
        )}

        {activeTab === 'custom' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Custom Report Builder</h2>
            </div>

            <div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create Custom Report</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Report Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Enter report name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                    <Select defaultValue="30">
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="Select date range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">Last 30 days</SelectItem>
                        <SelectItem value="90">Last 90 days</SelectItem>
                        <SelectItem value="6m">Last 6 months</SelectItem>
                        <SelectItem value="1y">Last year</SelectItem>
                        <SelectItem value="custom">Custom range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                    <Select defaultValue="summary">
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="summary">Shipment Summary</SelectItem>
                        <SelectItem value="financial">Financial Analysis</SelectItem>
                        <SelectItem value="carrier">Carrier Performance</SelectItem>
                        <SelectItem value="route">Route Analysis</SelectItem>
                        <SelectItem value="compliance">Compliance Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                    <Select defaultValue="pdf">
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filters</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Carrier</label>
                      <Select defaultValue="all">
                        <SelectTrigger className="w-full bg-white">
                          <SelectValue placeholder="All Carriers" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Carriers</SelectItem>
                          <SelectItem value="maersk">Maersk Line</SelectItem>
                          <SelectItem value="cosco">COSCO Shipping</SelectItem>
                          <SelectItem value="msc">MSC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Route</label>
                      <Select defaultValue="all">
                        <SelectTrigger className="w-full bg-white">
                          <SelectValue placeholder="All Routes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Routes</SelectItem>
                          <SelectItem value="uk-eu">UK-EU</SelectItem>
                          <SelectItem value="uk-us">UK-US</SelectItem>
                          <SelectItem value="uk-asia">UK-Asia</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Status</label>
                      <Select defaultValue="all">
                        <SelectTrigger className="w-full bg-white">
                          <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="transit">In Transit</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <Button variant="outline">Preview</Button>
                  <Button>Generate Report</Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
