import React, { useState, useEffect } from 'react';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ShipmentRow = {
  id: string;
  origin: string;
  destination: string;
  status: string;
  eta: string;
  carrier: string;
  value: string;
  container: string;
};
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import MediaCardHeader from '@/components/ui/media-card-header';
import DataTable from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Sparkles, Mail, Play } from "lucide-react";
import { toast } from 'sonner';
import { useUser, useAuth, useOrganization } from "@clerk/clerk-react";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFeature } from '@/hooks/useFeature';
import { Link } from 'react-router-dom'; // Ensure Link is imported for upgrade redo
import { formatCurrency, parseCurrencyString, convertCurrency } from '@/lib/currency';
import { useStickyQueryData } from '@/hooks/useStickyQueryData';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";


const ShipmentsPage = () => {
  const { user } = useUser();
  const hasPredictiveInsights = useFeature("PREDICTIVE_INSIGHTS");
  const [activeTab, setActiveTab] = useState('active');
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [sheetMode, setSheetMode] = useState<'details' | 'tracking'>('details');
  const [emailing, setEmailing] = useState(false);
  const [limitDialogOpen, setLimitDialogOpen] = useState(false);
  const createShipment = useMutation(api.shipments.upsertShipment);
  const moveShipments = useMutation((api as any).simulation.moveShipments);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [showFilters, setShowFilters] = useState(false);


  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...activeFilters };
    if (value === '' || value === null || (Array.isArray(value) && value.length === 0)) {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    setActiveFilters(newFilters);
    // Instant update
    handleSearch(searchTerm, newFilters);
  };

  // Recipient email state (defaults to user logged in email)
  const [recipientEmail, setRecipientEmail] = useState("");

  const handleCreateTestShipment = async () => {

    const toastId = toast.loading("Creating shipment...");
    try {
      await createShipment({
        shipmentId: `SH-TEST-${Date.now().toString().slice(-4)}`,
        tracking: {
          status: 'Booking Confirmed',
          currentLocation: {
            city: 'London',
            state: '',
            country: 'United Kingdom',
            coordinates: { lat: 51.5074, lng: -0.1278 }
          },
          estimatedDelivery: new Date(Date.now() + 86400000 * 14).toISOString(),
          carrier: 'Maersk Line',
          trackingNumber: `MRKU${Date.now()}`,
          service: 'Standard Freight',
          shipmentDetails: {
            weight: '1200 kg',
            dimensions: '20x8x8 ft',
            origin: 'London, UK',
            destination: 'New York, USA',
            value: '$5,000'
          },
          events: []
        }
      });
      toast.dismiss(toastId);
      toast.success("Shipment created successfully!");
    } catch (error: any) {
      toast.dismiss(toastId);
      if (error.message.includes("PLAN_LIMIT_REACHED")) {
        setLimitDialogOpen(true);
      } else {
        toast.error("Failed to create shipment: " + error.message);
      }
    }
  };

  const [simulating, setSimulating] = useState(false);
  const handleSimulateTraffic = async () => {
    setSimulating(true);
    try {
      const count = await moveShipments();
      toast.success(`Simulation update: ${count}`);
    } catch {
      toast.error("Simulation failed (is the function defined?)");
    } finally {
      setTimeout(() => setSimulating(false), 500);
    }
  };

  useEffect(() => {
    if (user?.primaryEmailAddress?.emailAddress) {
      setRecipientEmail(user.primaryEmailAddress.emailAddress);
    }
  }, [user]);

  // Action to send email
  const sendReport = useAction((api as any).reporting.sendShipmentReport);

  // Hardcoded fallback data
  const HARDCODED_SHIPMENTS = {
    active: [
      {
        id: 'SH-2024-001',
        origin: 'London, UK',
        destination: 'Hamburg, DE',
        status: 'In Transit',
        eta: '2024-08-05',
        carrier: 'Maersk Line',
        value: '$12,450',
        container: 'MSKU-123456-7'
      },
      {
        id: 'SH-2024-002',
        origin: 'Shanghai, CN',
        destination: 'Felixstowe, UK',
        status: 'Customs Clearance',
        eta: '2024-08-03',
        carrier: 'COSCO Shipping',
        value: '$8,750',
        container: 'COSU-789012-3'
      },
      {
        id: 'SH-2024-004',
        origin: 'Rotterdam, NL',
        destination: 'Singapore, SG',
        status: 'Loading',
        eta: '2024-08-12',
        carrier: 'MSC',
        value: '$18,900',
        container: 'MSCU-345678-9'
      },
      {
        id: 'SH-2024-005',
        origin: 'Miami, US',
        destination: 'Southampton, UK',
        status: 'Booking Confirmed',
        eta: '2024-08-15',
        carrier: 'Hapag-Lloyd',
        value: '$22,100',
        container: 'HLCU-901234-5'
      },
    ],
    completed: [
      {
        id: 'SH-2024-003',
        origin: 'Hamburg, DE',
        destination: 'Dubai, AE',
        status: 'Delivered',
        eta: '2024-07-28',
        carrier: 'Emirates Shipping',
        value: '$15,200',
        container: 'EMSU-567890-1'
      },
      {
        id: 'SH-2024-006',
        origin: 'Tokyo, JP',
        destination: 'Long Beach, US',
        status: 'Delivered',
        eta: '2024-07-20',
        carrier: 'ONE',
        value: '$19,800',
        container: 'ONEU-234567-8'
      },
    ]
  };

  const { organization, isLoaded: isOrgLoaded } = useOrganization();
  const orgId = organization?.id;
  const liveDataQuery = useQuery(
    api.shipments.listShipments,
    isOrgLoaded ? { orgId: orgId ?? null } : "skip"
  );
  const liveData = useStickyQueryData(`shipments:${orgId ?? "personal"}`, liveDataQuery, []);

  // State for filtering - initialized with fallback, updated via effect
  const [filteredShipments, setFilteredShipments] = useState<{ active: any[], completed: any[] }>({ active: [], completed: [] });

  // Sync live data to state when it arrives
  useEffect(() => {
    if (liveData && liveData.length > 0) {
      const formatted = {
        active: liveData.filter((s: any) => s.status !== 'Delivered').map((s: any) => ({
          id: s.shipmentId,
          origin: s.shipmentDetails?.origin || '',
          destination: s.shipmentDetails?.destination || '',
          status: s.status,
          eta: s.estimatedDelivery,
          carrier: s.carrier,
          value: s.shipmentDetails?.value || '',
          container: s.trackingNumber
        })),
        completed: liveData.filter((s: any) => s.status === 'Delivered').map((s: any) => ({
          id: s.shipmentId,
          origin: s.shipmentDetails?.origin || '',
          destination: s.shipmentDetails?.destination || '',
          status: s.status,
          eta: s.estimatedDelivery,
          carrier: s.carrier,
          value: s.shipmentDetails?.value || '',
          container: s.trackingNumber
        }))
      };
      setFilteredShipments(formatted);
    }
  }, [liveData]);

  // Helper to get current source of truth for filtering logic
  const currentShipments = (liveData && liveData.length > 0) ? {
    active: liveData.filter((s: any) => s.status !== 'Delivered').map((s: any) => ({
      id: s.shipmentId,
      origin: s.shipmentDetails?.origin || '',
      destination: s.shipmentDetails?.destination || '',
      status: s.status,
      eta: s.estimatedDelivery,
      carrier: s.carrier,
      value: s.shipmentDetails?.value || '',
      container: s.trackingNumber,
      progress: (() => {
        try {
          // Calculate progress based on Time Elasped
          const start = s.createdAt || Date.now();
          const end = new Date(s.estimatedDelivery).getTime();
          const now = Date.now();

          if (!end || isNaN(end)) return 25; // Default if no valid ETA
          if (now >= end) return 100;
          if (now <= start) return 5;

          const totalDuration = end - start;
          const elapsed = now - start;
          // Clamp between 5% and 95% while in transit
          const p = Math.round((elapsed / totalDuration) * 100);
          return Math.max(5, Math.min(95, p));
        } catch (e) {
          return 25;
        }
      })()
    })),
    completed: liveData.filter((s: any) => s.status === 'Delivered').map((s: any) => ({
      id: s.shipmentId,
      origin: s.shipmentDetails?.origin || '',
      destination: s.shipmentDetails?.destination || '',
      status: s.status,
      eta: s.estimatedDelivery,
      carrier: s.carrier,
      value: s.shipmentDetails?.value || '',
      container: s.trackingNumber
    }))
  } : { active: [], completed: [] };

  // Search filters configuration
  const searchFilters = [
    {
      key: 'carrier',
      label: 'Carrier',
      type: 'select' as const,
      options: [
        { value: 'Maersk Line', label: 'Maersk Line', count: 1 },
        { value: 'COSCO Shipping', label: 'COSCO Shipping', count: 1 },
        { value: 'MSC', label: 'MSC', count: 1 },
        { value: 'Hapag-Lloyd', label: 'Hapag-Lloyd', count: 1 },
        { value: 'ONE', label: 'ONE', count: 1 },
        { value: 'Emirates Shipping', label: 'Emirates Shipping', count: 1 }
      ]
    },
    {
      key: 'status',
      label: 'Status',
      type: 'multiselect' as const,
      options: [
        { value: 'In Transit', label: 'In Transit', count: 1 },
        { value: 'Customs Clearance', label: 'Customs Clearance', count: 1 },
        { value: 'Loading', label: 'Loading', count: 1 },
        { value: 'Booking Confirmed', label: 'Booking Confirmed', count: 1 },
        { value: 'Delivered', label: 'Delivered', count: 2 }
      ]
    },
    {
      key: 'value',
      label: 'Shipment Value (£)',
      type: 'range' as const
    },
    {
      key: 'eta',
      label: 'ETA',
      type: 'date' as const
    }
  ];

  const handleSearch = (searchTerm: string, filters: Record<string, any>) => {
    let filtered: any = { ...currentShipments };

    // Apply search term
    if (searchTerm) {
      Object.keys(filtered).forEach(tab => {
        filtered[tab] = filtered[tab].filter((shipment: any) =>
          Object.values(shipment).some(value =>
            String(value).toLowerCase().includes(searchTerm.toLowerCase())
          )
        );
      });
    }

    // Apply filters
    Object.keys(filtered).forEach(tab => {
      filtered[tab] = filtered[tab].filter((shipment: any) => {
        return Object.entries(filters).every(([key, value]) => {
          if (!value) return true;

          switch (key) {
            case 'carrier':
              return shipment.carrier === value;
            case 'status':
              return Array.isArray(value) ? value.includes(shipment.status) : shipment.status === value;
            case 'value':
              const shipmentValue = parseCurrencyString(shipment.value);
              const min = value.min ? parseFloat(value.min) : 0;
              const max = value.max ? parseFloat(value.max) : Infinity;
              return shipmentValue >= min && shipmentValue <= max;
            case 'eta':
              return shipment.eta === value;
            default:
              return true;
          }
        });
      });
    });

    setFilteredShipments(filtered);
  };

  const handleClearSearch = () => {
    setFilteredShipments(currentShipments);
  };

  const openTrackingHub = () => {
    const firstShipment = filteredShipments.active[0] || filteredShipments.completed[0];
    if (!firstShipment) {
      toast.error("No shipments available for tracking");
      return;
    }

    setActiveTab(firstShipment.status === 'Delivered' ? 'completed' : 'active');
    setSheetMode('tracking');
    setSelectedShipment(firstShipment);
  };

  const shipmentColumns = [
    { key: 'id' as keyof ShipmentRow, header: 'Shipment ID', sortable: true, mono: true },
    {
      key: 'origin' as keyof ShipmentRow,
      header: 'Route',
      sortable: true,
      render: (value: string, row: ShipmentRow) => (
        <span className="text-sm">
          <div className="font-medium">{row.origin}</div>
          <div className="text-gray-500">→ {row.destination}</div>
        </span>
      )
    },
    { key: 'carrier' as keyof ShipmentRow, header: 'Carrier', sortable: true },
    {
      key: 'status' as keyof ShipmentRow,
      header: 'Status',
      sortable: true,
      render: (value: string) => <StatusBadge status={value} />
    },
    { key: 'eta' as keyof ShipmentRow, header: 'ETA', sortable: true },
    {
      key: 'value' as keyof ShipmentRow,
      header: 'Value',
      sortable: true,
      render: (value: string) => <span className="font-semibold text-gray-900">{formatCurrency(value)}</span>
    },
    {
      key: 'container' as keyof ShipmentRow,
      header: 'Actions',
      render: (value: string, row: ShipmentRow) => (
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => {
            setSheetMode('details');
            setSelectedShipment(row);
          }}>View</Button>
          {activeTab === 'active' && (
            <Button variant="outline" size="sm" onClick={() => {
              setSheetMode('tracking');
              setSelectedShipment(row);
            }}>Track</Button>
          )}
        </div>
      )
    },
  ];

  // --- REPORTING HANDLER ---
  const handleEmailReport = async () => {
    if (!selectedShipment) return;

    // Check local state recipient email, which defaults to user login
    if (!recipientEmail) {
      toast.error("Please enter a recipient email address");
      return;
    }

    const toastId = toast.loading(`Sending report to ${recipientEmail}...`);
    setEmailing(true);

    const seed = selectedShipment.id.split('').reduce((a: any, c: any) => a + c.charCodeAt(0), 0);
    const riskScore = (seed % 100);

    try {
      await sendReport({
        shipmentId: selectedShipment.id,
        email: recipientEmail,
        riskScore
      });
      toast.dismiss(toastId);
      toast.success(`Report sent to ${recipientEmail}`);
    } catch (e: any) {
      toast.dismiss(toastId);
      toast.error("Failed to send report");
      console.error(e);
    } finally {
      setEmailing(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Shipments Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-4">

        <MediaCardHeader
          title="Active Shipments"
          subtitle="Shipments"
          description="Track and manage all your active freight shipments globally."
          backgroundImage="/shipments-bg.jpg"
          overlayOpacity={0.5}
          className="mb-8"
        />

        {/* Action Toolbar */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex items-center space-x-8">
              <button
                onClick={() => setActiveTab('active')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'active'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Active Shipments ({filteredShipments.active.length})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'completed'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Completed Shipments ({filteredShipments.completed.length})
              </button>
              <button
                type="button"
                onClick={openTrackingHub}
                className="py-2 px-1 border-b-2 border-transparent text-sm font-medium text-gray-600 hover:text-primary hover:border-primary/40 transition-colors"
              >
                Tracking Hub
              </button>
            </nav>
          </div>
        </div>

        {/* Actions Bar (Moved above/merged conceptually, but keeping layout) */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {activeTab === 'active' ? 'Active' : 'Completed'} Shipments
            <span className="text-sm text-gray-500 ml-2">
              ({filteredShipments[activeTab as keyof typeof filteredShipments].length} results)
            </span>
          </h2>

          <div className="flex items-center gap-3">
            {/* Usage Indicator for Free Plan */}
            {!hasPredictiveInsights && (
              <div className="flex items-center mr-2">
                <div className="text-xs text-gray-500 mr-2">
                  <span className="font-medium text-gray-900">{filteredShipments.active.length}</span>
                  /5 Free
                </div>
                <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${filteredShipments.active.length >= 5 ? 'bg-red-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min(100, (filteredShipments.active.length / 5) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Filter Buttons */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={`relative ${showFilters ? 'bg-gray-100' : ''}`}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707v4.586l-4-2v-2.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
                {Object.keys(activeFilters).length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center border-2 border-white shadow-sm">
                    {Object.keys(activeFilters).length}
                  </span>
                )}
              </Button>

              {(searchTerm || Object.keys(activeFilters).length > 0) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setActiveFilters({});
                    setShowFilters(false);
                    handleClearSearch();
                  }}
                  className="text-gray-500 hover:text-gray-900"
                >
                  Clear check
                </Button>
              )}
            </div>

            <Button variant="outline" size="sm">Export</Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSimulateTraffic}
              disabled={simulating}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Play className={`w-4 h-4 mr-2 ${simulating ? 'animate-spin' : ''}`} />
              {simulating ? "Simulating..." : "Simulate Traffic"}
            </Button>
            <Button
              size="sm"
              onClick={handleCreateTestShipment}
              disabled={!hasPredictiveInsights && filteredShipments.active.length >= 5}
              className={!hasPredictiveInsights && filteredShipments.active.length >= 5 ? "opacity-50 cursor-not-allowed" : ""}
            >
              {!hasPredictiveInsights && filteredShipments.active.length >= 5 ? "Limit Reached" : "New Shipment"}
            </Button>
          </div>
        </div>

        {/* Shipments Table with Integrated Search & Filter */}
        <DataTable
          data={filteredShipments[activeTab as keyof typeof filteredShipments]}
          columns={shipmentColumns}
          rowKey="id"
          searchPlaceholder="Search all shipments (ID, route, carrier, container)"
          rowsPerPage={10}

          // Controlled Search
          searchValue={searchTerm}
          onSearchChange={(val) => {
            setSearchTerm(val);
            handleSearch(val, activeFilters);
          }}

          // Filter Panel Content
          filterPanel={showFilters && (
            <div className="border-t border-gray-200 pt-4 mt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {searchFilters.map((filter) => (
                  <div key={filter.key}>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      {filter.label}
                    </label>
                    {filter.type === 'select' && (
                      <Select
                        value={activeFilters[filter.key] || ''}
                        onValueChange={(value) => handleFilterChange(filter.key, value === "all" ? "" : value)}
                      >
                        <SelectTrigger className="w-full bg-white">
                          <SelectValue placeholder={`All ${filter.label}`} />
                        </SelectTrigger>
                        <SelectContent className="z-[99999]">
                          <SelectItem value="all">All {filter.label}</SelectItem>
                          {filter.options?.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {filter.type === 'multiselect' && (
                      <div className="space-y-1.5 max-h-32 overflow-y-auto">
                        {filter.options?.map((option) => (
                          <label key={option.value} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                            <input
                              type="checkbox"
                              checked={(activeFilters[filter.key] as string[] || [])?.includes(option.value)}
                              onChange={(e) => {
                                const current = activeFilters[filter.key] as string[] || [];
                                const next = e.target.checked
                                  ? [...current, option.value]
                                  : current.filter(v => v !== option.value);
                                handleFilterChange(filter.key, next);
                              }}
                              className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                            />
                            <span className="text-sm text-gray-700">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    {filter.type === 'range' && (
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          className="h-9"
                          value={activeFilters[filter.key]?.min || ''}
                          onChange={(e) => handleFilterChange(filter.key, { ...activeFilters[filter.key], min: e.target.value })}
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          className="h-9"
                          value={activeFilters[filter.key]?.max || ''}
                          onChange={(e) => handleFilterChange(filter.key, { ...activeFilters[filter.key], max: e.target.value })}
                        />
                      </div>
                    )}
                    {filter.type === 'date' && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !activeFilters[filter.key] && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {activeFilters[filter.key] ? (
                              format(new Date(activeFilters[filter.key]), "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={activeFilters[filter.key] ? new Date(activeFilters[filter.key]) : undefined}
                            onSelect={(date) => handleFilterChange(filter.key, date ? format(date, "yyyy-MM-dd") : "")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        />






        {/* Shipment Details & Risk Analysis Sheet */}
        <Sheet open={!!selectedShipment} onOpenChange={(open) => !open && setSelectedShipment(null)}>
          <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto p-6">
            <SheetHeader>
              <SheetTitle>
                {sheetMode === 'details' ? 'Shipment Details' : 'Live Tracking & Analysis'}
              </SheetTitle>
              <SheetDescription>
                {sheetMode === 'details'
                  ? `Comprehensive manifesto for ${selectedShipment?.id}`
                  : `Real-time geospatial insights for ${selectedShipment?.id}`
                }
              </SheetDescription>
            </SheetHeader>

            {selectedShipment && (
              <div className="py-6 space-y-8">

                {/* SHARED: Basic Route Header */}
                <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center border border-gray-100">
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Origin</div>
                    <div className="font-semibold text-gray-900">{selectedShipment.origin}</div>
                  </div>
                  <div className="text-gray-300">→</div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Destination</div>
                    <div className="font-semibold text-gray-900">{selectedShipment.destination}</div>
                  </div>
                </div>

                {/* MODE: DETAILS */}
                {sheetMode === 'details' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                      <div>
                        <span className="text-gray-500 block mb-1">Status</span>
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${selectedShipment.status === 'Delivered' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>{selectedShipment.status}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block mb-1">Carrier</span>
                        <span className="font-medium text-gray-900">{selectedShipment.carrier}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block mb-1">Container ID</span>
                        <span className="font-mono text-gray-900">{selectedShipment.container || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block mb-1">Value</span>
                        <div className="space-y-1">
                          <span className="font-semibold text-gray-900 block">{selectedShipment.value ? formatCurrency(selectedShipment.value) : 'N/A'}</span>
                          {selectedShipment.value && (
                            <div className="flex gap-2 text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                              <span>≈ {formatCurrency(convertCurrency(parseCurrencyString(selectedShipment.value), 'GBP', 'USD'), 'USD')}</span>
                              <span>≈ {formatCurrency(convertCurrency(parseCurrencyString(selectedShipment.value), 'GBP', 'EUR'), 'EUR')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500 block mb-1">ETA</span>
                        <span className="font-medium text-gray-900">{selectedShipment.eta || 'Pending'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block mb-1">Service Type</span>
                        <span className="font-medium text-gray-900">FCL (Full Container Load)</span>
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h4 className="font-semibold mb-4 text-sm">Associated Documents</h4>
                      <div className="space-y-2">
                        {['Bill of Lading', 'Commercial Invoice', 'Packing List'].map(doc => (
                          <div key={doc} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                            <div className="flex items-center">
                              <span className="text-lg mr-3">📄</span>
                              <span className="text-sm font-medium text-gray-700">{doc}</span>
                            </div>
                            <span className="text-xs text-blue-600 font-medium">Download</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* MODE: TRACKING */}
                {sheetMode === 'tracking' && (
                  <div className="space-y-6">
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Tracking Overview</h4>
                      <p className="text-sm text-gray-600">
                        Route: <span className="font-medium text-gray-900">{selectedShipment.origin}</span> to{" "}
                        <span className="font-medium text-gray-900">{selectedShipment.destination}</span>
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Current status: <span className="font-medium text-gray-900">{selectedShipment.status}</span>
                      </p>
                    </div>

                    {/* AI Risk Analysis Widget - GATED */}
                    {hasPredictiveInsights ? (
                      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-semibold text-slate-900 flex items-center">
                            <Sparkles className="w-4 h-4 text-purple-600 mr-2" />
                            Predictive Risk Analysis
                          </h3>
                          <span className="text-xs text-slate-500">Confidence: 94%</span>
                        </div>

                        <RiskMeter shipmentId={selectedShipment.id} />

                        <div className="mt-4 space-y-3">
                          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Risk Factors Detected</h4>
                          <div className="flex items-start space-x-3 text-sm bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                            <div className="mt-0.5">⚠️</div>
                            <div>
                              <p className="font-medium text-slate-800">Port Congestion at {selectedShipment.destination.split(',')[0]}</p>
                              <p className="text-slate-500 text-xs mt-0.5">Average dwell time increased by 48h in last 2 days.</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3 text-sm bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                            <div className="mt-0.5">🌦️</div>
                            <div>
                              <p className="font-medium text-slate-800">Weather Alert: Atlantic Route</p>
                              <p className="text-slate-500 text-xs mt-0.5">Minor deviation expected due to storm front.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 opacity-90 relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center text-center p-4">
                          <span className="text-4xl mb-2">🔮</span>
                          <h4 className="text-lg font-bold text-slate-900 mb-1">Predictive Insights Locked</h4>
                          <p className="text-sm text-slate-600 mb-4 max-w-[200px]">Upgrade to Pro to foresee delays and mitigate risks with AI.</p>
                          <Button asChild size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600 border-0">
                            <Link to="/payments?tab=subscription">Upgrade to Pro</Link>
                          </Button>
                        </div>
                        <div className="blur-sm select-none pointer-events-none" aria-hidden="true">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-slate-900 flex items-center">
                              <Sparkles className="w-4 h-4 text-purple-600 mr-2" />
                              Predictive Risk Analysis
                            </h3>
                          </div>
                          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden" />
                          <div className="mt-4 space-y-3">
                            <div className="h-16 bg-white rounded-lg border border-slate-100" />
                            <div className="h-16 bg-white rounded-lg border border-slate-100" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Share Analysis Section */}
                    <div className="space-y-3 pt-4 border-t border-gray-100">
                      <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Share Analysis Report
                      </Label>
                      <div className="flex w-full items-center space-x-2">
                        <Input
                          type="email"
                          placeholder="recipient@example.com"
                          value={recipientEmail}
                          onChange={(e) => setRecipientEmail(e.target.value)}
                          className="h-10"
                        />
                        <Button
                          className="h-10 px-4 shrink-0"
                          onClick={handleEmailReport}
                          disabled={emailing}
                        >
                          {emailing ? (
                            <span className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          ) : (
                            <Mail className="w-4 h-4" />
                          )}
                          <span className="ml-2 hidden sm:inline">Send</span>
                        </Button>
                      </div>
                      <p className="text-[10px] text-gray-400">
                        Export this live risk assessment to clients or stakeholders.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* Plan Limit Reached Dialog */}
        <Dialog open={limitDialogOpen} onOpenChange={setLimitDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Monthly Shipment Limit Reached</DialogTitle>
              <DialogDescription>
                You have reached your limit of 5 shipments per month on the Free plan.
                <br /><br />
                Upgrade to <strong>Pro</strong> for unlimited shipments, advanced analytics, and priority support.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLimitDialogOpen(false)}>Cancel</Button>
              <Button asChild className="bg-gradient-to-r from-purple-600 to-blue-600 border-0">
                <Link to="/payments?tab=subscription">Upgrade to Pro</Link>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
};

// Simple Risk Meter Component
function RiskMeter({ shipmentId }: { shipmentId: string }) {
  // Deterministic random based on ID char codes
  const seed = shipmentId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const riskScore = (seed % 100);

  let level = 'Low';
  let color = 'bg-green-500';
  let text = 'text-green-700';
  let bg = 'bg-green-50';

  if (riskScore > 40) {
    level = 'Medium';
    color = 'bg-yellow-500';
    text = 'text-yellow-700';
    bg = 'bg-yellow-50';
  }
  if (riskScore > 75) {
    level = 'High';
    color = 'bg-red-500';
    text = 'text-red-700';
    bg = 'bg-red-50';
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className={`text-2xl font-bold ${text}`}>{riskScore}%</span>
        <span className={`px-2 py-1 rounded text-xs font-medium ${bg} ${text}`}>{level} Risk</span>
      </div>
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-1000 ease-out`}
          style={{ width: `${riskScore}%` }}
        />
      </div>
    </div>
  );
}




export default ShipmentsPage;
