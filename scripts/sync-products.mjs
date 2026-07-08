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

function normalizeProductKey(product) {
  const name = String(product.name || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const dci = String(product.dci || '').trim().toLowerCase().replace(/\s+/g, ' ');
  return `${name}::${dci}`;
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
  const productsById = new Map();
  const uniqueProducts = [];

  for (const product of products) {
    if (product.id != null) {
      const existing = productsById.get(product.id);
      if (!existing || preferProduct(existing, product)) {
        productsById.set(product.id, product);
      }
      continue;
    }
    uniqueProducts.push(product);
  }

  const seenKeys = new Set();
  const deduped = [];

  for (const product of [...productsById.values(), ...uniqueProducts]) {
    const key = normalizeProductKey(product);
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    deduped.push(product);
  }

  return deduped;
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

    for (const sourceUrl of uniqueUrls.slice(0, 5)) {
      const result = await importProductFromUrl({
        url: sourceUrl,
        outputPath: sourcePath,
        existingProducts: products,
      });

      if (result.imported) {
        products = [...products, result.product];
        importedProducts.push({ ...result.product, sourceUrl });
      }
    }
  } catch {
    // Ignore missing or malformed source configuration.
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
