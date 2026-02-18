import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { SUPPORTED_PORTS } from '@/lib/ports';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import LiveRateComparison from '@/components/shipping/LiveRateComparison';
import { type RateRequest, type CarrierRate } from '@/services/carriers';

import {
  quoteStep1Schema,
  quoteStep2Schema,
  quoteStep3Schema
} from '@/lib/validation/quoteSchema';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Check, ChevronsUpDown, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';


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
  targetDate: Date | undefined;
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
        serviceType: '',
        cargoType: 'general',
        weight: initialData.weight || '',
        dimensions: initialData.dimensions || { length: '', width: '', height: '' },
        value: '',
        incoterms: 'FOB',
        targetDate: undefined,
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
      serviceType: '',
      cargoType: '',
      weight: '1000',
      dimensions: { length: '120', width: '100', height: '100' },
      value: '5000',
      incoterms: 'FOB',
      targetDate: undefined,
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
  const [originOpen, setOriginOpen] = useState(false);
  const [destOpen, setDestOpen] = useState(false);

  const totalSteps = 5; // Restored Step 5 (Live Rates)


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



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep < totalSteps) {
      nextStep();
      return;
    }
    onSubmit(formData);
  };

  const validateStep = (step: number) => {
    try {
      if (step === 1) {
        quoteStep1Schema.parse(formData);
      } else if (step === 2) {
        quoteStep2Schema.parse(formData);
      } else if (step === 3) {
        quoteStep3Schema.parse(formData);
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
                <Popover open={originOpen} onOpenChange={setOriginOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={originOpen}
                      className="w-full justify-between text-gray-900"
                    >
                      {formData.origin
                        ? SUPPORTED_PORTS.find((port) => port === formData.origin)
                        : <span className="text-muted-foreground">Select origin...</span>}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Search origin..." />
                      <CommandList>
                        <CommandEmpty>No origin found.</CommandEmpty>
                        <CommandGroup>
                          {SUPPORTED_PORTS.map((port) => (
                            <CommandItem
                              key={port}
                              value={port}
                              onSelect={(currentValue) => {
                                handleInputChange('origin', currentValue);
                                setOriginOpen(false);
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Destination</label>
                <Popover open={destOpen} onOpenChange={setDestOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={destOpen}
                      className="w-full justify-between text-gray-900"
                    >
                      {formData.destination
                        ? SUPPORTED_PORTS.find((port) => port === formData.destination)
                        : <span className="text-muted-foreground">Select destination...</span>}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Search destination..." />
                      <CommandList>
                        <CommandEmpty>No destination found.</CommandEmpty>
                        <CommandGroup>
                          {SUPPORTED_PORTS.map((port) => (
                            <CommandItem
                              key={port}
                              value={port}
                              onSelect={(currentValue) => {
                                handleInputChange('destination', currentValue);
                                setDestOpen(false);
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
                <Select
                  value={formData.serviceType}
                  onValueChange={(value) => handleInputChange('serviceType', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select service" />
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
                    <SelectValue placeholder="Select cargo" />
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

              <div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.targetDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.targetDate ? format(formData.targetDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-[99999]" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.targetDate}
                        onSelect={(date) => handleInputChange('targetDate', date as any)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cargo Specifications</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Weight <span className="text-xs text-gray-500">(kg)</span></label>
                <div className="relative">
                  <Input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => handleInputChange('weight', e.target.value)}
                    className="text-lg"
                    placeholder="0"
                  />
                </div>
                {errors.weight && <p className="text-red-500 text-xs mt-1">{errors.weight}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dimensions <span className="text-xs text-gray-500">(cm)</span></label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="L"
                      value={formData.dimensions.length}
                      onChange={(e) => handleInputChange('dimensions.length', e.target.value)}
                      className="text-xs"
                    />
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="W"
                      value={formData.dimensions.width}
                      onChange={(e) => handleInputChange('dimensions.width', e.target.value)}
                      className="text-xs"
                    />
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="H"
                      value={formData.dimensions.height}
                      onChange={(e) => handleInputChange('dimensions.height', e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>
                {(errors['dimensions.length'] || errors['dimensions.width'] || errors['dimensions.height']) && (
                  <p className="text-red-500 text-xs mt-1">Please enter all dimensions</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cargo Value (£)</label>
                <Input
                  type="number"
                  value={formData.value}
                  onChange={(e) => handleInputChange('value', e.target.value)}
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
                    <SelectItem value="FCA">FCA - Free Carrier</SelectItem>
                    <SelectItem value="CPT">CPT - Carriage Paid To</SelectItem>
                    <SelectItem value="CIP">CIP - Carriage and Insurance Paid To</SelectItem>
                    <SelectItem value="DAP">DAP - Delivered at Place</SelectItem>
                    <SelectItem value="DPU">DPU - Delivered at Place Unloaded</SelectItem>
                    <SelectItem value="DDP">DDP - Delivered Duty Paid</SelectItem>
                    <SelectItem value="FAS">FAS - Free Alongside Ship</SelectItem>
                    <SelectItem value="FOB">FOB - Free on Board</SelectItem>
                    <SelectItem value="CFR">CFR - Cost and Freight</SelectItem>
                    <SelectItem value="CIF">CIF - Cost, Insurance & Freight</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <Input
                  type="text"
                  value={formData.contactInfo.name}
                  onChange={(e) => handleInputChange('contactInfo.name', e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
                {errors['contactInfo.name'] && <p className="text-red-500 text-xs mt-1">{errors['contactInfo.name']}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                <Input
                  type="text"
                  value={formData.contactInfo.company}
                  onChange={(e) => handleInputChange('contactInfo.company', e.target.value)}
                  placeholder="Enter company name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                <Input
                  type="email"
                  value={formData.contactInfo.email}
                  onChange={(e) => handleInputChange('contactInfo.email', e.target.value)}
                  placeholder="Enter email address"
                  required
                />
                {errors['contactInfo.email'] && <p className="text-red-500 text-xs mt-1">{errors['contactInfo.email']}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <Input
                  type="tel"
                  value={formData.contactInfo.phone}
                  onChange={(e) => handleInputChange('contactInfo.phone', e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-900 mb-1">Review Details</h3>

            <div className="rounded-md border border-gray-200 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Origin</span>
                  <span className="font-medium text-gray-900">{formData.origin || '—'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Destination</span>
                  <span className="font-medium text-gray-900">{formData.destination || '—'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Service</span>
                  <span className="font-medium text-gray-900 capitalize">{formData.serviceType || '—'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Target Date</span>
                  <span className="font-medium text-gray-900 capitalize">
                    {formData.targetDate ? format(formData.targetDate, 'PPP') : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Cargo / Weight</span>
                  <span className="font-medium text-gray-900 capitalize">
                    {formData.cargoType || '—'}{formData.weight ? ` · ${formData.weight} kg` : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Dimensions</span>
                  <span className="font-medium text-gray-900">
                    {formData.dimensions.length || formData.dimensions.width || formData.dimensions.height
                      ? `${formData.dimensions.length}x${formData.dimensions.width}x${formData.dimensions.height} cm`
                      : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Value / Incoterms</span>
                  <span className="font-medium text-gray-900">
                    {formData.value ? `£${formData.value}` : '—'}{formData.incoterms ? ` · ${formData.incoterms}` : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Contact</span>
                  <span className="font-medium text-gray-900">{formData.contactInfo.name || '—'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Email</span>
                  <span className="font-medium text-gray-900">{formData.contactInfo.email || '—'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Company</span>
                  <span className="font-medium text-gray-900">{formData.contactInfo.company || '—'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Phone</span>
                  <span className="font-medium text-gray-900">{formData.contactInfo.phone || '—'}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        const rateRequest: RateRequest = {
          origin: {
            street1: "Main St",
            city: formData.origin.split(',')[0].trim(),
            state: "",
            zip: "SW1A 1AA",
            country: formData.origin.toLowerCase().includes('uk') || formData.origin.toLowerCase().includes('london') ? 'GB' : 'CN',
          },
          destination: {
            street1: "Port St",
            city: formData.destination.split(',')[0].trim(),
            state: "",
            zip: "20095",
            country: formData.destination.toLowerCase().includes('china') || formData.destination.toLowerCase().includes('shanghai') ? 'CN' : 'DE',
          },
          parcel: {
            length: parseFloat(formData.dimensions.length) || 10,
            width: parseFloat(formData.dimensions.width) || 10,
            height: parseFloat(formData.dimensions.height) || 10,
            weight: parseFloat(formData.weight) || 1,
            distance_unit: 'cm',
            mass_unit: 'kg',
          }
        };

        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Select Shipping Rate</h3>
            <LiveRateComparison
              rateRequest={rateRequest}
              onRateSelect={(rate) => {
                setFormData(prev => ({ ...prev, selectedRate: rate }));
              }}
              onRatesFetched={(rates) => {
                setFormData(prev => ({ ...prev, rates }));
              }}
              onBook={(rate) => {
                setFormData(prev => ({ ...prev, selectedRate: rate }));
                onSubmit({ ...formData, selectedRate: rate });
              }}
            />
          </div>
        );


      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
      <div className="mb-0 min-h-[250px]">
        {renderStep()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-2 border-t border-gray-200 bg-white space-x-3">
        <div>
          {currentStep > 1 && (
            <Button type="button" variant="outline" onClick={prevStep}>
              Previous
            </Button>
          )}
        </div>

        <div className="flex space-x-3">
          <Button type="submit">
            {currentStep === totalSteps ? 'Complete Quote' : currentStep === 4 ? 'View Rates' : 'Next'}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default QuoteRequestForm;
