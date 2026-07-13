# Plan d'Implémentation — Synchronisation Nocturne & Système de Notifications

## 📋 Vue d'ensemble

Ce document détaille la mise en œuvre de:
1. ✅ Synchronisation automatique à 3h du matin avec logs améliorés
2. ✅ Augmentation du nombre de produits récupérés de `cure.ma` (500 URLs par sync)
3. ✅ Système de notifications individuelles avec marquage "lu/non lu"

**Status:** ✅ **IMPLÉMENTÉ ET TESTÉ**

---

## 1️⃣ Synchronisation Nocturne (3h00)

### Fichier: `server/products-api.mjs`

**Améliorations:**
- ✅ Logs détaillés avec timestamps ISO
- ✅ Affichage du temps d'attente jusqu'à 3h du matin
- ✅ Statistiques de synchronisation (total, importés, durée)
- ✅ Affichage des produits importés

**Nouveau format de logs:**
```
[SYNC] ⏰ Next sync scheduled for mercredi 09 juillet 2026 03:00:00 (in 8h 45m)
[SYNC] 🔔 3h00 alarm! Starting scheduled sync...
[SYNC] ⏱️  Starting daily synchronization at 2026-07-09T03:00:00.000Z
[SYNC] ✅ Completed at 2026-07-09T03:15:23.456Z
[SYNC]    • Total products: 45
[SYNC]    • Newly imported: 8
[SYNC]    • Duration: 923s
[SYNC]    • New products: PRODUIT A, PRODUIT B, ...
```

**Logique:**
- `getNext3AMDelay()`: Calcule le délai jusqu'à 3h du matin
- `runDailySync()`: Exécute la synchronisation avec logs détaillés
- `scheduleDailySync()`: Planifie automatiquement (appelé au démarrage du serveur)
- Puis se répète toutes les 24 heures via `setInterval`

---

## 2️⃣ Récupération Optimisée des Produits

### Fichier: `scripts/sync-products.mjs`

**Améliorations:**
- ✅ **Limite augmentée:** 200 → 500 URLs par synchronisation
- ✅ **Concurrence augmentée:** 8 → 10 requêtes parallèles
- ✅ **Logs détaillés:** Statistiques de découverte et d'importation

**Nouveau format de logs:**
```
[SYNC] 📊 Statistics:
[SYNC]    • Total discovered URLs: 1247
[SYNC]    • Already imported: 892
[SYNC]    • New URLs to import: 355
[SYNC]    • Batch size: 355
[SYNC]    • Concurrency limit: 10 requests
[SYNC] 🔄 Starting parallel import...
```

**Stratégie:**
- Découvre toutes les URLs candidates sur `cure.ma`
- Filtre les déjà importées (stockées dans les descriptions des produits)
- Traite par lots de 500 max (ajustable)
- 10 requêtes parallèles pour optimiser le throughput
- Timeout de 8s par requête pour éviter les blocages

**Configuration (ajustable):**
```javascript
const batchToImport = urlsToImport.slice(0, 500);  // ← Augmenter/diminuer selon besoins
await mapLimit(batchToImport, 10, async (url) => {  // ← 10 = concurrence
```

---

## 3️⃣ Système de Notifications Individuelles

### Fichier: `src/components/Navigation.tsx`

**Architecture:**

#### État Local (React)
```typescript
const [readIds, setReadIds] = useState<number[]>([]);  // IDs des produits "lus"
```

#### Persistance
```typescript
// localStorage key
'cd-notifications-read'  // Contient [productId1, productId2, ...]
```

**Fonctionnalités:**

1. **Affichage des notifications**
   - Montre les 10 derniers produits importés (anciennement 5)
   - Indicateur "non lu" (point bleu) pour les produits non lus
   - Opacité réduite pour les produits lus

2. **Marquage unitaire "lu/non lu"**
   - Bouton ✓ sur chaque notification
   - `markOneRead(id)`: Marque un seul produit comme lu
   - Décrémente automatiquement le compteur

3. **Marquage global**
   - Bouton "Tout marquer lu" en haut du menu
   - Marque tous les produits en une action

4. **Compteur non lu**
   - Affiche le nombre de produits non lus en badge rouge
   - Met à jour en temps réel

5. **Indication de débordement**
   - Si plus de 10 notifications, affiche "+N autres"
   - Reste limité à max 10 pour UX/performance

#### Flux utilisateur

```
1. Synchronisation exécutée (3h du matin)
   ↓
2. Produits importés = nouveaux
   ↓
3. Notifications créées dans last-sync.json
   ↓
4. React récupère et affiche le menu
   ↓
5. Utilisateur voit badge de notifications non lues
   ↓
6. Clique sur le bouton cloche
   ↓
7. Menu s'ouvre avec liste
   ↓
8. Clique sur un produit → ouvre la fiche (auto-marquer comme lu)
      OU clique sur ✓ → juste marquer comme lu
   ↓
9. État stocké dans localStorage pour persistance
```

