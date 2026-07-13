/**
 * Enhanced similarity algorithm for pharmaceutical products
 * Handles missing/incomplete data better, especially for imported products
 */

function normalizeString(str) {
  return String(str || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove accents
}

/**
 * Normalize DCI for better matching
 * Removes dosage info, capitalizes consistently
 * E.g., "AMOXICILLINE 1g" → "amoxicilline"
 * E.g., "Amoxicilline" → "amoxicilline"
 */
function normalizeDci(dci) {
  if (!dci) return '';
  // Remove dosage patterns (1g, 500mg, etc.)
  return normalizeString(dci)
    .replace(/\s*\d+\s*(?:mg|g|ml|µg|mcg|%|ui|unité)/gi, '')
    .trim();
}

/**
 * Extract dosage value from product name if not in dosage field
 * E.g., "AMOXIL 500 MG, COMPRIMÉ DISPERSIBLE" → 500
 */
function extractDosageFromName(name, dosage) {
  // If dosage field already has a valid numeric value, use it
  const directDosage = String(dosage || '').match(/([\d.]+)\s*(%|mg|g|ml|mcg|ug|l)?/i);
  if (directDosage && /\d/.test(directDosage[1])) {
    return {
      value: Number(directDosage[1]),
      unit: (directDosage[2] || 'mg').toLowerCase(),
      source: 'dosage_field'
    };
  }

  // Try to extract from name
  const nameMatch = String(name || '')
    .match(/(\d+(?:[.,]\d+)?)\s*(%|mg|g|ml|mcg|ug|µg|l|ui|unité)/i);
  
  if (nameMatch) {
    return {
      value: Number(nameMatch[1].replace(',', '.')),
      unit: (nameMatch[2] || 'mg').toLowerCase(),
      source: 'product_name'
    };
  }

  return null;
}

/**
 * Tokenize a string and return unique tokens
 */
function tokenize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Calculate similarity between two pharmaceutical products
 * Returns -1 if same product, or a score 0-100+
 */
export function computeEnhancedSimilarity(product, candidate) {
  if (product.id === candidate.id) return -1;

  let score = 0;
  const traces = [];

  // ==================== SUBSTANCE ACTIVE (DCI) - 50% base ====================
  const prodDciNorm = normalizeDci(product.dci || '');
  const candDciNorm = normalizeDci(candidate.dci || '');

  if (prodDciNorm && candDciNorm) {
    if (prodDciNorm === candDciNorm) {
      score += 50;
      traces.push('DCI exact match: +50');
    } else {
      // Tokenize DCI for partial matches
      const prodTokens = new Set(tokenize(product.dci));
      const candTokens = tokenize(candidate.dci);
      const sharedTokens = candTokens.filter((t) => prodTokens.has(t)).length;
      
      if (sharedTokens > 0) {
        const partialScore = Math.min(40, sharedTokens * 15); // Up to 40 for partial
        score += partialScore;
        traces.push(`DCI partial match (${sharedTokens} tokens): +${partialScore}`);
      }
    }
  } else if (!prodDciNorm || !candDciNorm) {
    // One or both DCIs are missing - try name matching instead
    const prodNameTokens = new Set(tokenize(product.name || ''));
    const candNameTokens = tokenize(candidate.name || '');
    const sharedNameTokens = candNameTokens.filter((t) => prodNameTokens.has(t)).length;
    
    if (sharedNameTokens >= 2) { // At least 2 shared tokens in name
      const nameScore = Math.min(35, sharedNameTokens * 12);
      score += nameScore;
      traces.push(`Name matching (${sharedNameTokens} tokens): +${nameScore}`);
    }
  }

  // ==================== DOSAGE - 20% base ====================
  // Enhanced extraction from both dosage field and product name
  const productDosage = extractDosageFromName(product.name, product.dosage);
  const candidateDosage = extractDosageFromName(candidate.name, candidate.dosage);

  if (productDosage && candidateDosage && productDosage.unit === candidateDosage.unit) {
    const diff = Math.abs(productDosage.value - candidateDosage.value);
    const threshold10 = productDosage.value * 0.1;
    const threshold20 = productDosage.value * 0.2;

    if (productDosage.value === candidateDosage.value) {
      score += 20;
      traces.push(`Dosage exact match: +20`);
    } else if (diff <= threshold10) {
      score += 15;
      traces.push(`Dosage ±10%: +15`);
    } else if (diff <= threshold20) {
      score += 10;
      traces.push(`Dosage ±20%: +10`);
    }
  } else if (!productDosage || !candidateDosage) {
    traces.push(`Dosage incomplete (extracted: ${productDosage ? 'yes' : 'no'}, ${candidateDosage ? 'yes' : 'no'})`);
  }

  // ==================== PHARMACEUTICAL FORM - 15% ====================
  const prodFormNorm = normalizeString(product.form || '');
  const candFormNorm = normalizeString(candidate.form || '');
  
  if (prodFormNorm && candFormNorm && prodFormNorm === candFormNorm) {
    score += 15;
    traces.push(`Form match: +15`);
  } else if (prodFormNorm && candFormNorm) {
    // Partial form matching (e.g., "comprimé" in both)
    const prodFormTokens = new Set(tokenize(product.form));
    const candFormTokens = tokenize(candidate.form);
    const sharedFormTokens = candFormTokens.filter((t) => prodFormTokens.has(t)).length;
    
    if (sharedFormTokens > 0) {
      const partialFormScore = Math.min(8, sharedFormTokens * 3);
      score += partialFormScore;
      traces.push(`Form partial match (${sharedFormTokens} tokens): +${partialFormScore}`);
    }
  }

  // ==================== CATEGORIES - 10% ====================
  const sharedCategories = (candidate.categories || [])
    .filter((cat) => (product.categories || []).includes(cat))
    .length;
  
  if (sharedCategories > 0) {
    const catScore = Math.min(10, sharedCategories * 4);
    score += catScore;
    traces.push(`Shared categories (${sharedCategories}): +${catScore}`);
  }

  // ==================== LABORATORY - 5% ====================
  const prodLabNorm = normalizeString(product.laboratory || '');
  const candLabNorm = normalizeString(candidate.laboratory || '');
  
  if (prodLabNorm && candLabNorm && prodLabNorm === candLabNorm) {
    score += 5;
    traces.push(`Laboratory match: +5`);
  }

  // ==================== THERAPEUTIC CLASS BONUSES ====================
  const prodTher = normalizeString(product.therapeuticClass || '');
  const candTher = normalizeString(candidate.therapeuticClass || '');

  // Antiseptics/disinfectants
  if (
    /antisept|povidone|iode|iodé|chlorhexidine|hexamidine|desinfect/.test(prodTher) &&
    /antisept|povidone|iode|iodé|chlorhexidine|hexamidine|desinfect/.test(candTher)
  ) {
    score += 20;
    traces.push(`Therapeutic class bonus (antiseptic): +20`);
  }

  // Antibiotics
  if (/antibiotic|antibiot/.test(prodTher) && /antibiotic|antibiot/.test(candTher)) {
    score += 15;
    traces.push(`Therapeutic class bonus (antibiotic): +15`);
  }

  // ==================== PENALTIES ====================
  // Obvious mismatches that should not be related
  if (
    /antisept|povidone|iode|chlorhexidine/.test(prodTher) &&
    /antihistamin|corticost|antidepressant|antipsychotic/.test(candTher)
  ) {
    score -= 30;
    traces.push(`Category mismatch penalty: -30`);
  }

  if (
    (product.categories || []).includes('dermatology') &&
    (candidate.categories || []).includes('respiratory')
  ) {
    score -= 10;
    traces.push(`Dermatology vs Respiratory penalty: -10`);
  }

  return { score: Math.max(0, score), traces };
}

/**
 * Find related products for a given product
 * Returns array of related product IDs sorted by similarity score
 */
export function findRelatedProducts(product, allProducts, minScore = 30, maxResults = 5) {
  const scored = allProducts
    .map((candidate) => {
      const result = computeEnhancedSimilarity(product, candidate);
      return {
        id: candidate.id,
        score: result.score,
        product: candidate,
      };
    })
    .filter(({ score }) => score > 0 && score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);

  return scored.map(({ id }) => id);
}

export default computeEnhancedSimilarity;
