#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CatalogueSource } from './ai/catalogue-source.mjs';
import { ExtractionService } from './ai/extraction-source.mjs';
import { OllamaAgent } from './ai/ollama-agent.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const seedPath = path.join(projectRoot, 'src', 'data', 'market-products.seed.json');
const compiledCataloguePath = path.join(projectRoot, 'tmp', 'products-catalogue.compiled.js');
const historyPath = path.join(projectRoot, 'tmp', 'seed-enrichment-history.json');

const TARGET_FIELDS = [
  'indications',
  'posology',
  'contraindications',
  'sideEffects',
  'conservation',
  'pregnancyCategory',
  'isPrescriptionRequired',
];

function isPlaceholder(value) {
  if (value == null) return true;
  const normalized = String(value).trim().toLowerCase();
  return (
    normalized === '' ||
    normalized === 'à compléter' ||
    normalized === 'à préciser' ||
    normalized === 'a preciser' ||
    normalized === 'n/a' ||
    normalized === 'n/a' ||
    normalized === 'n/a'
  );
}

function pickExistingField(targetValue, sourceValue) {
  if (!isPlaceholder(targetValue) && targetValue != null) return targetValue;
  if (sourceValue == null) return targetValue;
  if (!isPlaceholder(sourceValue)) return sourceValue;
  return targetValue;
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function parseArgs(argv) {
  const args = { dryRun: false, history: true, concurrency: 1, onlyIds: [] };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--dry-run') {
      args.dryRun = true;
    } else if (token === '--no-history') {
      args.history = false;
    } else if (token === '--concurrency') {
      args.concurrency = Number(argv[index + 1]) || 1;
      index += 1;
    } else if (token === '--only') {
      args.onlyIds = String(argv[index + 1] || '').split(',').map((value) => Number(value.trim())).filter(Number.isFinite);
      index += 1;
    }
  }

  return args;
}

async function loadSeed() {
  const raw = await fs.readFile(seedPath, 'utf8');
  return JSON.parse(raw);
}

async function saveSeed(products, destination) {
  const backupPath = `${destination}.backup-${new Date().toISOString().slice(0, 10)}`;
  await fs.copyFile(destination, backupPath);
  await fs.writeFile(destination, JSON.stringify(products, null, 2), 'utf8');
  return backupPath;
}

function buildProductKey(product) {
  return `${normalizeText(product.name)}::${normalizeText(product.dci)}`;
}

function findBestSibling(product, products) {
  const query = normalizeText(product.dci || product.name || '');
  if (!query) return null;

  const candidates = products.filter((candidate) => candidate.id !== product.id && normalizeText(candidate.dci || candidate.name || '') === query);
  candidates.sort((a, b) => {
    const score = (prod) => TARGET_FIELDS.reduce((acc, field) => acc + (!isPlaceholder(prod[field]) ? 1 : 0), 0);
    return score(b) - score(a);
  });
  return candidates[0] || null;
}

function pickFieldsFromSource(product, source, fields) {
  const updated = {};
  for (const field of fields) {
    if (isPlaceholder(product[field]) && source[field] != null && !isPlaceholder(source[field])) {
      updated[field] = source[field];
    }
  }
  return updated;
}

function hasProductGaps(product) {
  return TARGET_FIELDS.some((field) => isPlaceholder(product[field]));
}

function getMissingFields(product) {
  return TARGET_FIELDS.filter((field) => isPlaceholder(product[field]));
}

function mergeUpdates(product, updates) {
  const changed = {};
  for (const [field, value] of Object.entries(updates || {})) {
    if (value != null && !isPlaceholder(value) && isPlaceholder(product[field])) {
      product[field] = value;
      changed[field] = value;
    }
  }
  return changed;
}

