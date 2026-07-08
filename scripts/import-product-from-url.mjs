import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
  const pattern = new RegExp(
    `(?:${labels.join('|')})\\s*[:\\-]\\s*([^\\n.;,]{1,120}?)(?=(?:\\s+(?:Laboratoire|Laboratory|Fabricant|Manufacturer|Marque|Forme|Formulation|Présentation|Dosage|Dose|Concentration|Dosage recommandé|DCI|Principe actif|Substance active|Substance active ingredient|Active ingredient))|$)`,
    'i'
  );
  const match = text.match(pattern);
  return match ? normalizeText(match[1]) : '';
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
      jsonLd?.additionalProperty?.find((entry) => /dci|active|principe|substance/i.test(entry.name || ''))?.value
  );
  const laboratory = normalizeText(
    extractByLabel(plainText, ['Laboratoire', 'Laboratory', 'Fabricant', 'Manufacturer', 'Marque', 'Laboratoires']) ||
      jsonLd?.brand?.name ||
      jsonLd?.manufacturer?.name
  );
  const form = normalizeText(extractByLabel(plainText, ['Forme', 'Formulation', 'Présentation', 'Présentation galénique', 'Galénique']));
  const dosage = normalizeText(extractByLabel(plainText, ['Dosage', 'Dose', 'Concentration', 'Dosage recommandé', 'Dose recommandée', 'Dosage thérapeutique']));

  return {
    name,
    dci,
    laboratory,
    form,
    dosage,
    sourceUrl,
    description: normalizeText(jsonLd?.description || `${name} importé automatiquement depuis ${sourceUrl || 'une source externe'}.`),
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
    indications: 'À compléter',
    posology: 'À compléter',
    contraindications: 'À compléter',
    sideEffects: 'À compléter',
    conservation: 'À compléter',
    pregnancyCategory: 'N/A',
    isPrescriptionRequired: false,
    relatedIds: [],
  };
}

function isDuplicate(existingProducts, incomingProduct) {
  const normalizedIncoming = `${incomingProduct.name} ${incomingProduct.dci}`.toLowerCase();
  return existingProducts.some((product) => `${product.name} ${product.dci}`.toLowerCase() === normalizedIncoming);
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

function looksLikeProductPage(html, extracted) {
  const plainText = stripHtml(html).toLowerCase();
  const hasProductMetadata = Boolean(extracted.dci && extracted.dci !== 'À préciser')
    || Boolean(extracted.laboratory && extracted.laboratory !== 'À préciser')
    || Boolean(extracted.form && extracted.form !== 'À préciser')
    || Boolean(extracted.dosage && extracted.dosage !== 'À préciser');
  const hasStructuredData = /application\/ld\+json/i.test(html);
  const hasProductSignals = /(dci|laboratoire|laboratory|fabricant|manufacturer|forme|dosage|substance active|principe actif|composition|présentation|médicament|medicament|produit|product)/i.test(plainText);
  const looksLikeArticle = /article|actualité|actualite|blog|news|actualité/i.test((extracted.name || '').toLowerCase());

  return (hasProductMetadata || hasStructuredData || hasProductSignals) && !looksLikeArticle;
}

export async function importProductFromUrl({
  url,
  outputPath = seedPath,
  existingProducts = [],
  sourceUrl = url,
}) {
  let response;

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

  const html = await response.text();

  if (looksLikeInvalidPage(html, url)) {
    return { imported: false, reason: 'invalid-page', status: response.status };
  }

  const extracted = extractProductDataFromHtml(html, sourceUrl);

  if (!looksLikeProductPage(html, extracted)) {
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
