#!/usr/bin/env node
/**
 * Final enrichment pass - extract from URLs for remaining products
 */

import { promises as fs } from 'node:fs';
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const seedPath = path.join(projectRoot, 'src', 'data', 'market-products.seed.json');

function isPlaceholder(value) {
  const v = String(value || '').trim().toLowerCase();
  return !v || v === 'à compléter' || v === 'à préciser' || v === 'à preciser' || v === 'a preciser' || v === 'n/a';
}

function extractSourceUrl(desc) {
  if (!desc) return null;
  const match = desc.match(/(https?:\/\/[^\s]+)/);
  return match ? match[1] : null;
}

async function enrichRemainingProducts() {
  const raw = await fs.readFile(seedPath, 'utf8');
  const products = JSON.parse(raw);

  const fieldsToFill = ['indications', 'posology', 'contraindications', 'sideEffects', 'conservation'];
  const needsUpdate = products.filter((p) => fieldsToFill.some((f) => isPlaceholder(p[f])));

  if (needsUpdate.length === 0) {
    console.log('✓ All products are complete!');
    return;
  }

  // Filter for products with URLs
  const withUrls = needsUpdate.filter((p) => extractSourceUrl(p.description));

  if (withUrls.length === 0) {
    console.log(`✓ ${needsUpdate.length} products remain with gaps but no URL available`);
    console.log('These require manual enrichment');
    return;
  }

  console.log(`Found ${withUrls.length} products with URLs to enrich`);
  console.log('Note: This requires web extraction and may take time\n');

  // For now, just report status
  for (const p of withUrls) {
    const url = extractSourceUrl(p.description);
    const missing = fieldsToFill.filter((f) => isPlaceholder(p[f]));
    console.log(`- ID ${p.id}: ${p.name}`);
    console.log(`  URL: ${url}`);
    console.log(`  Missing: ${missing.join(', ')}`);
  }

  console.log(`\n--- Summary ---`);
  console.log(`✓ Covered: ${products.length - needsUpdate.length}/${products.length} products`);
  console.log(`⚠ Remaining: ${needsUpdate.length} products`);
  console.log(`  └─ With URLs: ${withUrls.length} (extractable)`);
  console.log(`  └─ Without URLs: ${needsUpdate.length - withUrls.length} (manual enrichment needed)`);
}

enrichRemainingProducts().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
