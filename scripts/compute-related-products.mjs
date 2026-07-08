#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Read the products catalogue
const catalogPath = './src/data/products-catalogue.ts';
const content = fs.readFileSync(catalogPath, 'utf-8');

// Extract PRODUCTS array from TypeScript
const productsMatch = content.match(/export const PRODUCTS: Product\[\] = \[([\s\S]*?)\n\];/);
if (!productsMatch) {
  console.error('Could not extract PRODUCTS array');
  process.exit(1);
}

// We need to parse the TypeScript manually since we're dealing with valid TS structure
// For now, let's import and use the actual code
import { PRODUCTS, computeSimilarityScore } from '../src/data/products-catalogue.ts' with { type: 'json' };

// Actually, let's use eval to load the products
// This is a temporary workaround - we'll parse the file differently

// For now, let's read the file and extract product objects
function normalizeString(str) {
  return str.toLowerCase().trim();
}

function normalizeDosageValue(dosage) {
  const match = dosage.match(/([\d,.]+)/);
  if (!match) return undefined;
  return Number(match[1].replace(',', '.'));
}

function computeSimilarityScore(product, candidate) {
  if (product.id === candidate.id) return -1;

  let score = 0;

  // 1. Substance active (DCI) - 50%
  if (normalizeString(candidate.dci) === normalizeString(product.dci)) {
    score += 50;
  }

  // 2. Dosage - 20%
  const productDosage = normalizeDosageValue(product.dosage);
  const candidateDosage = normalizeDosageValue(candidate.dosage);
  if (productDosage && candidateDosage) {
    if (productDosage === candidateDosage) {
      score += 20;
    } else if (Math.abs(productDosage - candidateDosage) <= productDosage * 0.1) {
      score += 15;
    } else if (Math.abs(productDosage - candidateDosage) <= productDosage * 0.2) {
      score += 10;
    }
  }

  // 3. Forme pharmaceutique - 15%
  if (normalizeString(candidate.form) === normalizeString(product.form)) {
    score += 15;
  }

  // 4. Catégories - 10%
  const sharedCategories = candidate.categories.filter((cat) => product.categories.includes(cat)).length;
  if (sharedCategories > 0) {
    score += Math.min(10, sharedCategories * 5);
  }

  // 5. Laboratoire - 5%
  if (normalizeString(candidate.laboratory) === normalizeString(product.laboratory)) {
    score += 5;
  }

  return score;
}

// Parse products from catalogue (simplified JSON extraction)
const productsJsonMatch = content.match(/export const PRODUCTS: Product\[\] = (\[[\s\S]*?\n\];)/);
if (!productsJsonMatch) {
  console.error('Could not extract PRODUCTS definition');
  process.exit(1);
}

// Get products JSON string (we'll need to clean it up)
let productsStr = productsJsonMatch[1];

// Remove comments and trailing semicolon
productsStr = productsStr.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').trim();
if (productsStr.endsWith('];')) {
  productsStr = productsStr.slice(0, -2) + ']';
}

// Remove TypeScript-specific syntax (type annotations after colons)
// This is tricky, so let's use a simpler approach: eval with proper context
const prodCode = `
const PRODUCTS = ${productsStr};
`;

let PRODUCTS;
try {
  eval(prodCode);
} catch (e) {
  console.error('Error parsing products:', e.message);
  console.error('Attempting alternative parsing...');
  process.exit(1);
}

if (!PRODUCTS || !Array.isArray(PRODUCTS)) {
  console.error('PRODUCTS is not an array');
  process.exit(1);
}

console.log(`Loaded ${PRODUCTS.length} products`);

// Compute related products for each
const related = {};
for (const product of PRODUCTS) {
  const scores = PRODUCTS
    .map((candidate) => ({
      id: candidate.id,
      score: computeSimilarityScore(product, candidate),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4); // Top 4 related products

  related[product.id] = scores.map(({ id }) => id);
  console.log(`Product ${product.id} (${product.name}): [${related[product.id].join(', ')}]`);
}

// Generate TypeScript code to update
console.log('\n\n// Add this to your products update:');
for (const product of PRODUCTS) {
  console.log(`// ID ${product.id}: relatedIds: [${related[product.id].join(', ')}],`);
}
