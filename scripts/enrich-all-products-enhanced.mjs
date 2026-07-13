#!/usr/bin/env node
/**
 * Enhanced enrichment script - fill ALL missing product fields
 * Uses multiple extraction methods for maximum coverage:
 * 1. extractProductDataFromHtml - general HTML parsing
 * 2. extractNoticeSections - Playwright-based extraction from cure.ma
 * 3. Field copying from similar products (same DCI)
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { extractProductDataFromHtml } from './import-product-from-url.mjs';
import { extractNoticeSections, gotoNoticePage, normalizeText } from './cure-notice-utils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const seedPath = path.join(projectRoot, 'src', 'data', 'market-products.seed.json');

function isPlaceholder(value) {
  const v = String(value || '').trim().toLowerCase();
  return !v || v === 'à compléter' || v === 'à preciser' || v === 'à préciser' || v === 'a preciser' || v === 'n/a';
}

function normalizeCompare(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function extractSourceUrl(desc) {
  if (!desc) return null;
  const m = String(desc).match(/https?:\/\/[\w.\-\/=?&%#]+/i);
  return m ? m[0].replace(/[.,]$/, '').trim() : null;
}

async function fetchAndEnrich(product, browser) {
  const url = extractSourceUrl(product.description);
  if (!url) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const html = await res.text();
    let extracted = extractProductDataFromHtml(html, url);

    // Try Playwright extraction for cure.ma URLs
    if (/cure\.ma/i.test(url) && browser) {
      try {
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        // Try to navigate to notice page if available
        try {
          await gotoNoticePage(page);
        } catch (e) {
          // Keep current page if navigation fails
        }

        const noticed = await extractNoticeSections(page);
        // Merge with preference for noticed sections
        extracted = {
          ...extracted,
          indications: noticed.indications || extracted.indications,
          posology: noticed.posology || extracted.posology,
          contraindications: noticed.contraindications || extracted.contraindications,
          sideEffects: noticed.sideEffects || extracted.sideEffects,
          conservation: noticed.conservation || extracted.conservation,
        };

        await page.close();
      } catch (err) {
        console.warn(`  [WARN] Playwright extraction failed for ${product.id}:`, err.message);
      }
    }

    return extracted;
  } catch (err) {
    console.warn(`  [WARN] Failed to fetch ${url}:`, err.message);
    return null;
  }
}

async function enrichAllProducts() {
  const raw = await fs.readFile(seedPath, 'utf8').catch(() => '[]');
  const products = JSON.parse(raw);

  // Build index by DCI for cross-product field copying
  const byDCI = new Map();
  for (const p of products) {
    const dci = normalizeCompare(p.dci || p.name || '');
    if (!byDCI.has(dci)) byDCI.set(dci, []);
    byDCI.get(dci).push(p);
  }

  let updatedCount = 0;
  const browser = await chromium.launch({ headless: true });

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const needsUpdate = ['indications', 'posology', 'contraindications', 'sideEffects', 'conservation', 'pregnancyCategory', 'isPrescriptionRequired'].some(
      (k) => isPlaceholder(p[k])
    );

    if (!needsUpdate) {
      console.log(`[${i + 1}/${products.length}] SKIP ${p.id} ${p.name} (all fields complete)`);
      continue;
    }

    console.log(`[${i + 1}/${products.length}] Processing ${p.id} ${p.name}...`);

    // Step 1: Try fetching and extracting from URL
    const extracted = await fetchAndEnrich(p, browser);
    let changed = false;

    if (extracted) {
      console.log(`  [FETCH] Attempting to extract data from URL...`);
      if (extracted.indications && isPlaceholder(p.indications)) {
        p.indications = extracted.indications;
        changed = true;
      }
      if (extracted.posology && isPlaceholder(p.posology)) {
        p.posology = extracted.posology;
        changed = true;
      }
      if (extracted.contraindications && isPlaceholder(p.contraindications)) {
        p.contraindications = extracted.contraindications;
        changed = true;
      }
      if (extracted.sideEffects && isPlaceholder(p.sideEffects)) {
        p.sideEffects = extracted.sideEffects;
        changed = true;
      }
      if (extracted.conservation && isPlaceholder(p.conservation)) {
        p.conservation = extracted.conservation;
        changed = true;
      }
      if (extracted.pregnancyCategory && (isPlaceholder(p.pregnancyCategory) || p.pregnancyCategory === 'N/A')) {
        p.pregnancyCategory = extracted.pregnancyCategory;
        changed = true;
      }
      if (typeof extracted.isPrescriptionRequired === 'boolean' && isPlaceholder(p.isPrescriptionRequired)) {
        p.isPrescriptionRequired = extracted.isPrescriptionRequired;
        changed = true;
      }
    }

    // Step 2: If still missing, copy from products with same DCI
    const dciKey = normalizeCompare(p.dci || p.name || '');
    const siblings = byDCI.get(dciKey) || [];
    const bestSibling = siblings
      .filter((s) => s.id !== p.id)
      .sort((a, b) => {
        const scoreA = ['indications', 'posology', 'contraindications', 'sideEffects', 'conservation'].reduce(
          (s, k) => s + (!isPlaceholder(a[k]) ? 1 : 0),
          0
        );
        const scoreB = ['indications', 'posology', 'contraindications', 'sideEffects', 'conservation'].reduce(
          (s, k) => s + (!isPlaceholder(b[k]) ? 1 : 0),
          0
        );
        return scoreB - scoreA;
      })[0];

    if (bestSibling) {
      console.log(`  [COPY] Found similar product with same DCI: id=${bestSibling.id}`);
      if (isPlaceholder(p.indications) && !isPlaceholder(bestSibling.indications)) {
        p.indications = bestSibling.indications;
        changed = true;
      }
      if (isPlaceholder(p.posology) && !isPlaceholder(bestSibling.posology)) {
        p.posology = bestSibling.posology;
        changed = true;
      }
      if (isPlaceholder(p.contraindications) && !isPlaceholder(bestSibling.contraindications)) {
        p.contraindications = bestSibling.contraindications;
        changed = true;
      }
      if (isPlaceholder(p.sideEffects) && !isPlaceholder(bestSibling.sideEffects)) {
        p.sideEffects = bestSibling.sideEffects;
        changed = true;
      }
      if (isPlaceholder(p.conservation) && !isPlaceholder(bestSibling.conservation)) {
        p.conservation = bestSibling.conservation;
        changed = true;
      }
    }

    if (changed) {
      updatedCount++;
      console.log(`  ✓ Updated`);
    } else {
      console.log(`  ⚠ No data found to fill`);
    }

    // Add delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 800));
  }

  await browser.close();

  if (updatedCount > 0) {
    const backupPath = seedPath + '.backup-' + new Date().toISOString().slice(0, 10);
    await fs.copyFile(seedPath, backupPath);
    await fs.writeFile(seedPath, JSON.stringify(products, null, 2));
    console.log(`\n✓ Backup created: ${backupPath}`);
  }

  console.log(`\n✓ Enrichment complete. Updated: ${updatedCount} products`);
}

enrichAllProducts().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
