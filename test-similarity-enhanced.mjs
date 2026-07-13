/**
 * Test script: Compare similarity algorithms on cure.ma products
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { computeEnhancedSimilarity, findRelatedProducts } from './scripts/similarity-enhanced.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const publicPath = path.resolve(__dirname, 'public/api/products.json');
let products = [];

if (fs.existsSync(publicPath)) {
  products = JSON.parse(fs.readFileSync(publicPath, 'utf8'));
} else {
  console.error('Products file not found');
  process.exit(1);
}

// Find cure.ma products
const cureProducts = products.filter(p => 
  (p.description && p.description.includes('cure.ma')) || 
  (p.sourceUrl && p.sourceUrl.includes('cure.ma'))
);

console.log(`\n${'='.repeat(80)}`);
console.log('SIMILARITY ALGORITHM TEST - CURE.MA PRODUCTS');
console.log(`${'='.repeat(80)}\n`);

console.log(`Testing ${cureProducts.length} cure.ma products against ${products.length} total products\n`);

// Test each cure.ma product
for (const testProduct of cureProducts) {
  console.log(`\nProduct: ${testProduct.name}`);
  console.log(`  DCI: ${testProduct.dci}`);
  console.log(`  Form: ${testProduct.form}`);
  console.log(`  Lab: ${testProduct.laboratory}\n`);

  const related = findRelatedProducts(testProduct, products, 25, 5);
  
  if (related.length === 0) {
    console.log('  ❌ No related products found (score < 25)\n');
  } else {
    console.log(`  ✓ Found ${related.length} related products:\n`);
    
    related.forEach((relatedId, idx) => {
      const relProduct = products.find(p => p.id === relatedId);
      if (relProduct) {
        const result = computeEnhancedSimilarity(testProduct, relProduct);
        console.log(`    ${idx + 1}. [Score: ${result.score}] ${relProduct.name}`);
        console.log(`       DCI: ${relProduct.dci} | Form: ${relProduct.form}`);
        
        // Show scoring details for first match
        if (idx === 0 && result.traces) {
          result.traces.forEach(trace => {
            console.log(`       ${trace}`);
          });
        }
      }
    });
    console.log();
  }
}

// Summary statistics
console.log(`\n${'='.repeat(80)}`);
console.log('SUMMARY');
console.log(`${'='.repeat(80)}\n`);

let productsWithMatches = 0;
let totalMatches = 0;

for (const testProduct of cureProducts) {
  const related = findRelatedProducts(testProduct, products, 25, 5);
  if (related.length > 0) {
    productsWithMatches++;
    totalMatches += related.length;
  }
}

console.log(`Products with at least 1 related product: ${productsWithMatches}/${cureProducts.length}`);
console.log(`Average related products per cure.ma item: ${(totalMatches / cureProducts.length).toFixed(2)}`);
console.log(`Total relationships found: ${totalMatches}`);
console.log();
