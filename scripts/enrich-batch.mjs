import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { gotoNoticePage, extractNoticeSections } from './cure-notice-utils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const productsPath = path.join(projectRoot, 'public', 'api', 'products.json');
const pendingPath = path.join(projectRoot, 'src', 'data', 'pending-products.json');
const sourcesPath = path.join(projectRoot, 'src', 'data', 'market-products.sources.json');
const cacheDir = path.join(projectRoot, 'scripts', 'ammps-cleaner', 'cache');
const cachePath = path.join(cacheDir, 'scraping_cache.json');
const logDir = path.join(projectRoot, 'logs');
const logPath = path.join(logDir, 'errors.log');

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

function normalizeString(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function cleanDDGLink(rawUrl) {
  try {
    const u = new URL(rawUrl);
    const uddg = u.searchParams.get('uddg');
    if (uddg) return decodeURIComponent(uddg);
  } catch {}
  return rawUrl;
}

function getPriority(url) {
  const norm = url.toLowerCase();
  if (norm.includes('sante.gov.ma')) return 2;
  if (norm.includes('ema.europa.eu')) return 3;
  if (norm.includes('dailymed.nlm.nih.gov') || norm.includes('dailymed')) return 4;
  if (norm.includes('vidal.fr')) return 5;
  if (norm.includes('bnf.nice.org.uk') || norm.includes('bnf.org')) return 6;
  if (norm.includes('cure.ma')) return 7;
  if (norm.includes('medscape.com')) return 8;
  return 999; // unknown
}

async function searchDDG(query) {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
    }
  });
  if (!res.ok) throw new Error(`Search failed with status ${res.status}`);
  const html = await res.text();
  const hrefs = [];
  const matches = html.matchAll(/href="([^"]+)"/g);
  for (const m of matches) {
    const rawUrl = m[1];
    if (rawUrl.startsWith('//')) {
      hrefs.push('https:' + rawUrl);
    } else if (rawUrl.startsWith('http')) {
      hrefs.push(rawUrl);
    }
  }
  return hrefs;
}

