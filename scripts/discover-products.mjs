import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import https from 'node:https';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const sitemapsPath = path.join(projectRoot, 'src', 'data', 'market-products.sitemaps.json');
const sourcesPath = path.join(projectRoot, 'src', 'data', 'market-products.sources.json');
const pendingPath = path.join(projectRoot, 'src', 'data', 'pending-products.json');
const seedPath = path.join(projectRoot, 'src', 'data', 'market-products.seed.json');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    let data = '';
    const req = https.get(url, { timeout: 8000 }, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 400) {
        reject(new Error(`Failed to fetch ${url}: ${res.statusCode}`));
        res.resume();
        return;
      }
      res.setEncoding('utf8');
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy(new Error('timeout'));
    });
  });
}

function parseUrlset(xml) {
  const matches = [...xml.matchAll(/<loc>([^<]+)<\/loc>/gi)];
  return matches.map((m) => m[1].trim()).filter(Boolean);
}

function isProductUrl(url) {
  if (!url) return false;

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  const pathname = parsed.pathname.toLowerCase();
  const segments = pathname.split('/').filter(Boolean);
  const hasProductPathSegment = segments.some((segment) => /(medicament|medicaments|produit|produits|product|products|specialite|specialites|drug|drugs|pharmacie|pharmacies|comprime|capsule|sirop|gelule|poudre|creme|solution|spray|suppositoire|injectable)/i.test(segment));
  const hasKnownMedicineToken = /(paracetamol|doliprane|ibuprofene|amoxicilline|omeprazole|vitamine|aspirine|cetirizine|loratadine|metformine|atorvastatine|augmentin|voltfast|gaviscon|loperamide|fluimucil|biseptol|ceftriaxone|prednisolone|diclofenac|ketoconazole|betadine)/i.test(pathname);

  return hasProductPathSegment || hasKnownMedicineToken;
}

export function extractProductUrlsFromSitemapXml(xml) {
  if (!xml) return [];

  const isSitemapIndex = /<sitemapindex\b/i.test(xml);
  if (isSitemapIndex) {
    return [...new Set(parseUrlset(xml))];
  }

  return [...new Set(parseUrlset(xml).filter(isProductUrl))];
}

export async function discoverProductUrls() {
  const sitemapRaw = await fs.readFile(sitemapsPath, 'utf8');
  const sitemapCfg = JSON.parse(sitemapRaw);
  const sitemaps = Array.isArray(sitemapCfg.sitemaps) ? sitemapCfg.sitemaps : [];

  const discovered = new Set();

  for (const sm of sitemaps) {
    try {
      const xml = await fetchUrl(sm);
      const subs = extractProductUrlsFromSitemapXml(xml);
      if (subs.length > 0 && /<sitemapindex\b/i.test(xml)) {
        for (const sub of subs) {
          try {
            const subXml = await fetchUrl(sub);
            const urls = extractProductUrlsFromSitemapXml(subXml);
            urls.forEach((u) => discovered.add(u));
          } catch {
            // ignore individual sub-sitemap errors
          }
        }
      } else {
        subs.forEach((u) => discovered.add(u));
      }
    } catch {
      // ignore errors fetching a sitemap
    }
  }

  return [...discovered];
}

export async function discover() {
  const discovered = await discoverProductUrls();

  const existingSourcesRaw = await fs.readFile(sourcesPath, 'utf8').catch(() => '{"sources":[]}');
  const existingPendingRaw = await fs.readFile(pendingPath, 'utf8').catch(() => '{"pending":[]}');

  const existingSources = JSON.parse(existingSourcesRaw);
  const existingPending = JSON.parse(existingPendingRaw);

  const known = new Set([
    ...(Array.isArray(existingSources.sources) ? existingSources.sources : []),
    ...(Array.isArray(existingPending.pending) ? existingPending.pending : []),
  ]);

  const newUrls = discovered.filter((u) => !known.has(u));

  if (newUrls.length === 0) {
    console.log('No new product URLs discovered');
    return { added: 0 };
  }

  const nextPending = { pending: [...(existingPending.pending || []), ...newUrls] };
  await fs.writeFile(pendingPath, JSON.stringify(nextPending, null, 2));
  console.log(`Discovered and added ${newUrls.length} new product URLs to pending (validation will occur during import)`);

  // Do NOT trigger sync automatically. Pending items require manual review/approval.

  return { added: newUrls.length };
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('discover-products.mjs')) {
  discover().catch((err) => {
    console.error('Discovery failed:', err);
    process.exitCode = 1;
  });
}
