import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { importProductFromUrl } from './import-product-from-url.mjs';
import { discoverProductUrls } from './discover-products.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const sourcePath = path.join(projectRoot, 'src', 'data', 'market-products.seed.json');
const sourceConfigPath = path.join(projectRoot, 'src', 'data', 'market-products.sources.json');
const mockProductsPath = path.join(projectRoot, 'src', 'data', 'mock', 'products.json');
const outputPath = path.join(projectRoot, 'public', 'api', 'products.json');
const metadataPath = path.join(projectRoot, 'public', 'api', 'last-sync.json');

function isPlaceholderValue(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === '' || normalized === 'à préciser' || normalized === 'a preciser';
}

function isPlausibleProductField(value, type) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized || normalized === 'à préciser' || normalized === 'a preciser') return false;

  if (type === 'dosage') {
    return /\d/.test(normalized) || /(mg|g|ml|µg|mcg|%|ui|unité|capsule|comprimé|gélule|spray|pommade|patch|solution|suppositoire|inject|ampoule)/i.test(normalized);
  }

  if (type === 'form') {
    return /(comprimé|capsule|gélule|solution|sirop|sachet|patch|crème|gel|spray|dispositif|ampoule|injection|suppositoire|collyre|pommade|patch)/i.test(normalized) || normalized.length <= 40;
  }

  if (type === 'laboratory') {
    return normalized.length >= 3 && !/^(article|actualité|actualite|blog|news|communiqu|communiqué)/i.test(normalized);
  }

  if (type === 'dci') {
    return normalized.length >= 3 && !/^(article|actualité|actualite|blog|news|communiqu|communiqué)/i.test(normalized);
  }

  return normalized.length > 0;
}

