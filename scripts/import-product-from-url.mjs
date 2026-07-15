import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { gotoNoticePage, extractNoticeSections } from './cure-notice-utils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const seedPath = path.join(projectRoot, 'src', 'data', 'market-products.seed.json');

function normalizeText(value) {
  return String(value ?? '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .replace(/\s*([,;:.])\s*/g, '$1 ')
    .trim();
}

function stripHtml(value) {
  return normalizeText(
    String(value ?? '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
  );
}

function findProductNodes(value) {
  if (Array.isArray(value)) {
    return value.flatMap(findProductNodes);
  }

  if (!value || typeof value !== 'object') {
    return [];
  }

  const type = value['@type'];
  const types = Array.isArray(type) ? type : [type].filter(Boolean);
  const isProductLike = Boolean(value.name) && (types.some((entry) => /product/i.test(String(entry))) || value.brand || value.sku || value.offers);

  if (isProductLike) {
    return [value];
  }

  return Object.values(value).flatMap(findProductNodes);
}

function readJsonLdCandidate(html) {
  const matches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];

  for (const match of matches) {
    try {
      const parsed = JSON.parse(match[1]);
      const candidates = findProductNodes(parsed);
      if (candidates.length > 0) {
        return candidates[0];
      }
    } catch {
      // Ignore malformed JSON-LD blocks.
    }
  }

  return null;
}

function extractByLabel(text, labels) {
  // First try label followed by colon/dash on same line
  const inlinePattern = new RegExp(
    `(?:${labels.join('|')})\\s*[:\\-]\\s*([^\\n.;,]{1,120}?)(?=(?:\\s+(?:Laboratoire|Laboratory|Fabricant|Manufacturer|Marque|Forme|Formulation|Présentation|Dosage|Dose|Concentration|Dosage recommandé|DCI|Principe actif|Substance active|Substance active ingredient|Active ingredient))|$)`,
    'i'
  );
  const inlineMatch = text.match(inlinePattern);
  if (inlineMatch) return normalizeText(inlineMatch[1]);

  // Fallback: label as a heading on its own line followed by a paragraph
  const blockPattern = new RegExp(`(?:\\n|^)\\s*(?:${labels.join('|')})\\s*(?:\\n|\\r|\\s)+([\\s\\S]{1,500}?)\\s*(?=\\n\\s*\\n|$)`, 'i');
  const blockMatch = text.match(blockPattern);
  if (blockMatch) return normalizeText(blockMatch[1].replace(/[\n\r]+/g, ' '));

  return '';
}


function inferCategory(name, dci) {
  const source = `${name} ${dci}`.toLowerCase();

  if (/amoxicilline|azithromycine|ciprofloxacine|antibi|pénic|macrol|fluoroquinolone/.test(source)) {
    return ['antibiotic'];
  }

  if (/paracétamol|ibuprofène|aspirine|diclof|nsaid|analg|anti-inflamm/.test(source)) {
    return ['analgesic'];
  }

  if (/statine|amlodipine|metformine|cardio|hypertens|diab/.test(source)) {
    return ['cardiovascular'];
  }

  if (/vitamin|multivit|fer/.test(source)) {
    return ['vitamins'];
  }

  return ['digestive'];
}

export function extractProductDataFromHtml(html, sourceUrl = '') {
  const plainText = stripHtml(html);
  const jsonLd = readJsonLdCandidate(html);
  const title = normalizeText((html.match(/<title>([^<]+)<\/title>/i)?.[1] || '').trim());
  const ogTitle = normalizeText((html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1] || '').trim());
  const twitterTitle = normalizeText((html.match(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i)?.[1] || '').trim());
  const h1 = normalizeText((html.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1] || '').trim());
  const h2 = normalizeText((html.match(/<h2[^>]*>([^<]+)<\/h2>/i)?.[1] || '').trim());

  const name = normalizeText(jsonLd?.name || ogTitle || twitterTitle || h1 || h2 || title || sourceUrl.split('/').filter(Boolean).pop() || 'Produit importé');
  const dci = normalizeText(
    extractByLabel(plainText, ['DCI', 'Principe actif', 'Substance active', 'Substance active ingredient', 'Active ingredient', 'Substance']) ||
      jsonLd?.activeIngredient ||
      jsonLd?.drugClass ||
      jsonLd?.additionalProperty?.find((entry) => /dci|active|principe|substance/i.test(entry.name || ''))?.value
  );
  const laboratory = normalizeText(
    extractByLabel(plainText, ['Laboratoire', 'Laboratory', 'Fabricant', 'Manufacturer', 'Marque', 'Laboratoires']) ||
      jsonLd?.brand?.name ||
      jsonLd?.manufacturer?.name
  );
  const form = normalizeText(
    extractByLabel(plainText, ['Forme', 'Formulation', 'Présentation', 'Présentation galénique', 'Galénique']) ||
      jsonLd?.dosageForm
  );
  const dosage = normalizeText(
    extractByLabel(plainText, ['Dosage', 'Dose', 'Concentration', 'Dosage recommandé', 'Dose recommandée', 'Dosage thérapeutique']) ||
      jsonLd?.dosage ||
      jsonLd?.dosageForm
  );

  const indications = normalizeText(
    extractByLabel(plainText, ['Indications', 'Indication', 'Indications thérapeutiques', 'Indication(s)']) || jsonLd?.indication || jsonLd?.indications || ''
  );

  const posology = normalizeText(
    extractByLabel(plainText, ['Posologie', 'Posology', 'Mode d\'emploi', 'Mode d\'utilisation', 'Posologie recommandée', 'Dosage recommandé']) || jsonLd?.dosage || ''
  );

  const contraindications = normalizeText(
    extractByLabel(plainText, ['Contre-indications', 'Contre indication', 'Contraindications', 'Contre-indication']) || jsonLd?.contraindication || ''
  );

  const sideEffects = normalizeText(
    extractByLabel(plainText, ['Effets indésirables', 'Effets secondaires', 'Effets', 'Side effects', 'Adverse reactions']) || jsonLd?.sideEffects || jsonLd?.adverseEffects || ''
  );

  const conservation = normalizeText(
    extractByLabel(plainText, ['Conservation', 'Conserver', 'Storage', 'Conservation et durée']) || jsonLd?.storage || ''
  );

  // Fallback: try to extract product sections from Next.js serialized payload (self.__next_f)
  function readNextJsPayload(htmlText) {
    const parts = [];
    const re = /self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\);/g;
    let m;
    while ((m = re.exec(htmlText))) {
      // unescape common sequences
      const s = m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
      parts.push(s);
    }
    return parts.join('\n');
  }

  function extractSectionFromNextPayload(payload, label) {
    if (!payload) return '';
    const idx = payload.search(new RegExp(label, 'i'));
    if (idx === -1) return '';
    // capture until next section label or end (limit length)
    const rest = payload.slice(idx);
    const endMatch = rest.search(/(Indications|Posologie|Contre-indications|Effets indésirables|Conservation|FAQPage|<\/div>|","|",)/i);
    const slice = endMatch === -1 ? rest.slice(0, 2000) : rest.slice(0, Math.min(2000, endMatch));
    // remove JSON-like and HTML wrappers
    return normalizeText(slice.replace(/\\"/g, '"').replace(/<[^>]+>/g, ' ').replace(/\{[\s\S]*?\}/g, ' ').replace(/\[|\]/g, ' '));
  }

  const nextPayload = readNextJsPayload(html);
  if (nextPayload) {
    // Prefer payload-derived values if current extraction is empty or placeholder
    if (!indications || indications === 'À compléter') {
      const v = extractSectionFromNextPayload(nextPayload, 'Indications');
      if (v) indications = v;
    }

    if (!posology || posology === 'À compléter') {
      const v = extractSectionFromNextPayload(nextPayload, 'Posologie');
      if (v) posology = v;
    }

    if (!contraindications || contraindications === 'À compléter') {
      const v = extractSectionFromNextPayload(nextPayload, 'Contre-indications');
      if (v) contraindications = v;
    }

    if (!sideEffects || sideEffects === 'À compléter') {
      const v = extractSectionFromNextPayload(nextPayload, 'Effets indésirables');
      if (v) sideEffects = v;
    }

    if (!conservation || conservation === 'À compléter') {
      const v = extractSectionFromNextPayload(nextPayload, 'Conservation');
      if (v) conservation = v;
    }
  }

  // Try to extract pregnancy category (A/B/C/D/X/N/A)
  let pregnancyCategory = '';
  const pregMatch = plainText.match(/cat[eé]gorie\s*(grossesse|de grossesse)\s*[:\-\s]*([ABCDXNAabcdnx\/\s]+)/i);
  if (pregMatch) pregnancyCategory = normalizeText(pregMatch[2]).toUpperCase().replace(/[^A-Z\/]/g, '') || '';
  if (!pregnancyCategory) {
    const pregShort = (plainText.match(/grossesse\s*[:\-\s]*([ABCDXNA])/i) || [])[1];
    if (pregShort) pregnancyCategory = pregShort.toUpperCase();
  }

  // Extract price (PPM / Prix public / Prix)
  function extractPrice(text) {
    const m = text.match(/(?:ppm|prix public|prix)\s*[:\-]?\s*(?:≈|~)?\s*([0-9]+(?:[.,][0-9]+)?)(?:\s*(?:dh|dhs|mad|dhm|dhs|\u20ac|€|\$))?/i);
    if (m) return m[1].replace(',', '.');
    const m2 = text.match(/([0-9]+(?:[.,][0-9]+)?)\s*(?:dh|dhs|mad|dhm|dhs|\u20ac|€|\$)/i);
    if (m2) return m2[1].replace(',', '.');
    return '';
  }
  const ppm = extractPrice(plainText) || '';

  // Detect if prescription is required
  const isPrescriptionRequired = /sur ordonnance|requiert une ordonnance|vente sur ordonnance|prescription obligatoire|prescription requise/i.test(plainText);

  return {
    name,
    dci,
    laboratory,
    form,
    dosage,
    sourceUrl,
    description: normalizeText(jsonLd?.description || `${name} importé automatiquement depuis ${sourceUrl || 'une source externe'}.`),
    indications,
    posology,
    contraindications,
    sideEffects,
    conservation,
    pregnancyCategory,
    ppm,
    isPrescriptionRequired,
  };
}

export function buildImportedProduct({
  name,
  dci,
  laboratory,
  form,
  dosage,
  sourceUrl,
  existingIds = [],
  indications = '',
  posology = '',
  contraindications = '',
  sideEffects = '',
  conservation = '',
  pregnancyCategory = '',
  ppm = '',
  isPrescriptionRequired = false,
}) {
  const nextId = Math.max(0, ...existingIds) + 1;
  const normalizedName = normalizeText(name).toUpperCase();
  const normalizedDci = normalizeText(dci || 'À préciser');
  const normalizedLaboratory = normalizeText(laboratory || 'À préciser');
  const normalizedForm = normalizeText(form || 'À préciser');
  const normalizedDosage = normalizeText(dosage || 'À préciser');
  const categories = inferCategory(normalizedName, normalizedDci);

  return {
    id: nextId,
    name: normalizedName,
    dci: normalizedDci,
    laboratory: normalizedLaboratory,
    form: normalizedForm,
    dosage: normalizedDosage,
    therapeuticClass: 'Produit importé automatiquement',
    categories,
    description: `Produit importé automatiquement depuis ${sourceUrl || 'une source externe'}.`,
    indications: indications || 'À compléter',
    posology: posology || 'À compléter',
    contraindications: contraindications || 'À compléter',
    sideEffects: sideEffects || 'À compléter',
    conservation: conservation || 'À compléter',
    pregnancyCategory: pregnancyCategory || 'N/A',
    isPrescriptionRequired: !!isPrescriptionRequired,
    ppm: ppm ? Number(ppm) : undefined,
    relatedIds: [],
  };
}

function isDuplicate(existingProducts, incomingProduct) {
  function normalizeKey(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  }

  const incomingKey = normalizeKey(`${incomingProduct.name} ${incomingProduct.dci}`);
  for (const product of existingProducts) {
    const existingKey = normalizeKey(`${product.name} ${product.dci}`);
    if (existingKey && incomingKey && existingKey === incomingKey) return true;
    // fallback: DCI token overlap
    const inDci = normalizeKey(incomingProduct.dci || incomingProduct.name || '');
    const exDci = normalizeKey(product.dci || product.name || '');
    const inTokens = new Set(inDci.split(' ').filter(Boolean));
    const exTokens = new Set(exDci.split(' ').filter(Boolean));
    const shared = [...inTokens].filter((t) => exTokens.has(t));
    if (shared.length >= 2) return true;
  }
  return false;
}

function looksLikeInvalidPage(html, url) {
  const text = stripHtml(html).toLowerCase();
  const title = String(html.match(/<title>([^<]+)<\/title>/i)?.[1] || '').toLowerCase();
  const markers = [
    '404',
    'not found',
    'introuvable',
    'page not found',
    'does not exist',
    'no longer available',
    'access denied',
    'forbidden',
    'temporarily unavailable',
  ];

  const urlLooksBad = /\/404\b|\/not-found\b|\/missing\b|\/error\b/i.test(url);
  const contentLooksBad = markers.some((marker) => text.includes(marker) || title.includes(marker));

  return urlLooksBad || contentLooksBad;
}

function isPlausibleProductField(value, fieldName) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized || normalized === 'à préciser' || normalized === 'a preciser') return false;

  if (fieldName === 'dosage') {
    return /\d/.test(normalized) || /(mg|ml|g|µg|mcg|%|ui|unité|capsule|comprim|gélul|spray|pommade|patch)/i.test(normalized);
  }

  if (fieldName === 'form') {
    return /(comprimé|capsule|gélule|solution|sirop|sachet|patch|crème|gel|spray|dispositif|ampoule|injection|suppositoire|collyre|pommade)/i.test(normalized) || normalized.length <= 40;
  }

  if (fieldName === 'laboratory') {
    return normalized.length >= 3 && !/^(article|actualité|actualite|blog|news|communiqué|communiqu)/i.test(normalized);
  }

  if (fieldName === 'dci') {
    return normalized.length >= 3 && !/^(article|actualité|actualite|blog|news|communiqué|communiqu)/i.test(normalized);
  }

  return normalized.length > 0;
}

function isPlaceholderValue(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return !normalized || normalized === 'à compléter' || normalized === 'a compléter' || normalized === 'à préciser' || normalized === 'a preciser' || normalized === 'n/a';
}

function shouldUsePlaywrightFallback(extracted, url) {
  const missingFields = ['indications', 'posology', 'contraindications', 'sideEffects', 'conservation']
    .filter((field) => isPlaceholderValue(extracted[field])).length;

  return /cure\.ma/i.test(url) && missingFields > 0;
}

function mergeExtractedFields(primary, fallback) {
  const merged = { ...primary };
  for (const key of Object.keys(fallback)) {
    if (isPlaceholderValue(merged[key]) && !isPlaceholderValue(fallback[key])) {
      merged[key] = fallback[key];
    }
  }
  return merged;
}

async function extractProductDataWithPlaywright(url) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    const finalUrl = await gotoNoticePage(page, url);
    await page.waitForLoadState('networkidle');
    const pageContent = await page.content();
    const extractedFromPage = extractProductDataFromHtml(pageContent, finalUrl);
    const noticeSections = await extractNoticeSections(page);
    return mergeExtractedFields(extractedFromPage, noticeSections);
  } finally {
    await browser.close();
  }
}

