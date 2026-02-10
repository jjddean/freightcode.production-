
/**
 * Test script for SeaRates API integration
 * 
 * To run this standalone:
 * npx ts-node --project ./convex/tsconfig.json ./scripts/test-searates.ts
 * 
 * But since we are in a Convex environment, we likely need to run this as an internal Convex function or just mock the call.
 * 
 * This script attempts to call the SeaRates API directly using axios to verify the key.
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env vars from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SEARATES_API_KEY = process.env.SEARATES_API_KEY;
const SEARATES_PLATFORM_ID = process.env.SEARATES_PLATFORM_ID || '1111'; // Default mock ID if not present

console.log('Testing SeaRates API Connection...');
console.log('API Key Present:', !!SEARATES_API_KEY);
console.log('Platform ID:', SEARATES_PLATFORM_ID);

async function testSeaRates() {
    if (!SEARATES_API_KEY) {
        console.error('Error: SEARATES_API_KEY is missing in .env');
        process.exit(1);
    }

    try {
        // Step 1: Get Platform Token (Auth)
        // Note: The URL structure might vary based on exact SeaRates documentation version, 
        // but typically it's https://www.searates.com/auth/platform-token
        const authUrl = `https://www.searates.com/auth/platform-token?id=${SEARATES_PLATFORM_ID}&api_key=${SEARATES_API_KEY}`;

        console.log('Authenticating...');
        const authResponse = await axios.get(authUrl);

        if (!authResponse.data || !authResponse.data.token) {
            console.error('Authentication Failed:', authResponse.data);
            return;
        }

        const token = authResponse.data.token;
        console.log('Authentication Successful! Token received.');

        // Step 2: Test a simple GraphQL Query (Rates)
        const graphqlUrl = 'https://api.searates.com/graphql'; // Verify this endpoint

        const query = `
        query {
            rates(
                shippingType: FCL
                coordinatesFrom: [31.2304, 121.4737] # Shanghai
                coordinatesTo: [53.5511, 9.9937] # Hamburg
            ) {
                shipmentId
                totalPrice
                totalCurrency
                totalTransitTime
            }
        }`;

        console.log('Fetching FCL Rates (Sample: Shanghai -> Hamburg)...');
        const rateResponse = await axios.post(
            graphqlUrl,
            { query },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (rateResponse.data.errors) {
            console.error('GraphQL Query Errors:', JSON.stringify(rateResponse.data.errors, null, 2));
        } else if (rateResponse.data.data) {
            console.log('Rate Fetch Successful!');
            console.log('Data:', JSON.stringify(rateResponse.data.data, null, 2));
        } else {
            console.log('Unexpected Response:', rateResponse.data);
        }

    } catch (error: any) {
        console.error('Connection Test Failed:', error.response?.data || error.message);
    }
}

testSeaRates();
