import React, { useMemo, useState, useEffect } from 'react';
import { StatusBadge } from '@/components/ui/status-badge';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import MediaCardHeader from '@/components/ui/media-card-header';
import DataTable from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import Footer from '@/components/layout/Footer';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@clerk/clerk-react";
import { useStickyQueryData } from "@/hooks/useStickyQueryData";
import QuoteRequestForm from '@/components/forms/QuoteRequestForm';
import LiveRateComparison from '@/components/shipping/LiveRateComparison';
import QuoteResultsView from '@/components/shipping/QuoteResultsView';
import { type RateRequest } from '@/services/carriers';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger
} from '@/components/ui/drawer';
import { toast } from 'sonner';
import PriceBreakdownTable from '@/components/shipping/PriceBreakdownTable';

// Internal helper for the seed button - Moved to top to avoid hoisting issues
// Internal helper for the seed button - Moved to top to avoid hoisting issues

type Quote = any;

import { formatCurrency, convertCurrency } from '@/lib/currency';

// GPS coordinates for common shipping cities
function getCityCoordinates(cityOrOrigin?: string): { lat: number; lng: number } {
    const city = (cityOrOrigin || '').toLowerCase();
    const cityCoords: Record<string, { lat: number; lng: number }> = {
        'london': { lat: 51.5074, lng: -0.1278 },
        'hamburg': { lat: 53.5511, lng: 9.9937 },
        'rotterdam': { lat: 51.9225, lng: 4.4792 },
        'new york': { lat: 40.7128, lng: -74.0060 },
        'shanghai': { lat: 31.2304, lng: 121.4737 },
        'singapore': { lat: 1.3521, lng: 103.8198 },
        'tokyo': { lat: 35.6762, lng: 139.6503 },
        'los angeles': { lat: 34.0522, lng: -118.2437 },
        'dubai': { lat: 25.2048, lng: 55.2708 },
        'paris': { lat: 48.8566, lng: 2.3522 },
        'frankfurt': { lat: 50.1109, lng: 8.6821 },
        'hong kong': { lat: 22.3193, lng: 114.1694 },
    };
    for (const [key, coords] of Object.entries(cityCoords)) {
        if (city.includes(key)) return coords;
    }
    return { lat: 51.5074, lng: -0.1278 };
}


