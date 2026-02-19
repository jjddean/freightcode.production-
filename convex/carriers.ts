import { action } from "./_generated/server";
import { v } from "convex/values";
import axios from "axios";
import { generateMockLineItems } from "./pricing";

// Types matching the frontend expectations
interface CarrierRate {
    carrierId: string;
    carrier: string;
    service: string;
    cost: number;
    amount: number;
    currency: string;
    transit_time: string;
    transitTime: string;
    delivery_date?: string;
    provider: "shippo" | "reachship" | "easyship" | "searates";
    price: {
        amount: number;
        currency: string;
        lineItems: any[];
    };
}

export const fetchCarrierRates = action({
    args: {
        origin: v.object({
            street1: v.string(),
            city: v.string(),
            state: v.string(),
            zip: v.string(),
            country: v.string(),
        }),
        destination: v.object({
            street1: v.string(),
            city: v.string(),
            state: v.string(),
            zip: v.string(),
            country: v.string(),
        }),
        parcel: v.object({
            length: v.number(),
            width: v.number(),
            height: v.number(),
            weight: v.number(),
            distance_unit: v.union(v.literal("in"), v.literal("cm")),
            mass_unit: v.union(v.literal("lb"), v.literal("kg")),
        }),
    },
    handler: async (ctx, args): Promise<CarrierRate[]> => {
        const SHIPPO_API_KEY = process.env.SHIPPO_API_KEY;
        const REACHSHIP_CLIENT_ID = process.env.REACHSHIP_CLIENT_ID;
        const REACHSHIP_CLIENT_SECRET = process.env.REACHSHIP_CLIENT_SECRET;
        const EASYSHIP_TOKEN = process.env.EASYSHIP_TOKEN;

        const allRates: CarrierRate[] = [];

        // 1. Fetch from Shippo
        if (SHIPPO_API_KEY) {
            try {
                const response = await axios.post(
                    "https://api.goshippo.com/shipments/",
                    {
                        address_from: {
                            name: "Sender",
                            street1: args.origin.street1,
                            city: args.origin.city,
                            state: args.origin.state,
                            zip: args.origin.zip,
                            country: args.origin.country,
                        },
                        address_to: {
                            name: "Recipient",
                            street1: args.destination.street1,
                            city: args.destination.city,
                            state: args.destination.state,
                            zip: args.destination.zip,
                            country: args.destination.country,
                        },
                        parcels: [
                            {
                                length: args.parcel.length,
                                width: args.parcel.width,
                                height: args.parcel.height,
                                distance_unit: args.parcel.distance_unit,
                                weight: args.parcel.weight,
                                mass_unit: args.parcel.mass_unit,
                            },
                        ],
                        async: false,
                    },
                    {
                        headers: {
                            Authorization: `ShippoToken ${SHIPPO_API_KEY}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                const shippoRates = (response.data.rates || []).map((rate: any) => {
                    const cost = parseFloat(rate.amount);
                    return {
                        carrierId: rate.object_id,
                        carrier: rate.provider,
                        service: rate.servicelevel?.name || rate.servicelevel,
                        cost: cost,
                        amount: cost,
                        currency: rate.currency,
                        transit_time: rate.estimated_days ? `${rate.estimated_days} days` : "Unknown",
                        transitTime: rate.estimated_days ? `${rate.estimated_days} days` : "Unknown",
                        delivery_date: rate.arrives_by,
                        provider: "shippo",
                        price: {
                            amount: cost,
                            currency: rate.currency,
                            lineItems: generateMockLineItems(args.origin.city, args.destination.city),
                        },
                    };
                });
                allRates.push(...shippoRates);
            } catch (e: any) {
                console.error("Shippo fetch failed:", e.response?.data || e.message);
            }
        }

        // 2. Fetch from ReachShip
        if (REACHSHIP_CLIENT_ID && REACHSHIP_CLIENT_SECRET) {
            try {
                // ReachShip requires OAuth token exchange
                const authBody = new URLSearchParams();
                authBody.append('grant_type', 'client_credentials');
                authBody.append('client_id', REACHSHIP_CLIENT_ID);
                authBody.append('client_secret', REACHSHIP_CLIENT_SECRET);

                const authResponse = await axios.post(
                    "https://api.reachship.com/sandbox/v1/oauth/token",
                    authBody,
                    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
                );

                const token = authResponse.data.access_token;

                if (token) {
                    const response = await axios.post(
                        "https://api.reachship.com/sandbox/v1/quotes",
                        {
                            origin: {
                                address: args.origin.street1,
                                city: args.origin.city,
                                state: args.origin.state,
                                postal_code: args.origin.zip,
                                country: args.origin.country,
                            },
                            destination: {
                                address: args.destination.street1,
                                city: args.destination.city,
                                state: args.destination.state,
                                postal_code: args.destination.zip,
                                country: args.destination.country,
                            },
                            parcel: {
                                length: args.parcel.length,
                                width: args.parcel.width,
                                height: args.parcel.height,
                                weight: args.parcel.weight,
                                units: args.parcel.distance_unit === "in" ? "imperial" : "metric",
                            },
                        },
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json",
                            },
                        }
                    );

                    const reachShipRates = (response.data.quotes || []).map((quote: any) => {
                        const cost = quote.total_cost;
                        return {
                            carrierId: `reachship-${Date.now()}-${Math.random()}`,
                            carrier: quote.carrier,
                            service: quote.service,
                            cost: cost,
                            amount: cost,
                            currency: quote.currency || "USD",
                            transit_time: quote.transit_time,
                            transitTime: quote.transit_time,
                            delivery_date: quote.delivery_date,
                            provider: "reachship",
                            price: {
                                amount: cost,
                                currency: quote.currency || "USD",
                                lineItems: generateMockLineItems(args.origin.city, args.destination.city),
                            },
                        };
                    });
                    allRates.push(...reachShipRates);
                }
            } catch (e: any) {
                console.error("ReachShip fetch failed:", e.response?.data || e.message);
            }
        }

        // 3. Fetch from EasyShip
        if (EASYSHIP_TOKEN) {
            try {
                const response = await axios.post(
                    "https://api.easyship.com/2023-01/rates",
                    {
                        origin_address: {
                            line_1: args.origin.street1,
                            city: args.origin.city,
                            state: args.origin.state,
                            postal_code: args.origin.zip,
                            country_alpha2: args.origin.country,
                        },
                        destination_address: {
                            line_1: args.destination.street1,
                            city: args.destination.city,
                            state: args.destination.state,
                            postal_code: args.destination.zip,
                            country_alpha2: args.destination.country,
                        },
                        boxes: [
                            {
                                length: args.parcel.length,
                                width: args.parcel.width,
                                height: args.parcel.height,
                                weight: args.parcel.weight,
                            },
                        ],
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${EASYSHIP_TOKEN}`,
                            "Content-Type": "application/json",
                            "Easyship-API-Version": "2024-09",
                        },
                    }
                );

                const easyshipRates = (response.data.rates || []).map((rate: any) => {
                    const cost = rate.total_charge;
                    return {
                        carrierId: rate.courier_id || `easyship-${Date.now()}`,
                        carrier: rate.courier_name,
                        service: rate.service_name,
                        cost: cost,
                        amount: cost,
                        currency: rate.currency,
                        transit_time: `${rate.min_delivery_time}-${rate.max_delivery_time} days`,
                        transitTime: `${rate.min_delivery_time}-${rate.max_delivery_time} days`,
                        delivery_date: rate.delivery_date,
                        provider: "easyship",
                        price: {
                            amount: cost,
                            currency: rate.currency,
                            lineItems: generateMockLineItems(args.origin.city, args.destination.city),
                        },
                    };
                });
                allRates.push(...easyshipRates);
            } catch (e: any) {
                console.error("EasyShip fetch failed:", e.response?.data || e.message);
            }
        }

        // 4. Fetch from SeaRates
        const SEARATES_API_KEY = process.env.SEARATES_API_KEY;
        const SEARATES_PLATFORM_ID = process.env.SEARATES_PLATFORM_ID || "1111"; // Default/Fallback ID

        if (SEARATES_API_KEY) {
            try {
                const authUrl = `https://www.searates.com/auth/platform-token?id=${SEARATES_PLATFORM_ID}&api_key=${SEARATES_API_KEY}`;
                const authResponse = await axios.get(authUrl);

                if (authResponse.data && authResponse.data.token) {
                    const token = authResponse.data.token;
                    const graphqlUrl = "https://api.searates.com/graphql";

                    const shippingType = args.parcel.weight > 500 ? "FCL" : "AIR";
                    const coordsFrom = [31.2304, 121.4737];
                    const coordsTo = [53.5511, 9.9937];

                    const query = `
                        query {
                            rates(
                                shippingType: ${shippingType}
                                coordinatesFrom: [${coordsFrom}]
                                coordinatesTo: [${coordsTo}]
                                weight: ${args.parcel.weight}
                                volume: 1
                            ) {
                                shipmentId
                                totalPrice
                                totalCurrency
                                totalTransitTime
                                points {
                                    provider
                                    location { name country }
                                }
                            }
                        }
                    `;

                    const rateResponse = await axios.post(
                        graphqlUrl,
                        { query },
                        {
                            headers: {
                                "Authorization": `Bearer ${token}`,
                                "Content-Type": "application/json"
                            }
                        }
                    );

                    if (rateResponse.data.data && rateResponse.data.data.rates) {
                        const srRates = (Array.isArray(rateResponse.data.data.rates) ? rateResponse.data.data.rates : [rateResponse.data.data.rates]).map((rate: any, idx: number) => {
                            const providerName = rate.points?.[0]?.provider || "SeaRates Carrier";
                            return {
                                carrierId: rate.shipmentId || `searates-${Date.now()}-${idx}`,
                                carrier: providerName,
                                service: shippingType === "FCL" ? "Ocean FCL" : "Standard Air",
                                cost: rate.totalPrice,
                                amount: rate.totalPrice,
                                currency: rate.totalCurrency || "USD",
                                transit_time: `${rate.totalTransitTime || 30} days`,
                                transitTime: `${rate.totalTransitTime || 30} days`,
                                provider: "searates",
                                price: {
                                    amount: rate.totalPrice,
                                    currency: rate.totalCurrency || "USD",
                                    lineItems: generateMockLineItems(args.origin.city, args.destination.city)
                                }
                            };
                        });
                        allRates.push(...srRates);
                    }
                }
            } catch (e: any) {
                console.error("SeaRates fetch failed:", e.response?.data || e.message);
            }
        }







        // Sort by cost before returning
        return allRates.sort((a, b) => a.cost - b.cost);
    },
});
