import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvFilePath = path.join(__dirname, '../../public/hs-codes.csv');
const jsonFilePath = path.join(__dirname, '../../public/hs-codes.json');

try {
    const fileContent = fs.readFileSync(csvFilePath, 'utf8');

    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true
    });

    const hsCodes = records
        .filter(record => record.level === '6') // Only keep 6-digit codes
        .map(record => ({
            code: record.hscode,
            desc: record.description
        }));

    fs.writeFileSync(jsonFilePath, JSON.stringify(hsCodes));
    console.log(`Successfully converted ${hsCodes.length} HS codes into JSON.`);

} catch (err) {
    console.error('Error converting CSV to JSON:', err);
}