function looksLikeInvalidProductExtraction(extracted) {
  const suspectTitle = String(extracted.name || '').toLowerCase();
  const hasArticleWords = /(article|actualité|actualite|blog|news|communiqu|communiqué)/i.test(suspectTitle);
  const overlyLongTitle = suspectTitle.length > 70;
  const fieldCount = [
    isPlausibleProductField(extracted.dci, 'dci'),
    isPlausibleProductField(extracted.laboratory, 'laboratory'),
    isPlausibleProductField(extracted.form, 'form'),
    isPlausibleProductField(extracted.dosage, 'dosage'),
  ].filter(Boolean).length;

  return hasArticleWords && overlyLongTitle && fieldCount < 2;
}

function hasProductSchema(html) {
  const scriptBlocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  return scriptBlocks.some((match) => /"@type"\s*:\s*"(Product|Drug|MedicalEntity|MedicalArticle|WebPage)"/i.test(match[1]));
}

function looksLikeProductPage(html, extracted, sourceUrl = '') {
  const plainText = stripHtml(html).toLowerCase();
  const title = String(html.match(/<title>([^<]+)<\/title>/i)?.[1] || '').toLowerCase();
  const lowerUrl = String(sourceUrl).toLowerCase();

  const productFields = [extracted.dci, extracted.laboratory, extracted.form, extracted.dosage]
    .filter((value) => value && value !== 'À préciser');
  const hasProductMetadata = productFields.length >= 2;
  const hasStructuredProductData = hasProductSchema(html);
  const hasProductSignals = /(dci|laboratoire|laboratory|fabricant|manufacturer|forme|dosage|substance active|principe actif|composition|présentation|médicament|medicament|produit|product)/i.test(plainText);
  const looksLikeArticle = /(article|actualité|actualite|blog|news|communiqu|communiqué)/i.test(`${extracted.name || title}`.toLowerCase())
    || /(\/article\/|\/blog\/|\/news\/|\/actualite\/|\/actus?\/)/i.test(lowerUrl);
  const isCureMaProductPage = /https?:\/\/(?:www\.)?cure\.ma\/medicaments\/(?!classe\/)/i.test(sourceUrl);

  return !looksLikeArticle && (hasStructuredProductData || hasProductMetadata || (isCureMaProductPage && hasProductSignals));
}

