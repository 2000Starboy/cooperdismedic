import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const productsPath = path.join(projectRoot, 'public', 'api', 'products.json');

const isPlaceholder = (val) => {
  if (!val) return true;
  const s = String(val).trim().toLowerCase();
  return s === '' || s === 'à compléter' || s === 'a completer' || s === 'a préciser' || s === 'à préciser';
};

function run() {
  if (!fs.existsSync(productsPath)) {
    console.error('products.json not found');
    return;
  }

  const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
  console.log(`Loaded ${products.length} products.`);

  // 1. Build index of fully completed products by DCI, Dosage, and Form
  const completedMap = new Map();
  const fields = ['indications', 'posology', 'contraindications', 'sideEffects', 'conservation'];

  for (const p of products) {
    const hasMissing = fields.some(f => isPlaceholder(p[f]));
    if (!hasMissing) {
      const key = `${normalize(p.dci)}::${normalize(p.dosage)}::${normalize(p.form)}`;
      completedMap.set(key, p);
    }
  }

  console.log(`Found ${completedMap.size} unique completed DCI+Dosage+Form combinations.`);

  // 2. Try to fill missing fields in products
  let updatedProductsCount = 0;
  let filledAttributesCount = 0;

  for (const p of products) {
    const missingFields = fields.filter(f => isPlaceholder(p[f]));
    if (missingFields.length === 0) continue;

    const key = `${normalize(p.dci)}::${normalize(p.dosage)}::${normalize(p.form)}`;
    const source = completedMap.get(key);

    if (source) {
      let updatedThisProduct = false;
      for (const f of missingFields) {
        if (!isPlaceholder(source[f])) {
          p[f] = source[f];
          filledAttributesCount++;
          updatedThisProduct = true;
        }
      }
      if (updatedThisProduct) {
        updatedProductsCount++;
      }
    }
  }

  if (updatedProductsCount > 0) {
    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2), 'utf8');
    console.log(`✓ Updated ${updatedProductsCount} products with local reuse, filling ${filledAttributesCount} attributes.`);
  } else {
    console.log('No products could be updated via local reuse.');
  }
}

function normalize(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

run();
