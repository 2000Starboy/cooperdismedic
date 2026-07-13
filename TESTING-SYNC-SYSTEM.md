# 🧪 Guide de Test Rapide — Synchronisation Nocturne

## 1️⃣ Tester les Logs de Planification

```bash
npm run server
```

**Résultat attendu:**
```
🚀 Products API listening on http://localhost:3001/api/products
[SYNC] ⏰ Next sync scheduled for [DATE] (in XXh XXm)
```

---

## 2️⃣ Tester la Synchronisation Manuelle

```bash
# Terminal 1: Lancer le serveur
npm run server

# Terminal 2: Déclencher sync
curl -X POST http://localhost:3001/api/products/sync
```

**Résultat attendu:**
```json
{
  "ok": true,
  "syncedAt": "2026-07-09T10:45:23.456Z",
  "count": 45,
  "importedCount": 8,
  "importedProducts": [
    {"id": 1018, "name": "PRODUIT A", "dci": "DCI A", "url": "https://cure.ma/..."},
    ...
  ]
}
```

**Dans les logs du serveur:**
```
[SYNC] ⏱️  Starting daily synchronization at 2026-07-09T10:45:23.456Z
[SYNC] 📊 Statistics:
[SYNC]    • Total discovered URLs: 1247
[SYNC]    • Already imported: 892
[SYNC]    • New URLs to import: 355
[SYNC]    • Batch size: 355
[SYNC]    • Concurrency limit: 10 requests
[SYNC] 🔄 Starting parallel import...
[SYNC] ✅ Completed at 2026-07-09T10:46:15.789Z
[SYNC]    • Total products: 45
[SYNC]    • Newly imported: 8
[SYNC]    • Duration: 52s
```

---

## 3️⃣ Tester le Système de Notifications

### Ouvrir l'interface
```bash
# Terminal 1: Serveur backend
npm run server

# Terminal 2: Dev frontend
npm run dev
# Ouvrir http://localhost:5173/
```

### Vérifier les notifications
1. **Chercher le bouton cloche** (🔔) en haut à droite
   - Doit afficher un badge rouge avec le nombre non lu
   - Exemple: `🔔 3` = 3 notifications non lues

2. **Cliquer sur la cloche** pour ouvrir le menu
   - Doit afficher jusqu'à 10 produits importés
   - Chaque produit doit avoir:
     - Nom (ex: "PRODUIT A")
     - DCI (ex: "Amoxicilline")
     - Point bleu 🔵 si non lu
     - Bouton ✓ en haut à droite si non lu

3. **Tester "Marquer comme lu" unitaire**
   - Cliquer sur le bouton ✓ d'une notification
   - Le point bleu doit disparaître
   - Le compteur doit décrémenter de 1
   - Le produit doit devenir semi-transparent (opacity-60%)

4. **Tester "Tout marquer lu"**
   - Cliquer sur le bouton "Tout marquer lu" (bleu en haut)
   - Tous les points bleus doivent disparaître
   - Le compteur doit passer à 0
   - Tous les produits doivent devenir semi-transparents

5. **Tester la persistance**
   - Recharger la page (F5)
   - Les états "lu/non lu" doivent être conservés
   - Le compteur doit afficher le même nombre

6. **Tester le débordement (si 10+ notifications)**
   - Doit afficher: "+2 autres non affichés" (exemple)
   - Les 10 premiers restent visibles
   - Les autres sont masqués mais comptabilisés

7. **Tester l'ouverture de produit**
   - Cliquer sur une notification (pas sur le ✓)
   - Doit ouvrir la fiche produit
   - Doit marquer automatiquement comme lu

---

## 4️⃣ Vérifier localStorage

Ouvrir DevTools (F12) → Application → localStorage

**Clé à chercher:** `cd-notifications-read`

**Contenu attendu:**
```javascript
[1000, 1001, 1005]  // IDs des produits marqués comme lus
```

---

## 5️⃣ Scénario Complet de Test

### Étape 1: Préparation
```bash
npm run server   # Terminal 1
npm run dev      # Terminal 2
# Ouvrir http://localhost:5173/
# Ouvrir DevTools (F12)
```

### Étape 2: Trigger synchronisation
```bash
curl -X POST http://localhost:3001/api/products/sync
```

### Étape 3: Vérifier notifications
1. Badge devrait afficher 8 (par exemple)
2. Menu devrait afficher les 8 produits
3. localStorage['cd-notifications-read'] doit être vide `[]`

### Étape 4: Marquer comme lu
1. Cliquer ✓ sur 3 produits
2. Badge devrait passer à 5
3. localStorage doit contenir 3 IDs
4. Les 3 produits doivent être semi-transparents

### Étape 5: Tout marquer lu
1. Cliquer "Tout marquer lu"
2. Badge doit disparaître
3. localStorage doit contenir 8 IDs
4. Tous les produits doivent être semi-transparents

### Étape 6: Recharger
1. F5 pour recharger
2. localStorage doit être conservé
3. Badge ne doit pas réapparaître
4. Tous les produits doivent rester semi-transparents

### Étape 7: Nouveau sync
1. `curl -X POST http://localhost:3001/api/products/sync` (si nouvelles URLs)
2. Badge devrait réapparaître avec nouveau nombre
3. Anciens produits doivent rester lu
4. Nouveaux produits doivent être non lu

---

## 📋 Checklist de Validation

- [ ] Logs server affichent horaire de sync
- [ ] Sync manuelle retourne les données attendues
- [ ] Badge notifications affiche le bon nombre
- [ ] Menu affiche jusqu'à 10 produits
- [ ] Bouton ✓ marque comme lu unitairement
- [ ] Compteur décrémente correctement
- [ ] Bouton "Tout marquer lu" fonctionne
- [ ] Badges disparaissent après marquage
- [ ] Opacité change visuellement
- [ ] localStorage persiste après rechargement
- [ ] Débordement affiche "+N autres"

---

## 🐛 Debug

### Logs serveur manquants?
- Vérifier que `npm run server` est exécuté
- Chercher les logs commençant par `[SYNC]`

### Notifications n'apparaissent pas?
- Vérifier DevTools → Network → `last-sync.json`
- Doit contenir: `importedProducts: [...]`

### localStorage ne fonctionne pas?
- DevTools → Application → Storage
- Vérifier la clé `cd-notifications-read`
- Essayer de vider le cache (Cmd+Shift+Delete)

### Compteur incorrect?
- Vérifier le calcul: `unreadCount = importedProducts.length - readIds.length`

---

## 📞 Support

Tous les changements sont documentés dans: `IMPLEMENTATION-SYNC-SYSTEM.md`
