import fs from 'fs';
import path from 'path';
import { SmartAuditAuditor } from '../../convex/smartaudit_auditor.js';

// Get API Key from .env
const envFile = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf-8') : "";
const apiKeyMatch = envFile.match(/OPENAI_API_KEY=(.*)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : process.env.OPENAI_API_KEY;

if (!apiKey) {
    console.warn("OPENAI_API_KEY not found. Falling back to [MOCK] labeling.");
}

const auditor = new SmartAuditAuditor(apiKey || "MOCK_KEY");
const samplesDir = path.join('ml', 'data', 'samples');
const labelsDir = path.join('ml', 'data', 'labels');

if (!fs.existsSync(labelsDir)) {
    fs.mkdirSync(labelsDir, { recursive: true });
}

function mockLabel(text: string, type: string) {
    // Better extraction for anomaly training
    const title = text.split('\n')[0];
    const ref = text.match(/(ShipmentRef|No|Ref): (.*)/)?.[2] || "UNKNOWN";

    // Extract numerical features from text
    const weightMatch = text.match(/WEIGHT: (\d+)/i);
    const weight = weightMatch ? parseInt(weightMatch[1]) : 0;

    const priceMatch = text.match(/TOTAL: \$(\d+)/i);
    const price = priceMatch ? parseInt(priceMatch[1]) : 0;

    return {
        documentType: type,
        documentNumber: ref,
        rawText: text,
        title: title,
        shippingWeight: weight,
        totalValue: price,
        extractedFields: [
            { key: "DocType", value: type, confidence: 1.0 },
            { key: "Reference", value: ref, confidence: 1.0 },
            { key: "Weight", value: weight, confidence: 1.0 },
            { key: "TotalValue", value: price, confidence: 1.0 }
        ]
    };
}

async function labelAll() {
    const files = fs.readdirSync(samplesDir).filter(f => f.endsWith('.txt'));
    console.log(`Found ${files.length} samples to label...`);

    for (const file of files) {
        const filePath = path.join(samplesDir, file);
        const labelPath = path.join(labelsDir, file.replace('.txt', '.json'));

        // Infer docType from filename (e.g., SHIP-2026-0001_bol.txt -> bill_of_lading)
        let docType = "unknown";
        if (file.toLowerCase().includes('bol')) docType = "bill_of_lading";
        else if (file.toLowerCase().includes('invoice')) docType = "commercial_invoice";
        else if (file.toLowerCase().includes('packing_list')) docType = "packing_list";
        else if (file.toLowerCase().includes('awb')) docType = "air_waybill";
        else if (file.toLowerCase().includes('coo')) docType = "certificate_of_origin";
        else if (file.toLowerCase().includes('insurance')) docType = "insurance_certificate";

        /* 
        if (fs.existsSync(labelPath)) {
            // console.log(`Skipping ${file}, already labeled.`);
            continue;
        }
        */

        const rawText = fs.readFileSync(filePath, 'utf-8');
        try {
            if (!apiKey || apiKey === "MOCK_KEY") {
                console.log(`[MOCK] Labeling ${file} as ${docType}...`);
                const mockResult = mockLabel(rawText, docType);
                fs.writeFileSync(labelPath, JSON.stringify(mockResult, null, 2));
            } else {
                console.log(`[GPT-4] Labeling ${file} as ${docType}...`);
                const result = await auditor.audit(rawText, docType);
                fs.writeFileSync(labelPath, JSON.stringify(result.extractedData, null, 2));
            }
            console.log(`Saved label for ${file}`);
        } catch (error) {
            console.error(`Error labeling ${file}:`, error);
        }
    }
}

labelAll();
