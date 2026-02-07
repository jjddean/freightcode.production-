import React, { useState, useEffect } from 'react';
import { SUPPORTED_PORTS } from '@/lib/ports';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import LiveRateComparison from '@/components/shipping/LiveRateComparison';
import { type RateRequest, type CarrierRate } from '@/services/carriers';
import { CO2Badge } from '@/components/ui/co2-badge';
import { LandedCostTool } from '@/components/ui/landed-cost-tool';
import {
  quoteStep1Schema,
  quoteStep2Schema,
  quoteStep3Schema,
  quoteStep4Schema
} from '@/lib/validation/quoteSchema';
import { z } from 'zod';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuoteFormData {
  origin: string;
  destination: string;
  serviceType: string;
  cargoType: string;
  weight: string;
  dimensions: {
    length: string;
    width: string;
    height: string;
  };
  value: string;
  incoterms: string;
  urgency: string;
  additionalServices: string[];
  contactInfo: {
    name: string;
    email: string;
    phone: string;
    company: string;
  };
  selectedRate?: CarrierRate;
  rates?: CarrierRate[];
}

interface QuoteRequestFormProps {
  onSubmit: (data: QuoteFormData) => void;
  onCancel: () => void;
  initialStep?: number;
  onStepChange?: (step: number) => void;
  initialData?: Partial<QuoteFormData>;
}