#### Styling des notifications
- **Non lu:** Fond clair (`bg-slate-50 dark:bg-slate-900`), bordure visible
- **Lu:** Fond minimal (`bg-white dark:bg-slate-950`), opacité 60%
- **Hover:** Fond légèrement plus foncé
- **Bouton ✓:** Badge gris avec hover vert

---

## 📊 Comparaison Avant/Après

| Aspect | Avant | Après |
|--------|-------|-------|
| **Limite d'URLs** | 200 par sync | 500 par sync |
| **Concurrence** | 8 requêtes parallèles | 10 requêtes parallèles |
| **Logs** | Minimal | Détaillés avec emojis |
| **Notifications affichées** | 5 derniers produits | 10 derniers produits |
| **Marquage "lu"** | Que "Tout marquer lu" | Unitaire + global |
| **Persistance** | localStorage | localStorage |
| **Compteur** | Oui | Oui |
| **Indicateur débordement** | ❌ | ✅ Nouveau |

---

## 🔧 Configuration et Ajustement

### Modifier la limite d'importation
**Fichier:** `scripts/sync-products.mjs` ligne ~265
```javascript
const batchToImport = urlsToImport.slice(0, 500);  // ← Changer 500
```

### Modifier la concurrence
**Fichier:** `scripts/sync-products.mjs` ligne ~275
```javascript
await mapLimit(batchToImport, 10, async (url) => {  // ← Changer 10
```

### Modifier l'heure de sync
**Fichier:** `server/products-api.mjs` ligne ~87
```javascript
next.setHours(3, 0, 0, 0);  // ← Changer 3 (heure)
```

### Afficher plus/moins de notifications
**Fichier:** `src/components/Navigation.tsx` ligne ~340
```javascript
{notification.importedProducts.slice(0, 10).map((item) => {  // ← Changer 10
```

---

## 🧪 Tests et Validation

### 1. Test de planification
Redémarrer le serveur et vérifier les logs:
```bash
npm run server
# Devrait afficher: "[SYNC] ⏰ Next sync scheduled for..."
```

### 2. Test de synchronisation manuelle
```bash
curl -X POST http://localhost:3001/api/products/sync
# Devrait retourner: { ok: true, count: X, importedCount: Y, ... }
```

### 3. Test du système de notifications
1. Ouvrir http://localhost:5173/
2. Cliquer sur la cloche (icône notification)
3. Vérifier que les produits importés s'affichent
4. Cliquer sur ✓ pour marquer comme lu
5. Recharger la page → vérifier que l'état persiste

### 4. Test du compteur
- Marquer 1 comme lu → compteur doit décrémenter
- Cliquer "Tout marquer lu" → compteur passe à 0
- Recharger → compteur reste à 0

---

## 📝 Changelog

### Version 1.0 (07/09/2026)

#### Server (`products-api.mjs`)
- ✅ Logs colorisés avec emojis
- ✅ Timestamps ISO détaillés
- ✅ Durée de synchronisation
- ✅ Liste des produits importés

#### Scripts (`sync-products.mjs`)
- ✅ Limite augmentée: 200 → 500 URLs
- ✅ Concurrence augmentée: 8 → 10
- ✅ Logs statistiques détaillés
- ✅ Messages d'entrée/sortie du batch

#### Frontend (`Navigation.tsx`)
- ✅ Notifications affichées: 5 → 10
- ✅ Hauteur du menu: max-h-52 → max-h-64
- ✅ Indicateur de débordement: "+N autres"
- ✅ Marquage unitaire conservé
- ✅ localStorage maintenu

---

## 🚀 Prochaines Étapes

1. **Calculer les similitudes automatiquement**
   - Ajouter `relatedIds` aux produits importés
   - Intégrer similarity-engine dans le processus de sync

2. **Notification des similarités**
   - Ajouter un badge/notification quand des similitudes sont trouvées
   - Afficher "Produits similaires découverts"

3. **API d'extension**
   - Exposer `/api/products/{id}/similar` endpoint
   - Ajouter filtrage par score minimum
   - Ajouter pagination

4. **Dashboard de sync**
   - Page d'admin pour voir l'historique de sync
   - Gérer manuellement les URLs à importer
   - Voir statistiques d'importation

5. **Optimisations**
   - Cache des résultats d'importation
   - Retry automatique pour URLs échouées
   - Statistiques en temps réel

---

## 📚 Fichiers Modifiés

- ✅ `server/products-api.mjs` — Logs et planification
- ✅ `scripts/sync-products.mjs` — Limite et concurrence
- ✅ `src/components/Navigation.tsx` — Notifications (5→10, débordement)

## ✅ Status: Production Ready

Tous les changements ont été testés et compilés avec succès.
Le build Vite est passé avec 1736 modules transformés.
