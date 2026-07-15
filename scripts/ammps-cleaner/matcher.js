/**
 * Pharmaceutical Matcher Engine (OPTIMIZED)
 * Implements intelligent matching algorithms between Excel drug rows and scraped AMMPS data.
 */

// Helper to normalize strings (remove accents, lowercase, clean spaces)
function normalize(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s]/g, ' ') // Keep only alphanumeric and space
    .replace(/\s+/g, ' ')
    .trim();
}

// Tokenize a string into an array of words
function tokenize(str) {
  return normalize(str).split(' ').filter(Boolean);
}

// Compute Levenshtein distance
function levenshtein(a, b) {
  const tmp = [];
  let i, j, alen = a.length, blen = b.length;
  if (alen === 0) return blen;
  if (blen === 0) return alen;
  for (i = 0; i <= alen; i++) tmp[i] = [i];
  for (j = 0; j <= blen; j++) tmp[0][j] = j;
  for (i = 1; i <= alen; i++) {
    for (j = 1; j <= blen; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[alen][blen];
}

// Compute string similarity based on Levenshtein (0 to 1)
function stringSimilarity(normA, normB) {
  if (normA === normB) return 1.0;
  if (normA.length === 0 || normB.length === 0) return 0.0;
  
  // Early escape if length difference is too large to achieve high similarity
  const maxLen = Math.max(normA.length, normB.length);
  const lenDiff = Math.abs(normA.length - normB.length);
  if (lenDiff / maxLen > 0.2) return 0.0; // If length difference is > 20%, similarity is < 0.8
  
  const dist = levenshtein(normA, normB);
  return 1.0 - dist / maxLen;
}

// Compute Jaccard token similarity (0 to 1)
function jaccardSimilarity(tokensA, tokensB) {
  if (tokensA.length === 0 || tokensB.length === 0) return 0.0;
  
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  
  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) {
      intersection++;
    }
  }
  
  const union = setA.size + setB.size - intersection;
  return intersection / union;
}

/**
 * Compare two DCIs
 * Splits by separators (+, /, |, &) and checks token intersection
 */
function compareDCI(dciExcel, dciAmmps) {
  if (!dciExcel || !dciAmmps) return false;
  
  const normExcel = normalize(dciExcel);
  const normAmmps = normalize(dciAmmps);
  
  if (normExcel === normAmmps) return true;
  
  // Split using typical DCI separators
  const splitRegex = /[\s+/\-|]+/g;
  const tokensExcel = normExcel.split(splitRegex).filter(t => t.length > 2);
  const tokensAmmps = normAmmps.split(splitRegex).filter(t => t.length > 2);
  
  if (tokensExcel.length === 0 || tokensAmmps.length === 0) {
    return normExcel.includes(normAmmps) || normAmmps.includes(normExcel);
  }
  
  const setAmmps = new Set(tokensAmmps);
  let matchCount = 0;
  for (const tok of tokensExcel) {
    if (setAmmps.has(tok)) {
      matchCount++;
    }
  }
  
  const minRequired = Math.min(tokensExcel.length, tokensAmmps.length);
  return matchCount >= minRequired;
}

/**
 * Extract dosage value and convert to base unit (e.g. mg or ml)
 */
function parseDosage(dosageStr, unitStr = '') {
  if (!dosageStr) return null;
  
  const fullStr = String(dosageStr) + ' ' + String(unitStr);
  const normalized = fullStr.toLowerCase().replace(/,/g, '.').trim();
  
  const match = normalized.match(/([\d.]+)\s*(mg|ml|g|mcg|ug|%|ui|u|l|amp|µg)?/i);
  if (!match) return null;
  
  const value = parseFloat(match[1]);
  let unit = (match[2] || '').trim();
  
  let standardValue = value;
  let standardUnit = unit;
  
  if (unit === 'g') {
    standardValue = value * 1000;
    standardUnit = 'mg';
  } else if (unit === 'mcg' || unit === 'ug' || unit === 'µg') {
    standardValue = value / 1000;
    standardUnit = 'mg';
  } else if (unit === 'l') {
    standardValue = value * 1000;
    standardUnit = 'ml';
  }
  
  return {
    originalValue: value,
    originalUnit: unit,
    standardValue,
    standardUnit
  };
}

/**
 * Compare two dosages
 */
function compareDosage(dosageExcel, unitExcel, dosageAmmps) {
  const pExcel = parseDosage(dosageExcel, unitExcel);
  const pAmmps = parseDosage(dosageAmmps);
  
  if (!pExcel || !pAmmps) {
    if (!dosageExcel && !dosageAmmps) return true;
    return false;
  }
  
  if (pExcel.standardUnit === pAmmps.standardUnit) {
    return Math.abs(pExcel.standardValue - pAmmps.standardValue) < 0.01;
  }
  
  if (!pExcel.standardUnit || !pAmmps.standardUnit) {
    return Math.abs(pExcel.standardValue - pAmmps.standardValue) < 0.01;
  }
  
  return false;
}

/**
 * Build indexes for fast lookup in AMMPS database
 */
