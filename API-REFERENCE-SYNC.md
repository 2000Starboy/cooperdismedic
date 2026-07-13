# API Reference — Synchronisation Nocturne

## 🔌 Endpoints

### GET `/api/products`
Récupère la liste complète des produits

```bash
curl http://localhost:3001/api/products
```

**Réponse:**
```json
[
  {
    "id": 1000,
    "name": "DOLIPRANE 1000MG",
    "dci": "Paracétamol",
    "laboratory": "Sanofi Maroc",
    "form": "Comprimé",
    "dosage": "1000 mg",
    "therapeuticClass": "Antalgique",
    "categories": ["analgesic"],
    "relatedIds": [1001, 1013, 1014, 1002, 1003, 1006],
    "ppm": 18.5
  },
  ...
]
```

---

### GET `/api/products/last-sync` (ou `/api/last-sync.json`)
Récupère les métadonnées de la dernière synchronisation

```bash
curl http://localhost:3001/api/products/last-sync
```

**Réponse:**
```json
{
  "syncedAt": "2026-07-09T03:15:23.456Z",
  "count": 45,
  "importedCount": 8,
  "importedProducts": [
    {
      "id": 1018,
      "name": "PRODUIT IMPORTÉ A",
      "dci": "Amoxicilline 250mg",
      "url": "https://www.cure.ma/medicaments/amoxicilline-250mg-..."
    },
    {
      "id": 1019,
      "name": "PRODUIT IMPORTÉ B",
      "dci": "Azithromycine 500mg",
      "url": "https://www.cure.ma/medicaments/azithromycine-500mg-..."
    },
    ...
  ]
}
```

---

### POST `/api/products/sync`
Déclenche manuellement une synchronisation

```bash
curl -X POST http://localhost:3001/api/products/sync
```

**Réponse:**
```json
{
  "ok": true,
  "syncedAt": "2026-07-09T10:45:23.456Z",
  "count": 45,
  "importedCount": 8,
  "importedProducts": [
    {
      "id": 1018,
      "name": "PRODUIT IMPORTÉ A",
      "dci": "Amoxicilline 250mg",
      "url": "https://www.cure.ma/medicaments/amoxicilline-250mg-..."
    },
    ...
  ],
  "outputPath": "c:\\Users\\...\\public\\api\\products.json",
  "metadataPath": "c:\\Users\\...\\public\\api\\last-sync.json"
}
```

**Erreur:**
```json
{
  "ok": false,
  "error": "Description de l'erreur"
}
```

---

## 📋 Variables d'Environnement

### PORT
Port du serveur API (défaut: 3001)

```bash
PORT=3001 npm run server
```

---

## 🔄 Processus de Synchronisation

### Timeline
```
03:00:00 → Alarm
          Appelle runDailySync()
          ↓
          discoverProductUrls() — Découvre toutes les URLs
          ↓
          Filtre les URLs déjà importées
          ↓
          Charge par lots de 500 (concurrence 10)
          ↓
          importProductFromUrl() pour chaque URL
          ↓
          Ecrit dans products.json
          ↓
          Ecrit métadonnées dans last-sync.json
          ↓
03:15:23 → Terminé (exemple)
          
24 heures plus tard
          ↓
03:00:00 → Alarm (jour suivant)
```

### Configuration

| Variable | Fichier | Ligne | Défaut | Description |
|----------|---------|-------|--------|------------|
| Heure de sync | server/products-api.mjs | 87 | 3 | setHours(3, 0, 0, 0) |
| Limite URLs | scripts/sync-products.mjs | 265 | 500 | slice(0, 500) |
| Concurrence | scripts/sync-products.mjs | 275 | 10 | mapLimit(..., 10) |
| Timeout requête | scripts/sync-products.mjs | 285 | 8000 | 8 secondes |

---

## 📡 Structure des Données

### Product Object
```typescript
interface Product {
  id: number;
  name: string;
  dci: string;                    // Dénomination Commune Internationale
  laboratory: string;
  form: string;                   // Comprimé, gélule, solution, etc.
  dosage: string;                 // Ex: "1000 mg"
  therapeuticClass: string;       // Classification thérapeutique
  categories: string[];           // ["analgesic", "antibiotic", ...]
  ppm: number;                    // Prix public maximal
  description?: string;
  indications?: string;
  posology?: string;
  contraindications?: string;
  sideEffects?: string;
  conservation?: string;
  pregnancyCategory?: string;
  isPrescriptionRequired?: boolean;
  relatedIds?: number[];          // IDs des produits similaires
  sourceUrl?: string;             // URL d'importation (cure.ma)
}
```