function summarizeChanges(changes) {
  return TARGET_FIELDS.filter((field) => field in changes);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const products = await loadSeed();

  const catalogue = await CatalogueSource.create({ compiledPath: compiledCataloguePath });
  const extractionService = await ExtractionService.create({ enablePlaywright: false });
  const ollamaAgent = new OllamaAgent({ host: process.env.OLLAMA_API_URL || 'http://127.0.0.1:11434' });
  const useOllama = await ollamaAgent.isAvailable();

  const history = [];
  const worklist = products.filter((product) => hasProductGaps(product));

  if (args.onlyIds.length > 0) {
    const ids = new Set(args.onlyIds);
    worklist.splice(0, worklist.length, ...worklist.filter((product) => ids.has(product.id)));
  }

  console.log(`Found ${worklist.length} products with gaps. Using ${useOllama ? 'Ollama' : 'no local model'} mode.`);

  for (const product of worklist) {
    const productHistory = {
      id: product.id,
      name: product.name,
      updatedAt: new Date().toISOString(),
      source: null,
      updates: {},
      missingAfter: [],
      notes: [],
    };

    const missingBefore = getMissingFields(product);
    const candidate = catalogue.match(product);

    if (candidate.candidate) {
      const catalogueUpdates = pickFieldsFromSource(product, candidate.candidate, TARGET_FIELDS);
      if (Object.keys(catalogueUpdates).length > 0) {
        const applied = mergeUpdates(product, catalogueUpdates);
        productHistory.source = `catalogue:${candidate.reason}`;
        productHistory.updates = { ...productHistory.updates, ...applied };
        productHistory.notes.push(`catalogue match ${candidate.reason}`);
      }
    }

    if (hasProductGaps(product)) {
      const sibling = findBestSibling(product, products);
      if (sibling) {
        const siblingUpdates = pickFieldsFromSource(product, sibling, TARGET_FIELDS);
        if (Object.keys(siblingUpdates).length > 0) {
          const applied = mergeUpdates(product, siblingUpdates);
          productHistory.source = productHistory.source || 'sibling:DCI';
          productHistory.updates = { ...productHistory.updates, ...applied };
          productHistory.notes.push(`copied from sibling id=${sibling.id}`);
        }
      }
    }

    let extracted = null;
    if (hasProductGaps(product)) {
      const extractionResult = await extractionService.extractFromProduct(product);
      if (extractionResult.extracted) {
        extracted = extractionResult.extracted;
        const extractionUpdates = pickFieldsFromSource(product, extracted, TARGET_FIELDS);
        if (Object.keys(extractionUpdates).length > 0) {
          const applied = mergeUpdates(product, extractionUpdates);
          productHistory.source = productHistory.source || 'external:html';
          productHistory.updates = { ...productHistory.updates, ...applied };
          productHistory.notes.push(`extracted from ${extractionResult.sourceUrl || 'source text'}`);
        }
      } else {
        productHistory.notes.push(`extraction skipped (${extractionResult.notes || 'no url'})`);
      }
    }

    if (hasProductGaps(product) && useOllama) {
      const missingFields = getMissingFields(product);
      const ollamaUpdates = await ollamaAgent.enrich(product, extracted || {}, missingFields);
      if (ollamaUpdates) {
        const applied = mergeUpdates(product, ollamaUpdates);
        if (Object.keys(applied).length > 0) {
          productHistory.source = productHistory.source || 'ollama';
          productHistory.updates = { ...productHistory.updates, ...applied };
          productHistory.notes.push('local-model fallback');
        } else {
          productHistory.notes.push('local-model returned no new fields');
        }
      } else {
        productHistory.notes.push('local-model unavailable or response could not be parsed');
      }
    }

    productHistory.missingAfter = getMissingFields(product);
    if (Object.keys(productHistory.updates).length > 0) {
      console.log(`Updated product id=${product.id} name=${product.name} fields=[${Object.keys(productHistory.updates).join(', ')}]`);
    } else {
      console.log(`No update for product id=${product.id} name=${product.name}`);
    }

    history.push(productHistory);
  }

  await extractionService.dispose();

  if (!args.dryRun) {
    const backupPath = await saveSeed(products, seedPath);
    console.log(`Seed file updated. Backup saved to ${backupPath}`);
  } else {
    console.log('Dry run enabled. No seed file changes were written.');
  }

  if (args.history) {
    await fs.writeFile(historyPath, JSON.stringify(history, null, 2), 'utf8');
    console.log(`History written to ${historyPath}`);
  }

  const filledCount = history.filter((entry) => Object.keys(entry.updates).length > 0).length;
  console.log(`Finished. Products changed: ${filledCount}/${history.length}`);
}

main().catch((error) => {
  console.error('Agent error:', error);
  process.exit(1);
});
