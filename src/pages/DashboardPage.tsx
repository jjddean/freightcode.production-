import React, { useState, useEffect } from 'react';
import { StatusBadge } from '@/components/ui/status-badge';
import { Link } from 'react-router-dom';
import MediaCardHeader from '@/components/ui/media-card-header';
import DataTable from '@/components/ui/data-table';
import type { Column } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import Footer from '@/components/layout/Footer';
import MobileDashboard from '@/components/mobile/MobileDashboard';

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { formatCurrency } from '@/lib/currency';
import { useOrganization, useUser } from "@clerk/clerk-react";
import { useStickyQueryData } from '@/hooks/useStickyQueryData';

const DashboardPage = () => {
  const { organization, isLoaded: isOrgLoaded } = useOrganization();
  const { user } = useUser();
  const orgId = organization?.id;


  const liveShipmentsQuery = useQuery(
    api.shipments.listShipments,
    isOrgLoaded ? { orgId: orgId ?? null } : "skip"
  );
  const liveDocumentsQuery = useQuery(
    api.documents.listDocuments,
    isOrgLoaded ? { orgId: orgId ?? null } : "skip"
  );
  const liveBookingsQuery = useQuery(
    api.bookings.listBookings,
    isOrgLoaded ? { orgId: orgId ?? null } : "skip"
  );

  const liveShipments = useStickyQueryData(`dashboard:shipments:${orgId ?? "personal"}`, liveShipmentsQuery, []);
  const liveDocuments = useStickyQueryData(`dashboard:documents:${orgId ?? "personal"}`, liveDocumentsQuery, []);
  const liveBookings = useStickyQueryData(`dashboard:bookings:${orgId ?? "personal"}`, liveBookingsQuery, []);

  // Dynamic metrics calculation
  const liveMetrics = {
    activeShipments: liveShipments?.filter((s: any) => s.status !== 'Delivered').length ?? 0,
    pendingDocuments: liveDocuments?.filter((d: any) => d.status === 'pending' || d.status === 'draft').length ?? 0,
    outstandingInvoices: liveDocuments?.filter((d: any) => d.type === 'commercial_invoice' && d.status !== 'paid').length ?? 0,
    monthlyRevenue: 45000 // Keep hardcoded until financial API is ready
  };

  const HARDCODED_SHIPMENTS = [
    {
      id: 'SH-2024-001',
      origin: 'London, UK',
      destination: 'Hamburg, DE',
      status: 'In Transit',
      eta: '2024-08-05',
      value: '$12,450'
    },
    {
      id: 'SH-2024-002',
      origin: 'Shanghai, CN',
      destination: 'Felixstowe, UK',
      status: 'Customs Clearance',
      eta: '2024-08-03',
      value: '$8,750'
    },
    {
      id: 'SH-2024-003',
      origin: 'Rotterdam, NL',
      destination: 'New York, US',
      status: 'Delivered',
      eta: '2024-07-28',
      value: '$15,200'
    },
  ];

  const recentShipments = (liveShipments && liveShipments.length > 0) ? liveShipments.map((s: any) => ({
    id: s.shipmentId,
    origin: s.shipmentDetails?.origin || 'Unknown',
    destination: s.shipmentDetails?.destination || 'Unknown',
    status: s.status,
    eta: s.estimatedDelivery,
    value: s.shipmentDetails?.value || 'N/A'
  })) : [];

  interface Shipment {
    id: any;
    origin: any;
    destination: any;
    status: any;
    eta: any;
    value: any;
  }

  // Decide what to show: Hardcoded (for demo feel) or Empty State?
  // Current logic: If live data is empty, show hardcoded. This confuses users when switching orgs.
  // NEW LOGIC: If we are in an ORG, and data is empty, show "No Shipments in [Org Name]".
  // If we are in Personal, and data is empty, show Hardcoded (for first time exp).
  const displayShipments = recentShipments;



  const shipmentColumns: Column<Shipment>[] = [
    {
      key: 'id' as any,
      header: 'Shipment ID',
      sortable: true,
      mono: true,
      render: (value: string) => <span className="block max-w-[170px] truncate">{value}</span>
    },
    {
      key: 'origin' as any,
      header: 'Origin',
      sortable: true,
      render: (value: string) => <span className="block max-w-[130px] truncate">{value}</span>
    },
    {
      key: 'destination' as any,
      header: 'Destination',
      sortable: true,
      render: (value: string) => <span className="block max-w-[130px] truncate">{value}</span>
    },
    {
      key: 'status' as any,
      header: 'Status',
      sortable: true,
      render: (value: string) => <StatusBadge status={value} />
    },
    {
      key: 'eta' as any,
      header: 'ETA',
      sortable: true,
      render: (value: string) => {
        const parsed = value ? new Date(value) : null;
        return (
          <span className="whitespace-nowrap">
            {parsed && !isNaN(parsed.getTime()) ? parsed.toLocaleDateString() : '-'}
          </span>
        );
      }
    },
    {
      key: 'value' as any,
      header: 'Value',
      sortable: true,
      render: (val: string) => <span className="font-semibold text-gray-900">{formatCurrency(val)}</span>
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Dashboard */}
      <div className="md:hidden px-4 pt-4">
        <MobileDashboard />
      </div>

      {/* Desktop Dashboard */}
      <div className="hidden md:block">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          {/* Dashboard Header */}
          <MediaCardHeader
            title="Shipment Overview"
            subtitle="Dashboard"
            description="Monitor active shipments, track documentation, and manage operations."
            backgroundImage="/dashboard-bg.jpg"
            overlayOpacity={0.6}
            className="mb-8"
          />

          {/* Live Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 relative">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-sm">🚢</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Shipments</p>
                  <p className="text-2xl font-semibold text-gray-900">{liveMetrics.activeShipments}</p>
                </div>
              </div>
              <div className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-sm">📋</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pending Documents</p>
                  <p className="text-2xl font-semibold text-gray-900">{liveMetrics.pendingDocuments}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-sm">💰</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Outstanding Invoices</p>
                  <p className="text-2xl font-semibold text-gray-900">{liveMetrics.outstandingInvoices}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 relative">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-sm">📊</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Revenue</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatCurrency(liveMetrics.monthlyRevenue)}</p>
                  <p className="text-[11px] text-gray-400 mt-1 whitespace-nowrap">MTD estimate</p>
                </div>
              </div>
              <div className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Recent Shipments Table */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Recent Shipments</h2>
              <Button asChild>
                <Link to="/shipments">View All Shipments</Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <DataTable
                  data={displayShipments}
                  columns={shipmentColumns}
                  rowKey="id"
                  searchPlaceholder="Search shipments..."
                  rowsPerPage={5}
                />
              </div>
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Button asChild variant="outline" className="w-full justify-start h-auto whitespace-normal">
                      <Link to="/quotes" state={{ mode: 'create' }} className="flex items-center py-2">
                        <span className="mr-2 shrink-0">📋</span>
                        <span className="text-left">New Quote</span>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-start h-auto whitespace-normal">
                      <Link to="/shipments" className="flex items-center py-2">
                        <span className="mr-2 shrink-0">🚢</span>
                        <span className="text-left">Track Shipment</span>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-start h-auto whitespace-normal">
                      <Link to="/compliance" className="flex items-center py-2">
                        <span className="mr-2 shrink-0">📄</span>
                        <span className="text-left">Upload Document</span>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-start h-auto whitespace-normal">
                      <Link to="/payments" className="flex items-center py-2">
                        <span className="mr-2 shrink-0">💳</span>
                        <span className="text-left">View Invoices</span>
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Actions</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-600">Commercial Invoice</span>
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Pending</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-600">Certificate of Origin</span>
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Pending</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-600">Payment Due</span>
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Overdue</span>
                    </div>
                  </div>
                  <Button asChild variant="link" className="w-full mt-4 p-0">
                    <Link to="/compliance">View All →</Link>
                  </Button>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <p className="text-gray-900">SH-2024-001 cleared customs</p>
                      <p className="text-gray-500 text-xs">2 hours ago</p>
                    </div>
                    <div className="text-sm">
                      <p className="text-gray-900">Payment received for SH-2024-003</p>
                      <p className="text-gray-500 text-xs">5 hours ago</p>
                    </div>
                    <div className="text-sm">
                      <p className="text-gray-900">New quote request submitted</p>
                      <p className="text-gray-500 text-xs">1 day ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Global Shipment Map removed */}
        </div>
      </div>

    </div>
  );
};

export default DashboardPage;
