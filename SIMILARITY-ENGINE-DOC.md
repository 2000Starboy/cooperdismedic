# 🎯 Similarity Engine - Documentation Complète

## Vue d'ensemble

Le **Similarity Engine** est un système sophistiqué de calcul de pertinence pour identifier les médicaments similaires dans votre catalogue.

### Caractéristiques
- ✅ Score basé sur critères hiérarchisés
- ✅ Gestion des données manquantes
- ✅ Performance optimisée
- ✅ Code modulaire et maintenable
- ✅ Tests intégrés

---

## Système de Scoring

### Critères et Points

| Critère | Points | Description |
|---------|--------|-------------|
| **Principe Actif (DCI)** | **+100** | Identique ou équivalent (priorité maximale) |
| **Dosage** | **+30** | Même dosage avec même unité |
| **Forme Pharmaceutique** | **+20** | Comprimé, sirop, injection, etc. |
| **Classe ATC/Thérapeutique** | **+15** | Code ATC ou classe thérapeutique |
| **Laboratoire** | **+5** | Même laboratoire (bonus seulement) |

### Règles Importantes

1. **Seuil minimum**: Un produit avec un score < 1 n'est pas considéré comme similaire
2. **Bonus laboratoire**: Ne compte que si au moins un autre critère est satisfait (score > 0)
3. **Nombre de résultats**: Maximum 6 produits similaires par défaut
4. **Exclusion**: Le médicament lui-même est automatiquement exclu
5. **Gestion des données manquantes**: L'algorithme ne génère pas d'erreurs si des données manquent

---

## Utilisation

### 1. Import dans votre code

```javascript
import {
  calculateSimilarityScore,
  findSimilarProducts,
  findSimilarProductIds,
  getSimilarityStats,
} from './scripts/similarity-engine.mjs';
```

### 2. Calcul du score entre deux produits

```javascript
const product1 = { id: 1, name: 'Amoxicilline 500 mg', dci: 'Amoxicilline', dosage: '500 mg', form: 'Comprimé' };
const product2 = { id: 2, name: 'Amoxicilline 500 mg', dci: 'Amoxicilline', dosage: '500 mg', form: 'Comprimé' };

const result = calculateSimilarityScore(product1, product2);
console.log(result.score);        // 100 (DCI exact + Dosage + Form)
console.log(result.breakdown);    // { dci: 100, dosage: 30, form: 20, ... }
```

### 3. Trouver les produits similaires

```javascript
const product = products.find(p => p.name === 'Amoxicilline 500 mg');
const similar = findSimilarProducts(product, products, {
  minScore: 1,
  maxResults: 6,
  includeBreakdown: false,
});

// Résultat:
// [
//   { id: 2, name: '...', score: 95 },
//   { id: 3, name: '...', score: 80 },
//   ...
// ]
```

### 4. Obtenir uniquement les IDs

```javascript
const ids = findSimilarProductIds(product, products);
// Résultat: [2, 3, 5, 8]
```

### 5. Statistiques de similarité

```javascript
const stats = getSimilarityStats(product, products);
// Résultat:
// {
//   totalCandidates: 100,
//   matchingCount: 4,
//   avgScore: 87.5,
//   matches: [...]
// }
```

---

## Intégration avec le Catalogue

### Étape 1: Générer les relations

```bash
node scripts/compute-related-products-new.mjs
```

Cela affichera:
```
✓ [1] Paracétamol 1000 mg → 2 similar
✓ [2] Ibuprofène 400 mg → 1 similar
○ [3] Aspirine → no matches
```

### Étape 2: Mettre à jour le catalogue

Copier les `relatedIds` générés dans `src/data/products-catalogue.ts`:

```typescript
{
  id: 1,
  name: 'PARACÉTAMOL 1000MG',
  dci: 'Paracétamol',
  // ...
  relatedIds: [2, 3],  // ← Ajouter ici
}
```

### Étape 3: Reconstruire

```bash
npm run build
```

---

## Cas d'Usage

### Cas 1: Même principe actif, dosage différent

```javascript
Product A: Amoxicilline 250 mg
Product B: Amoxicilline 500 mg

Score: 100 (DCI match) = 100
```

### Cas 2: Même principe actif et dosage

```javascript
Product A: Amoxicilline 500 mg Comprimé
Product B: Amoxicilline 500 mg Sirop

Score: 100 (DCI) + 30 (Dosage) = 130
```