export async function importProductFromUrl({
  url,
  outputPath = seedPath,
  existingProducts = [],
  sourceUrl = url,
  html = null,
}) {
  let response;
  let htmlContent = html;

  if (!htmlContent) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      response = await fetch(url, {
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        },
      });
      clearTimeout(timeout);
    } catch (error) {
      return { imported: false, reason: 'fetch-error', error };
    }

    if (!response.ok) {
      return { imported: false, reason: 'invalid-page', status: response.status };
    }

    htmlContent = await response.text();
  }

  if (looksLikeInvalidPage(htmlContent, url)) {
    return { imported: false, reason: 'invalid-page', status: response?.status };
  }

  let extracted = extractProductDataFromHtml(htmlContent, sourceUrl);

  if (shouldUsePlaywrightFallback(extracted, url)) {
    try {
      extracted = await extractProductDataWithPlaywright(url);
    } catch (error) {
      console.warn('[SYNC] Playwright fallback failed for', url, error.message || error);
    }
  }

  if (looksLikeInvalidProductExtraction(extracted)) {
    return { imported: false, reason: 'not-a-product-page', product: null };
  }

  if (!looksLikeProductPage(htmlContent, extracted, sourceUrl)) {
    return { imported: false, reason: 'not-a-product-page', product: null };
  }

  const product = buildImportedProduct({
    ...extracted,
    existingIds: existingProducts.map((product) => product.id),
  });

  if (isDuplicate(existingProducts, product)) {
    return { imported: false, product, reason: 'duplicate' };
  }

  const nextProducts = [...existingProducts, product];
  await fs.writeFile(outputPath, JSON.stringify(nextProducts, null, 2));
  return { imported: true, product };
}

