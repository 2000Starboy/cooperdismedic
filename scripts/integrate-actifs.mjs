import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'module';
import { findSimilarProductIds } from './similarity-engine.mjs';

const require = createRequire(import.meta.url);
const XLSX = require('./ammps-cleaner/node_modules/xlsx/xlsx.js');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const seedPath = path.join(projectRoot, 'src', 'data', 'market-products.seed.json');
const outputPath = path.join(projectRoot, 'public', 'api', 'products.json');
const excelPath = path.join(projectRoot, 'medicaments_actifs.xlsx');

// Backup paths from the first run to restore from
const initialSeedBackup = path.join(projectRoot, 'src', 'data', 'market-products.seed.json.bak.1784027292250');
const initialOutputBackup = path.join(projectRoot, 'public', 'api', 'products.json.bak.1784027292254');

function normalizeString(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function areProductsDuplicate(existing, incoming) {
  const existingName = normalizeString(existing.name);
  const incomingName = normalizeString(incoming.name);
  const existingDci = normalizeString(existing.dci);
  const incomingDci = normalizeString(incoming.dci);
  const existingForm = normalizeString(existing.form);
  const incomingForm = normalizeString(incoming.form);

  // Since we append dosage to the name, matching names matches brand + dosage.
  // We also require DCI and Form to match (or be placeholder).
  if (existingName === incomingName && existingDci === incomingDci) {
    return existingForm === incomingForm || 
           existingForm === 'a preciser' || 
           incomingForm === 'a preciser' ||
           existingForm.includes(incomingForm) ||
           incomingForm.includes(existingForm);
  }
  return false;
}

function titleCase(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function guessClassification(dci) {
  const norm = normalizeString(dci);
  if (/paracetamol|ibuprofene|aspirine|ketoprofene|diclofenac|tramadol|codeine|morphine/i.test(norm)) {
    return { therapeuticClass: 'Analgésique', categories: ['analgesic'] };
  }
  if (/cilline|mycine|oxacine|vir|cef|penem|cycline/i.test(norm)) {
    return { therapeuticClass: 'Antibiotique / Antiviral', categories: ['antibiotic'] };
  }
  if (/pril|sartan|lol|statin|amlodipine|diltiazem|furosemide|spironolactone/i.test(norm)) {
    return { therapeuticClass: 'Cardiovasculaire', categories: ['cardiovascular'] };
  }
  if (/vitamine|acide ascorbique|calciferol|tocopherol|retinol/i.test(norm)) {
    return { therapeuticClass: 'Vitamine', categories: ['vitamins'] };
  }
  if (/prednis|cortis|betamethasone|dexamethasone|mometasone/i.test(norm)) {
    return { therapeuticClass: 'Corticostéroïde', categories: ['dermatology'] };
  }
  if (/cetirizine|loratadine|fexofenadine|desloratadine|ebastine/i.test(norm)) {
    return { therapeuticClass: 'Antihistaminique', categories: ['respiratory'] };
  }
  if (/prazole|tidine|alginate|simethicone|spasmo|loperamide/i.test(norm)) {
    return { therapeuticClass: 'Gastro-intestinal', categories: ['digestive'] };
  }
  return { therapeuticClass: 'Médicament', categories: ['digestive'] };
}

async function run() {
  console.log('=== STARTING ACTIVE MEDICINES INTEGRATION ===');

  // Restore from initial backups if they exist to start clean
  if (fs.existsSync(initialSeedBackup)) {
    fs.copyFileSync(initialSeedBackup, seedPath);
    console.log(`✓ Restored seed file from initial backup: ${initialSeedBackup}`);
  }
  if (fs.existsSync(initialOutputBackup)) {
    fs.copyFileSync(initialOutputBackup, outputPath);
    console.log(`✓ Restored public API file from initial backup: ${initialOutputBackup}`);
  }

  // 2. Load existing seed products
  const existingSeedRaw = fs.existsSync(seedPath) ? fs.readFileSync(seedPath, 'utf8') : '[]';
  const existingProducts = JSON.parse(existingSeedRaw);
  console.log(`Loaded ${existingProducts.length} existing products from seed.`);

  // 3. Load Excel file
  if (!fs.existsSync(excelPath)) {
    console.error(`❌ Excel file not found at: ${excelPath}`);
    process.exit(1);
  }
  console.log(`Reading Excel file: ${excelPath}...`);
  const wb = XLSX.readFile(excelPath);
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const excelRows = XLSX.utils.sheet_to_json(ws);
  console.log(`Loaded ${excelRows.length} active medicine rows from sheet "${sheetName}".`);

  // Build index by DCI to copy details
  const existingByDci = new Map();
  for (const p of existingProducts) {
    const normDci = normalizeString(p.dci);
    if (normDci && !existingByDci.has(normDci)) {
      existingByDci.set(normDci, p);
    }
  }

  // Find max ID in existing
  let maxId = 1999;
  for (const p of existingProducts) {
    if (typeof p.id === 'number' && p.id > maxId) {
      maxId = p.id;
    }
  }
  console.log(`Starting ID assignment for new products at: ${maxId + 1}`);

  const mergedProducts = [...existingProducts];
  let newAddedCount = 0;
  let updatedCount = 0;

  for (const row of excelRows) {
    const rawNom = String(row.NOM || row.AMMPS_NOM || '').toUpperCase().trim();
    if (!rawNom) continue;

    const rowDciNorm = normalizeString(row.DCI1 || row.AMMPS_DCI || '');
    
    // Format fields
    const dci = titleCase(row.DCI1 || row.AMMPS_DCI || 'À préciser');
    const laboratory = titleCase(row.AMMPS_LABO || 'À préciser');
    const form = titleCase(row.FORME || row.AMMPS_FORME || 'À préciser');
    
    let dosage = '';
    if (row.DOSAGE1 !== undefined && row.DOSAGE1 !== null) {
      dosage = String(row.DOSAGE1).trim();
      if (row.UNITE_DOSAGE1) {
        dosage += ' ' + String(row.UNITE_DOSAGE1).trim().toLowerCase();
      }
    } else if (row.AMMPS_DOSAGE) {
      dosage = String(row.AMMPS_DOSAGE).trim();
    } else {
      dosage = 'À préciser';
    }

    // Construct formatted name: Brand + Dosage
    let name = rawNom;
    const cleanDosageToken = dosage !== 'À préciser' ? dosage.toUpperCase().replace(/\s+/g, '') : '';
    if (cleanDosageToken && !normalizeString(name).includes(normalizeString(cleanDosageToken))) {
      name = `${name} ${dosage.toUpperCase()}`;
    }

    const ppm = row.PPV ? Number(row.PPV) : undefined;

    // Check if it already exists
    const candidateProduct = { name, dci, form, dosage };
    const existing = mergedProducts.find((p) => areProductsDuplicate(p, candidateProduct));

    if (existing) {
      // Update price and lab if missing or different
      if (ppm !== undefined) existing.ppm = ppm;
      if (laboratory !== 'À préciser') existing.laboratory = laboratory;
      updatedCount++;
    } else {
      // Create new product
      let therapeuticClass = 'Médicament';
      let categories = ['digestive'];
      let isPrescriptionRequired = false;
      let pregnancyCategory = 'N/A';

      const matchedExistingDci = existingByDci.get(rowDciNorm);
      if (matchedExistingDci) {
        therapeuticClass = matchedExistingDci.therapeuticClass || therapeuticClass;
        categories = matchedExistingDci.categories || categories;
        isPrescriptionRequired = matchedExistingDci.isPrescriptionRequired !== undefined ? matchedExistingDci.isPrescriptionRequired : isPrescriptionRequired;
        pregnancyCategory = matchedExistingDci.pregnancyCategory || pregnancyCategory;
      } else {
        const guessed = guessClassification(row.DCI1 || row.AMMPS_DCI);
        therapeuticClass = guessed.therapeuticClass;
        categories = guessed.categories;
        if (categories.includes('antibiotic') || categories.includes('cardiovascular')) {
          isPrescriptionRequired = true;
        }
      }

      const descForm = form !== 'À préciser' ? form : 'Produit';
      const descDosage = dosage !== 'À préciser' ? ` ${dosage}` : '';
      const descLab = laboratory !== 'À préciser' ? ` par ${laboratory}` : '';
      const description = `${descForm}${descDosage}${descLab}. Produit actif validé par l'AMMPS.`;

      const newId = ++maxId;
      const newProduct = {
        id: newId,
        name,
        dci,
        laboratory,
        form,
        dosage,
        therapeuticClass,
        categories,
        ppm,
        description,
        indications: 'À compléter',
        posology: 'À compléter',
        contraindications: 'À compléter',
        sideEffects: 'À compléter',
        conservation: 'À compléter',
        pregnancyCategory,
        isPrescriptionRequired,
        relatedIds: []
      };

      mergedProducts.push(newProduct);
      newAddedCount++;
    }
  }

  console.log(`Merged results:`);
  console.log(`  • Updated existing products: ${updatedCount}`);
  console.log(`  • Added new products: ${newAddedCount}`);
  console.log(`  • Total products before similarity calculation: ${mergedProducts.length}`);

  // 4. Calculate similarity relations
  console.log('\nCalculating similarity relations for all products...');
  const similarityConfig = { minScore: 1, maxResults: 6 };
  let relationsCount = 0;

  for (const product of mergedProducts) {
    const similarIds = findSimilarProductIds(product, mergedProducts, similarityConfig);
    product.relatedIds = similarIds;
    if (similarIds.length > 0) {
      relationsCount++;
    }
  }
  console.log(`✓ Recalculated similarity: ${relationsCount} products have relations.`);

  // 5. Write to files
  console.log(`\nSaving merged products list...`);
  fs.writeFileSync(seedPath, JSON.stringify(mergedProducts, null, 2), 'utf8');
  console.log(`✓ Saved seed file: ${seedPath}`);

  fs.writeFileSync(outputPath, JSON.stringify(mergedProducts, null, 2), 'utf8');
  console.log(`✓ Saved public API file: ${outputPath}`);

  console.log('\n=== INTEGRATION COMPLETED SUCCESSFULLY ===');
}

run().catch((err) => {
  console.error('Fatal integration error:', err);
  process.exit(1);
});