### SyncMetadata Object
```typescript
interface SyncMetadata {
  syncedAt: string;               // ISO timestamp
  count: number;                  // Total produits
  importedCount: number;          // Nombre importés cette fois
  importedProducts: Array<{
    id: number;
    name: string;
    dci: string;
    url?: string;
  }>;
}
```

---

## 🧪 Scripts Utiles

### Exécuter une sync manuelle
```bash
node ./scripts/sync-products.mjs
```

### Vérifier les produits actuels
```bash
cat public/api/products.json | jq '.[0]'
```

### Vérifier les derniers importés
```bash
cat public/api/last-sync.json | jq '.importedProducts'
```

### Compter les produits
```bash
cat public/api/products.json | jq 'length'
```

### Lister les URLs découvertes
```bash
cat src/data/market-products.sitemaps.json | jq '.[].url'
```

---

## 🔍 Debugging

### Activer les logs détaillés
Les logs du serveur affichent automatiquement:
- Heure de la prochaine sync
- Statistiques de découverte
- Nombre d'URLs à traiter
- Concurrence utilisée
- Durée et résultats

### Vérifier les erreurs d'importation
```javascript
// Dans les logs de sync
[SYNC] ❌ Failed to sync products at ...
[SYNC]    Error: Description de l'erreur
```

### Vérifier les timeouts
Si une requête prend plus de 8s, elle timeout.
Augmenter si nécessaire:
```javascript
// scripts/sync-products.mjs ligne 285
const timeout = setTimeout(() => controller.abort(), 8000);  // ← 8000ms = 8s
```

---

## 🚀 Performance

### Estimations
- **Découverte URLs:** ~2-5s (selon le sitemaps)
- **Déduplication:** ~1s (si 1000+ URLs)
- **Batch de 500 URLs:** ~10-15 min (avec concurrence 10)
- **Total sync:** ~15-20 min (exemple typique)

### Optimisations Possibles
- Augmenter concurrence de 10 à 15 (plus de charge serveur)
- Augmenter limite de 500 à 1000 (plus de temps)
- Réduire timeout de 8s à 5s (plus d'erreurs)
- Paralléliser plus de découverte (plus complexe)

---

## 📊 Monitoring

### Métriques à surveiller
1. `count` — Nombre total de produits (doit croître)
2. `importedCount` — Nombre de nouveaux produits par sync
3. Durée de sync — Doit rester < 30 min
4. Erreurs d'importation — Doit être 0 ou très bas

### Alertes recommandées
- Sync échouée → Email à l'admin
- importedCount = 0 pendant 7 jours → Vérifier urls
- Durée sync > 30 min → Réduire batchSize ou concurrence

---

## 🔐 Sécurité

### Headers HTTP
```
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...
Accept: text/html,application/xhtml+xml,...
Accept-Language: fr-FR,fr;q=0.9,en;q=0.8
```

### Rate Limiting (cure.ma)
- Concurrence: 10 requêtes max parallèles
- Timeout: 8s par requête
- User-Agent: Identifié comme navigateur (respecte les TOS)

### Best Practices
- ✅ Respecter les TOS du site source
- ✅ Identifier clairement (User-Agent)
- ✅ Ne pas dépasser les limites de concurrence
- ✅ Respecter les robots.txt

---

## 📞 Support & Troubleshooting

### Sync ne s'exécute pas à 3h?
1. Vérifier que le serveur tourne: `npm run server`
2. Vérifier les logs au démarrage
3. Vérifier le timezone du serveur

### Produits ne s'importent pas?
1. Vérifier `discoverProductUrls()` trouve des URLs
2. Vérifier que `importProductFromUrl()` s'exécute
3. Vérifier les logs pour les erreurs d'importation

### localStorage notifications ne fonctionne pas?
1. Ouvrir DevTools (F12)
2. Aller dans Application → localStorage
3. Chercher la clé `cd-notifications-read`
4. Vérifier que le navigateur a localStorage activé

### Build échoue?
```bash
npm run build 2>&1
# Vérifier les erreurs TypeScript
```

---

## 📚 Fichiers Associés

- `IMPLEMENTATION-SYNC-SYSTEM.md` — Documentation technique complète
- `TESTING-SYNC-SYSTEM.md` — Guide de test détaillé
- `SYNC-SYSTEM-SUMMARY.txt` — Résumé visuel ASCII
- `server/products-api.mjs` — Serveur API
- `scripts/sync-products.mjs` — Logique de synchronisation
- `src/components/Navigation.tsx` — Interface notifications
- `public/api/products.json` — Base de données produits
- `public/api/last-sync.json` — Métadonnées dernière sync
