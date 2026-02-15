import React, { useState, useMemo, useEffect } from 'react';
import { StatusBadge } from '@/components/ui/status-badge';
import { Check } from 'lucide-react';
import MediaCardHeader from '@/components/ui/media-card-header';
import DataTable from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { UserProfile, useOrganization, useUser, useClerk } from '@clerk/clerk-react';
import Footer from '@/components/layout/Footer';
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useStripeCheckout } from '@/hooks/useStripeCheckout';
import SubscriptionCards from '@/components/subscription/SubscriptionCards';
import { formatCurrency, convertCurrency } from '@/lib/currency';

const PaymentsPage = () => {
  const { user } = useUser();
  const { organization } = useOrganization();
  // Resolve current tier
  const currentTier = (organization?.publicMetadata?.subscriptionTier as string) || (user?.publicMetadata?.subscriptionTier as string) || 'free';

  const [activeTab, setActiveTab] = useState('invoices');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Live payment data from Convex
  const livePayments = useQuery(api.paymentAttempts.listMyPayments) || [];
  const convexInvoices = useQuery(api.invoices.listMyInvoices) || [];

  // Checkout Action
  // const createCheckout = useAction(api.billing.createCheckoutSession);
  const completeSubscription = useAction(api.payments.completeSubscription);
  const confirmBookingPayment = useMutation(api.bookings.confirmBookingPayment);
  const createSubscriptionSession = useAction(api.subscriptions.createCheckoutSession);

  const handleUpgrade = async (priceId: string, plan: string) => {
    const toastId = toast.loading("Redirecting to checkout...");
    try {
      const { url } = await createSubscriptionSession({ priceId, plan: plan as any });
      if (url) {
        window.location.href = url;
        return; // Don't dismiss toast if redirecting
      }
      toast.dismiss(toastId);
    } catch (e: any) {
      toast.dismiss(toastId);
      console.error("Subscription Error:", e);
      toast.error(`Subscription failed: ${e.message || "Unknown error"}`);
    }
  };
  useEffect(() => {
    // Check for success query param
    const query = new URLSearchParams(window.location.search);
    const success = query.get('success');
    const invoiceId = query.get('invoice_id');
    const sessionId = query.get('session_id');

    if (success) {
      // Case A: Booking Invoice Payment
      if (invoiceId) {
        // Strip prefixes if present to get raw ID if needed, 
        // but our mutation handles cleaning or expects raw. 
        // Let's pass what we got, mutation cleans it.
        confirmBookingPayment({ bookingId: invoiceId })
          .then(() => {
            toast.success("Payment Received! Booking Confirmed.", {
              duration: 5000,
              description: "Your shipment has been marked as confirmed."
            });
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
          })
          .catch((e) => {
            console.error("Failed to confirm booking:", e);
            toast.error("Payment recorded but confirmation failed. Please contact support.");
          });
      }
      // Case B: Subscription Upgrade (Only if NO invoice_id)
      else if (sessionId) {
        completeSubscription({})
          .then(() => {
            toast.success("Payment Successful! Subscription Active.");
            // Force reload to refresh Clerk token/claims
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          })
          .catch((e) => console.error("Failed to complete subscription:", e));
      }
    }



    const tabParam = query.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }

    if (query.get('canceled')) {
      toast.info("Payment canceled.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const createBooking = useMutation(api.bookings.createBooking);
  const fetchedQuote = useQuery(api.quotes.getQuote,
    new URLSearchParams(window.location.search).get('quoteId')
      ? { quoteId: new URLSearchParams(window.location.search).get('quoteId') as any }
      : "skip"
  );

  useEffect(() => {
    // If we have a quoteId in URL and valid quote data, Create a Booking automatically
    const qId = new URLSearchParams(window.location.search).get('quoteId');
    if (qId && fetchedQuote && !(fetchedQuote as any).convertedToBooking) {
      const autoBook = async () => {
        try {
          toast.loading("Processing your booking...");
          const rate = fetchedQuote.quotes[0]; // For instant quotes, usually just one
          const contact = fetchedQuote.contactInfo;

          // Convert Quote -> Booking
          const result = await createBooking({
            quoteId: fetchedQuote.quoteId,
            carrierQuoteId: (rate as any).carrierId || (rate as any).id || `rate-auto-${Date.now()}`,
            customerDetails: {
              name: contact.name,
              email: contact.email,
              phone: contact.phone || 'N/A',
              company: contact.company || 'N/A'
            },
            pickupDetails: {
              address: fetchedQuote.origin,
              date: new Date().toISOString(), // Today
              timeWindow: '09:00 - 18:00',
              contactPerson: contact.name,
              contactPhone: contact.phone || ''
            },
            deliveryDetails: {
              address: fetchedQuote.destination,
              date: new Date(Date.now() + 7 * 86400000).toISOString(),
              timeWindow: '09:00 - 18:00',
              contactPerson: contact.name,
              contactPhone: contact.phone || ''
            }
          });

          toast.dismiss();
          toast.success("Booking Created! Invoice generated.");

          // Clean URL so we don't re-run
          window.history.replaceState({}, document.title, window.location.pathname);

        } catch (e) {
          console.error("Auto-booking failed", e);
          toast.error("Could not finalize booking.");
        }
      };
      autoBook();
    }
  }, [fetchedQuote]);

  const { startCheckout } = useStripeCheckout();

  const handlePayInvoice = (invoiceId: string) => {
    startCheckout(invoiceId);
  };

  // Merge live payments and convex invoices
  const invoices = useMemo(() => {
    let combined = [];

    // 1. Process Convex Invoices (shipment-specific)
    if (convexInvoices && convexInvoices.length > 0) {
      combined.push(...convexInvoices.map((inv: any) => ({
        id: inv.invoiceNumber || inv._id,
        date: new Date(inv.createdAt).toLocaleDateString(),
        amount: inv.amount,
        currency: inv.currency,
        status: inv.status === 'paid' ? 'Paid' : inv.status === 'pending' ? 'Pending' : inv.status || 'Unknown',
        shipment: inv.bookingId || '-',
        dueDate: inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '-',
        description: `Shipment Invoice - ${inv.invoiceNumber}`,
        route: inv.route || 'N/A',
        lineItems: inv.lineItems || [],
        metadata: inv
      })));
    }

    // 2. Process Live Payments (subscriptions, etc)
    if (livePayments && livePayments.length > 0) {
      combined.push(...livePayments.map((p: any) => ({
        id: p.payment_id || p.invoice_id || `PAY-${p._id}`,
        date: p.created_at ? new Date(p.created_at).toLocaleDateString() : '-',
        amount: p.totals?.grand_total?.amount || 0,
        currency: p.totals?.grand_total?.currency || 'GBP',
        status: p.status === 'completed' ? 'Paid' : p.status === 'pending' ? 'Pending' : p.status || 'Unknown',
        shipment: p.invoice_id || '-',
        dueDate: '-',
        description: p.subscription_items?.[0]?.plan?.name || `Payment ${p.payment_id || ''}`,
        route: p.metadata?.route || 'N/A',
        lineItems: p.metadata?.lineItems || [],
        metadata: p.metadata
      })));
    }

    return combined;
  }, [livePayments, convexInvoices]);

  const invoiceColumns = [
    {
      key: 'id' as keyof typeof invoices[0],
      header: 'Invoice ID',
      sortable: true,
      mono: true,
      render: (value: string) => <span className="truncate max-w-[120px] block">{value}</span>
    },
    { key: 'date' as keyof typeof invoices[0], header: 'Date', sortable: true },
    {
      key: 'description' as keyof typeof invoices[0],
      header: 'Service',
      sortable: false,
      render: (value: string, row: any) => {
        const parts = value.split(' - ');
        return (
          <div className="max-w-[180px]">
            <div className="font-medium text-gray-900 truncate">{parts[0]}</div>
            <div className="text-[10px] text-gray-500 leading-tight">
              {parts[1] && <div>{parts[1]}</div>}
              {row.route && row.route !== 'N/A' && !value.includes(row.route) && (
                <div className="text-[9px] text-gray-400 mt-0.5">{row.route}</div>
              )}
            </div>
          </div>
        );
      }
    },
    {
      key: 'amount' as keyof typeof invoices[0],
      header: 'Amount',
      sortable: true,
      align: 'right' as const,
      className: "w-24",
      render: (value: number, row: any) => <span className="font-semibold text-gray-900">{formatCurrency(value, (row.currency || 'GBP') as any)}</span>
    },
    {
      key: 'status' as keyof typeof invoices[0],
      header: 'Status',
      sortable: true,
      render: (value: string) => <StatusBadge status={value} />
    },
    { key: 'dueDate' as keyof typeof invoices[0], header: 'Due Date', sortable: true },
    {
      key: 'actions' as keyof typeof invoices[0],
      header: 'Actions',
      render: (value: string, row: typeof invoices[0]) => (
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => setSelectedInvoice(row)}>View</Button>
          {row.status === 'Pending' && (
            <Button size="sm" onClick={() => handlePayInvoice(row.id)}>
              Pay Now
            </Button>
          )}
        </div>
      )
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        {/* Payments Header */}
        <MediaCardHeader
          title="Payment Management"
          subtitle="Financial Operations"
          description="Manage invoices, process payments, and maintain financial records."
          backgroundImage="https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
          overlayOpacity={0.6}
          className="mb-8"
        />

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('invoices')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'invoices'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Invoices & Payments
              </button>
              <button
                onClick={() => setActiveTab('subscription')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'subscription'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                My Subscription
              </button>
              <button
                onClick={() => setActiveTab('billing')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'billing'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Billing
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'invoices' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Invoices & Payments</h2>
              <Button variant="outline" onClick={() => {
                const csvContent = "data:text/csv;charset=utf-8,"
                  + ["ID,Date,Description,Amount,Status"].join(",") + "\n"
                  + invoices.map(row => `${row.id},${row.date},"${row.description}",${row.amount},${row.status}`).join("\n");
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", "invoices.csv");
                document.body.appendChild(link);
                link.click();
              }}>Export Invoices</Button>
            </div>

            <DataTable
              data={invoices}
              columns={invoiceColumns}
              searchPlaceholder="Search invoices by ID, shipment, or service..."
              rowsPerPage={10}
            />
          </div>
        )}

        {activeTab === 'subscription' && (
          <div className="py-8">
            <SubscriptionCards
              currentTier={currentTier}
              onUpgrade={handleUpgrade}
            />

            <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-medium text-gray-900">Payment Methods</h4>
                  <p className="text-sm text-gray-500">Manage your saved cards and bank accounts.</p>
                </div>
                <Button variant="outline">Manage in Stripe</Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="flex justify-center py-8">
            <UserProfile />
          </div>
        )}




        {/* Invoice Detail Dialog */}
        <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Invoice Details</DialogTitle>
              <DialogDescription>
                {selectedInvoice?.id}
              </DialogDescription>
            </DialogHeader>
            {selectedInvoice && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Amount</p>
                    <div className="space-y-1">
                      <p className="text-xl font-bold text-primary">{formatCurrency(selectedInvoice.amount, (selectedInvoice.currency || 'GBP') as any)}</p>
                      <div className="flex gap-2 text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                        <span>≈ {formatCurrency(convertCurrency(selectedInvoice.amount, (selectedInvoice.currency || 'GBP') as any, 'USD'), 'USD')}</span>
                        <span>≈ {formatCurrency(convertCurrency(selectedInvoice.amount, (selectedInvoice.currency || 'GBP') as any, 'EUR'), 'EUR')}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-500">Status</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${selectedInvoice.status === 'Paid' ? 'bg-green-100 text-green-800' :
                      selectedInvoice.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        selectedInvoice.status === 'Overdue' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                      }`}>
                      {selectedInvoice.status}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Description</p>
                  <p className="font-medium">{selectedInvoice.description}</p>
                  {selectedInvoice.route && selectedInvoice.route !== 'N/A' && (
                    <p className="text-xs text-gray-400 mt-1 italic">{selectedInvoice.route}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Issue Date</p>
                    <p>{selectedInvoice.date}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Due Date</p>
                    <p>{selectedInvoice.dueDate}</p>
                  </div>
                </div>
                <div>
                  <p className="font-mono">{selectedInvoice.shipment}</p>
                </div>


                {selectedInvoice.status === 'Pending' && (
                  <Button className="w-full" onClick={() => {
                    handlePayInvoice(selectedInvoice.id);
                    setSelectedInvoice(null);
                  }}>
                    Pay Now
                  </Button>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default PaymentsPage;
