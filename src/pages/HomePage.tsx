import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import MediaCardHeader from '@/components/ui/media-card-header';
import Modal from '@/components/ui/modal';
import QuoteRequestForm from '@/components/forms/QuoteRequestForm';
import MarketingFooter from '@/components/layout/MarketingFooter';

import { toast } from 'sonner';

import { VisualQuoteInput } from '@/components/home/VisualQuoteInput';
import { useNavigate } from 'react-router-dom';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

const HomePage = () => {
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchParams, setSearchParams] = useState({ origin: '', destination: '' });
  const [quoteInitialData, setQuoteInitialData] = useState<any>(null);

  const handleVisualSearch = (data: { origin: string; destination: string; weight: string; dimensions: string }) => {
    setSearchParams({ origin: data.origin, destination: data.destination });

    // Parse dimensions string into object
    let dims = { length: '', width: '', height: '' };
    if (data.dimensions) {
      const parts = data.dimensions.toLowerCase().split(/[x\s*]+/).filter(p => !isNaN(parseFloat(p)));
      if (parts.length >= 1) dims.length = parts[0];
      if (parts.length >= 2) dims.width = parts[1];
      if (parts.length >= 3) dims.height = parts[2];
    }

    setQuoteInitialData({
      origin: data.origin,
      destination: data.destination,
      weight: data.weight,
      dimensions: dims
    });

    setShowResults(true);
    toast.success(`Found 3 routes from ${data.origin} to ${data.destination}`);

    // Auto-scroll to results
    setTimeout(() => {
      document.getElementById('quote-results')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const navigate = useNavigate();
  const createBooking = useMutation(api.quotes.createInstantQuoteAndBooking);

  const handleQuoteSubmit = async (data: any) => {
    try {
      // 1. Prepare payload for mutation
      const payload = {
        origin: data.origin,
        destination: data.destination,
        serviceType: data.serviceType,
        cargoType: data.cargoType,
        weight: data.weight,
        dimensions: data.dimensions,
        value: data.value,
        incoterms: data.incoterms,
        urgency: data.urgency,
        additionalServices: data.additionalServices,
        contactInfo: data.contactInfo,
        quotes: data.selectedRate ? [data.selectedRate] : [] // Pass selected rate if any
      };

      // 2. Call Backend
      const result = await createBooking({ request: payload });

      // 3. Close Modal & Redirect
      setIsQuoteModalOpen(false);
      toast.success("Booking initiated! Redirecting to payment...");

      // Redirect to payments with the new quote ID
      navigate(`/payments?quoteId=${result.quoteId}`);

    } catch (error) {
      console.error("Booking failed:", error);
      toast.error("Failed to create booking. Please try again.");
    }
  };

  const handleCloseModal = () => {
    setIsQuoteModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 1. Interactive Visual Quote Hero */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <VisualQuoteInput onSearch={handleVisualSearch} />
      </div>

      {/* 2. Results Section (Conditionally Rendered) */}
      {showResults && (
        <div id="quote-results" className="px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Best Routes Found</h2>
            <Button variant="outline" onClick={() => setShowResults(false)}>Clear Search</Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Option 1: Sea (Value - Primary/Navy) */}
            <div className="rounded-xl p-6 shadow-sm hover:shadow-lg transition-all cursor-pointer bg-white group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-primary-50 rounded-lg group-hover:bg-primary-100 transition-colors">
                  <span className="text-2xl">🚢</span>
                </div>
                <span className="bg-primary-100 text-primary-800 text-xs font-bold px-2 py-1 rounded-full">Best Value</span>
              </div>
              <h3 className="font-bold text-lg mb-1">Ocean Freight</h3>
              <p className="text-sm text-gray-500 mb-4">Maersk Line • 35 Days</p>
              <div className="text-2xl font-bold text-gray-900 mb-4">$1,240 <span className="text-sm font-normal text-gray-500">/ container</span></div>
              <div className="flex justify-center">
                <Button className="px-6 bg-primary hover:bg-primary-700 text-white shadow-sm" onClick={() => setIsQuoteModalOpen(true)}>Book Layout</Button>
              </div>
            </div>

            {/* Option 2: Air (Fastest - Secondary/Teal) */}
            <div className="rounded-xl p-6 shadow-sm hover:shadow-lg transition-all cursor-pointer bg-white group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-secondary-50 rounded-lg group-hover:bg-secondary-100 transition-colors">
                  <span className="text-2xl">✈️</span>
                </div>
                <span className="bg-secondary-100 text-secondary-800 text-xs font-bold px-2 py-1 rounded-full">Fastest</span>
              </div>
              <h3 className="font-bold text-lg mb-1">Air Freight</h3>
              <p className="text-sm text-gray-500 mb-4">DHL Aviation • 3 Days</p>
              <div className="text-2xl font-bold text-gray-900 mb-4">$4,850 <span className="text-sm font-normal text-gray-500">/ 500kg</span></div>
              <div className="flex justify-center">
                <Button className="px-6 variant-outline border-secondary text-secondary-700 hover:bg-secondary-50 shadow-sm" onClick={() => setIsQuoteModalOpen(true)}>Book Express</Button>
              </div>
            </div>

            {/* Option 3: Rail/Mixed (Eco - Primary-Light or Slate for neutrality) */}
            <div className="rounded-xl p-6 shadow-sm hover:shadow-lg transition-all cursor-pointer bg-white group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-primary-50 rounded-lg group-hover:bg-primary-100 transition-colors">
                  <span className="text-2xl">🚆</span>
                </div>
                <span className="bg-primary-100 text-primary-700 text-xs font-bold px-2 py-1 rounded-full">Eco Choice</span>
              </div>
              <h3 className="font-bold text-lg mb-1">Rail Freight</h3>
              <p className="text-sm text-gray-500 mb-4">China Rec • 18 Days</p>
              <div className="text-2xl font-bold text-gray-900 mb-4">$2,100 <span className="text-sm font-normal text-gray-500">/ container</span></div>
              <div className="flex justify-center">
                <Button className="px-6 variant-ghost hover:bg-primary-50 text-primary-700 shadow-sm" onClick={() => setIsQuoteModalOpen(true)}>Book Green</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Core Services Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary-800 mb-4">Core Services</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive freight forwarding solutions designed for modern global trade
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-secondary text-xl">📋</span>
              </div>
              <h3 className="text-lg font-semibold text-primary-800 mb-2">Quote & Booking</h3>
              <p className="text-sm text-gray-600">Instant quotes for UK-EU, UK-US, UK-Asia shipping lanes with direct booking capability.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-secondary text-xl">📄</span>
              </div>
              <h3 className="text-lg font-semibold text-primary-800 mb-2">Digital Documentation</h3>
              <p className="text-sm text-gray-600">Streamlined creation and exchange of Bills of Lading, Air Waybills, and commercial invoices.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-secondary text-xl">📍</span>
              </div>
              <h3 className="text-lg font-semibold text-primary-800 mb-2">Real-Time Tracking</h3>
              <p className="text-sm text-gray-600">Live shipment updates integrated with carrier APIs for complete visibility.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-secondary text-xl">💳</span>
              </div>
              <h3 className="text-lg font-semibold text-primary-800 mb-2">Secure Payments</h3>
              <p className="text-sm text-gray-600">Integrated payment processing with transparent invoicing and billing management.</p>
            </div>
          </div>
        </div>

        {/* Quote Request Modal */}
        <Modal
          isOpen={isQuoteModalOpen}
          onClose={handleCloseModal}
          title="Request Freight Quote"
          size="xl"
        >
          <QuoteRequestForm
            onSubmit={handleQuoteSubmit}
            onCancel={handleCloseModal}
            initialData={quoteInitialData}
          />
        </Modal>
      </div>

      <MarketingFooter />
    </div>
  );
};

export default HomePage;
