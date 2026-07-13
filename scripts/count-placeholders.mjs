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
let placeholderCount = 0;
let productsWithPlaceholders = 0;

for (const p of data) {
  let hasPlaceholder = false;
  for (const field of fields) {
    const val = String(p[field] || '').toLowerCase().trim();
    if (!val || val === 'à compléter' || val === 'à préciser' || val === 'a preciser' || val === 'n/a') {
      placeholderCount++;
      hasPlaceholder = true;
    }
  }
  if (hasPlaceholder) productsWithPlaceholders++;
}

console.log(`Placeholders remaining: ${placeholderCount} (${productsWithPlaceholders} products affected)`);
console.log(`Coverage: ${((data.length - productsWithPlaceholders) / data.length * 100).toFixed(1)}% products fully filled`);
