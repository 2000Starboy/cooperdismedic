# 🔄 SETUP SYNCHRONISATION AUTOMATIQUE À 3H DU MATIN

## 📋 PROBLÈME IDENTIFIÉ

Vous aviez remarqué que:
- ✅ Il y a **381 produits** dans `products.json`
- ❌ Mais seulement **28 produits** s'affichent sur le site
- ❌ La synchronisation automatique à **3h du matin n'est pas exécutée**

## 🔍 CAUSE ROOT

Le serveur API (`server/products-api.mjs`) programme la synchronisation à 3h du matin, **MAIS il doit rester actif en permanence**. Le problème est que:

1. Le serveur est lancé manuellement via `npm run api`
2. S'il s'arrête ou redémarre, la synchronisation programmée ne s'exécute pas
3. Sans le serveur actif, les 381 produits ne sont pas chargés

## ✅ SOLUTIONS

### **Option 1: Tâche Planifiée Windows (RECOMMANDÉE)**

Cette option lance automatiquement le serveur API au démarrage du système.

#### **Étapes:**

1. **Ouvrir Command Prompt ou PowerShell en tant qu'Administrateur**
   - Clic droit sur "Command Prompt" ou "PowerShell"
   - Sélectionner "Run as administrator"

2. **Exécuter le script de configuration**
   ```bash
   cd c:\Users\lenovo\Desktop\dismedic\cooperdismedic
   cd scripts
   setup-scheduled-task.bat
   ```

3. **Vérifier que la tâche a été créée**
   - Ouvrir "Task Scheduler" (chercher dans la barre de recherche Windows)
   - Vérifier que "CooperDismedic-API-Service" existe dans "Task Scheduler Library"

4. **Redémarrer Windows** pour tester
   - Le serveur devrait démarrer automatiquement
   - La synchronisation s'exécutera à 3h du matin chaque jour

### **Option 2: Lancer manuellement le serveur API**

À chaque fois que vous démarrez:

```bash
npm run api
```

Le serveur restera actif avec la synchronisation programmée à 3h du matin.

### **Option 3: Utiliser PM2 (Advanced)**

Pour plus de contrôle et de monitoring:

```bash
# Installer PM2 globalement
npm install -g pm2

# Sauvegarder le fichier de configuration PM2
pm2 save

# Configurer PM2 pour démarrer au boot
pm2 startup

# Ensuite, lancer le serveur via PM2
pm2 start "npm run api" --name "cooperdismedic-api"

# Sauvegarder la configuration
pm2 save
```

## 📊 SYNCHRONISATION À 3H DU MATIN

Une fois le serveur actif, voici ce qui se passe:

### **Automatiquement chaque jour à 03:00 AM:**

1. ✅ Le serveur se connecte à cure.ma pour découvrir les nouveaux produits
2. ✅ Il importe automatiquement les nouveaux produits trouvés
3. ✅ Les 381+ produits (ou plus) sont mis à jour dans `public/api/products.json`
4. ✅ Votre site web affiche tous les produits à jour

### **Comment vérifier les logs:**

Pour voir en temps réel ce que fait le serveur:

```bash
npm run api
```

Vous verrez des messages comme:
```
🚀 Products API listening on http://localhost:3001/api/products
[SYNC] ⏰ Next sync scheduled for 15/07/2026 03:00:00 (in 16h 28m)
[SYNC] 🔔 3h00 alarm! Starting scheduled sync...
[SYNC] ✅ Completed at 2026-07-15 03:05:30
[SYNC]    • Total products: 385
[SYNC]    • Newly imported: 4
```

## 🚀 PROCHAINES ÉTAPES

1. **Maintenant:** Garder le serveur API en cours d'exécution
2. **Aujourd'hui:** Attendre que la synchronisation en cours se termine (elle importe 7949 produits!)
3. **Demain à 3h:** La synchronisation automatique devrait s'exécuter
4. **Vérifier:** Rafraîchir le site pour voir les nouveaux produits

## 🔧 MAINTENANCE

### **Vérifier l'état du serveur:**

```bash
# Check if API is responding
curl http://localhost:3001/api/products/last-sync

# Or access in browser
http://localhost:3001/api/products/last-sync
```

### **Redémarrer le serveur:**

```bash
# Stop current server (Ctrl+C in terminal)
# Then restart
npm run api
```

### **Supprimer la tâche planifiée:**

Si vous voulez annuler la tâche planifiée:

```bash
# As Administrator
SchTasks.exe /Delete /TN "CooperDismedic-API-Service" /F
```

## 💡 ASTUCE

Pour vérifier que la synchronisation fonctionne:

1. Ouvrir `public/api/last-sync.json`
2. Vérifier le timestamp de la dernière synchronisation
3. Comparer avec l'heure actuelle

---

**Questions?** Vérifiez les logs du serveur avec `npm run api`
