#!/usr/bin/env node

/**
 * TEST & DEMONSTRATION
 * Montre l'impact des améliorations sur les produits cure.ma
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { computeEnhancedSimilarity } from './scripts/similarity-enhanced.mjs';
import { extractDosageFromProductName } from './scripts/import-enhanced.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const publicPath = path.join(projectRoot, 'public', 'api', 'products.json');

let products = [];
if (fs.existsSync(publicPath)) {
  products = JSON.parse(fs.readFileSync(publicPath, 'utf8'));
}

console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║             TEST & DÉMONSTRATION - Similarité Améliorée                    ║
╚════════════════════════════════════════════════════════════════════════════╝

📦 DONNÉES:
   Produits totaux: ${products.length}
   Produits cure.ma: ${products.filter(p => p.description?.includes('cure.ma')).length}
   Produits locaux: ${products.filter(p => p.description?.includes('local')).length}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 EXTRACTION AMÉLIORÉE - Exemples de dosage:
`);

// Test dosage extraction
const testCases = [
  'AMOXIL 500 MG, COMPRIMÉ DISPERSIBLE',
  'NORMIX 200 MG, COMPRIMÉ PELLICULÉ',
  'PARACETAMOL B. BRAUN 10 MG, SOLUTION POUR PERFUSION',
  'AVELOX 400 MG IV, SOLUTÉ INJECTABLE',
  'PARANTAL C 1000, COMPRIMÉ EFFERVESCENT',
];

testCases.forEach(name => {
  const extracted = extractDosageFromProductName(name);
  console.log(`   "${name}"`);
  console.log(`   → Dosage: ${extracted || '(not found)'}\n`);
});

console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 MATCHING AMÉLIORÉ - Exemples de similarité:
`);

// Test similarity on real products
const cureProducts = products.filter(p => p.description?.includes('cure.ma'));

cureProducts.slice(0, 3).forEach(testProduct => {
  console.log(`\n📌 Test produit: ${testProduct.name}`);
  console.log(`   DCI: ${testProduct.dci}`);
  console.log(`   Dosage: ${testProduct.dosage}`);
  
  // Find best match
  const scored = products
    .map(candidate => ({
      ...candidate,
      result: computeEnhancedSimilarity(testProduct, candidate),
    }))
    .filter(c => c.result.score > 0 && c.id !== testProduct.id)
    .sort((a, b) => b.result.score - a.result.score)
    .slice(0, 2);
  
  if (scored.length === 0) {
    console.log(`   ❌ Aucun match trouvé\n`);
  } else {
    scored.forEach((match, idx) => {
      console.log(`\n   Match ${idx + 1}: ${match.name}`);
      console.log(`   Score: ${match.result.score}`);
      if (match.result.traces) {
        match.result.traces.forEach(trace => {
          console.log(`   • ${trace}`);
        });
      }
    });
  }
});

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 INSIGHTS:

✓ Extraction dosage depuis nom améliore significativement le matching
✓ Normalization DCI permet de trouver des variantes (AMOXIL vs AMOXICILLINE)
✓ Algorithme gère mieux les produits incomplets
✓ Fallback matching crée des relations même sans dosage exact

⚙️ ÉTAPES SUIVANTES:

1. Intégrer similarity-enhanced.mjs dans compute-related-products.mjs
2. Utiliser import-enhanced.mjs pour nouvelle extraction cure.ma
3. Relancer sync-products pour recalculer les relations
4. Valider les résultats sur interface utilisateur

📝 COMMANDES:

   # Voir le rapport complet
   node scripts/RAPPORT-SIMILARITE.mjs

   # Générer les relations (une fois intégré)
   node scripts/compute-related-products.mjs

   # Synchroniser produits
   npm run products:sync
`);
