import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const productsPath  = path.join(projectRoot, 'public', 'api', 'products.json');
const pendingPath   = path.join(projectRoot, 'src', 'data', 'pending-products.json');
const sourcesPath   = path.join(projectRoot, 'src', 'data', 'market-products.sources.json');
const cacheDir      = path.join(projectRoot, 'scripts', 'ammps-cleaner', 'cache');
const cachePath     = path.join(cacheDir, 'scraping_cache.json');
const logDir        = path.join(projectRoot, 'logs');
const logPath       = path.join(logDir, 'errors.log');

// ── Config ──────────────────────────────────────────────────────────────────
const CONCURRENCY = 4;
const DELAY_MS    = 800;
const RETRY_MAX   = 4;
const RETRY_BASE  = 5000;

// ── Helpers ──────────────────────────────────────────────────────────────────
const isPlaceholder = (val) => {
  if (!val) return true;
  const s = String(val).trim().toLowerCase();
  return s === '' || s === 'à compléter' || s === 'a completer'
                  || s === 'à préciser'  || s === 'a preciser';
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function slugify(text) {
  return String(text).toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function normalizeStr(v) {
  return String(v||'').toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
}

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<')
    .replace(/&gt;/g,'>').replace(/&nbsp;/g,' ').replace(/&#39;/g,"'")
    .replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();
}

/**
 * Extract the medical notice sections from a cure.ma product page HTML.
 * Strategy 1: Parse the static HTML which contains data in <p> tags inside
 *   section divs with id="indications", id="posologie", etc.
 * Strategy 2: Parse the self.__next_f chunks and decode JSON payload
 */
function extractCureMaSections(html) {
  const result = {
    indications: '', posology: '', contraindications: '', sideEffects: '', conservation: ''
  };

  // Strategy 1: Parse static HTML sections via id= attributes
  const sectionMap = {
    indications:      ['id="indications"', 'id=\\"indications\\"'],
    posology:         ['id="posologie"',   'id=\\"posologie\\"'],
    contraindications:['id="contre-indications"', 'id=\\"contre-indications\\"'],
    sideEffects:      ['id="effets-indesirables"', 'id=\\"effets-indesirables\\"', 'id="effets"'],
    conservation:     ['id="conservation"', 'id=\\"conservation\\"'],
  };

  for (const [field, anchors] of Object.entries(sectionMap)) {
    for (const anchor of anchors) {
      const idx = html.indexOf(anchor);
      if (idx === -1) continue;
      // Grab up to 3000 chars after the anchor and extract <p> text
      const chunk = html.substring(idx, idx + 4000);
      // Extract all <p> tags content
      const pMatches = [...chunk.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];
      const texts = pMatches
        .map(m => stripHtml(m[1]).trim())
        .filter(t => t.length > 10);
      if (texts.length > 0) {
        result[field] = texts.join(' ').substring(0, 2000);
        break;
      }
    }
  }

  // Strategy 2: Parse self.__next_f chunks
  // These chunks contain the RSC (React Server Component) payload as escaped JSON strings
  if (Object.values(result).every(v => !v)) {
    const nextFChunks = [];
    const re = /self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g;
    let m;
    while ((m = re.exec(html)) !== null) {
      const raw = m[1]
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '')
        .replace(/\\t/g, ' ')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
      nextFChunks.push(raw);
    }
    const payload = nextFChunks.join('\n');

    if (payload) {
      // Look for section labels and grab the following text
      const sectionLabels = {
        indications:       ['Indications thérapeutiques', 'Indications'],
        posology:          ['Posologie et mode d\'administration', 'Posologie'],
        contraindications: ['Contre-indications'],
        sideEffects:       ['Effets indésirables', 'Effets secondaires'],
        conservation:      ['Conservation', 'Durée de conservation'],
      };

      for (const [field, labels] of Object.entries(sectionLabels)) {
        if (result[field]) continue; // Already filled from strategy 1
        for (const label of labels) {
          const idx = payload.indexOf(label);
          if (idx === -1) continue;
          // Grab text after the label, stop at next section or JSON boundary
          const after = payload.substring(idx + label.length, idx + label.length + 3000);
          // Remove JSON syntax chars and HTML tags
          const clean = after
            .replace(/<[^>]+>/g, ' ')
            .replace(/\\u[\da-f]{4}/gi, m => String.fromCharCode(parseInt(m.slice(2), 16)))
            .replace(/[{}\[\]"\\,]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          // Stop at next known section label
          const stopLabels = ['Posologie', 'Contre-indications', 'Effets', 'Conservation', 'Indications'];
          let end = clean.length;
          for (const stop of stopLabels) {
            const si = clean.indexOf(stop);
            if (si > 50 && si < end) end = si;
          }
          const extracted = clean.substring(0, end).trim();
          if (extracted.length > 20) {
            result[field] = extracted.substring(0, 2000);
            break;
          }
        }
      }
    }
  }

  return result;
}

// ── Fetch with retry + backoff ───────────────────────────────────────────────
async function fetchHtml(url, attempt = 0) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
      },
    });
    if (res.status === 429 && attempt < RETRY_MAX) {
      const wait = RETRY_BASE * Math.pow(2, attempt);
      console.log(`  [429] Rate limited, waiting ${wait}ms before retry ${attempt+1}...`);
      await sleep(wait);
      return fetchHtml(url, attempt + 1);
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (err) {
    if (attempt < RETRY_MAX) {
      await sleep(RETRY_BASE * Math.pow(2, attempt));
      return fetchHtml(url, attempt + 1);
    }
    throw err;
  }
}

