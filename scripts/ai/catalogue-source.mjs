import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

function normalizeText(value) {
  return String(value || '')
    .trim()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/gi, ' ')
    .trim()
    .toLowerCase();
}

export async function loadCompiledCatalogue({ compiledPath } = {}) {
  const defaultPath = path.resolve(process.cwd(), 'tmp', 'products-catalogue.compiled.js');
  const resolvedPath = path.resolve(compiledPath || defaultPath);

  try {
    const module = await import(pathToFileURL(resolvedPath).href);
    return module.PRODUCTS || module.default || [];
  } catch (error) {
    throw new Error(`Failed to import compiled catalogue from ${resolvedPath}: ${error.message}`);
  }
}

function buildIndexes(products) {
  const byExactName = new Map();
  const byNormalizedName = new Map();
  const byNormalizedDci = new Map();
  const byPpm = new Map();

  for (const product of products) {
    if (product.name) {
      byExactName.set(product.name, product);
      byNormalizedName.set(normalizeText(product.name), product);
    }

    if (product.dci) {
      byNormalizedDci.set(normalizeText(product.dci), product);
    }

    if (product.ppm != null) {
      byPpm.set(String(product.ppm), product);
    }
  }

  return { byExactName, byNormalizedName, byNormalizedDci, byPpm };
}

export class CatalogueSource {
  constructor(products = []) {
    this.products = Array.isArray(products) ? products : [];
    const indexes = buildIndexes(this.products);
    this.byExactName = indexes.byExactName;
    this.byNormalizedName = indexes.byNormalizedName;
    this.byNormalizedDci = indexes.byNormalizedDci;
    this.byPpm = indexes.byPpm;
  }

  static async create(options = {}) {
    const products = await loadCompiledCatalogue(options);
    return new CatalogueSource(products);
  }

  normalize(value) {
    return normalizeText(value || '');
  }

  findByExactName(name) {
    if (!name) return null;
    return this.byExactName.get(name) || null;
  }

  findByNormalizedName(name) {
    if (!name) return null;
    return this.byNormalizedName.get(this.normalize(name)) || null;
  }

  findByNormalizedDci(dci) {
    if (!dci) return null;
    return this.byNormalizedDci.get(this.normalize(dci)) || null;
  }

  findByPpm(ppm) {
    if (ppm == null) return null;
    return this.byPpm.get(String(ppm)) || null;
  }

  findByTokenOverlap(seedProduct) {
    const tokens = new Set((this.normalize(seedProduct.name || '') + ' ' + this.normalize(seedProduct.dci || '')).split(' ').filter(Boolean));
    if (tokens.size === 0) return null;

    let best = null;
    let bestScore = 0;

    for (const candidate of this.products) {
      if (candidate.id === seedProduct.id) continue;
      const text = this.normalize(candidate.name || '') + ' ' + this.normalize(candidate.dci || '');
      const candidateTokens = new Set(text.split(' ').filter(Boolean));
      const intersection = [...candidateTokens].filter((token) => tokens.has(token)).length;
      const union = new Set([...candidateTokens, ...tokens]).size || 1;
      const score = intersection / union;
      if (score > bestScore && score >= 0.35) {
        bestScore = score;
        best = candidate;
      }
    }

    return best;
  }

  match(seedProduct) {
    const normalizedName = this.normalize(seedProduct.name || '');
    const normalizedDci = this.normalize(seedProduct.dci || '');
    const ppm = seedProduct.ppm != null ? String(seedProduct.ppm) : null;

    const exactName = this.findByExactName(seedProduct.name || '');
    if (exactName) {
      return { candidate: exactName, reason: 'exactName' };
    }

    const normalizedNameMatch = this.findByNormalizedName(normalizedName);
    if (normalizedNameMatch) {
      return { candidate: normalizedNameMatch, reason: 'normalizedName' };
    }

    const dciMatch = this.findByNormalizedDci(normalizedDci);
    if (dciMatch) {
      return { candidate: dciMatch, reason: 'normalizedDci' };
    }

    if (ppm) {
      const ppmMatch = this.findByPpm(ppm);
      if (ppmMatch) {
        return { candidate: ppmMatch, reason: 'ppm' };
      }
    }

    const overlap = this.findByTokenOverlap(seedProduct);
    if (overlap) {
      return { candidate: overlap, reason: 'tokenOverlap' };
    }

    return { candidate: null, reason: 'none' };
  }
}