function parseArgs(argv) {
  const args = { _: [] };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--url') {
      args.url = argv[index + 1];
      index += 1;
    } else if (token === '--output') {
      args.output = argv[index + 1];
      index += 1;
    } else if (token === '--dry-run') {
      args.dryRun = true;
    } else if (token.startsWith('--')) {
      args[token.slice(2)] = argv[index + 1];
      index += 1;
    } else {
      args._.push(token);
    }
  }

  return args;
}

const isDirectRun = process.argv[1] && process.argv[1].endsWith('import-product-from-url.mjs');

if (isDirectRun) {
  const args = parseArgs(process.argv.slice(2));
  const inputUrl = args.url || args._[0];

  if (!inputUrl) {
    console.error('Usage: node ./scripts/import-product-from-url.mjs --url https://example.com/produit');
    process.exitCode = 1;
  } else {
    fs.readFile(seedPath, 'utf8')
      .then((raw) => JSON.parse(raw))
      .then((seedProducts) => importProductFromUrl({
        url: inputUrl,
        outputPath: args.output ? path.resolve(projectRoot, args.output) : seedPath,
        existingProducts: Array.isArray(seedProducts) ? seedProducts : seedProducts.products ?? [],
      }))
      .then((result) => {
        if (result.imported) {
          console.log(`Imported product: ${result.product.name}`);
        } else {
          console.log(`Product already exists: ${result.product.name}`);
        }
      })
      .catch((error) => {
        console.error('Failed to import product:', error);
        process.exitCode = 1;
      });
  }
}
