/**
 * Similarity Engine - Calcul du score de pertinence entre médicaments
 * 
 * Système de scoring hiérarchisé:
 * - Même principe actif (DCI): +100
 * - Même dosage: +30
 * - Même forme pharmaceutique: +20
 * - Même classe ATC: +15
 * - Même laboratoire: +5
 * 
 * Seuil minimum: 1 point
 * Résultats: Top 6 (configurable)
 */

/**
 * Normalise une chaîne pour la comparaison
 */
function normalize(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/\s+/g, ' ');
}

/**
 * Extrait les tokens d'une chaîne
 */
function tokenize(str) {
  return normalize(str)
    .split(/\s+/)
    .filter(t => t.length > 0);
}

/**
 * Compare deux DCIs (principes actifs)
 * Gère les cas avec plusieurs principes actifs (séparés par |, /ou +)
 */
function compareDCI(dci1, dci2) {
  if (!dci1 || !dci2) return false;

  const normalize1 = normalize(dci1);
  const normalize2 = normalize(dci2);

  // Exact match
  if (normalize1 === normalize2) return true;

  // Split by common separators for multiple active ingredients
  const split1 = normalize1.split(/[\s|/+&]+/).filter(Boolean);
  const split2 = normalize2.split(/[\s|/+&]+/).filter(Boolean);

  // Check if any ingredients match
  return split1.some(ing1 => split2.some(ing2 => ing1 === ing2));
}

/**
 * Compare deux dosages avec tolérance
 * Exemples: "500 mg", "500mg", "500 ML"
 */
function compareDosage(dosage1, dosage2) {
  if (!dosage1 || !dosage2) return false;

  const extract = (str) => {
    const match = String(str).match(/(\d+(?:[.,]\d+)?)\s*(mg|ml|g|µg|mcg|%|ui|unité)?/i);
    if (!match) return null;
    return {
      value: parseFloat(match[1].replace(',', '.')),
      unit: (match[2] || '').toLowerCase(),
    };
  };

  const val1 = extract(dosage1);
  const val2 = extract(dosage2);

  if (!val1 || !val2) return false;

  // Must have same unit
  if (val1.unit !== val2.unit) return false;

  // Values must match exactly
  return Math.abs(val1.value - val2.value) < 0.01;
}

/**
 * Compare deux formes pharmaceutiques
 */
function compareForm(form1, form2) {
  if (!form1 || !form2) return false;
  return normalize(form1) === normalize(form2);
}

/**
 * Compare deux classes ATC
 */
function compareATC(atc1, atc2) {
  if (!atc1 || !atc2) return false;

  const normalize1 = normalize(atc1);
  const normalize2 = normalize(atc2);

  // Exact match
  if (normalize1 === normalize2) return true;

  // ATC hierarchy: compare prefixes for partial matches
  // e.g., "N06AB" matches "N06AB04"
  const short1 = normalize1.split(/\s+/)[0];
  const short2 = normalize2.split(/\s+/)[0];

  return (
    short1 === short2 ||
    short1.startsWith(short2) ||
    short2.startsWith(short1)
  );
}

/**
 * Compare deux laboratoires
 */
function compareLaboratory(lab1, lab2) {
  if (!lab1 || !lab2) return false;
  return normalize(lab1) === normalize(lab2);
}

/**
 * Calcule le score de similarité entre deux médicaments
 * 
 * @param {Object} product - Médicament de référence
 * @param {Object} candidate - Médicament à comparer
 * @returns {Object} { score: number, breakdown: Object }
 */
export function calculateSimilarityScore(product, candidate) {
  if (product.id === candidate.id) {
    return { score: -1, breakdown: {} };
  }

  let score = 0;
  const breakdown = {
    dci: 0,
    dosage: 0,
    form: 0,
    atc: 0,
    laboratory: 0,
  };

  // 1. PRINCIPE ACTIF (DCI) - +100
  if (compareDCI(product.dci, candidate.dci)) {
    breakdown.dci = 100;
    score += 100;
  }

  // 2. DOSAGE - +30
  if (compareDosage(product.dosage, candidate.dosage)) {
    breakdown.dosage = 30;
    score += 30;
  }

  // 3. FORME PHARMACEUTIQUE - +20
  if (compareForm(product.form, candidate.form)) {
    breakdown.form = 20;
    score += 20;
  }

  // 4. CLASSE ATC / CLASSE THÉRAPEUTIQUE - +15
  // Utilise therapeuticClass comme fallback si ATC non disponible
  const productATC = product.atc || product.therapeuticClass;
  const candidateATC = candidate.atc || candidate.therapeuticClass;
  if (productATC && candidateATC && compareATC(productATC, candidateATC)) {
    breakdown.atc = 15;
    score += 15;
  }

  // 5. LABORATOIRE - +5 (bonus seulement, jamais seul)
  if (score > 0 && compareLaboratory(product.laboratory, candidate.laboratory)) {
    breakdown.laboratory = 5;
    score += 5;
  }

  return { score, breakdown };
}

/**
 * Trouve les produits similaires pour un médicament donné
 * 
 * @param {Object} product - Médicament de référence
 * @param {Array} allProducts - Liste de tous les médicaments
 * @param {Object} options - Configuration
 *   - minScore: Seuil minimum de score (défaut: 1)
 *   - maxResults: Nombre maximum de résultats (défaut: 6)
 *   - includeBreakdown: Inclure le détail du score (défaut: false)
 * @returns {Array} Médicaments similaires triés par score décroissant
 */
export function findSimilarProducts(
  product,
  allProducts,
  options = {}
) {
  const {
    minScore = 1,
    maxResults = 6,
    includeBreakdown = false,
  } = options;

  const scored = allProducts
    .filter(candidate => candidate.id !== product.id)
    .map(candidate => {
      const result = calculateSimilarityScore(product, candidate);
      return {
        id: candidate.id,
        name: candidate.name,
        score: result.score,
        ...(includeBreakdown && { breakdown: result.breakdown }),
      };
    })
    .filter(item => item.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);

  return scored;
}

/**
 * Retourne uniquement les IDs des produits similaires
 */
export function findSimilarProductIds(
  product,
  allProducts,
  options = {}
) {
  return findSimilarProducts(product, allProducts, options)
    .map(item => item.id);
}

/**
 * Crée un objet de configuration par défaut pour la similarité
 */
export function createSimilarityConfig() {
  return {
    scores: {
      dci: 100,
      dosage: 30,
      form: 20,
      atc: 15,
      laboratory: 5,
    },
    minScore: 1,
    maxResults: 6,
  };
}

/**
 * Fournit des statistiques sur la similarité d'un produit
 */
export function getSimilarityStats(product, allProducts, options = {}) {
  const similar = findSimilarProducts(product, allProducts, {
    ...options,
    includeBreakdown: true,
    minScore: 0, // Include all for stats
  });

  return {
    totalCandidates: allProducts.length - 1,
    matchingCount: similar.length,
    avgScore: similar.length > 0
      ? (similar.reduce((sum, p) => sum + p.score, 0) / similar.length).toFixed(2)
      : 0,
    matches: similar.slice(0, options.maxResults || 6),
  };
}

export default {
  calculateSimilarityScore,
  findSimilarProducts,
  findSimilarProductIds,
  createSimilarityConfig,
  getSimilarityStats,
};