async function run() {
  const startTime = Date.now();
  
  // Ensure directories exist
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

  // Load products
  if (!fs.existsSync(productsPath)) {
    console.error('products.json not found');
    return;
  }
  const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

  // Load cache
  const cache = fs.existsSync(cachePath) ? JSON.parse(fs.readFileSync(cachePath, 'utf8')) : {};

  // Load sitemaps/pending URLs
  const pendingData = fs.existsSync(pendingPath) ? JSON.parse(fs.readFileSync(pendingPath, 'utf8')) : { pending: [] };
  const sourcesData = fs.existsSync(sourcesPath) ? JSON.parse(fs.readFileSync(sourcesPath, 'utf8')) : { sources: [] };
  const pendingUrls = Array.isArray(pendingData.pending) ? pendingData.pending : [];
  const sourcesUrls = Array.isArray(sourcesData.sources) ? sourcesData.sources : [];
  const allUrls = [...new Set([...pendingUrls, ...sourcesUrls])];
  const slugToUrl = new Map();
  for (const url of allUrls) {
    const slug = url.split('/').filter(Boolean).pop();
    if (slug) slugToUrl.set(slug, url);
  }

  // Find products to process
  const fields = ['indications', 'posology', 'contraindications', 'sideEffects', 'conservation'];
  const toProcess = [];
  let totalRemaining = 0;

  for (const p of products) {
    const missing = fields.filter(f => isPlaceholder(p[f]));
    if (missing.length > 0) {
      totalRemaining++;
      if (toProcess.length < 50) {
        toProcess.push({ product: p, missing });
      }
    }
  }

  console.log(`Remaining products to complete: ${totalRemaining}`);
  if (toProcess.length === 0) {
    console.log('All products are already complete!');
    return;
  }

  console.log(`Processing batch of ${toProcess.length} products...`);

  // Build index of completed products for local reuse
  const completedMap = new Map();
  for (const p of products) {
    const hasMissing = fields.some(f => isPlaceholder(p[f]));
    if (!hasMissing) {
      const key = `${normalizeString(p.dci)}::${normalizeString(p.dosage)}::${normalizeString(p.form)}`;
      completedMap.set(key, p);
    }
  }

  let analyzedCount = 0;
  let modifiedCount = 0;
  let attributesFilledCount = 0;
  let ignoredCount = 0;

  const logError = (prod, error) => {
    const time = new Date().toISOString();
    const line = `[${time}] ID=${prod.id} Name="${prod.name}" DCI="${prod.dci}" Error: ${error.message || error}\n`;
    fs.appendFileSync(logPath, line, 'utf8');
  };

  const saveDB = () => {
    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2), 'utf8');
  };

  const saveCache = () => {
    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8');
  };

  let browser = null;

  for (const entry of toProcess) {
    const p = entry.product;
    const missing = entry.missing;
    analyzedCount++;
    let wasModified = false;

    console.log(`\n[${analyzedCount}/${toProcess.length}] Analyzing ${p.id} - ${p.name}...`);

    // Rule 1: Local Reuse
    const reuseKey = `${normalizeString(p.dci)}::${normalizeString(p.dosage)}::${normalizeString(p.form)}`;
    const reuseSource = completedMap.get(reuseKey);
    if (reuseSource) {
      let filledLocal = 0;
      for (const f of missing) {
        if (!isPlaceholder(reuseSource[f])) {
          p[f] = reuseSource[f];
          attributesFilledCount++;
          filledLocal++;
        }
      }
      if (filledLocal > 0) {
        console.log(`  ✓ Reused data from complete product with same DCI+Dosage+Form.`);
        modifiedCount++;
        saveDB();
        continue;
      }
    }

    // Rule 2: Cache Lookup
    const cacheData = cache[reuseKey];
    if (cacheData) {
      let filledCache = 0;
      for (const f of missing) {
        if (cacheData[f] && !isPlaceholder(cacheData[f])) {
          p[f] = cacheData[f];
          attributesFilledCount++;
          filledCache++;
        }
      }
      if (filledCache > 0) {
        console.log(`  ✓ Retrieved data from local scraping cache.`);
        modifiedCount++;
        saveDB();
        continue;
      }
    }

    // Rule 3: Search Web / Scrape
    try {
      // Find candidate URLs
      const brand = p.name.split(' ')[0];
      const pSlug = slugify(p.name);
      const cleanDosage = slugify(p.dosage);
      
      let targetUrl = null;

      // Check local slug map first for Cure.ma
      let localCureUrl = slugToUrl.get(pSlug);
      if (!localCureUrl && cleanDosage) {
        const brandSlug = slugify(brand);
        for (const [slug, url] of slugToUrl.entries()) {
          if (slug.includes(brandSlug) && slug.includes(cleanDosage)) {
            localCureUrl = url;
            break;
          }
        }
      }

      // Try searching DDG for higher priority URLs
      let ddgUrls = [];
      try {
        const searchQuery = `${p.name} ${p.dosage} ${p.form}`;
        ddgUrls = await searchDDG(searchQuery);
      } catch (err) {
        // Skip DDG search failure, log it, but continue with local Cure URL if available
        logError(p, `DDG Search failed: ${err.message}`);
      }

      const allCandidates = [...ddgUrls];
      if (localCureUrl) allCandidates.push(localCureUrl);

      // Rank candidate links by priority
      const rankedLinks = allCandidates
        .map(cleanDDGLink)
        .filter(link => getPriority(link) < 999)
        .sort((a, b) => getPriority(a) - getPriority(b));

      targetUrl = rankedLinks[0];

      if (!targetUrl) {
        console.log(`  ○ No reliable URL found for this product.`);
        ignoredCount++;
        continue;
      }

      console.log(`  ➜ Found target URL: ${targetUrl} (Priority: ${getPriority(targetUrl)})`);

      // Initialize browser on demand
      if (!browser) {
        browser = await chromium.launch({ headless: true });
      }

      // Open page and extract sections
      const page = await browser.newPage();
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
      
      // Navigate to notice page if cure.ma
      if (targetUrl.includes('cure.ma')) {
        try {
          await gotoNoticePage(page);
        } catch {
          // ignore navigation errors
        }
      }

      const sections = await extractNoticeSections(page);
      await page.close();

      // Check if we extracted any valid information
      let filledWeb = 0;
      const cachedEntry = cache[reuseKey] || {};

      for (const f of missing) {
        if (sections[f] && !isPlaceholder(sections[f])) {
          p[f] = sections[f];
          cachedEntry[f] = sections[f];
          attributesFilledCount++;
          filledWeb++;
        }
      }

      if (filledWeb > 0) {
        console.log(`  ✓ Successfully scraped and filled ${filledWeb} attributes.`);
        cache[reuseKey] = cachedEntry;
        saveCache();
        modifiedCount++;
        wasModified = true;
        
        // Add to completed map for next products in this run
        const hasMissingNow = fields.some(f => isPlaceholder(p[f]));
        if (!hasMissingNow) {
          completedMap.set(reuseKey, p);
        }

        saveDB();
      } else {
        console.log(`  ○ Scraped page, but no matching attributes could be filled.`);
        ignoredCount++;
      }

    } catch (err) {
      console.log(`  ❌ Error processing: ${err.message}`);
      logError(p, err);
      ignoredCount++;
    }
  }

  if (browser) {
    await browser.close();
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  const remainingAfter = totalRemaining - modifiedCount;

  console.log(`\n==================================================`);
  console.log(`STATISTIQUES DU LOT`);
  console.log(`==================================================`);
  console.log(`Produits analysés:             ${analyzedCount}`);
  console.log(`Produits modifiés:             ${modifiedCount}`);
  console.log(`Attributs complétés:           ${attributesFilledCount}`);
  console.log(`Produits ignorés:              ${ignoredCount}`);
  console.log(`Produits restant à compléter:  ${remainingAfter}`);
  console.log(`Temps d'exécution:             ${duration} s`);
  console.log(`==================================================\n`);
}

run().catch(err => {
  console.error('Fatal batch enrichment error:', err);
  process.exit(1);
});
