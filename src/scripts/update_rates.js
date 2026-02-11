import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// OpenExchangeRates Configuration
const APP_ID = '196d63f90c3048bbaa14d656cec3be9a'; // User provided
const API_URL = `https://openexchangerates.org/api/latest.json?app_id=${APP_ID}`;
const OUTPUT_FILE = path.join(__dirname, '../../public/exchange-rates.json');

console.log('Fetching latest exchange rates from OpenExchangeRates...');

https.get(API_URL, (res) => {
    let data = '';

    // A chunk of data has been received.
    res.on('data', (chunk) => {
        data += chunk;
    });

    // The whole response has been received.
    res.on('end', () => {
        try {
            const json = JSON.parse(data);

            if (json.error) {
                console.error('API Error:', json.description || json.message);
                process.exit(1);
            }

            // Save the data to public/exchange-rates.json
            // We keep the raw format as it's standard and easy to use
            // (base: "USD", rates: { ... })

            // Add a human-readable date for UI display
            json.date = new Date(json.timestamp * 1000).toISOString().split('T')[0];

            fs.writeFileSync(OUTPUT_FILE, JSON.stringify(json, null, 2));
            console.log(`Successfully updated rates! Base: ${json.base}, Rate Count: ${Object.keys(json.rates).length}`);
            console.log(`Saved to: ${OUTPUT_FILE}`);

        } catch (e) {
            console.error('Error parsing JSON:', e.message);
        }
    });

}).on('error', (err) => {
    console.error('Error fetching data:', err.message);
});
