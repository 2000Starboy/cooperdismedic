import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const seedPath = path.join(projectRoot, 'src', 'data', 'market-products.seed.json');

function normalizeString(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function splitTokens(value) {
  return normalizeString(value).split(' ').filter(Boolean);
}

function normalizeKey(p) {
  return `${normalizeString(p.name || '')}::${normalizeString(p.dci || '')}`;
}

function isPlaceholderValue(v) {
  const s = normalizeString(v);
  return !s || s === 'a preciser' || s === 'a completer' || s === 'n/a';
}

function extractProductUrl(product) {
  const url = String(product.sourceUrl || product.description || '').match(/https?:\/\/[\w\-./?&=%#]+/);
  return url ? url[0].replace(/[.,;]+$/, '') : '';
}

function areProductsDuplicate(existing, incoming) {
  const existingName = normalizeString(existing.name);
  const incomingName = normalizeString(incoming.name);
  const existingDci = normalizeString(existing.dci);
  const incomingDci = normalizeString(incoming.dci);

  if (existingName && incomingName && existingName === incomingName && existingDci === incomingDci) return true;

  const existingUrl = extractProductUrl(existing);
  const incomingUrl = extractProductUrl(incoming);
  if (existingUrl && incomingUrl && existingUrl === incomingUrl) return true;

  if (existingDci && incomingDci && existingDci === incomingDci) {
    if (existingName && incomingName && (existingName === incomingName || existingName.includes(incomingName) || incomingName.includes(existingName))) {
      return true;
    }
  }

  const existingDciTokens = splitTokens(existingDci || existingName);
  const incomingDciTokens = splitTokens(incomingDci || incomingName);
  const sharedTokens = existingDciTokens.filter((token) => incomingDciTokens.includes(token));
  if (sharedTokens.length >= 2 && existingName && incomingName) {
    const sharedNameTokens = splitTokens(existingName).filter((token) => splitTokens(incomingName).includes(token));
    if (sharedNameTokens.length >= 2) return true;
  }

  return false;
}

function mergeFields(target, src) {
  for (const key of Object.keys(src)) {
    const sv = src[key];
    const tv = target[key];
    if (sv == null) continue;
    if (Array.isArray(sv)) {
      target[key] = Array.from(new Set([...(Array.isArray(tv) ? tv : []), ...sv].filter(Boolean)));
      continue;
    }
    if (typeof sv === 'object') {
      target[key] = { ...(tv || {}), ...sv };
      continue;
    }
    if (tv == null || tv === '' || isPlaceholderValue(tv)) {
      target[key] = sv;
    }
  }
}

async function dedupe() {
  const raw = await fs.readFile(seedPath, 'utf8').catch(() => '[]');
  const products = JSON.parse(raw);
  const deduped = [];

  for (const p of products) {
    const existing = deduped.find((candidate) => areProductsDuplicate(candidate, p));
    if (!existing) {
      deduped.push({ ...p, categories: Array.isArray(p.categories) ? p.categories : [p.categories].filter(Boolean), relatedIds: Array.isArray(p.relatedIds) ? p.relatedIds : [] });
      continue;
    }

    mergeFields(existing, p);
    existing.relatedIds = Array.from(new Set([...(existing.relatedIds || []), ...(p.relatedIds || [])].filter(Boolean)));
    existing.categories = Array.from(new Set([...(existing.categories || []), ...(p.categories || [])].filter(Boolean)));
    if (!existing.id && p.id) existing.id = p.id;
  }

  await fs.writeFile(seedPath, JSON.stringify(deduped, null, 2));
  console.log(`[DEDUP] Reduced ${products.length} -> ${deduped.length} products`);
}

// Execute when run directly
dedupe().catch((err) => { console.error(err); process.exitCode = 1; });
