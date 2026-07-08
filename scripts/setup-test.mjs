#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Read the compiled TypeScript to extract product data
const distPath = path.resolve('./dist-test');
if (!fs.existsSync(distPath)) {
  fs.mkdirSync(distPath, { recursive: true });
}

// Export products as JSON for testing
const code = `
import { PRODUCTS, getRelatedProducts } from '../src/data/products-catalogue.ts';
import fs from 'fs';

const exported = PRODUCTS.map(p => ({
  id: p.id,
  name: p.name,
  dci: p.dci,
  dosage: p.dosage,
  form: p.form,
  categories: p.categories,
  laboratory: p.laboratory,
}));

fs.writeFileSync('./dist-test/products.json', JSON.stringify(exported, null, 2));

// Find Vitamine D3
const vitaminD3 = PRODUCTS.find(p => p.name.includes('VITAMINE D3'));
if (vitaminD3) {
  const related = getRelatedProducts(vitaminD3, 4);
  const result = {
    product: {
      id: vitaminD3.id,
      name: vitaminD3.name,
      dci: vitaminD3.dci,
      dosage: vitaminD3.dosage,
      form: vitaminD3.form,
      categories: vitaminD3.categories,
    },
    relatedProducts: related.map(p => ({
      id: p.id,
      name: p.name,
      dci: p.dci,
      dosage: p.dosage,
      form: p.form,
      categories: p.categories,
    })),
  };
  fs.writeFileSync('./dist-test/vitaminD3-related.json', JSON.stringify(result, null, 2));
  console.log('✅ Exported Vitamine D3 related products');
}
`;

fs.writeFileSync('./scripts/export-products.mjs', code);

console.log('Export script created. Building and running...');
