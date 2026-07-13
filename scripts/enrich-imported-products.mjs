import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { extractProductDataFromHtml } from './import-product-from-url.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const seedPath = path.join(projectRoot, 'src', 'data', 'market-products.seed.json');

function isPlaceholder(value) {
  const v = String(value || '').trim().toLowerCase();
  return !v || v === 'à compléter' || v === 'à preciser' || v === 'à préciser' || v === 'a preciser';
}

function extractSourceUrlFromDescription(desc) {
  if (!desc) return null;
  const m = String(desc).match(/https?:\/\/[\w.\-\/=?&%]+/i);
  return m ? m[0].replace(/[.,]$/, '').trim() : null;
}

async function enrich() {
  const raw = await fs.readFile(seedPath, 'utf8').catch(() => '[]');
  const products = JSON.parse(raw);
  let updated = 0;

  for (const p of products) {
    // Only attempt to enrich auto-imported products with missing fields
    if (!p || !p.description || !/(produit importé automatiquement|produit importé)/i.test(String(p.description))) continue;
    const url = extractSourceUrlFromDescription(p.description);
    if (!url) continue;

    const needs = ['indications', 'posology', 'contraindications', 'sideEffects', 'conservation', 'pregnancyCategory', 'ppm', 'isPrescriptionRequired'].some((k) => isPlaceholder(p[k]));
    if (!needs) continue;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(url, { redirect: 'follow', signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
      clearTimeout(timeout);
      if (!res.ok) continue;
      const html = await res.text();
      const extracted = extractProductDataFromHtml(html, url);

      let merged = false;
      if (extracted.indications && isPlaceholder(p.indications)) { p.indications = extracted.indications; merged = true; }
      if (extracted.posology && isPlaceholder(p.posology)) { p.posology = extracted.posology; merged = true; }
      if (extracted.contraindications && isPlaceholder(p.contraindications)) { p.contraindications = extracted.contraindications; merged = true; }
      if (extracted.sideEffects && isPlaceholder(p.sideEffects)) { p.sideEffects = extracted.sideEffects; merged = true; }
      if (extracted.conservation && isPlaceholder(p.conservation)) { p.conservation = extracted.conservation; merged = true; }
      if (extracted.pregnancyCategory && (isPlaceholder(p.pregnancyCategory) || p.pregnancyCategory === 'N/A')) { p.pregnancyCategory = extracted.pregnancyCategory || p.pregnancyCategory; merged = true; }
      if (extracted.ppm && !p.ppm) { const n = Number(String(extracted.ppm).replace(',', '.')); if (!Number.isNaN(n)) { p.ppm = n; merged = true; } }
      if (typeof extracted.isPrescriptionRequired === 'boolean' && !p.isPrescriptionRequired) { p.isPrescriptionRequired = !!extracted.isPrescriptionRequired; merged = true; }

      if (merged) {
        updated++;
        console.log(`[ENRICH] Updated product id=${p.id} name=${p.name}`);
      }
    } catch (err) {
      // ignore individual fetch errors
    }
  }

  if (updated > 0) {
    await fs.writeFile(seedPath, JSON.stringify(products, null, 2));
  }

  console.log(`[ENRICH] Done. Products updated: ${updated}`);
}

if (import.meta.url === process.argv[1] || pathToFileURL(process.argv[1]).href === import.meta.url) {
  enrich().catch((err) => { console.error(err); process.exitCode = 1; });
}
