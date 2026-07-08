#!/usr/bin/env node

import { PRODUCTS, getRelatedProducts } from '../src/data/products-catalogue.ts';

console.log('🧪 Testing Related Products Algorithm\n');
console.log('='.repeat(60));

// Test for Vitamine D3 and a few other problematic cases
const testProducts = [
  PRODUCTS.find((p) => p.name.includes('VITAMINE D3')),
  PRODUCTS.find((p) => p.name.includes('CÉTIRIZINE')),
  PRODUCTS.find((p) => p.name.includes('PROBIOTIQUES')),
  PRODUCTS.find((p) => p.name.includes('PARACÉTAMOL')),
  PRODUCTS.find((p) => p.name.includes('IBUPROFÈNE')),
];

for (const product of testProducts.filter(Boolean)) {
  console.log(`\n📌 ${product.id}. ${product.name}`);
  console.log(`   DCI: ${product.dci}`);
  console.log(`   Dosage: ${product.dosage}`);
  console.log(`   Forme: ${product.form}`);
  console.log(`   Catégories: ${product.categories.join(', ')}`);

  const related = getRelatedProducts(product, 4);
  console.log(`\n   ✨ Produits similaires:`);
  if (related.length === 0) {
    console.log(`   ❌ Aucun produit similaire trouvé`);
  } else {
    for (const rel of related) {
      console.log(
        `      • ${rel.id}. ${rel.name} (DCI: ${rel.dci}, Dosage: ${rel.dosage})`
      );
    }
  }
  console.log('-'.repeat(60));
}