import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const BookingDialog = ({ quote, selectedCarrier }: { quote: any, selectedCarrier: any }) => {
    const createBooking = useMutation(api.bookings.createBooking);
    const upsertShipment = useMutation(api.shipments.upsertShipment);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    // DFF: Checkout Integrations
    const [addCustoms, setAddCustoms] = useState(false);
    const [addInsurance, setAddInsurance] = useState(false);

    const basePrice = selectedCarrier.price?.amount || selectedCarrier.cost || selectedCarrier.amount || 0;
    const customsFee = 150;
    const insuranceFee = Math.round(basePrice * 0.015) + 50; // 1.5% + $50 base

    const totalPrice = basePrice + (addCustoms ? customsFee : 0) + (addInsurance ? insuranceFee : 0);

    const handleBook = async () => {
        setLoading(true);
        try {
            const contact = quote.contactInfo || {
                name: 'Guest User',
                email: 'guest@example.com',
                phone: 'N/A',
                company: 'N/A'
            };

            const notes = [];
            if (addCustoms) notes.push("Service: Customs Brokerage");
            if (addInsurance) notes.push("Service: Cargo Insurance");

            const additionalFees = [];
            if (addCustoms) additionalFees.push({ description: "Customs Brokerage", amount: customsFee });
            if (addInsurance) additionalFees.push({ description: "Cargo Insurance", amount: insuranceFee });

            const bookingRes = await createBooking({
                quoteId: quote.quoteId,
                carrierQuoteId: selectedCarrier.carrierId || `carrier_${Date.now()}`,
                customerDetails: {
                    name: contact.name || 'Guest',
                    email: contact.email || 'guest@example.com',
                    phone: contact.phone || 'N/A',
                    company: contact.company || 'N/A',
                },
                pickupDetails: {
                    address: quote.origin || 'Origin',
                    date: new Date().toISOString(),
                    timeWindow: '09:00-17:00',
                    contactPerson: contact.name || 'Guest',
                    contactPhone: contact.phone || 'N/A',
                },
                deliveryDetails: {
                    address: quote.destination || 'Destination',
                    date: new Date(Date.now() + 5 * 86400000).toISOString(),
                    timeWindow: '09:00-17:00',
                    contactPerson: contact.name || 'Guest',
                    contactPhone: contact.phone || 'N/A',
                },
                specialInstructions: notes.join(", ") || "Standard handling",
                additionalFees: additionalFees.length > 0 ? additionalFees : undefined,
            });

            // Optimistic ID if backend doesn't return one immediately (for upsertShipment)
            const shipmentId = bookingRes?.bookingId || `SHP-${Date.now()}`;

            await upsertShipment({
                shipmentId,
                tracking: {
                    status: 'pending',
                    currentLocation: {
                        city: quote.origin || 'London',
                        state: '',
                        country: 'UK',
                        coordinates: getCityCoordinates(quote.origin),
                    },
                    estimatedDelivery: new Date(Date.now() + 5 * 86400000).toISOString(),
                    carrier: selectedCarrier.carrierName || selectedCarrier.carrierId || 'Selected Carrier',
                    trackingNumber: `TBA-${shipmentId}`,
                    service: selectedCarrier.serviceType || quote.serviceType || 'Standard',
                    shipmentDetails: {
                        weight: quote.weight || '',
                        dimensions: `${quote.dimensions?.length || ''}x${quote.dimensions?.width || ''}x${quote.dimensions?.height || ''}`,
                        origin: quote.origin || '',
                        destination: quote.destination || '',
                        value: quote.value || '',
                    },
                    // riskLevel: (addInsurance ? 'low' : 'medium') as any, 
                    // customs: addCustoms ? { filingStatus: 'pending', brokerName: 'freightcode customs' } : undefined,
                    events: [
                        {
                            timestamp: new Date().toISOString(),
                            status: 'Shipment created',
                            location: quote.origin || 'Origin',
                            description: `Booking confirmed with ${selectedCarrier.carrierName || 'Carrier'}`,
                        },
                    ],
                },
            });

            toast.success(`Booking confirmed!`);
            navigate('/bookings');
        } catch (e) {
            console.error(e);
            toast.error("Failed to create booking");
        } finally {
            setLoading(false);
            setOpen(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="h-8 px-3 text-xs">Book</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Confirm Booking</DialogTitle>
                    <DialogDescription>
                        Review details and add operational services.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">

                    <div className="flex flex-col text-sm">
                        <span className="text-gray-500 mb-1">Base Price</span>
                        <span className="font-bold text-lg text-primary">{formatCurrency(basePrice, selectedCarrier.price?.currency)}</span>
                        <div className="flex gap-2 text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-1">
                            <span>≈ {formatCurrency(convertCurrency(basePrice, selectedCarrier.price?.currency || 'USD', 'GBP'), 'GBP')}</span>
                            <span>≈ {formatCurrency(convertCurrency(basePrice, selectedCarrier.price?.currency || 'USD', 'EUR'), 'EUR')}</span>
                        </div>
                    </div>

                    <div className="space-y-4 border-t pt-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="customs" checked={addCustoms} onCheckedChange={(c) => setAddCustoms(!!c)} />
                            <div className="grid gap-1.5 leading-none">
                                <Label htmlFor="customs" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Add Customs Brokerage (+${customsFee})
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    Includes ISF filing and Entry Summary.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox id="insurance" checked={addInsurance} onCheckedChange={(c) => setAddInsurance(!!c)} />
                            <div className="grid gap-1.5 leading-none">
                                <Label htmlFor="insurance" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Add Cargo Insurance (+${insuranceFee})
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    Full value protection against loss/damage.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center text-lg font-bold border-t pt-4 mt-2">
                        <span>Total Estimate</span>
                        <span>{formatCurrency(totalPrice, selectedCarrier.price?.currency)}</span>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" onClick={handleBook} disabled={loading}>
                        {loading ? 'Confirming...' : 'Confirm & Book'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


const ClientQuotesPage = () => {
    const { orgId, isLoaded } = useAuth();
    const navigate = useNavigate();
    const quotesQuery = useQuery(
        api.quotes.listQuotes,
        isLoaded ? { orgId: orgId ?? null } : "skip"
    );
    const quotes = useStickyQueryData(`quotes:${orgId ?? "personal"}`, quotesQuery, []);
    const [searchParams, setSearchParams] = useSearchParams();
    const createBooking = useMutation(api.bookings.createBooking);
    const upsertShipment = useMutation(api.shipments.upsertShipment);

    // Use URL params for persistence
    const viewMode = (searchParams.get('v') as any) || 'list';
    const activeQuoteId = searchParams.get('id');
    const currentStep = parseInt(searchParams.get('s') || '1');

    const [activeQuote, setActiveQuote] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch active quote if ID is in URL but not in state
    const fetchedActiveQuote = useQuery(api.quotes.getQuote,
        activeQuoteId ? { quoteId: activeQuoteId } : "skip" as any
    );

    useEffect(() => {
        if (fetchedActiveQuote && !activeQuote) {
            setActiveQuote(fetchedActiveQuote);
        }
    }, [fetchedActiveQuote, activeQuote]);

    const createQuote = useMutation(api.quotes.createQuote);

    const setMode = (mode: string, id?: string, step?: number) => {
        const params: any = { v: mode };
        if (id) params.id = id;
        if (step) params.s = step.toString();
        setSearchParams(params);
    };

    const handleQuoteBooking = async (quote: any, rate: any) => {
        setIsSubmitting(true);
        try {
            const contact = quote.contactInfo || {
                name: 'Guest User',
                email: 'guest@example.com',
                phone: 'N/A',
                company: 'N/A'
            };

            const bookingRes = await createBooking({
                quoteId: quote.quoteId,
                carrierQuoteId: rate.carrierId || `rate_${Date.now()}`, // Fallback if no ID
                customerDetails: {
                    name: contact.name || 'Guest',
                    email: contact.email || 'guest@example.com',
                    phone: contact.phone || 'N/A',
                    company: contact.company || 'N/A',
                },
                pickupDetails: {
                    address: quote.origin || 'Origin',
                    date: new Date().toISOString(),
                    timeWindow: '09:00-17:00',
                    contactPerson: contact.name || 'Guest',
                    contactPhone: contact.phone || 'N/A',
                },
                deliveryDetails: {
                    address: quote.destination || 'Destination',
                    date: new Date(Date.now() + 5 * 86400000).toISOString(),
                    timeWindow: '09:00-17:00',
                    contactPerson: contact.name || 'Guest',
                    contactPhone: contact.phone || 'N/A',
                },
                specialInstructions: "Standard handling"
            });

            const shipmentId = bookingRes?.bookingId || `SHP-${Date.now()}`;
            await upsertShipment({
                shipmentId,
                tracking: {
                    status: 'pending',
                    currentLocation: {
                        city: quote.origin || 'London',
                        state: '',
                        country: 'UK',
                        coordinates: getCityCoordinates(quote.origin),
                    },
                    estimatedDelivery: new Date(Date.now() + 5 * 86400000).toISOString(),
                    carrier: rate.carrierName || rate.carrier,
                    trackingNumber: `TBA-${shipmentId}`,
                    service: rate.serviceType || rate.service || 'Standard',
                    shipmentDetails: {
                        weight: quote.weight || '',
                        dimensions: `${quote.dimensions?.length || ''}x${quote.dimensions?.width || ''}x${quote.dimensions?.height || ''}`,
                        origin: quote.origin || '',
                        destination: quote.destination || '',
                        value: quote.value || '',
                    },
                    events: [
                        {
                            timestamp: new Date().toISOString(),
                            status: 'Shipment created',
                            location: quote.origin || 'Origin',
                            description: `Booking confirmed with ${rate.carrier}`,
                        },
                    ],
                },
            });

            toast.success(`Booking confirmed with ${rate.carrier}!`);
            navigate('/bookings');
        } catch (e) {
            console.error(e);
            toast.error("Failed to create booking");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateQuote = async (formData: any) => {
        setIsSubmitting(true);
        try {
            const requestData = {
                origin: formData.origin,
                destination: formData.destination,
                serviceType: formData.serviceType,
                cargoType: formData.cargoType,
                weight: formData.weight,
                dimensions: formData.dimensions,
                value: formData.value,
                incoterms: formData.incoterms,
                urgency: formData.urgency,
                additionalServices: formData.additionalServices,
                contactInfo: formData.contactInfo,
                quotes: formData.rates || [],
                selectedRate: formData.selectedRate
            };

            const result = await createQuote({ request: requestData });

            setMode('list');
            setSearchParams({ id: result.quoteId });
            toast.success("Quote generated successfully!");
        } catch (error) {
            console.error('Error creating quote:', error);
            toast.error("Failed to generate quote. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const columns: any[] = [
        {
            key: 'quoteId',
            header: 'Quote ID',
            sortable: true,
            mono: true,
            render: (value: string, row: any) => (
                <Drawer direction="right" shouldScaleBackground={false}>
                    <DrawerTrigger asChild>
                        <Button variant="link" className="p-0 h-auto font-medium text-blue-600 hover:underline">
                            {value}
                        </Button>
                    </DrawerTrigger>
                    <DrawerContent className="max-w-md ml-auto h-full rounded-none border-l">
                        <div className="h-full overflow-y-auto">
                            <DrawerHeader>
                                <DrawerTitle>Carrier Quotes</DrawerTitle>
                                <DrawerDescription>
                                    {row.origin} → {row.destination}
                                </DrawerDescription>
                            </DrawerHeader>

                            <div className="p-4 space-y-6">
                                <section className="space-y-3">
                                    <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Shipment Details</h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div><span className="block text-gray-500 text-xs">Service</span>{row.serviceType}</div>
                                        <div><span className="block text-gray-500 text-xs">Cargo</span>{row.cargoType}</div>
                                        <div><span className="block text-gray-500 text-xs">Weight</span>{row.weight} kg</div>
                                        <div><span className="block text-gray-500 text-xs">Incoterms</span>{row.incoterms}</div>
                                    </div>
                                </section>

                                <section className="space-y-3">
                                    <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Carrier Rates</h3>
                                    <div className="space-y-3">
                                        {(row.quotes || []).map((q: any, idx: number) => (
                                            <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-100 group hover:bg-white hover:shadow-sm transition-all">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex-1">
                                                        <div className="font-medium text-gray-900">{q.carrierName}</div>
                                                        <div className="text-xs text-gray-500">{q.serviceType} • {q.transitTime}</div>
                                                    </div>
                                                    <div className="text-right mr-4">
                                                        <div className="font-bold text-gray-900">
                                                            {formatCurrency(q.price?.amount || q.cost || q.amount || 0, q.price?.currency || q.currency)}
                                                        </div>
                                                        <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-0.5">
                                                            ≈ {formatCurrency(convertCurrency(q.price?.amount || q.cost || q.amount || 0, q.price?.currency || q.currency || 'USD', 'GBP'), 'GBP')}
                                                        </div>
                                                    </div>
                                                    <BookingDialog
                                                        quote={row}
                                                        selectedCarrier={q}
                                                    />
                                                </div>

                                                {q.price?.lineItems && (
                                                    <div className="mt-4 pt-4 border-t">
                                                        <details className="group">
                                                            <summary className="text-xs font-semibold text-blue-600 cursor-pointer hover:underline flex items-center">
                                                                <span>View Detailed Price Breakdown</span>
                                                                <span className="ml-2 transition-transform group-open:rotate-180">▼</span>
                                                            </summary>
                                                            <div className="mt-2 text-primary">
                                                                <PriceBreakdownTable
                                                                    lineItems={q.price.lineItems}
                                                                    currency={q.price.currency}
                                                                />
                                                            </div>
                                                        </details>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>

                            <DrawerFooter className="border-t mt-auto">
                                <DrawerClose asChild>
                                    <Button variant="outline" className="w-full">Close</Button>
                                </DrawerClose>
                            </DrawerFooter>
                        </div>
                    </DrawerContent>
                </Drawer>
            )
        },
        {
            key: 'origin',
            header: 'Route',
            render: (_: any, row: any) => (
                <span className="text-sm">
                    <div className="font-medium">{row.origin}</div>
                    <div className="text-gray-500">→ {row.destination}</div>
                </span>
            )
        },
        { key: 'serviceType', header: 'Service' },
        {
            key: 'status',
            header: 'Status',
            sortable: true,
            render: (value: string) => <StatusBadge status={value === 'success' ? 'ready' : value} />
        },
        {
            key: 'createdAt',
            header: 'Date',
            render: (value: number) => new Date(value).toLocaleDateString()
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="px-4 sm:px-6 lg:px-8 py-4">
                <MediaCardHeader
                    title="My Quotes"
                    subtitle="Pricing History"
                    description="View and manage your shipping quotes. converting them to bookings instantly."
                    backgroundImage="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
                    overlayOpacity={0.6}
                    className="mb-8"
                />
                {viewMode === 'create' ? (
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900">New Quote Request</h2>
                            <div className="flex gap-2">
                                <Button variant="ghost" onClick={() => setMode('list')} disabled={isSubmitting}>Cancel</Button>
                            </div>
                        </div>
                        <QuoteRequestForm
                            onSubmit={handleCreateQuote}
                            onCancel={() => setMode('list')}
                            initialStep={currentStep}
                            onStepChange={(step) => setMode('create', undefined, step)}
                        />
                    </div>
                ) : (
                    <>
                        {activeQuoteId && fetchedActiveQuote && (
                            <div className="mb-12 bg-white rounded-xl shadow-xl overflow-hidden">
                                <div className="bg-primary/5 px-6 py-4 border-b border-primary/10 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                                            📋
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">Active Quote: {fetchedActiveQuote.quoteId}</h3>
                                            <p className="text-xs text-gray-500">
                                                {fetchedActiveQuote.origin} → {fetchedActiveQuote.destination} · {fetchedActiveQuote.serviceType}
                                            </p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setSearchParams({ v: 'list' })}>
                                        Dismiss
                                    </Button>
                                </div>
                                <div className="p-6">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-4">Available Rates</h4>
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {(fetchedActiveQuote.quotes || []).map((q: any, idx: number) => (
                                            <div key={idx} className="bg-gray-50 p-4 rounded-md border border-gray-100 hover:border-primary/30 hover:shadow-md transition-all relative group">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <div className="font-bold text-gray-900">{q.carrierName}</div>
                                                        <div className="text-xs text-gray-500">{q.serviceType}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold text-primary text-lg">
                                                            {formatCurrency(q.price?.amount || q.cost || 0, q.price?.currency || 'USD')}
                                                        </div>
                                                        <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                                                            ≈ {formatCurrency(convertCurrency(q.price?.amount || q.cost || 0, q.price?.currency || 'USD', 'GBP'), 'GBP')}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-sm text-gray-600 mb-4 bg-white/50 p-2 rounded">
                                                    Transit: <span className="font-medium">{q.transitTime}</span>
                                                </div>
                                                <BookingDialog
                                                    quote={fetchedActiveQuote}
                                                    selectedCarrier={q}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between items-center mb-8">
                            <div className="space-y-1">
                                <h2 className="text-xl font-semibold text-gray-900">Recent Quotes</h2>
                                <p className="text-sm text-gray-500">Track and manage your shipping requests</p>
                            </div>
                            <Button onClick={() => setMode('create')} className="h-10 px-6">
                                New Quote
                            </Button>
                        </div>

                        <DataTable
                            data={quotes}
                            columns={columns as any}
                            rowKey="quoteId"
                            searchPlaceholder="Search by route, carrier, or ID..."
                            rowsPerPage={10}
                        />
                    </>
                )}
            </div>
            <div className="mt-12">
            </div>
        </div>
    );
};

// Internal helper for the seed button

export default ClientQuotesPage;
