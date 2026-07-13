import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const seedPath = path.join(projectRoot, 'src', 'data', 'market-products.seed.json');

function normalizeText(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function isPlaceholder(v) {
  if (v == null) return true;
  const s = String(v).trim();
  return s === '' || /a compl|a preciser|a préciser|a compléter/i.test(s) || /^n\/?a$/i.test(s);
}

function pickBestField(targetVal, sourceVal) {
  if (!isPlaceholder(targetVal) && targetVal != null) return targetVal;
  if (sourceVal == null) return targetVal;
  if (!isPlaceholder(sourceVal)) return sourceVal;
  return targetVal;
}

async function fill() {
  const raw = await fs.readFile(seedPath, 'utf8').catch(() => '[]');
  const products = JSON.parse(raw);
  const byDci = new Map();
  const byName = new Map();

  for (const p of products) {
    const dci = normalizeText(p.dci || p.name || '');
    if (!byDci.has(dci)) byDci.set(dci, []);
    byDci.get(dci).push(p);

    const nameKey = normalizeText(p.name || '');
    if (!byName.has(nameKey)) byName.set(nameKey, []);
    byName.get(nameKey).push(p);
  }

  let updated = 0;

  for (const p of products) {
    const needs = ['indications','posology','contraindications','sideEffects','conservation','pregnancyCategory','ppm'].some(k => isPlaceholder(p[k]));
    if (!needs) continue;

    // candidates: same DCI
    const dciKey = normalizeText(p.dci || p.name || '');
    const candidates = (byDci.get(dciKey) || []).filter(c => c.id !== p.id);

    // fallback: relatedIds
    const relatedCandidates = (p.relatedIds || []).map(id => products.find(x => x.id === id)).filter(Boolean);

    // fallback: name exact
    const nameCandidates = (byName.get(normalizeText(p.name || '')) || []).filter(c => c.id !== p.id);

    const pool = [...new Set([...(candidates || []), ...(relatedCandidates || []), ...(nameCandidates || [])])];

    // Also include any product whose DCI token overlap >=2
    const pTokens = new Set(dciKey.split(' ').filter(Boolean));
    for (const other of products) {
      if (other.id === p.id) continue;
      const otherKey = normalizeText(other.dci || other.name || '');
      const tokens = otherKey.split(' ').filter(Boolean);
      const shared = tokens.filter(t => pTokens.has(t));
      if (shared.length >= 2 && !pool.includes(other)) pool.push(other);
    }

    // Score candidates: prefer non-placeholder fields count
    pool.sort((a,b)=>{
      const score = (prod)=>['indications','posology','contraindications','sideEffects','conservation','pregnancyCategory','ppm'].reduce((s,k)=> s + (!isPlaceholder(prod[k])?1:0),0);
      return score(b)-score(a);
    });

    if (pool.length === 0) continue;

    const source = pool[0];
    let changed = false;
    // pick fields
    const fields = ['description','indications','posology','contraindications','sideEffects','conservation','pregnancyCategory','isPrescriptionRequired','ppm','laboratory','form','dosage','therapeuticClass'];
    for (const f of fields) {
      const newVal = pickBestField(p[f], source[f]);
      if (newVal !== p[f]) { p[f] = newVal; changed = true; }
    }

    if (changed) { updated++; console.log(`[FILL] id=${p.id} name=${p.name} <- from id=${source.id} (${source.name})`); }
  }

  if (updated>0) await fs.writeFile(seedPath, JSON.stringify(products, null, 2));
  console.log(`[FILL] Done. Products updated: ${updated}`);
}

fill().catch(err=>{ console.error(err); process.exitCode=1; });
