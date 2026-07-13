#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const seedPath = path.join(projectRoot, 'src', 'data', 'market-products.seed.json');

const raw = await fs.readFile(seedPath, 'utf8');
const data = JSON.parse(raw);
const fields = ['indications', 'posology', 'contraindications', 'sideEffects', 'conservation'];

const productsWithGaps = [];

for (const p of data) {
  let missingFields = [];
  for (const field of fields) {
    const val = String(p[field] || '').toLowerCase().trim();
    if (!val || val === 'à compléter' || val === 'à préciser' || val === 'a preciser' || val === 'n/a') {
      missingFields.push(field);
    }
  }
  if (missingFields.length > 0) {
    productsWithGaps.push({
      id: p.id,
      name: p.name,
      dci: p.dci,
      hasUrl: !!p.description?.includes('http'),
      missingFields: missingFields.join(', ')
    });
  }
}

console.log(`\nProducts with missing fields: ${productsWithGaps.length}`);
console.log('===============================\n');
for (const p of productsWithGaps) {
  console.log(`ID: ${p.id}`);
  console.log(`Name: ${p.name}`);
  console.log(`DCI: ${p.dci}`);
  console.log(`Has URL: ${p.hasUrl}`);
  console.log(`Missing: ${p.missingFields}`);
  console.log('---');
}
