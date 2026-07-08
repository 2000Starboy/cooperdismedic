#!/usr/bin/env node

/**
 * Test script to validate improved similarity algorithm
 * Run with: node --loader ts-node/esm scripts/test-algorithm.ts
 */

// Simple test of scoring algorithm
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
  const sharedCategories = candidate.categories.filter((cat) =>
    product.categories.includes(cat)
  ).length;
  if (sharedCategories > 0) {
    score += Math.min(10, sharedCategories * 5);
  }

  // 5. Laboratoire - 5%
  if (normalizeString(candidate.laboratory) === normalizeString(product.laboratory)) {
    score += 5;
  }

  return score;
}

// Test products from catalogue
const VITAMINE_D3 = {
  id: 15,
  name: 'VITAMINE D3 1000 UI',
  dci: 'Colécalciférol (Vitamine D3)',
  laboratory: 'Cooper Pharma',
  form: 'Capsule molle',
  dosage: '1000 UI',
  categories: ['vitamins', 'seasonal'],
};

const CETIRIZINE = {
  id: 11,
  name: 'CÉTIRIZINE 10MG',
  dci: 'Cétirizine dichlorhydrate',
  laboratory: 'Cooper Pharma',
  form: 'Comprimé pelliculé',
  dosage: '10 mg',
  categories: ['seasonal', 'respiratory'],
};

const PROBIOTIQUES = {
  id: 16,
  name: 'PROBIOTIQUES NOURRISSON',
  dci: 'Lactobacillus rhamnosus GG',
  laboratory: 'Cooper Pharma',
  form: 'Poudre orale (sachet)',
  dosage: '10⁹ UFC / sachet',
  categories: ['baby'],
};

const MULTIVITAMINES = {
  id: 18,
  name: 'MULTIVITAMINES NOURRISSON GOUTTES',
  dci: 'Vitamines A + C + D3',
  laboratory: 'Cooper Pharma',
  form: 'Solution buvable – Gouttes',
  dosage: 'Vitamines A 1333 UI + C 20 mg + D3 200 UI / ml',
  categories: ['baby', 'vitamins'],
};

const ACIDE_FOLIQUE = {
  id: 19,
  name: 'ACIDE FOLIQUE 5MG',
  dci: 'Acide folique (Vitamine B9)',
  laboratory: 'Cooper Pharma',
  form: 'Comprimé',
  dosage: '5 mg',
  categories: ['mom', 'vitamins'],
};

const LORATADINE = {
  id: 12,
  name: 'LORATADINE 10MG',
  dci: 'Loratadine',
  laboratory: 'Sanofi Maroc',
  form: 'Comprimé',
  dosage: '10 mg',
  categories: ['seasonal', 'respiratory'],
};

console.log('═══════════════════════════════════════════════════════════════');
console.log('🧪 TESTING SIMILARITY ALGORITHM');
console.log('═══════════════════════════════════════════════════════════════\n');

// Test 1: VITAMINE D3 similar products
console.log('📌 TEST 1: VITAMINE D3 1000 UI (ID 15)');
console.log('   DCI: Colécalciférol (Vitamine D3)');
console.log('   Dosage: 1000 UI');
console.log('   Forme: Capsule molle');
console.log('   Catégories: vitamins, seasonal\n');

const vitaminD3Products = [
  { product: CETIRIZINE, label: 'CÉTIRIZINE (ID 11)' },
  { product: PROBIOTIQUES, label: 'PROBIOTIQUES (ID 16)' },
  { product: MULTIVITAMINES, label: 'MULTIVITAMINES (ID 18)' },
  { product: ACIDE_FOLIQUE, label: 'ACIDE FOLIQUE (ID 19)' },
];

const vitaminD3Scores = vitaminD3Products.map(({ product, label }) => ({
  label,
  score: computeSimilarityScore(VITAMINE_D3, product),
}));

vitaminD3Scores.sort((a, b) => b.score - a.score);

console.log('   Scores de similarité:');
for (const { label, score } of vitaminD3Scores) {
  const emoji = score > 0 ? (score >= 20 ? '✅' : '⚠️ ') : '❌';
  console.log(`   ${emoji} ${label}: ${score} points`);
}

console.log('\n   ✨ Expected: MULTIVITAMINES & ACIDE FOLIQUE should rank higher');
console.log('      (Not CÉTIRIZINE or PROBIOTIQUES)\n');

// Test 2: CÉTIRIZINE similar products
console.log('═══════════════════════════════════════════════════════════════');
console.log('📌 TEST 2: CÉTIRIZINE 10MG (ID 11)');
console.log('   DCI: Cétirizine dichlorhydrate');
console.log('   Dosage: 10 mg');
console.log('   Forme: Comprimé pelliculé');
console.log('   Catégories: seasonal, respiratory\n');

const cetirizineProducts = [
  { product: VITAMINE_D3, label: 'VITAMINE D3 (ID 15)' },
  { product: LORATADINE, label: 'LORATADINE (ID 12)' },
  { product: PROBIOTIQUES, label: 'PROBIOTIQUES (ID 16)' },
];

const cetirizineScores = cetirizineProducts.map(({ product, label }) => ({
  label,
  score: computeSimilarityScore(CETIRIZINE, product),
}));

cetirizineScores.sort((a, b) => b.score - a.score);

console.log('   Scores de similarité:');
for (const { label, score } of cetirizineScores) {
  const emoji = score > 0 ? (score >= 15 ? '✅' : '⚠️ ') : '❌';
  console.log(`   ${emoji} ${label}: ${score} points`);
}

console.log('\n   ✨ Expected: LORATADINE should rank higher');
console.log('      (Same category "seasonal", antihistaminique class)\n');

console.log('═══════════════════════════════════════════════════════════════');
console.log('📊 VALIDATION SUMMARY');
console.log('═══════════════════════════════════════════════════════════════\n');

// Check if VITAMINE D3 has MULTIVITAMINES or ACIDE_FOLIQUE as top similar
const vitaminD3TopScore = vitaminD3Scores[0];
const isVitaminTest1Pass = vitaminD3TopScore.score >= 10 && 
  (vitaminD3TopScore.label.includes('MULTIVITAMINES') || vitaminD3TopScore.label.includes('ACIDE'));

// Check if CÉTIRIZINE has LORATADINE as top similar  
const cetirizineTopScore = cetirizineScores[0];
const isCetirizineTest2Pass = cetirizineTopScore.score >= 15 && cetirizineTopScore.label.includes('LORATADINE');

console.log(`✓ VITAMINE D3 test: ${isVitaminTest1Pass ? '✅ PASS' : '❌ FAIL'}`);
console.log(`✓ CÉTIRIZINE test: ${isCetirizineTest2Pass ? '✅ PASS' : '❌ FAIL'}`);

if (isVitaminTest1Pass && isCetirizineTest2Pass) {
  console.log('\n🎉 ALL TESTS PASSED - Similarity algorithm works correctly!');
} else {
  console.log('\n⚠️  Some tests failed - Review the algorithm');
}

console.log('\n═══════════════════════════════════════════════════════════════');