const QuoteRequestForm: React.FC<QuoteRequestFormProps> = ({ onSubmit, onCancel, initialStep = 1, onStepChange, initialData }) => {
  const [formData, setFormData] = useState<QuoteFormData>(() => {
    // 1. If initialData is provided (e.g. from Hero), use it to override defaults
    if (initialData) {
      return {
        origin: initialData.origin || '',
        destination: initialData.destination || '',
        serviceType: 'ocean',
        cargoType: 'general',
        weight: initialData.weight || '',
        dimensions: initialData.dimensions || { length: '', width: '', height: '' },
        value: '',
        incoterms: 'FOB',
        urgency: 'standard',
        additionalServices: [],
        contactInfo: { name: '', email: '', phone: '', company: '' }
      } as QuoteFormData;
    }
    const saved = localStorage.getItem('quoteFormDraft');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return {
      origin: 'Shanghai',
      destination: 'London',
      serviceType: 'ocean',
      cargoType: 'general',
      weight: '1000',
      dimensions: { length: '120', width: '100', height: '100' },
      value: '5000',
      incoterms: 'FOB',
      urgency: 'standard',
      additionalServices: [],
      contactInfo: { name: 'Test Demo', email: 'demo@freightcode.co.uk', phone: '555-0123', company: 'Demo Corp' }
    };
  });

  useEffect(() => {
    localStorage.setItem('quoteFormDraft', JSON.stringify(formData));
  }, [formData]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [currentStep, setCurrentStep] = useState(initialStep);
  const [selectedRate, setSelectedRate] = useState<CarrierRate | null>(null);
  const totalSteps = 5; // Added rate comparison step

  const rateRequest = React.useMemo<RateRequest>(() => ({
    origin: {
      street1: '123 Business St',
      city: formData.origin.split(', ')[0] || 'London',
      state: '',
      zip: 'SW1A 1AA',
      country: 'GB',
    },
    destination: {
      street1: '456 Commerce Ave',
      city: formData.destination.split(', ')[0] || 'Hamburg',
      state: '',
      zip: '20095',
      country: formData.destination.includes('DE') ? 'DE' :
        formData.destination.includes('US') ? 'US' :
          formData.destination.includes('CN') ? 'CN' : 'DE',
    },
    parcel: {
      length: parseFloat(formData.dimensions.length) || 40,
      width: parseFloat(formData.dimensions.width) || 30,
      height: parseFloat(formData.dimensions.height) || 20,
      distance_unit: 'cm',
      weight: parseFloat(formData.weight) || 100,
      mass_unit: 'kg',
    },
  }), [formData.origin, formData.destination, formData.dimensions, formData.weight]);

  const handleRateSelect = (rate: CarrierRate) => {
    setSelectedRate(rate);
  };

  const handleBookRate = React.useCallback((rate: CarrierRate, allRates?: CarrierRate[]) => {
    setSelectedRate(rate);
    onSubmit({
      ...formData,
      selectedRate: rate,
      rates: allRates || formData.rates || []
    });
  }, [formData, onSubmit]);

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof QuoteFormData] as any),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleServiceToggle = (service: string) => {
    setFormData(prev => ({
      ...prev,
      additionalServices: prev.additionalServices.includes(service)
        ? prev.additionalServices.filter(s => s !== service)
        : [...prev.additionalServices, service]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep < totalSteps) {
      nextStep();
      return;
    }
    onSubmit({
      ...formData,
      selectedRate: selectedRate || undefined
    });
  };

  const validateStep = (step: number) => {
    try {
      if (step === 1) {
        quoteStep1Schema.parse(formData);
      } else if (step === 2) {
        quoteStep2Schema.parse(formData);
      } else if (step === 4) {
        quoteStep4Schema.parse(formData);
      }
      setErrors({});
      return true;
    } catch (error: any) {
      // Safe error handling to prevent crash
      const newErrors: Record<string, string> = {};
      if (error && typeof error === 'object' && Array.isArray(error.errors)) {
        error.errors.forEach((err: any) => {
          if (err.path && err.message) {
            const path = err.path.join('.');
            newErrors[path] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      const next = Math.min(currentStep + 1, totalSteps);
      setCurrentStep(next);
      onStepChange?.(next);
    } else {
      toast.error("Please fill in all required fields correctly.");
    }
  };
  const prevStep = () => {
    const prev = Math.max(currentStep - 1, 1);
    setCurrentStep(prev);
    onStepChange?.(prev);
    setErrors({}); // Clear errors when going back
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Shipment Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Origin</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between font-normal",
                        !formData.origin && "text-muted-foreground"
                      )}
                    >
                      {formData.origin
                        ? SUPPORTED_PORTS.find((port) => port === formData.origin)
                        : "Select origin"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search origin..." />
                      <CommandList>
                        <CommandEmpty>No port found.</CommandEmpty>
                        <CommandGroup>
                          {SUPPORTED_PORTS.map((port) => (
                            <CommandItem
                              key={port}
                              value={port}
                              onSelect={() => {
                                handleInputChange('origin', port === formData.origin ? "" : port)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.origin === port ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {port}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {errors.origin && <p className="text-red-500 text-xs mt-1">{errors.origin}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Destination</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between font-normal",
                        !formData.destination && "text-muted-foreground"
                      )}
                    >
                      {formData.destination
                        ? SUPPORTED_PORTS.find((port) => port === formData.destination)
                        : "Select destination"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search destination..." />
                      <CommandList>
                        <CommandEmpty>No port found.</CommandEmpty>
                        <CommandGroup>
                          {SUPPORTED_PORTS.map((port) => (
                            <CommandItem
                              key={port}
                              value={port}
                              onSelect={() => {
                                handleInputChange('destination', port === formData.destination ? "" : port)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.destination === port ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {port}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {errors.destination && <p className="text-red-500 text-xs mt-1">{errors.destination}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
                <Select
                  value={formData.serviceType}
                  onValueChange={(value) => handleInputChange('serviceType', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent className="z-[99999]">
                    <SelectItem value="ocean">Ocean Freight</SelectItem>
                    <SelectItem value="air">Air Freight</SelectItem>
                    <SelectItem value="road">Road Transport</SelectItem>
                    <SelectItem value="rail">Rail Transport</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cargo Type</label>
                <Select
                  value={formData.cargoType}
                  onValueChange={(value) => handleInputChange('cargoType', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select cargo type" />
                  </SelectTrigger>
                  <SelectContent className="z-[99999]">
                    <SelectItem value="general">General Cargo</SelectItem>
                    <SelectItem value="dangerous">Dangerous Goods</SelectItem>
                    <SelectItem value="perishable">Perishable</SelectItem>
                    <SelectItem value="oversized">Oversized</SelectItem>
                    <SelectItem value="fragile">Fragile</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div >
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cargo Specifications</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Weight (kg)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => handleInputChange('weight', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">kg</span>
                </div>
                {errors.weight && <p className="text-red-500 text-xs mt-1">{errors.weight}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dimensions (L x W x H)</label>
                <div className="relative">
                  <input
                    type="text"
                    defaultValue={`${formData.dimensions.length}x${formData.dimensions.width}x${formData.dimensions.height}`}
                    onChange={(e) => {
                      const val = e.target.value;
                      // Simple parse logic: split by 'x', space, or '*'
                      const parts = val.toLowerCase().split(/[x\s*]+/).filter(p => !isNaN(parseFloat(p)));

                      if (parts.length >= 1) handleInputChange('dimensions.length', parts[0]);
                      if (parts.length >= 2) handleInputChange('dimensions.width', parts[1]);
                      if (parts.length >= 3) handleInputChange('dimensions.height', parts[2]);
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
                    placeholder="e.g. 120x80x100"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">cm</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">Format: Length x Width x Height</p>
                {(errors['dimensions.length'] || errors['dimensions.width'] || errors['dimensions.height']) && (
                  <p className="text-red-500 text-xs mt-1">Please enter valid dimensions (e.g. 120x80x100)</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cargo Value (£)</label>
                <input
                  type="number"
                  value={formData.value}
                  onChange={(e) => handleInputChange('value', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter cargo value"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Incoterms</label>
                <Select
                  value={formData.incoterms}
                  onValueChange={(value) => handleInputChange('incoterms', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select incoterms" />
                  </SelectTrigger>
                  <SelectContent className="z-[99999]">
                    <SelectItem value="EXW">EXW - Ex Works</SelectItem>
                    <SelectItem value="FOB">FOB - Free on Board</SelectItem>
                    <SelectItem value="CIF">CIF - Cost, Insurance & Freight</SelectItem>
                    <SelectItem value="DDP">DDP - Delivered Duty Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Service Options</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Urgency</label>
              <div className="space-y-2">
                {[
                  { value: 'standard', label: 'Standard (7-14 days)', price: 'Standard pricing' },
                  { value: 'express', label: 'Express (3-7 days)', price: '+25% premium' },
                  { value: 'urgent', label: 'Urgent (1-3 days)', price: '+50% premium' }
                ].map((option) => (
                  <label key={option.value} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="urgency"
                      value={option.value}
                      checked={formData.urgency === option.value}
                      onChange={(e) => handleInputChange('urgency', e.target.value)}
                      className="text-primary focus:ring-primary"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{option.label}</div>
                      <div className="text-sm text-gray-500">{option.price}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Additional Services</label>
              <div className="space-y-2">
                {[
                  { value: 'insurance', label: 'Cargo Insurance', desc: 'Full coverage for cargo value' },
                  { value: 'customs', label: 'Customs Clearance', desc: 'Complete customs handling' },
                  { value: 'packaging', label: 'Professional Packaging', desc: 'Export-grade packaging' },
                  { value: 'tracking', label: 'Premium Tracking', desc: 'Real-time GPS tracking' }
                ].map((service) => (
                  <label key={service.value} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.additionalServices.includes(service.value)}
                      onChange={() => handleServiceToggle(service.value)}
                      className="text-primary focus:ring-primary"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{service.label}</div>
                      <div className="text-sm text-gray-500">{service.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );



      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={formData.contactInfo.name}
                  onChange={(e) => handleInputChange('contactInfo.name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter your full name"
                  required
                />
                {errors['contactInfo.name'] && <p className="text-red-500 text-xs mt-1">{errors['contactInfo.name']}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                <input
                  type="text"
                  value={formData.contactInfo.company}
                  onChange={(e) => handleInputChange('contactInfo.company', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter company name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                <input
                  type="email"
                  value={formData.contactInfo.email}
                  onChange={(e) => handleInputChange('contactInfo.email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter email address"
                  required
                />
                {errors['contactInfo.email'] && <p className="text-red-500 text-xs mt-1">{errors['contactInfo.email']}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={formData.contactInfo.phone}
                  onChange={(e) => handleInputChange('contactInfo.phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter phone number"
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Live Shipping Rates</h3>
            <p className="text-sm text-gray-600 mb-6">
              Compare live rates from multiple carriers for your shipment.
            </p>

            <LiveRateComparison
              rateRequest={rateRequest}
              onRateSelect={handleRateSelect}
              onBook={handleBookRate}
              onRatesFetched={(rates) => {
                setFormData(prev => ({ ...prev, rates }));
              }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-24">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Step {currentStep} of {totalSteps}</span>
          <span className="text-sm text-gray-500">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Form Content */}
      <div className="mb-8">
        {renderStep()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 border-t border-gray-200 mt-8 bg-white">
        <div>
          {currentStep > 1 && (
            <Button type="button" variant="outline" onClick={prevStep}>
              Previous
            </Button>
          )}
        </div>

        <div className="flex space-x-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>

          {currentStep < totalSteps ? (
            <Button type="button" onClick={nextStep}>
              Next
            </Button>
          ) : currentStep === totalSteps ? null : (
            <Button type="submit">
              Submit Quote Request
            </Button>
          )}
        </div>
      </div>
    </form>
  );
};

export default QuoteRequestForm;