// ── Concurrency pool ─────────────────────────────────────────────────────────
async function runPool(items, concurrency, delayMs, fn) {
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const item = items[idx++];
      await fn(item);
      if (idx < items.length) await sleep(delayMs);
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, worker);
  await Promise.all(workers);
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function run() {
  const startTime = Date.now();

  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
  if (!fs.existsSync(logDir))   fs.mkdirSync(logDir,   { recursive: true });
  if (!fs.existsSync(productsPath)) { console.error('products.json not found'); return; }

  const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
  const cache    = fs.existsSync(cachePath) ? JSON.parse(fs.readFileSync(cachePath, 'utf8')) : {};

  // Build URL map from pending + sources
  const pendingData  = fs.existsSync(pendingPath)  ? JSON.parse(fs.readFileSync(pendingPath, 'utf8'))  : { pending: [] };
  const sourcesData  = fs.existsSync(sourcesPath)  ? JSON.parse(fs.readFileSync(sourcesPath, 'utf8')) : { sources: [] };
  const allUrls      = [...new Set([...(pendingData.pending||[]), ...(sourcesData.sources||[])])];
  // Only keep individual medicine product URLs (depth-4: cure.ma/medicaments/SLUG)
  const productUrls  = allUrls.filter(u => {
    const parts = u.split('/').filter(Boolean);
    return parts.length === 4 && parts[2] === 'medicaments' && !parts[3].startsWith('classe');
  });
  const slugToUrl = new Map();
  for (const url of productUrls) {
    const slug = url.split('/').filter(Boolean).pop();
    if (slug) slugToUrl.set(slug, url);
  }
  console.log(`URL map built: ${slugToUrl.size} product URLs available`);

  const fields = ['indications', 'posology', 'contraindications', 'sideEffects', 'conservation'];

  // ── PASS 1 : local DCI reuse ────────────────────────────────────────────────
  const completedMap = new Map();
  for (const p of products) {
    if (!fields.some(f => isPlaceholder(p[f]))) {
      const key = `${normalizeStr(p.dci)}::${normalizeStr(p.dosage)}::${normalizeStr(p.form)}`;
      completedMap.set(key, p);
    }
  }
  let localFilled = 0;
  for (const p of products) {
    const missing = fields.filter(f => isPlaceholder(p[f]));
    if (!missing.length) continue;
    const key    = `${normalizeStr(p.dci)}::${normalizeStr(p.dosage)}::${normalizeStr(p.form)}`;
    const source = completedMap.get(key);
    if (source) {
      for (const f of missing) if (!isPlaceholder(source[f])) { p[f] = source[f]; localFilled++; }
    }
  }

  // ── PASS 2 : cache reuse ────────────────────────────────────────────────────
  let cacheFilled = 0;
  for (const p of products) {
    const missing = fields.filter(f => isPlaceholder(p[f]));
    if (!missing.length) continue;
    const key  = `${normalizeStr(p.dci)}::${normalizeStr(p.dosage)}::${normalizeStr(p.form)}`;
    const data = cache[key];
    if (data) {
      for (const f of missing) if (data[f] && !isPlaceholder(data[f])) { p[f] = data[f]; cacheFilled++; }
    }
  }

  if (localFilled + cacheFilled > 0) {
    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2), 'utf8');
    console.log(`[PASS 1+2] Local/cache reuse: ${localFilled + cacheFilled} attributes filled.`);
  }

  // ── Group by DCI for web fetching ────────────────────────────────────────────
  const dciGroups = new Map();
  for (const p of products) {
    const missing = fields.filter(f => isPlaceholder(p[f]));
    if (!missing.length) continue;
    const dciKey = normalizeStr(p.dci);
    if (!dciGroups.has(dciKey)) dciGroups.set(dciKey, { products: [], dci: p.dci });
    dciGroups.get(dciKey).products.push(p);
  }

  const groups = [...dciGroups.values()];
  const totalIncomplete = groups.reduce((s, g) => s + g.products.length, 0);

  console.log(`\n=== WEB ENRICHMENT START ===`);
  console.log(`Products still incomplete : ${totalIncomplete}`);
  console.log(`Unique DCI groups to fetch: ${groups.length}`);
  console.log(`Concurrency: ${CONCURRENCY}  Delay: ${DELAY_MS}ms  MaxRetries: ${RETRY_MAX}\n`);

  let modifiedCount    = 0;
  let attributesFilled = 0;
  let ignoredCount     = 0;
  let processed        = 0;

  const saveAll = () => {
    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2), 'utf8');
    fs.writeFileSync(cachePath,    JSON.stringify(cache,    null, 2), 'utf8');
  };

  const logErr = (dci, url, msg) => {
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] DCI="${dci}" URL=${url} – ${msg}\n`, 'utf8');
  };

  await runPool(groups, CONCURRENCY, DELAY_MS, async (group) => {
    processed++;
    const rep   = group.products[0];
    const pct   = ((processed / groups.length) * 100).toFixed(1);

    // ── Find best URL for this group ──────────────────────────────────────
    let targetUrl = null;
    for (const p of group.products) {
      // Try exact slug match
      const exactSlug = slugify(p.name);
      if (slugToUrl.has(exactSlug)) { targetUrl = slugToUrl.get(exactSlug); break; }
      // Try brand+dosage partial match
      const brand = slugify(p.name.split(' ')[0]);
      const dose  = slugify(p.dosage);
      if (dose) {
        for (const [slug, url] of slugToUrl.entries()) {
          if (slug.startsWith(brand) && slug.includes(dose)) { targetUrl = url; break; }
        }
        if (targetUrl) break;
      }
    }

    if (!targetUrl) {
      ignoredCount += group.products.length;
      return;
    }

    // ── Fetch product page ──────────────────────────────────────────────
    let html;
    try {
      // First try the product page (has inline indications snippet)
      html = await fetchHtml(targetUrl);
    } catch (err) {
      logErr(group.dci, targetUrl, err.message);
      ignoredCount += group.products.length;
      return;
    }

    let sections = extractCureMaSections(html);
    const filledFromProduct = Object.values(sections).filter(v => v && v.length > 10).length;

    // If product page didn't yield enough, try /notice page
    if (filledFromProduct < 3) {
      try {
        const noticeHtml = await fetchHtml(targetUrl + '/notice');
        const noticeSections = extractCureMaSections(noticeHtml);
        // Merge: prefer notice values (more complete)
        for (const f of fields) {
          if (!isPlaceholder(noticeSections[f])) sections[f] = noticeSections[f];
        }
      } catch {
        // Notice page unavailable — continue with what we have
      }
    }

    // ── Apply to all products in this DCI group ─────────────────────────
    let groupFilled = 0;
    for (const p of group.products) {
      const pKey    = `${normalizeStr(p.dci)}::${normalizeStr(p.dosage)}::${normalizeStr(p.form)}`;
      const pMissing = fields.filter(f => isPlaceholder(p[f]));
      let   pFilled  = 0;

      for (const f of pMissing) {
        if (sections[f] && !isPlaceholder(sections[f])) {
          p[f] = sections[f];
          attributesFilled++; pFilled++; groupFilled++;
        }
      }
      if (pFilled > 0) {
        modifiedCount++;
        cache[pKey] = { ...(cache[pKey]||{}), ...sections };
        if (!fields.some(f => isPlaceholder(p[f]))) completedMap.set(pKey, p);
      }
    }

    if (groupFilled > 0) {
      console.log(`[${pct}%] ✓ ${group.dci}: ${groupFilled} attrs × ${group.products.length} products`);
    } else {
      ignoredCount += group.products.length;
    }

    // Save every 10 groups processed
    if (processed % 10 === 0) saveAll();
  });

  // Final save
  saveAll();

  const remaining = products.filter(p => fields.some(f => isPlaceholder(p[f]))).length;
  const duration  = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\n==================================================`);
  console.log(`STATISTIQUES FINALES`);
  console.log(`==================================================`);
  console.log(`Produits modifiés:             ${modifiedCount}`);
  console.log(`Attributs complétés:           ${attributesFilled}`);
  console.log(`Produits ignorés:              ${ignoredCount}`);
  console.log(`Produits restant à compléter:  ${remaining}`);
  console.log(`Temps d'exécution:             ${duration} s`);
  console.log(`==================================================\n`);
}

run().catch(err => { console.error('Fatal error:', err); process.exit(1); });