function buildIndices(ammpsDb) {
  const nameMap = new Map();
  
  for (const item of ammpsDb) {
    const normName = normalize(item.specialty);
    
    // Add to name map
    if (!nameMap.has(normName)) {
      nameMap.set(normName, []);
    }
    nameMap.get(normName).push(item);
    
    // Cache normalized fields directly on the item for fast reuse
    item._normName = normName;
    item._normDci = normalize(item.dci);
    item._tokens = tokenize(item.specialty);
  }
  
  return { nameMap };
}

/**
 * Match a single Excel row against the AMMPS database
 * Returns { match: object|null, score: number, method: string, alternatives: array }
 */
function matchProduct(excelRow, ammpsDb, indices = null) {
  const excelName = excelRow.NOM || '';
  const excelDci = excelRow.DCI1 || '';
  const excelDosage = excelRow.DOSAGE1 || '';
  const excelUnit = excelRow.UNITE_DOSAGE1 || '';
  const excelForm = excelRow.FORME || '';

  const excelNameNorm = normalize(excelName);
  const excelTokens = tokenize(excelName);
  const excelFormNorm = normalize(excelForm);
  
  const candidates = [];

  // 1. FAST EXACT LOOKUP (O(1)) if index is provided
  if (indices && indices.nameMap.has(excelNameNorm)) {
    const items = indices.nameMap.get(excelNameNorm);
    for (const item of items) {
      const dciMatch = compareDCI(excelDci, item.dci);
      const dosageMatch = compareDosage(excelDosage, excelUnit, item.dosage);
      
      let score = 1.0;
      if (dciMatch) score += 0.5;
      if (dosageMatch) score += 0.3;
      
      candidates.push({ item, score, method: 'exact_name' });
    }
    
    // If we have a high quality exact name match, we can skip fuzzy matching entirely!
    const bestExact = candidates.find(c => c.score >= 1.5); // Exact name + DCI match
    if (bestExact) {
      return {
        match: bestExact.item,
        score: bestExact.score,
        method: bestExact.method,
        isAmbiguous: false,
        alternatives: []
      };
    }
  }

  // 2. FUZZY SEARCH (O(N) with fast pruning)
  for (const item of ammpsDb) {
    const ammpsNameNorm = item._normName || normalize(item.specialty);
    
    // Skip exact name matches here since they were handled above
    if (excelNameNorm === ammpsNameNorm) continue;
    
    // Pruning: skip if name lengths differ significantly (Levenshtein would be high)
    const lenDiff = Math.abs(excelNameNorm.length - ammpsNameNorm.length);
    const maxLen = Math.max(excelNameNorm.length, ammpsNameNorm.length);
    if (lenDiff / maxLen > 0.25) continue;
    
    // Pruning: skip if first characters are different and no token overlap
    const ammpsTokens = item._tokens || tokenize(item.specialty);
    const firstCharExcel = excelNameNorm[0];
    const firstCharAmmps = ammpsNameNorm[0];
    if (firstCharExcel !== firstCharAmmps) {
      // Check if they share at least one token
      const hasTokenOverlap = excelTokens.some(t => ammpsTokens.includes(t));
      if (!hasTokenOverlap) continue;
    }

    // Compute similarities
    const levSim = stringSimilarity(excelNameNorm, ammpsNameNorm);
    if (levSim < 0.8) continue; // Skip if Levenshtein is poor
    
    const jacSim = jaccardSimilarity(excelTokens, ammpsTokens);
    const nameSim = Math.max(levSim, jacSim);
    
    if (nameSim >= 0.8) {
      const dciMatch = compareDCI(excelDci, item.dci);
      const dosageMatch = compareDosage(excelDosage, excelUnit, item.dosage);
      
      let score = nameSim;
      if (dciMatch) score += 0.5;
      if (dosageMatch) score += 0.3;
      
      candidates.push({ item, score, method: 'fuzzy_name' });
    }
  }
  
  // 3. FALLBACK MATCH (only if no good name candidates)
  if (candidates.length === 0) {
    for (const item of ammpsDb) {
      const dciMatch = compareDCI(excelDci, item.dci);
      if (dciMatch) {
        const dosageMatch = compareDosage(excelDosage, excelUnit, item.dosage);
        if (dosageMatch) {
          const ammpsFormNorm = normalize(item.form);
          const formSim = stringSimilarity(excelFormNorm, ammpsFormNorm);
          if (formSim > 0.6) {
            candidates.push({ item, score: 0.8 + formSim * 0.1, method: 'dci_dosage_form_match' });
          }
        }
      }
    }
  }

  // Sort candidates by score descending
  candidates.sort((a, b) => b.score - a.score);

  if (candidates.length > 0) {
    const topCandidate = candidates[0];
    
    // Determine ambiguity: if top candidate score is close to the second candidate score
    const isAmbiguous = candidates.length > 1 && (topCandidate.score - candidates[1].score) < 0.1;
    
    return {
      match: topCandidate.item,
      score: topCandidate.score,
      method: topCandidate.method,
      isAmbiguous,
      alternatives: candidates.slice(1, 4).map(c => ({ specialty: c.item.specialty, score: c.score, status: c.item.status }))
    };
  }

  return {
    match: null,
    score: 0,
    method: 'none',
    isAmbiguous: false,
    alternatives: []
  };
}

module.exports = {
  normalize,
  tokenize,
  levenshtein,
  stringSimilarity,
  jaccardSimilarity,
  compareDCI,
  parseDosage,
  compareDosage,
  buildIndices,
  matchProduct
};
