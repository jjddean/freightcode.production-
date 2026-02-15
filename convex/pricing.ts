import { v } from "convex/values";

// City coordinates for distance calculation
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
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
    'miami': { lat: 25.7617, lng: -80.1918 },
    'southampton': { lat: 50.9097, lng: -1.4044 },
    'felixstowe': { lat: 51.9642, lng: 1.3515 },
};

// Haversine formula to calculate distance between two points
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Extract city name from address string
function extractCity(address: string): string {
    const city = address.split(',')[0].trim().toLowerCase();
    return city;
}

// Get coordinates for a city
export function getCityCoords(address: string): { lat: number; lng: number } | null {
    const city = extractCity(address);
    for (const [key, coords] of Object.entries(CITY_COORDS)) {
        if (city.includes(key) || key.includes(city)) {
            return coords;
        }
    }
    return null;
}

interface PricingParams {
    origin: string;
    destination: string;
    weight: string; // in kg
    serviceType: string; // 'sea', 'air', 'express'
    cargoType?: string;
}

interface PriceBreakdown {
    baseRate: number;
    weightSurcharge: number;
    fuelSurcharge: number;
    securityFee: number;
    documentation: number;
    total: number;
}

export function calculateShippingPrice(params: PricingParams): PriceBreakdown {
    const { origin, destination, weight, serviceType, cargoType } = params;

    // Parse weight
    const weightKg = parseFloat(weight) || 100;

    // Get coordinates
    const originCoords = getCityCoords(origin);
    const destCoords = getCityCoords(destination);

    // Calculate distance (default to 5000km if cities not found)
    let distanceKm = 5000;
    if (originCoords && destCoords) {
        distanceKm = calculateDistance(
            originCoords.lat,
            originCoords.lng,
            destCoords.lat,
            destCoords.lng
        );
    }

    // Base rates per km
    const sType = serviceType.toLowerCase();
    const ratePerKm: Record<string, number> = {
        'sea': 0.08,
        'ocean': 0.08,
        'air': 0.35,
        'express': 0.50,
    };
    const currentRatePerKm = ratePerKm[sType] || 0.20;

    // Weight rate per kg
    const ratePerKg: Record<string, number> = {
        'sea': 2.5,
        'ocean': 2.5,
        'air': 8.0,
        'express': 12.0,
    };
    const currentRatePerKg = ratePerKg[sType] || 5.0;

    // Calculate components
    const baseRate = distanceKm * currentRatePerKm;
    const weightSurcharge = weightKg * currentRatePerKg;
    const subtotal = baseRate + weightSurcharge;

    // Additional fees
    const fuelSurcharge = subtotal * 0.15; // 15% fuel surcharge
    const securityFee = 25; // Flat security fee
    const documentation = 15; // Documentation fee

    // Hazardous cargo surcharge
    const hazardousSurcharge = cargoType?.toLowerCase().includes('hazardous') ? subtotal * 0.25 : 0;

    const total = subtotal + fuelSurcharge + securityFee + documentation + hazardousSurcharge;

    return {
        baseRate: Math.round(baseRate * 100) / 100,
        weightSurcharge: Math.round(weightSurcharge * 100) / 100,
        fuelSurcharge: Math.round(fuelSurcharge * 100) / 100,
        securityFee,
        documentation,
        total: Math.round(total * 100) / 100,
    };
}

// Transit time estimation
export function estimateTransitTime(origin: string, destination: string, serviceType: string): string {
    const sType = serviceType.toLowerCase();
    const originCoords = getCityCoords(origin);
    const destCoords = getCityCoords(destination);

    let distanceKm = 5000;
    if (originCoords && destCoords) {
        distanceKm = calculateDistance(
            originCoords.lat,
            originCoords.lng,
            destCoords.lat,
            destCoords.lng
        );
    }

    // Estimate based on service type and distance
    if (serviceType.toLowerCase() === 'express') {
        if (distanceKm < 2000) return '1-2 days';
        if (distanceKm < 5000) return '2-3 days';
        return '3-5 days';
    } else if (sType === 'air') {
        if (distanceKm < 2000) return '2-4 days';
        if (distanceKm < 5000) return '4-7 days';
        return '7-10 days';
    } else { // sea / ocean
        if (distanceKm < 2000) return '10-14 days';
        if (distanceKm < 5000) return '14-21 days';
        if (distanceKm < 10000) return '21-30 days';
        return '30-45 days';
    }
}

// Helper to generate detailed price breakdown
export function generateMockLineItems(origin: string, destination: string) {
    const currency = "USD";
    return [
        { category: "Origin", description: "Pick up", unit: "wm", price: 90, currency, minimum: 120, total: 180, vat: "%" },
        { category: "Origin", description: "Documentation fee", unit: "shipment", price: 115, currency, total: 115, vat: "%" },
        { category: "Main Transport", description: `Ocean freight ${origin} - HUB`, unit: "wm", price: 221.06, currency, minimum: 94, total: 442.12, vat: "%" },
        { category: "Main Transport", description: `Ocean freight HUB - ${destination}`, unit: "wm", price: 73, currency, minimum: 73, total: 146, vat: "%" },
        { category: "Destination", description: "Security Surcharge", unit: "wm", price: 11, currency, minimum: 40, total: 40, vat: "%" },
        { category: "Destination", description: "Fuel Surcharge", unit: "wm", price: 18.5, currency, minimum: 20, total: 37, vat: "%" },
        { category: "Destination", description: "Delivery order fee", unit: "shipment", price: 200, currency, total: 200, vat: "%" },
        { category: "Destination", description: "Documentation fee", unit: "shipment", price: 10, currency, total: 10, vat: "%" },
        { category: "Destination", description: "Delivery", unit: "wm", price: 70, currency, minimum: 110, total: 140, vat: "%" },
        { category: "Destination", description: "Terminal Handling", unit: "wm", price: 25, currency, minimum: 50, total: 50, vat: "%" },
        { category: "Destination", description: "Cargo handling charge", unit: "wm", price: 5, currency, minimum: 50, total: 50, vat: "%" },
    ];
}