function looksLikeImportedPlaceholderProduct(product) {
  const therapeuticClass = String(product.therapeuticClass || '').toLowerCase();
  const description = String(product.description || '').toLowerCase();
  const importedSignal = therapeuticClass.includes('produit importé automatiquement') || description.includes('produit importé automatiquement');
  if (!importedSignal) return false;

  const plausibleFields = [
    isPlausibleProductField(product.dci, 'dci'),
    isPlausibleProductField(product.laboratory, 'laboratory'),
    isPlausibleProductField(product.form, 'form'),
    isPlausibleProductField(product.dosage, 'dosage'),
  ].filter(Boolean).length;

  const titleLooksLikeArticle = /^(le |la |les |l’|l'|article|actualité|actualite|blog|news|communiqué|communiqu)/i.test(String(product.name || '').trim());

  return plausibleFields < 2 || titleLooksLikeArticle;
}

function normalizeProducts(products) {
  return products
    .filter(Boolean)
    .map((product) => ({
      ...product,
      categories: Array.isArray(product.categories) ? product.categories : [product.categories].filter(Boolean),
      relatedIds: Array.isArray(product.relatedIds) ? product.relatedIds : [],
      ppm: typeof product.ppm === 'number' ? product.ppm : undefined,
    }))
    .filter((product) => !looksLikeImportedPlaceholderProduct(product));
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

function splitTokens(value) {
  return normalizeString(value).split(' ').filter(Boolean);
}

function normalizeProductKey(product) {
  const name = normalizeString(product.name);
  const dci = normalizeString(product.dci);
  if (dci && dci !== 'a preciser' && dci !== 'a completer' && dci !== 'n/a') {
    return `${name}::${dci}`;
  }
  return name;
}

function extractProductUrl(product) {
  const text = String(product.sourceUrl || product.description || '');
  const match = text.match(/https?:\/\/[\w\-./?&=%#]+/);
  return match ? match[0].replace(/[.,;]+$/, '') : '';
}

function areProductsDuplicate(existing, candidate) {
  const existingName = normalizeString(existing.name);
  const candidateName = normalizeString(candidate.name);
  const existingDci = normalizeString(existing.dci);
  const candidateDci = normalizeString(candidate.dci);

  if (existingName && candidateName && existingName === candidateName && existingDci === candidateDci) return true;

  const existingUrl = extractProductUrl(existing);
  const candidateUrl = extractProductUrl(candidate);
  if (existingUrl && candidateUrl && existingUrl === candidateUrl) return true;

  if (existingDci && candidateDci && existingDci === candidateDci) {
    if (existingName && candidateName && (existingName === candidateName || existingName.includes(candidateName) || candidateName.includes(existingName))) {
      return true;
    }
  }

  const existingTokens = splitTokens(existingDci || existingName);
  const candidateTokens = splitTokens(candidateDci || candidateName);
  const sharedTokens = existingTokens.filter((token) => candidateTokens.includes(token));
  if (sharedTokens.length >= 2) {
    const sharedNameTokens = splitTokens(existingName).filter((token) => splitTokens(candidateName).includes(token));
    if (sharedNameTokens.length >= 2) return true;
  }

  return false;
}

function isPlaceholderProduct(product) {
  const therapeuticClass = String(product.therapeuticClass || '').toLowerCase();
  const dci = String(product.dci || '').trim().toLowerCase();
  return (
    therapeuticClass.includes('produit import') ||
    dci === 'à préciser' ||
    dci === 'a preciser'
  );
}

function isLocalCatalogueProduct(product) {
  return String(product.description || '').toLowerCase().includes('catalogue local');
}

function preferProduct(existing, candidate) {
  const existingLocal = isLocalCatalogueProduct(existing);
  const candidateLocal = isLocalCatalogueProduct(candidate);
  if (existingLocal !== candidateLocal) return candidateLocal;

  const existingPlaceholder = isPlaceholderProduct(existing);
  const candidatePlaceholder = isPlaceholderProduct(candidate);
  if (existingPlaceholder !== candidatePlaceholder) return !candidatePlaceholder;

  return false;
}

function dedupeProducts(products) {
  // Merge duplicates by normalized name::dci key, or by similar DCI/name combinations.
  const map = new Map();

  function isPlaceholderValue(v) {
    const s = normalizeString(v);
    return !s || s === 'a preciser' || s === 'a completer';
  }

  function mergeFields(target, src) {
    // prefer non-placeholder values
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
      } else if (isPlaceholderValue(sv)) {
        // keep tv
      } else {
        target[key] = tv;
      }
    }
  }

  for (const product of products) {
    const key = normalizeProductKey(product);
    let existing = map.get(key);
    if (!existing) {
      existing = [...map.values()].find((candidate) => areProductsDuplicate(candidate, product));
    }

    if (!existing) {
      map.set(key, { ...product, categories: Array.isArray(product.categories) ? product.categories : [product.categories].filter(Boolean), relatedIds: Array.isArray(product.relatedIds) ? product.relatedIds : [] });
      continue;
    }

    const preferCandidate = preferProduct(existing, product) ? product : existing;
    const base = preferCandidate === existing ? existing : product;
    const other = preferCandidate === existing ? product : existing;

    mergeFields(base, other);
    base.relatedIds = Array.from(new Set([...(base.relatedIds || []), ...(other.relatedIds || [])].filter(Boolean)));
    base.categories = Array.from(new Set([...(base.categories || []), ...(other.categories || [])].filter(Boolean)));
    if (!base.id && other.id) base.id = other.id;

    if (base !== existing) {
      const existingKey = normalizeProductKey(existing);
      map.delete(existingKey);
      map.set(key, base);
    }
  }

  return Array.from(map.values());
}

function inferCategoryFromFamily(family) {
  const normalized = String(family || '').toLowerCase();
  if (/(antiinflamm|antalg|douleur|pain)/i.test(normalized)) return ['analgesic'];
  if (/(antibiot|infection)/i.test(normalized)) return ['antibiotic'];
  if (/(diab|cardio|hypert|tension)/i.test(normalized)) return ['cardiovascular'];
  if (/(vitamin|vitamines)/i.test(normalized)) return ['vitamins'];
  if (/(derm|pansement|consomm|materiel|protection)/i.test(normalized)) return ['dermatology'];
  return ['digestive'];
}

function formatLocalProductDescription(product) {
  const family = String(product.Famille || '').trim();
  const presentation = String(product.Presentation || '').trim();
  const laboratory = String(product.Laboratoire || '').trim();
  const form = String(product.Forme || '').trim();
  const dosage = String(product.Dosage || '').trim();

  if (presentation) {
    return `Produit de base issu du catalogue local, ${presentation.toLowerCase()}.`;
  }

  if (form && dosage) {
    return `${form} ${dosage} issu du catalogue local.`;
  }

  if (family) {
    return `Produit de base issu du catalogue local ${family.toLowerCase()}.`;
  }

  if (laboratory) {
    return `Produit de base issu du catalogue local ${laboratory}.`;
  }

  return 'Produit de base issu du catalogue local.';
}

const fallbackBaseProducts = [
  { name: 'DOLIPRANE 1000MG', dci: 'Paracétamol', laboratory: 'Sanofi Maroc', form: 'Comprimé', dosage: '1000 mg', therapeuticClass: 'Antalgique', categories: ['analgesic'], ppm: 18.5 },
  { name: 'AMOXICILLINE 500MG', dci: 'Amoxicilline', laboratory: 'Cooper Pharma', form: 'Capsule', dosage: '500 mg', therapeuticClass: 'Antibiotique', categories: ['antibiotic'], ppm: 21.5 },
  { name: 'AZITHROMYCINE 500MG', dci: 'Azithromycine', laboratory: 'Maphar', form: 'Comprimé', dosage: '500 mg', therapeuticClass: 'Macrolide', categories: ['antibiotic'], ppm: 59 },
  { name: 'CETIRIZINE 10MG', dci: 'Cétirizine', laboratory: 'Cooper Pharma', form: 'Comprimé', dosage: '10 mg', therapeuticClass: 'Antihistaminique', categories: ['respiratory'], ppm: 27.5 },
  { name: 'LORATADINE 10MG', dci: 'Loratadine', laboratory: 'Sanofi Maroc', form: 'Comprimé', dosage: '10 mg', therapeuticClass: 'Antihistaminique', categories: ['respiratory'], ppm: 24.5 },
  { name: 'METFORMINE 850MG', dci: 'Metformine', laboratory: 'Merck Maroc', form: 'Comprimé', dosage: '850 mg', therapeuticClass: 'Antidiabétique', categories: ['cardiovascular'], ppm: 46 },
  { name: 'ATORVASTATINE 20MG', dci: 'Atorvastatine', laboratory: 'Pfizer Maroc', form: 'Comprimé', dosage: '20 mg', therapeuticClass: 'Hypolipémiant', categories: ['cardiovascular'], ppm: 84 },
  { name: 'VITAMINE C 500MG', dci: 'Vitamine C', laboratory: 'Cooper Pharma', form: 'Comprimé effervescent', dosage: '500 mg', therapeuticClass: 'Vitamine', categories: ['vitamins'], ppm: 31 },
  { name: 'OMEPRAZOLE 20MG', dci: 'Oméprazole', laboratory: 'Cooper Pharma', form: 'Gélule', dosage: '20 mg', therapeuticClass: 'IPP', categories: ['digestive'], ppm: 29 },
  { name: 'PREDNISOLONE 20MG', dci: 'Prednisolone', laboratory: 'Cooper Pharma', form: 'Comprimé', dosage: '20 mg', therapeuticClass: 'Corticostéroïde', categories: ['dermatology'], ppm: 19 },
  { name: 'BETA-DINE 10%', dci: 'Povidone iodée', laboratory: 'Mundi Pharma', form: 'Solution', dosage: '10%', therapeuticClass: 'Antiseptique', categories: ['dermatology'], ppm: 22 },
  { name: 'SERINGUE 5ML', dci: 'Seringue', laboratory: 'Cooper Dismedic', form: 'Dispositif médical', dosage: '5 ml', therapeuticClass: 'Matériel médical', categories: ['dermatology'], ppm: 3.5 },
];

async function loadBaseProducts() {
  try {
    const mockRaw = await fs.readFile(mockProductsPath, 'utf8');
    const mockData = JSON.parse(mockRaw);
    const mockProducts = Array.isArray(mockData?.products) ? mockData.products : [];

    return normalizeProducts([
      ...fallbackBaseProducts.map((product, index) => ({
        id: 1000 + index,
        ...product,
        description: `Produit de base ajouté par le synchroniseur ${product.name}.`,
        indications: 'À compléter',
        posology: 'À compléter',
        contraindications: 'À compléter',
        sideEffects: 'À compléter',
        conservation: 'À compléter',
        pregnancyCategory: 'N/A',
        isPrescriptionRequired: false,
        relatedIds: [],
      })),
      ...mockProducts.map((product, index) => ({
        id: Number(product.id_produit || index + 1000),
        name: String(product.designation || `Produit ${index + 1}`).toUpperCase(),
        dci: String(product.designation || 'À préciser'),
        laboratory: String(product.Laboratoire || 'À préciser'),
        form: String(product.Forme || 'À préciser'),
        dosage: String(product.Dosage || 'À préciser'),
        therapeuticClass: String(product.Famille || 'Produit de base'),
        categories: inferCategoryFromFamily(product.Famille),
        description: formatLocalProductDescription(product),
        indications: 'À compléter',
        posology: 'À compléter',
        contraindications: 'À compléter',
        sideEffects: 'À compléter',
        conservation: 'À compléter',
        pregnancyCategory: 'N/A',
        isPrescriptionRequired: false,
        ppm: Number(product.PPM) || undefined,
        relatedIds: [],
      })),
    ]);
  } catch {
    return [];
  }
}

export async function syncProducts() {
  const raw = await fs.readFile(sourcePath, 'utf8').catch(() => '[]');
  const parsed = JSON.parse(raw);
  const seedProducts = normalizeProducts(Array.isArray(parsed) ? parsed : parsed.products ?? []);
  const baseProducts = await loadBaseProducts();
  let products = dedupeProducts([...baseProducts, ...seedProducts]);
  const importedProducts = [];

  try {
    const sourceConfigRaw = await fs.readFile(sourceConfigPath, 'utf8');
    const sourceConfig = JSON.parse(sourceConfigRaw);
    const sources = Array.isArray(sourceConfig.sources) ? sourceConfig.sources : [];
    const discoveredUrls = await discoverProductUrls();
    const requestedUrls = [
      ...sources.map((source) => (typeof source === 'string' ? source : source.url)).filter(Boolean),
      ...discoveredUrls,
    ];
    const uniqueUrls = [...new Set(requestedUrls)];

    // Check which URLs are already imported to avoid duplicate fetches
    const alreadyImportedUrls = new Set(
      products
        .map((p) => {
          const match = p.description?.match(/https?:\/\/www\.cure\.ma\/medicaments\/[a-zA-Z0-9-.\/]+/);
          return match ? match[0].replace(/[.,]$/, '').trim() : null;
        })
        .filter(Boolean)
    );

    const urlsToImport = uniqueUrls.filter((url) => !alreadyImportedUrls.has(url));

    // Limit to 500 URLs per sync run to balance performance and throughput
    // Adjust based on server performance and rate-limiting concerns
    const batchToImport = urlsToImport.slice(0, 500);

    // Parallel fetching with concurrency limit of 10 for improved throughput
    const mapLimit = async (items, limit, fn) => {
      const results = [];
      const executing = new Set();
      for (const item of items) {
        const p = Promise.resolve().then(() => fn(item));
        results.push(p);
        executing.add(p);
        const clean = () => executing.delete(p);
        p.then(clean, clean);
        if (executing.size >= limit) {
          await Promise.race(executing);
        }
      }
      return Promise.all(results);
    };

    console.log(`[SYNC] 📊 Statistics:`);
    console.log(`[SYNC]    • Total discovered URLs: ${uniqueUrls.length}`);
    console.log(`[SYNC]    • Already imported: ${alreadyImportedUrls.size}`);
    console.log(`[SYNC]    • New URLs to import: ${urlsToImport.length}`);
    console.log(`[SYNC]    • Batch size: ${batchToImport.length}`);
    console.log(`[SYNC]    • Concurrency limit: 10 requests`);
    console.log(`[SYNC] 🔄 Starting parallel import...\n`);

    const fetched = await mapLimit(batchToImport, 10, async (url) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const response = await fetch(url, {
          redirect: 'follow',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
          },
        });
        clearTimeout(timeout);
        if (!response.ok) return { url, ok: false };
        const html = await response.text();
        return { url, ok: true, html };
      } catch {
        return { url, ok: false };
      }
    });

    for (const entry of fetched) {
      if (!entry.ok) continue;
      const result = await importProductFromUrl({
        url: entry.url,
        outputPath: sourcePath,
        existingProducts: products,
        html: entry.html,
      });

      if (result.imported) {
        products = [...products, result.product];
        importedProducts.push({ ...result.product, sourceUrl: entry.url });
      }
    }
  } catch (err) {
    console.error('[SYNC] Error during synchronization processing:', err);
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(products, null, 2));

  const syncReport = {
    syncedAt: new Date().toISOString(),
    count: products.length,
    importedCount: importedProducts.length,
    importedProducts: importedProducts.map((product) => ({
      id: product.id,
      name: product.name,
      dci: product.dci,
      url: product.sourceUrl,
    })),
  };

  await fs.writeFile(metadataPath, JSON.stringify(syncReport, null, 2));

  return { ...syncReport, outputPath, metadataPath };
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  syncProducts()
    .then((result) => {
      console.log(`Products synced successfully: ${result.count} items`);
    })
    .catch((error) => {
      console.error('Failed to sync products:', error);
      process.exitCode = 1;
    });
}
