import fs from 'node:fs';
import path from 'node:path';

function normalizeString(str) {
  return String(str || '').toLowerCase().trim();
}

function normalizeDosageValue(dosage) {
  if (!dosage) return undefined;
  const m = String(dosage)
    .toLowerCase()
    .replace(',', '.')
    .match(/([\d.]+)\s*(%|mg|g|ml|mcg|ug|l)?/i);
  if (!m) return undefined;
  return { value: Number(m[1]), unit: (m[2] || '').toLowerCase() };
}

function tokenize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function computeSimilarityLocal(product, candidate) {
  if (product.id === candidate.id) return -1;
  let score = 0;

  if ((product.relatedIds || []).includes(candidate.id) || (candidate.relatedIds || []).includes(product.id)) {
    score += 12;
  }

  const prodDci = normalizeString(product.dci || '');
  const candDci = normalizeString(candidate.dci || '');
  if (prodDci && candDci) {
    if (prodDci === candDci) score += 50;
    else {
      const prodTokens = new Set(tokenize(product.dci));
      const candTokens = tokenize(candidate.dci);
      const shared = candTokens.filter((t) => prodTokens.has(t)).length;
      if (shared > 0) score += Math.min(30, shared * 10);
    }
  }

  const productDosage = normalizeDosageValue(product.dosage);
  const candidateDosage = normalizeDosageValue(candidate.dosage);
  if (productDosage && candidateDosage && productDosage.unit && candidateDosage.unit && productDosage.unit === candidateDosage.unit) {
    if (productDosage.value === candidateDosage.value) score += 20;
    else if (Math.abs(productDosage.value - candidateDosage.value) <= productDosage.value * 0.1) score += 15;
    else if (Math.abs(productDosage.value - candidateDosage.value) <= productDosage.value * 0.2) score += 10;
  }

  if (normalizeString(candidate.form) === normalizeString(product.form)) score += 15;

  const sharedCategories = (candidate.categories || []).filter((cat) => (product.categories || []).includes(cat)).length;
  if (sharedCategories > 0) score += Math.min(6, sharedCategories * 3);

  if (normalizeString(candidate.laboratory) === normalizeString(product.laboratory)) score += 5;

  const prodTher = normalizeString(product.therapeuticClass || '');
  const candTher = normalizeString(candidate.therapeuticClass || '');
  if (/antisept|povidone|iod[eé]|chlorhexidine|hexamidine/.test(prodTher) && /antisept|povidone|iod[eé]|chlorhexidine|hexamidine/.test(candTher)) {
    score += 20;
  }

  // Penalize obvious mismatches: antiseptic vs antihistamine/corticosteroid
  if (/antisept|povidone|iod[eé]|chlorhexidine|hexamidine/.test(prodTher) && /(antihistamin|corticost|cortico|corticost[eé]roid)/.test(candTher)) {
    score -= 20;
  }

  if ((product.categories || []).includes('dermatology') && (candidate.categories || []).includes('respiratory')) score -= 5;

  return score;
}

const publicPath = path.resolve('./public/api/products.json');
const distPath = path.resolve('./dist/api/products.json');
let raw;
if (fs.existsSync(publicPath)) raw = fs.readFileSync(publicPath, 'utf8');
else raw = fs.readFileSync(distPath, 'utf8');
const products = JSON.parse(raw);

let target = products.find((p) => p.name && p.name.toUpperCase().includes('BETA-DINE'));
if (!target && fs.existsSync(distPath)) {
  const raw2 = fs.readFileSync(distPath, 'utf8');
  const products2 = JSON.parse(raw2);
  target = products2.find((p) => p.name && p.name.toUpperCase().includes('BETA-DINE'));
}
if (!target) {
  console.error('BETA-DINE not found');
  process.exit(1);
}

const scored = products
  .map((c) => ({ name: c.name, id: c.id, score: computeSimilarityLocal(target, c), dci: c.dci, therapeuticClass: c.therapeuticClass, categories: c.categories }))
  .filter((s) => s.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, 12);

console.log('Top related for BETA-DINE:');
for (const s of scored) {
  console.log(`${s.score}	${s.name}	| DCI:${s.dci}	Ther:${s.therapeuticClass}	Cats:${(s.categories||[]).join(',')}`);
}
