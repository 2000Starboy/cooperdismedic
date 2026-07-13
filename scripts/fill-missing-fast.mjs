#!/usr/bin/env node
/**
 * Simple fill script - copy missing fields from products with same DCI
 * Fast and reliable - no external requests
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const seedPath = path.join(projectRoot, 'src', 'data', 'market-products.seed.json');

function isPlaceholder(value) {
  const v = String(value || '').trim().toLowerCase();
  return !v || v === 'à compléter' || v === 'à preciser' || v === 'à préciser' || v === 'a preciser' || v === 'n/a';
}

function normalizeCompare(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

async function fillMissingFields() {
  const raw = await fs.readFile(seedPath, 'utf8').catch(() => '[]');
  const products = JSON.parse(raw);

  console.log(`Loading ${products.length} products...`);

  // Build index by DCI for cross-product field copying
  const byDCI = new Map();
  const byName = new Map();

  for (const p of products) {
    const dci = normalizeCompare(p.dci || p.name || '');
    if (!byDCI.has(dci)) byDCI.set(dci, []);
    byDCI.get(dci).push(p);

    const name = normalizeCompare(p.name || '');
    if (!byName.has(name)) byName.set(name, []);
    byName.get(name).push(p);
  }

  let updatedCount = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const needsUpdate = ['indications', 'posology', 'contraindications', 'sideEffects', 'conservation', 'pregnancyCategory', 'isPrescriptionRequired'].some(
      (k) => isPlaceholder(p[k])
    );

    if (!needsUpdate) continue;

    console.log(`\n[${i + 1}/${products.length}] Processing ${p.id} ${p.name}`);

    // Step 1: Look for products with same DCI but full info
    const dciKey = normalizeCompare(p.dci || p.name || '');
    const dciCandidates = byDCI.get(dciKey) || [];

    // Step 2: Look for products with name tokens overlap
    const nameTokens = new Set(normalizeCompare(p.name || '').split(' ').filter(Boolean));
    const nameCandidates = [];
    for (const [name, prods] of byName) {
      const tokens = new Set(name.split(' ').filter(Boolean));
      const shared = [...tokens].filter((t) => nameTokens.has(t));
      if (shared.length >= 1 && prods !== dciCandidates) {
        nameCandidates.push(...prods);
      }
    }

    // Merge and deduplicate candidates
    const candidates = [...new Set([...dciCandidates, ...nameCandidates])].filter((c) => c.id !== p.id);

    // Score by completeness
    candidates.sort((a, b) => {
      const scoreField = (prod, field) => (!isPlaceholder(prod[field]) ? 1 : 0);
      const scoreA = ['indications', 'posology', 'contraindications', 'sideEffects', 'conservation'].reduce((s, k) => s + scoreField(a, k), 0);
      const scoreB = ['indications', 'posology', 'contraindications', 'sideEffects', 'conservation'].reduce((s, k) => s + scoreField(b, k), 0);
      return scoreB - scoreA;
    });

    if (candidates.length === 0) {
      console.log(`  ⚠ No similar products found`);
      continue;
    }

    const source = candidates[0];
    let changed = false;

    if (isPlaceholder(p.indications) && !isPlaceholder(source.indications)) {
      p.indications = source.indications;
      changed = true;
    }
    if (isPlaceholder(p.posology) && !isPlaceholder(source.posology)) {
      p.posology = source.posology;
      changed = true;
    }
    if (isPlaceholder(p.contraindications) && !isPlaceholder(source.contraindications)) {
      p.contraindications = source.contraindications;
      changed = true;
    }
    if (isPlaceholder(p.sideEffects) && !isPlaceholder(source.sideEffects)) {
      p.sideEffects = source.sideEffects;
      changed = true;
    }
    if (isPlaceholder(p.conservation) && !isPlaceholder(source.conservation)) {
      p.conservation = source.conservation;
      changed = true;
    }
    if (isPlaceholder(p.pregnancyCategory) && !isPlaceholder(source.pregnancyCategory) && source.pregnancyCategory !== 'N/A') {
      p.pregnancyCategory = source.pregnancyCategory;
      changed = true;
    }
    if (isPlaceholder(p.isPrescriptionRequired) && typeof source.isPrescriptionRequired === 'boolean') {
      p.isPrescriptionRequired = source.isPrescriptionRequired;
      changed = true;
    }

    if (changed) {
      updatedCount++;
      console.log(`  ✓ Updated from id=${source.id} (${source.name})`);
    } else {
      console.log(`  ⚠ No suitable data found in similar products`);
    }
  }

  // Save if updated
  if (updatedCount > 0) {
    const backupPath = seedPath + '.backup-' + new Date().toISOString().slice(0, 10);
    await fs.copyFile(seedPath, backupPath);
    await fs.writeFile(seedPath, JSON.stringify(products, null, 2));
    console.log(`\n✓ Backup created: ${backupPath}`);
  }

  console.log(`\n✓ Fill complete. Updated: ${updatedCount}/${products.length} products`);
}

fillMissingFields().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
