# Guide d'implémentation - Amélioration de la similarité cure.ma

## 📌 Résumé du problème

Les produits importés de cure.ma n'ont pas de relations (relatedIds) calculées car:
- Le dosage est mal extrait (capture la forme au lieu de la dose)
- L'algorithme actuel pèse le dosage à 20%
- Avec dosage manquant = pas de match

## ✅ Solution implémentée

Nouveau fichier: **`scripts/similarity-enhanced.mjs`**

### Améliorations:
1. **Extraction dosage du nom** - "AMOXIL 500 MG" → 500 mg
2. **Normalization DCI** - "AMOXICILLINE 1g" → "amoxicilline"  
3. **Matching partiel** - Même si dosage/form incomplets
4. **Fallback matching** - Si DCI absent, utilise nom
5. **Scoring détaillé** - Traces pour debug

## 🔄 Comment l'intégrer

### Étape 1: Mettre à jour compute-related-products.mjs

Remplacer l'algorithme actuel par le nouvel:

```javascript
// OLD (compute-related-products.mjs)
import { computeSimilarityScore } from '../src/data/products-catalogue.ts'

// NEW
import { computeEnhancedSimilarity, findRelatedProducts } from './similarity-enhanced.mjs'
```

Puis utiliser:

```javascript
const related = {};
for (const product of PRODUCTS) {
  related[product.id] = findRelatedProducts(product, PRODUCTS, 25, 4);
  // 25 = score minimum, 4 = max results
}
```

### Étape 2: Améliorer l'extraction cure.ma

Dans `import-product-from-url.mjs`, améliorer `extractProductDataFromHtml()`:

```javascript
// Ajouter extraction du dosage du nom
function extractDosageFromName(name) {
  const match = String(name).match(/(\d+(?:,\d+)?)\s*(mg|g|ml|mcg|%|ui)?/i);
  if (match) return `${match[1]} ${match[2] || 'mg'}`;
  return '';
}

// Utiliser dans extraction
const dosage = extractByLabel(plainText, [...]) || extractDosageFromName(name);
```

### Étape 3: Normaliser les DCIs

Dans `sync-products.mjs`, normaliser les DCIs:

```javascript
function normalizeDci(dci) {
  return String(dci || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/\s*\d+\s*(?:mg|g|ml|%)/gi, '') // Remove dosage
    .trim();
}
```

## 🧪 Tests

Lancer le test:
```bash
node test-similarity-enhanced.mjs
```

Voir le rapport:
```bash
node scripts/RAPPORT-SIMILARITE.mjs
```

## 📊 Résultats attendus

**Avant** (algorithme actuel):
- Paracetamol match: DOLIPRANE 1000MG ✓
- Autres produits cure.ma: ✗ (0 match)

**Après** (algorithme amélioré):
- Score minimum 25 au lieu de 30
- Extraction dosage depuis nom du produit
- Matching partiel même sans dosage exact
- Plus de matches trouvés pour cure.ma

## ⚠️ Limitations actuelles

- Base de données petite (19 produits)
- Peu de doublons pour valider
- Résultats s'améliorent avec plus de produits

## 🎯 Prochaines étapes

1. **Court terme**:
   - Intégrer similarity-enhanced.mjs
   - Améliorer extraction cure.ma
   - Normaliser DCIs existants

2. **Moyen terme**:
   - Augmenter base de produits
   - Tester avec plus de données cure.ma
   - Affiner les poids de scoring

3. **Long terme**:
   - Machine learning pour scoring
   - User feedback integration
   - Données historiques d'utilisation
