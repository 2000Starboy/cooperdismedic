import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicPath = path.resolve('./public/api/products.json');
const distPath = path.resolve('./dist/api/products.json');

let products = [];
if (fs.existsSync(publicPath)) {
  products = JSON.parse(fs.readFileSync(publicPath, 'utf8'));
} else if (fs.existsSync(distPath)) {
  products = JSON.parse(fs.readFileSync(distPath, 'utf8'));
} else {
  console.error('Products file not found');
  process.exit(1);
}

// Find products from cure.ma
const cureProducts = products.filter(p => 
  (p.description && p.description.includes('cure.ma')) || 
  (p.sourceUrl && p.sourceUrl.includes('cure.ma'))
);

console.log(`\n=== Products from cure.ma: ${cureProducts.length} ===\n`);

// Count products with missing fields
let incompleteDci = 0;
let incompleteLab = 0;
let incompleteForm = 0;
let incompleteDosage = 0;

cureProducts.forEach(p => {
  if (!p.dci || p.dci === 'À préciser' || p.dci === 'a preciser') incompleteDci++;
  if (!p.laboratory || p.laboratory === 'À préciser' || p.laboratory === 'a preciser') incompleteLab++;
  if (!p.form || p.form === 'À préciser' || p.form === 'a preciser') incompleteForm++;
  if (!p.dosage || p.dosage === 'À préciser' || p.dosage === 'a preciser') incompleteDosage++;
});

console.log('Missing fields in cure.ma products:');
console.log(`  DCI missing: ${incompleteDci}/${cureProducts.length}`);
console.log(`  Laboratory missing: ${incompleteLab}/${cureProducts.length}`);
console.log(`  Form missing: ${incompleteForm}/${cureProducts.length}`);
console.log(`  Dosage missing: ${incompleteDosage}/${cureProducts.length}\n`);

// Show sample products
console.log('Sample products from cure.ma:');
cureProducts.slice(0, 8).forEach((p, i) => {
  console.log(`\n${i+1}. ${p.name}`);
  console.log(`   DCI: ${p.dci || '(missing)'}`);
  console.log(`   Lab: ${p.laboratory || '(missing)'}`);
  console.log(`   Form: ${p.form || '(missing)'}`);
  console.log(`   Dosage: ${p.dosage || '(missing)'}`);
  console.log(`   Category: ${(p.categories || []).join(', ')}`);
  console.log(`   Related: ${(p.relatedIds || []).join(', ') || '(none)'}`);
});