### Cas 3: Classe thérapeutique seulement

```javascript
Product A: Amoxicilline (Antibiotic)
Product C: Azithromycine (Antibiotic, pas d'ATC)

Score: 0 (si DCI n'existe pas)
```

### Cas 4: Données manquantes

```javascript
Product A: DCI missing, Form: Comprimé
Product B: DCI: Something, Form: Comprimé

Score: 20 (Form match seulement)
```

---

## API Complète

### `calculateSimilarityScore(product, candidate)`

Calcule le score entre deux produits.

**Paramètres:**
- `product`: Produit de référence
- `candidate`: Produit à comparer

**Retour:**
```javascript
{
  score: number,           // Score total
  breakdown: {
    dci: number,           // Points DCI
    dosage: number,        // Points Dosage
    form: number,          // Points Forme
    atc: number,           // Points ATC
    laboratory: number     // Points Labo
  }
}
```

### `findSimilarProducts(product, allProducts, options)`

Trouve les produits similaires triés par score.

**Options:**
```javascript
{
  minScore: 1,             // Seuil minimum (défaut: 1)
  maxResults: 6,           // Nombre max (défaut: 6)
  includeBreakdown: false  // Inclure détail (défaut: false)
}
```

**Retour:** Array de produits avec scores

### `findSimilarProductIds(product, allProducts, options)`

Version simplifiée retournant seulement les IDs.

### `getSimilarityStats(product, allProducts, options)`

Statistiques sur la similarité d'un produit.

**Retour:**
```javascript
{
  totalCandidates: number,
  matchingCount: number,
  avgScore: string,
  matches: Array
}
```

---

## Performance

### Complexité
- **Calcul d'un score**: O(1) - opérations simples
- **Trouver similaires**: O(n) - comparaison avec tous les produits
- **Pour 1000 produits**: ~10-50ms

### Optimisations
- String normalization en cache
- Pas d'allocations inutiles
- Filtrage précoce

---

## Maintenance

### Ajouter un nouveau critère

1. Créer une fonction `compareXXX(val1, val2)` dans `similarity-engine.mjs`
2. Ajouter au `calculateSimilarityScore()`:
   ```javascript
   if (compareXXX(product.xxx, candidate.xxx)) {
     breakdown.xxx = POINTS;
     score += POINTS;
   }
   ```
3. Documenter dans les scores

### Ajuster les points

Modifier les valeurs dans `calculateSimilarityScore()`:
```javascript
// 1. PRINCIPE ACTIF (DCI) - +100
// Changer à +150 pour augmenter l'importance
```

### Modifier les seuils

Dans `compute-related-products-new.mjs`:
```javascript
const config = {
  minScore: 1,      // Augmenter à 15 pour être plus strict
  maxResults: 6,    // Modifier le nombre de résultats
};
```

---

## Testing

### Tests unitaires

```bash
node scripts/test-similarity-engine.mjs
```

Teste:
- ✓ Calcul de score
- ✓ Composants de score
- ✓ Cas limites (données manquantes)
- ✓ Analyse complète

### Exemples manuels

```javascript
// Dans node
import { findSimilarProducts } from './scripts/similarity-engine.mjs';
const similar = findSimilarProducts(product, products);
console.log(similar);
```

---

## Limitations et Considérations

### Limitations actuelles
1. Pas d'IA/ML - système à règles
2. Ne gère pas les synonymes DCI
3. Pas d'historique utilisateur

### Améliorations futures
1. Support des synonymes DCI
2. Machine learning pour ajuster les poids
3. Feedback utilisateur
4. Cache des calculs

---

## FAQ

**Q: Pourquoi un score minimum de 1?**
A: Pour éviter les matches sans raison. Le seuil peut être augmenté dans `config.minScore`.

**Q: Et si le DCI est vide?**
A: L'algorithme continue avec les autres critères sans erreur.

**Q: Peut-on avoir 6 résultats?**
A: Oui, `maxResults: 6` est le défaut configurable.

**Q: Comment mettre à jour les relations?**
A: Relancer `compute-related-products-new.mjs` régulièrement.

---

## Support

Pour plus d'aide, consultez:
- `scripts/similarity-engine.mjs` - Code principal
- `scripts/test-similarity-engine.mjs` - Tests
- `scripts/compute-related-products-new.mjs` - Script de génération
