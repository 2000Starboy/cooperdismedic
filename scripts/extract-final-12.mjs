#!/usr/bin/env node
/**
 * Extract data for remaining 12 products with URLs
 * Fast, targeted enrichment
 */

import { promises as fs } from 'node:fs';
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractProductDataFromHtml } from './import-product-from-url.mjs';

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

async function fetchWithTimeout(url, timeout = 5000) {
  return Promise.race([
    fetch(url),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeout))
  ]);
}

async function extractFinalProducts() {
  const raw = await fs.readFile(seedPath, 'utf8');
  const products = JSON.parse(raw);

  const fieldsToFill = ['indications', 'posology', 'contraindications', 'sideEffects', 'conservation'];
  const needsUpdate = products.filter((p) => fieldsToFill.some((f) => isPlaceholder(p[f])));
  const withUrls = needsUpdate.filter((p) => extractSourceUrl(p.description));

  if (withUrls.length === 0) {
    console.log('✓ No products with URLs need enrichment');
    return;
  }

  console.log(`Extracting data for ${withUrls.length} products...\n`);

  let browser;
  try {
    browser = await chromium.launch();
    let updated = 0;

    for (let i = 0; i < withUrls.length; i++) {
      const p = withUrls[i];
      const url = extractSourceUrl(p.description);
      console.log(`[${i + 1}/${withUrls.length}] ${p.name}...`);

      try {
        // Fetch HTML
        const response = await fetchWithTimeout(url, 8000);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const html = await response.text();

        // Extract data
        const extracted = extractProductDataFromHtml(html, url);

        // Merge missing fields
        let changed = false;
        for (const field of fieldsToFill) {
          if (isPlaceholder(p[field]) && extracted[field] && !isPlaceholder(extracted[field])) {
            p[field] = extracted[field];
            changed = true;
          }
        }

        if (changed) {
          updated++;
          console.log(`  ✓ Updated`);
        } else {
          console.log(`  ⚠ No new data extracted`);
        }
      } catch (err) {
        console.log(`  ✗ Error: ${err.message}`);
      }

      // Delay between requests
      if (i < withUrls.length - 1) await new Promise((r) => setTimeout(r, 400));
    }

    await browser.close();

    // Save if updated
    if (updated > 0) {
      const backupPath = seedPath + '.backup-' + new Date().toISOString().slice(0, 10).replace(/-/g, '');
      try {
        await fs.copyFile(seedPath, backupPath);
        await fs.writeFile(seedPath, JSON.stringify(products, null, 2));
        console.log(`\n✓ Updated ${updated} products`);
        console.log(`✓ Backup: ${path.basename(backupPath)}`);
      } catch (err) {
        console.error('Save error:', err.message);
      }
    }
  } catch (err) {
    console.error('Fatal error:', err);
    if (browser) await browser.close();
    process.exit(1);
  }
}

extractFinalProducts();
