import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import MediaCardHeader from '@/components/ui/media-card-header';
import Modal from '@/components/ui/modal';
import QuoteRequestForm from '@/components/forms/QuoteRequestForm';
import QuickQuoteForm from '@/components/forms/QuickQuoteForm';
import MarketingFooter from '@/components/layout/MarketingFooter';

import { toast } from 'sonner';

import { useNavigate } from 'react-router-dom';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

const HomePage = () => {
  const createQuote = useMutation(api.quotes.createQuote);
  const navigate = useNavigate();
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [initialStep, setInitialStep] = useState(1);
  const [initialData, setInitialData] = useState<any>(null);

  const handleQuoteSubmit = async (data: any) => {
    try {
      // 1. Prepare payload for mutation
      const payload = {
        origin: data.origin,
        destination: data.destination,
        serviceType: data.serviceType || 'ocean',
        cargoType: data.cargoType || 'general',
        weight: data.weight || '0',
        dimensions: data.dimensions || { length: '0', width: '0', height: '0' },
        value: data.value || '0',
        incoterms: data.incoterms || 'FOB',
        urgency: data.urgency || 'standard',
        additionalServices: data.additionalServices || [],
        contactInfo: data.contactInfo,
        quotes: data.rates || [],
        selectedRate: data.selectedRate,
      };

      // 2. Call Backend
      const result = await createQuote({ request: payload });

      // 3. Close Modal & Redirect
      setIsQuoteModalOpen(false);
      toast.success("Quote request submitted! Redirecting to select rates...");

      // Redirect to quotes page with the new quote ID
      navigate(`/quotes?id=${result.quoteId}`);

    } catch (error) {
      console.error("Quote creation failed:", error);
      toast.error("Failed to create quote. Please try again.");
    }
  };

  const handleCloseModal = () => {
    setIsQuoteModalOpen(false);
    setInitialStep(1);
    setInitialData(null);
  };

  const handleQuickQuoteSelect = (data: any) => {
    // Collect all data from Quick Quote form
    const fullInitialData = {
      origin: data.origin,
      destination: data.destination,
      weight: data.weight,
      dimensions: data.dimensions,
      selectedRate: data.selectedRate,
      // Default other fields that QuoteRequestForm expects
      serviceType: 'ocean',
      cargoType: 'general',
      incoterms: 'FOB',
    };

    setInitialData(fullInitialData);
    setInitialStep(3); // Start at Contact Information step
    setIsQuoteModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 text-center">
        <div className="animate-in fade-in slide-in-from-top-4 duration-700">
          <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-full mb-4 tracking-wider uppercase">
            Private Access
          </span>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary-800 tracking-tight mb-6">
            Freight Operations for the <br />
            <span className="text-primary-800">Next Frontier of Trade</span>
          </h1>
          <p className="max-w-2xl mx-auto text-base md:text-lg text-slate-500 leading-relaxed mb-10">
            Scale your forwarding business with unified carrier APIs, GeoRisk Navigator™, and embedded trade finance.
          </p>

          <div className="mt-8">
            <QuickQuoteForm onSelectRate={handleQuickQuoteSelect} />
          </div>
        </div>
      </div>

      {/* Core Services Section */}
      <div className="py-20 bg-gray-50 border-t border-gray-100">
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
            initialStep={initialStep}
            initialData={initialData}
          />
        </Modal>
      </div>

      <MarketingFooter />
    </div>
  );
};

export default HomePage;
