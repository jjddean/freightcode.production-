import fs from 'fs';
import path from 'path';

async function testKeys() {
    console.log('--- API Key Validation Script ---');

    // 1. Load .env manually
    const fs = await import('fs');
    const path = await import('path');
    const envPath = path.resolve(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
        console.error('Error: .env file not found at', envPath);
        return;
    }

    const envContent = fs.readFileSync(envPath, 'utf-8');
    const env: Record<string, string> = {};
    envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            env[key.trim()] = valueParts.join('=').trim();
        }
    });

    const shippoKey = env['SHIPPO_API_KEY'];
    const reachshipId = env['REACHSHIP_CLIENT_ID'];
    const reachshipSecret = env['REACHSHIP_CLIENT_SECRET'];

    console.log('Testing Shippo...');
    if (shippoKey) {
        await testShippo(shippoKey);
    } else {
        console.log('[-] Shippo key missing in .env');
    }

    console.log('\nTesting ReachShip...');
    if (reachshipId && reachshipSecret) {
        const body = new URLSearchParams();
        body.append('grant_type', 'client_credentials');
        body.append('client_id', reachshipId);
        body.append('client_secret', reachshipSecret);

        for (const envName of ['sandbox', 'production']) {
            try {
                const response = await fetch(`https://api.reachship.com/${envName}/v1/oauth/token`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: body
                });
                if (response.ok) {
                    console.log(`✅ ReachShip ${envName}: SUCCESS`);
                } else {
                    const error = await response.text();
                    console.log(`❌ ReachShip ${envName}: FAILED (${response.status})`);
                }
            } catch (err) {
                console.log(`❌ ReachShip ${envName}: ERROR`);
            }
        }
    } else {
        console.log('[-] ReachShip credentials missing in .env');
    }
}
async function testShippo(key: string) {
    console.log('\nTesting Shippo...');
    const response = await fetch('https://api.goshippo.com/v1/addresses/?results=1', {
        headers: { 'Authorization': `ShippoToken ${key}` }
    });
    if (response.ok) console.log('✅ Shippo: SUCCESS');
    else {
        const err = await response.text();
        console.log(`❌ Shippo: FAILED (${response.status}) - ${err}`);
    }
}

(async () => {
    await testShippo('shippo_test_087400bef00b81000390f7807c84bb3c7aa8f1');
    await testKeys();
})();
