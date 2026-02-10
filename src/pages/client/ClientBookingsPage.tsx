import React, { useState } from 'react';
import MediaCardHeader from '@/components/ui/media-card-header';
import DataTable from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { useQuery, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
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

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import QuoteRequestForm from '@/components/forms/QuoteRequestForm';
import { toast } from 'sonner';
import { useStripeCheckout } from '@/hooks/useStripeCheckout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

import { useAuth } from "@clerk/clerk-react";

// ...

const ClientBookingsPage = () => {
    const { orgId } = useAuth();
    const bookings = useQuery(api.bookings.listBookings, { orgId: orgId ?? null }) || [];
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    // const createCheckout = useAction(api.billing.createCheckoutSession);

    const handleCreateBooking = (data: any) => {

        toast.success("Booking request submitted successfully!");
        setIsCreateOpen(false);
    };

    const { startCheckout } = useStripeCheckout();

    const handlePay = (bookingId: string) => {
        const invoiceId = `INV-${bookingId}`;
        startCheckout(invoiceId);
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const styles: Record<string, string> = {
            confirmed: 'bg-green-100 text-green-800',
            pending: 'bg-yellow-100 text-yellow-800',
            cancelled: 'bg-red-100 text-red-800',
            in_transit: 'bg-blue-100 text-blue-800',
            delivered: 'bg-gray-100 text-gray-800',
        };
        const style = styles[status] || 'bg-gray-100 text-gray-800';

        return (
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${style}`}>
                {status}
            </span>
        );
    };

    const columns = [
        {
            key: 'bookingId',
            header: 'Booking ID',
            sortable: true,
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
                                <DrawerTitle>Booking {row.bookingId}</DrawerTitle>
                                <DrawerDescription>
                                    Quote {row.quoteId} · {row.status}
                                </DrawerDescription>
                            </DrawerHeader>

                            <div className="p-4 space-y-6">
                                <section className="space-y-3">
                                    <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Booking Details</h3>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-6 text-sm">
                                        <div>
                                            <span className="block text-gray-500 text-xs mb-1">Status</span>
                                            <span className="capitalize">{row.status}</span>
                                        </div>
                                        <div>
                                            <span className="block text-gray-500 text-xs mb-1">Quote ID</span>
                                            <span className="font-mono text-[10px] break-all block text-gray-600">{row.quoteId}</span>
                                        </div>
                                        <div className="col-span-2 space-y-4">
                                            <div className="border-t pt-4">
                                                <span className="block text-gray-500 text-xs mb-1">Carrier & Service</span>
                                                <div className="flex items-center gap-2">
                                                    {row.carrierLogo && (
                                                        <img src={row.carrierLogo} alt="" className="w-6 h-6 object-contain" />
                                                    )}
                                                    <div>
                                                        <div className="font-medium text-gray-900">{row.carrierName || 'Standard Freight'}</div>
                                                        <div className="text-[10px] text-gray-500">{row.serviceType || 'Standard Service'}</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <span className="block text-gray-500 text-xs mb-1">Created Date</span>
                                                <div className="text-gray-900">{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'}</div>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-3">
                                    <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Financials</h3>
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex items-center justify-between gap-4">
                                        <div className="shrink-0">
                                            <div className="font-medium text-gray-900">Total Cost</div>
                                            <div className="text-xs text-gray-500">
                                                {row.status === 'confirmed' ? 'Paid' : 'Ready for payment'}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 justify-end min-w-0">
                                            <div className="font-bold text-gray-900 text-right leading-tight break-words">
                                                {row.price
                                                    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: row.price.currency || 'USD' }).format(row.price.amount)
                                                    : <span className="text-sm">Calculated<br />at Checkout</span>
                                                }
                                            </div>
                                            {row.status !== 'confirmed' && (
                                                <Button
                                                    onClick={() => handlePay(row.bookingId)}
                                                    size="sm"
                                                    className="bg-primary hover:bg-primary/90 text-white shadow-sm h-9 px-4 shrink-0"
                                                >
                                                    Secure Booking
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-3">
                                    <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Customer Details</h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="col-span-1">
                                            <span className="block text-gray-500 text-xs mb-1">Name</span>
                                            <div className="font-medium truncate">{row.customerDetails?.name || '-'}</div>
                                        </div>
                                        <div className="col-span-1">
                                            <span className="block text-gray-500 text-xs mb-1">Company</span>
                                            <div className="truncate">{row.customerDetails?.company || '-'}</div>
                                        </div>
                                        <div className="col-span-2 space-y-4 pt-2 border-t mt-2">
                                            <div>
                                                <span className="block text-gray-500 text-xs mb-1">Email Address</span>
                                                <div className="break-all font-medium text-primary">{row.customerDetails?.email || '-'}</div>
                                            </div>
                                            <div>
                                                <span className="block text-gray-500 text-xs mb-1">Phone Number</span>
                                                <div className="text-gray-900">{row.customerDetails?.phone || '-'}</div>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-3">
                                    <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Pickup</h3>
                                    <div className="text-sm">
                                        <div>{row.pickupDetails?.address || '-'}</div>
                                        <div className="text-gray-500 text-xs">{row.pickupDetails?.date} · {row.pickupDetails?.timeWindow}</div>
                                    </div>
                                </section>

                                <section className="space-y-3">
                                    <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Delivery</h3>
                                    <div className="text-sm">
                                        <div>{row.deliveryDetails?.address || '-'}</div>
                                        <div className="text-gray-500 text-xs">{row.deliveryDetails?.date} · {row.deliveryDetails?.timeWindow}</div>
                                    </div>
                                </section>

                                {row.specialInstructions && (
                                    <section className="space-y-3">
                                        <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Special Instructions</h3>
                                        <div className="text-sm text-gray-700">{row.specialInstructions}</div>
                                    </section>
                                )}
                            </div>

                            <DrawerFooter className="border-t">
                                <DrawerClose asChild>
                                    <Button variant="outline">Close</Button>
                                </DrawerClose>
                            </DrawerFooter>
                        </div>
                    </DrawerContent>
                </Drawer>
            )
        },
        { key: 'quoteId', header: 'Quote ID', sortable: true },
        {
            key: 'status',
            header: 'Status',
            sortable: true,
            render: (value: string) => <StatusBadge status={value} />
        },
        {
            key: 'pickupDetails',
            header: 'Pickup',
            render: (_: any, row: any) => row.pickupDetails?.address || '-'
        },
        {
            key: 'deliveryDetails',
            header: 'Delivery',
            render: (_: any, row: any) => row.deliveryDetails?.address || '-'
        },
        {
            key: 'createdAt',
            header: 'Created',
            sortable: true,
            render: (value: number) => value ? new Date(value).toLocaleDateString() : '-'
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="px-4 sm:px-6 lg:px-8 py-4">
                <MediaCardHeader
                    title="My Bookings"
                    subtitle="Confirmed Shipments"
                    description="View and manage your confirmed bookings."
                    backgroundImage="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
                    overlayOpacity={0.6}
                    className="mb-8"
                />
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                        All Bookings
                        <span className="text-sm text-gray-500 ml-2">
                            ({bookings.length})
                        </span>
                    </h2>
                    <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <SheetTrigger asChild>
                            <Button>New Booking</Button>
                        </SheetTrigger>
                        <SheetContent className="w-[100%] sm:max-w-xl overflow-y-auto p-6">
                            <SheetHeader className="mb-6">
                                <SheetTitle>Create New Shipment</SheetTitle>
                            </SheetHeader>
                            <QuoteRequestForm
                                onSubmit={handleCreateBooking}
                                onCancel={() => setIsCreateOpen(false)}
                            />
                        </SheetContent>
                    </Sheet>
                </div>

                {bookings.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg border border-gray-200 shadow-sm">
                        <div className="text-4xl mb-4">🚢</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Bookings Yet</h3>
                        <p className="text-gray-500 mb-6">Create your first shipment booking to get started.</p>
                        <Button onClick={() => setIsCreateOpen(true)}>
                            Create Shipment
                        </Button>
                    </div>
                ) : (
                    <DataTable
                        data={bookings}
                        columns={columns as any}
                        searchPlaceholder="Search bookings..."
                        rowsPerPage={10}
                    />
                )}
            </div>
        </div>
    );
};

export default ClientBookingsPage;
