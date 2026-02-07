// Freightcode.co.uk Carrier API Integration - Types and Utils Only
// Live shipping rates are now fetched via Convex actions to avoid CORS and protect keys.

export interface Address {
  name?: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state?: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
}

export interface Parcel {
  length: number;
  width: number;
  height: number;
  distance_unit: 'in' | 'cm';
  weight: number;
  mass_unit: 'lb' | 'kg';
}

export interface CarrierRate {
  carrierId: string;
  carrier: string;
  service: string;
  cost: number;
  amount?: number;
  currency: string;
  transit_time: string;
  transitTime?: string;
  delivery_date?: string;
  co2_emission?: number;
  provider: 'shippo' | 'reachship' | 'easyship' | 'fedex' | 'ups' | 'searates';
  price?: {
    amount: number;
    currency: string;
    breakdown?: {
      baseRate: number;
      fuelSurcharge: number;
      securityFee: number;
      documentation: number;
    };
    lineItems?: Array<{
      category: string;
      description: string;
      unit: string;
      price: number;
      currency: string;
      total: number;
    }>;
  };
}

export interface RateRequest {
  origin: Address;
  destination: Address;
  parcel: Parcel;
  service_type?: 'standard' | 'express' | 'overnight';
}

// Utility function to calculate approximate distance (for mock pricing if needed)
export function calculateDistance(origin: Address, destination: Address): number {
  const cityDistances: Record<string, Record<string, number>> = {
    'London': { 'Hamburg': 450, 'New York': 3500, 'Shanghai': 5700 },
    'Manchester': { 'Hamburg': 520, 'New York': 3300, 'Shanghai': 5500 },
    'Birmingham': { 'Hamburg': 480, 'New York': 3400, 'Shanghai': 5600 },
  };

  const originCity = origin.city;
  const destCity = destination.city;

  return cityDistances[originCity]?.[destCity] || 1000;
}

// Address validation helper
export function validateAddress(address: Address): boolean {
  return !!(
    address.street1 &&
    address.city &&
    address.zip &&
    address.country
  );
}

// Convert between units
export function convertWeight(weight: number, from: 'lb' | 'kg', to: 'lb' | 'kg'): number {
  if (from === to) return weight;
  if (from === 'lb' && to === 'kg') return weight * 0.453592;
  if (from === 'kg' && to === 'lb') return weight * 2.20462;
  return weight;
}

export function convertDimensions(value: number, from: 'in' | 'cm', to: 'in' | 'cm'): number {
  if (from === to) return value;
  if (from === 'in' && to === 'cm') return value * 2.54;
  if (from === 'cm' && to === 'in') return value / 2.54;
  return value;
}
