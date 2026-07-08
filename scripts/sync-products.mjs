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

function normalizeProducts(products) {
  return products
    .filter(Boolean)
    .map((product) => ({
      ...product,
      categories: Array.isArray(product.categories) ? product.categories : [product.categories].filter(Boolean),
      relatedIds: Array.isArray(product.relatedIds) ? product.relatedIds : [],
      ppm: typeof product.ppm === 'number' ? product.ppm : undefined,
    }))
    .filter((product) => !(
      product.therapeuticClass === 'Produit importé automatiquement' &&
      product.dci === 'À préciser' &&
      product.laboratory === 'À préciser' &&
      product.form === 'À préciser' &&
      product.dosage === 'À préciser'
    ));
}

function dedupeProducts(products) {
  const seen = new Set();
  return products.filter((product) => {
    const key = `${(product.name || '').toLowerCase()}::${(product.dci || '').toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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
        description: `Produit de base issu du catalogue local ${String(product.Famille || 'local')}.`,
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
      }
    }
  } catch {
    // Ignore missing or malformed source configuration.
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(products, null, 2));

  await fs.writeFile(
    metadataPath,
    JSON.stringify({ syncedAt: new Date().toISOString(), count: products.length }, null, 2)
  );

  return { count: products.length, outputPath, metadataPath };
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
