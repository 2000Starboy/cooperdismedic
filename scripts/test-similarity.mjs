#!/usr/bin/env node

// This script tests the related products logic
// We'll manually test by examining key products

const testData = [
  {
    name: 'VITAMINE D3 1000 UI',
    dci: 'Cholécalciférol',
    dosage: '1000 UI',
    form: 'Comprimé',
    categories: ['vitamins'],
  },
  {
    name: 'CÉTIRIZINE 10MG',
    dci: 'Cétirizine',
    dosage: '10 mg',
    form: 'Comprimé',
    categories: ['seasonal'],
  },
  {
    name: 'PROBIOTIQUES NOURRISSON',
    dci: 'Complexe probiotique',
    dosage: 'À préciser',
    form: 'Poudre',
    categories: ['baby'],
  },
];

function normalizeString(str) {
  return str.toLowerCase().trim();
}

function normalizeDosageValue(dosage) {
  const match = dosage.match(/([\d,.]+)/);
  if (!match) return undefined;
  return Number(match[1].replace(',', '.'));
}

function computeSimilarityScore(product, candidate) {
  if (product.name === candidate.name) return -1;

  let score = 0;

  // 1. DCI - 50%
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

  // 3. Forme - 15%
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
  // (skipped for this test)

  return score;
}

console.log('🧪 Testing Similarity Algorithm\n');
console.log('='.repeat(70));

for (let i = 0; i < testData.length; i++) {
  const product = testData[i];
  console.log(`\n📌 ${product.name}`);
  console.log(`   DCI: ${product.dci}`);
  console.log(`   Dosage: ${product.dosage}`);
  console.log(`   Forme: ${product.form}`);
  console.log(`   Catégories: ${product.categories.join(', ')}`);

  const scores = testData
    .map((candidate, idx) => ({
      idx,
      name: candidate.name,
      score: computeSimilarityScore(product, candidate),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  console.log(`\n   Scores de similarité:`);
  if (scores.length === 0) {
    console.log(`   ❌ Aucun produit similaire`);
  } else {
    for (const { name, score } of scores) {
      console.log(`      • ${name}: ${score} points`);
    }
  }
  console.log('-'.repeat(70));
}
