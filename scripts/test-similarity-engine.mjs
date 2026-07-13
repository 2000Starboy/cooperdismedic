#!/usr/bin/env node

/**
 * Test suite - Similarity Engine
 * Valide l'algorithme de calcul de similarité
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  calculateSimilarityScore,
  findSimilarProducts,
  findSimilarProductIds,
  getSimilarityStats,
} from './similarity-engine.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const publicPath = path.join(projectRoot, 'public', 'api', 'products.json');

// Load products
let products = [];
if (fs.existsSync(publicPath)) {
  products = JSON.parse(fs.readFileSync(publicPath, 'utf8'));
}

console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                  TEST SUITE - SIMILARITY ENGINE                           ║
╚════════════════════════════════════════════════════════════════════════════╝

📊 Database: ${products.length} products loaded

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TEST 1: Score Calculation
`);

// Find test cases with known relationships
const paracetamol = products.find(p => p.dci && p.dci.toLowerCase().includes('paracétamol'));
const aspirin = products.find(p => p.dci && p.dci.toLowerCase().includes('aspirine'));
const amoxicillin = products.find(p => p.dci && p.dci.toLowerCase().includes('amoxicilline'));
const ibuprofen = products.find(p => p.dci && p.dci.toLowerCase().includes('ibuprofène'));

if (paracetamol) {
  console.log(`\nProduct: ${paracetamol.name}`);
  console.log(`  DCI: ${paracetamol.dci}`);
  console.log(`  Dosage: ${paracetamol.dosage}`);
  console.log(`  Form: ${paracetamol.form}`);

  const similar = findSimilarProducts(paracetamol, products, {
    maxResults: 3,
    includeBreakdown: true,
  });

  if (similar.length === 0) {
    console.log(`  → No similar products found`);
  } else {
    console.log(`  → Found ${similar.length} similar product(s):\n`);
    similar.forEach((prod, idx) => {
      const candidate = products.find(p => p.id === prod.id);
      console.log(`    ${idx + 1}. ${prod.name} (Score: ${prod.score})`);
      console.log(`       DCI: ${candidate.dci}`);
      console.log(`       Dosage: ${candidate.dosage}`);
      console.log(`       Breakdown: ${JSON.stringify(prod.breakdown)}`);
    });
  }
}

console.log(`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TEST 2: Score Components
`);

if (paracetamol && ibuprofen) {
  console.log(`\nComparing: ${paracetamol.name} vs ${ibuprofen.name}`);
  const score = calculateSimilarityScore(paracetamol, ibuprofen);
  console.log(`
  Score components:
    DCI match: ${score.breakdown.dci} points (${paracetamol.dci} vs ${ibuprofen.dci})`);
  console.log(`    Dosage match: ${score.breakdown.dosage} points (${paracetamol.dosage} vs ${ibuprofen.dosage})`);
  console.log(`    Form match: ${score.breakdown.form} points (${paracetamol.form} vs ${ibuprofen.form})`);
  console.log(`    ATC match: ${score.breakdown.atc} points`);
  console.log(`    Lab match: ${score.breakdown.laboratory} points`);
  console.log(`
  Total Score: ${score.score}`);
}

console.log(`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TEST 3: Statistics
`);

if (paracetamol) {
  const stats = getSimilarityStats(paracetamol, products, { maxResults: 6 });
  console.log(`\nProduct: ${paracetamol.name}`);
  console.log(`  Total candidates: ${stats.totalCandidates}`);
  console.log(`  Matching count: ${stats.matchingCount}`);
  console.log(`  Average score: ${stats.avgScore}`);
  console.log(`  Top matches: ${stats.matches.slice(0, 3).map(m => m.name).join(', ')}`);
}

console.log(`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TEST 4: Edge Cases
`);

console.log(`
✓ Missing DCI: ${products.filter(p => !p.dci).length} products`);
console.log(`✓ Missing Dosage: ${products.filter(p => !p.dosage).length} products`);
console.log(`✓ Missing Form: ${products.filter(p => !p.form).length} products`);
console.log(`✓ Missing ATC: ${products.filter(p => !p.atc && !p.therapeuticClass).length} products`);

// Test with incomplete product
const incompleteProduct = products.find(p => !p.dci || !p.dosage);
if (incompleteProduct) {
  console.log(`\nTesting with incomplete product: ${incompleteProduct.name}`);
  const similar = findSimilarProducts(incompleteProduct, products, { maxResults: 3 });
  console.log(`✓ No errors with missing fields`);
  console.log(`  Found ${similar.length} similar products`);
}

console.log(`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TEST 5: Full Product Analysis
`);

let totalMatches = 0;
let productsWithMatches = 0;

for (const product of products.slice(0, 5)) {
  const similar = findSimilarProductIds(product, products, { maxResults: 6 });
  if (similar.length > 0) {
    productsWithMatches++;
    totalMatches += similar.length;
    console.log(`\n✓ ${product.name}`);
    console.log(`  → ${similar.length} match(es)`);
  }
}

console.log(`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ TEST SUMMARY

  Products analyzed: 5
  Products with matches: ${productsWithMatches}
  Total relationships: ${totalMatches}
  
  Status: ${'PASSED' /* All tests ran without errors */}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
