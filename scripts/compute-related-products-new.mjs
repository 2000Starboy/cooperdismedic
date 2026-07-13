#!/usr/bin/env node

/**
 * Compute Related Products
 * 
 * Génère les relations de similarité entre médicaments
 * Utilise le Similarity Engine pour calculer les scores
 * 
 * Usage:
 *   node scripts/compute-related-products.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { findSimilarProductIds } from './similarity-engine.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Chemins des fichiers
const publicPath = path.join(projectRoot, 'public', 'api', 'products.json');
const distPath = path.join(projectRoot, 'dist', 'api', 'products.json');

// Load products from either public or dist
let products = [];
let sourceFile = null;

if (fs.existsSync(publicPath)) {
  products = JSON.parse(fs.readFileSync(publicPath, 'utf8'));
  sourceFile = publicPath;
} else if (fs.existsSync(distPath)) {
  products = JSON.parse(fs.readFileSync(distPath, 'utf8'));
  sourceFile = distPath;
} else {
  console.error('❌ Products file not found in public/api or dist/api');
  process.exit(1);
}

if (!Array.isArray(products)) {
  console.error('❌ Products is not an array');
  process.exit(1);
}

console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║            COMPUTE RELATED PRODUCTS - SIMILARITY ENGINE                   ║
╚════════════════════════════════════════════════════════════════════════════╝

📊 Source: ${sourceFile}
📦 Products loaded: ${products.length}
`);

// Configuration
const config = {
  minScore: 1,      // Seuil minimum de score
  maxResults: 6,    // Nombre maximum de résultats
};

console.log(`⚙️  Configuration:`);
console.log(`   Min score threshold: ${config.minScore}`);
console.log(`   Max results per product: ${config.maxResults}`);

console.log(`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 Computing similarities...
`);

// Compute related products for each
const related = {};
let totalRelationships = 0;
let productsWithRelations = 0;

for (const product of products) {
  const similarIds = findSimilarProductIds(product, products, config);

  if (similarIds.length > 0) {
    productsWithRelations++;
    totalRelationships += similarIds.length;
  }

  related[product.id] = similarIds;

  // Log with emoji based on results
  const statusIcon = similarIds.length > 0 ? '✓' : '○';
  const relationText = similarIds.length > 0
    ? `${similarIds.length} similar`
    : 'no matches';

  console.log(`${statusIcon} [${product.id}] ${product.name.substring(0, 50).padEnd(50)} → ${relationText}`);
}

console.log(`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 STATISTICS

  Total products: ${products.length}
  Products with relations: ${productsWithRelations} (${((productsWithRelations / products.length) * 100).toFixed(1)}%)
  Total relationships: ${totalRelationships}
  Avg relations per product: ${(totalRelationships / products.length).toFixed(2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 UPDATE CODE

Add these relatedIds to your products:
`);

// Generate update code
for (const product of products) {
  if (related[product.id].length > 0) {
    console.log(`  relatedIds: [${related[product.id].join(', ')}],  // ${product.name}`);
  }
}

console.log(`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 DETAILED ANALYSIS - Sample Products

`);

// Show detailed analysis for a few products
for (const product of products.slice(0, 3)) {
  const similarIds = related[product.id];

  console.log(`\n📌 ${product.name}`);
  console.log(`   ID: ${product.id}`);
  console.log(`   DCI: ${product.dci || '(missing)'}`);
  console.log(`   Dosage: ${product.dosage || '(missing)'}`);
  console.log(`   Form: ${product.form || '(missing)'}`);

  if (similarIds.length === 0) {
    console.log(`   ❌ No similar products found`);
  } else {
    console.log(`   ✓ Similar products (${similarIds.length}):`);
    similarIds.forEach((id, idx) => {
      const similar = products.find(p => p.id === id);
      if (similar) {
        console.log(`      ${idx + 1}. ${similar.name}`);
      }
    });
  }
}

console.log(`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ COMPLETE

To update your products catalogue:
1. Copy the relatedIds arrays above
2. Update src/data/products-catalogue.ts
3. Run: npm run build
4. Commit changes

For more details, run: node scripts/test-similarity-engine.mjs
`);
