import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const productsPath = path.join(projectRoot, 'public', 'api', 'products.json');
const pendingPath = path.join(projectRoot, 'src', 'data', 'pending-products.json');
const sourcesPath = path.join(projectRoot, 'src', 'data', 'market-products.sources.json');

const isPlaceholder = (val) => {
  if (!val) return true;
  const s = String(val).trim().toLowerCase();
  return s === '' || s === 'à compléter' || s === 'a completer' || s === 'a préciser' || s === 'à préciser';
};

function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function run() {
  if (!fs.existsSync(productsPath)) {
    console.error('products.json not found');
    return;
  }

  const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
  const pendingData = fs.existsSync(pendingPath) ? JSON.parse(fs.readFileSync(pendingPath, 'utf8')) : { pending: [] };
  const sourcesData = fs.existsSync(sourcesPath) ? JSON.parse(fs.readFileSync(sourcesPath, 'utf8')) : { sources: [] };

  const pendingUrls = Array.isArray(pendingData.pending) ? pendingData.pending : [];
  const sourcesUrls = Array.isArray(sourcesData.sources) ? sourcesData.sources : [];
  const allUrls = [...new Set([...pendingUrls, ...sourcesUrls])];

  console.log(`Loaded ${products.length} products.`);
  console.log(`Loaded ${allUrls.length} unique URLs from pending/sources.`);

  // Build a lookup map of URL slugs
  const slugToUrl = new Map();
  for (const url of allUrls) {
    const slug = url.split('/').filter(Boolean).pop();
    if (slug) {
      slugToUrl.set(slug, url);
    }
  }

  let matchCount = 0;
  let missingCount = 0;

  for (const p of products) {
    const fields = ['indications', 'posology', 'contraindications', 'sideEffects', 'conservation'];
    const hasMissing = fields.some(f => isPlaceholder(p[f]));
    if (hasMissing) {
      missingCount++;
      const pSlug = slugify(p.name);
      // Try exact name slug, or check if any URL slug contains name slug
      let matchedUrl = slugToUrl.get(pSlug);
      if (!matchedUrl) {
        // Try without dosage if name doesn't match
        const brandSlug = slugify(p.name.split(' ')[0]);
        // Find URL slug that contains brand slug and dosage slug
        const cleanDosage = slugify(p.dosage);
        for (const [slug, url] of slugToUrl.entries()) {
          if (slug.includes(brandSlug) && slug.includes(cleanDosage)) {
            matchedUrl = url;
            break;
          }
        }
      }

      if (matchedUrl) {
        matchCount++;
      }
    }
  }

  console.log(`Products with missing fields: ${missingCount}`);
  console.log(`Matched URLs for missing products: ${matchCount} (${((matchCount/missingCount)*100).toFixed(1)}%)`);
}

run();
