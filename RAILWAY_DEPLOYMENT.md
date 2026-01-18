# 🚀 Guide de Déploiement sur RAILWAY - GameHub Repertoire

## Étape 1: Préparer ton Repository GitHub

### Vérifier que tout est commité
```bash
cd "c:\Users\Utilisateur\Documents\Visual-studio\Site Web\Game Hub repertoire"
git status
```

Si tu vois des fichiers non commitès:
```bash
git add .
git commit -m "Préparation pour déploiement Railway"
git push origin main
```

**IMPORTANT:** Vérifie que `.gitignore` contient `.env` ✅ (c'est fait)

---

## Étape 2: Créer un Compte Railway

1. Va sur **https://railway.app**
2. Clique sur **"Start Free"**
3. Clique sur **"GitHub"** pour te connecter avec GitHub
4. Autorise Railway à accéder à tes repos
5. Valide ton email si demandé

---

## Étape 3: Créer un Nouveau Projet

1. Une fois connecté, tu es sur le dashboard
2. Clique sur **"New Project"**
3. Clique sur **"Deploy from GitHub repo"**

---

## Étape 4: Sélectionner ton Repo

1. Si tu vois un popup, cherche et sélectionne **"Game-Hub-repertoire"** (ou le nom exact de ton repo)
2. Railway va analyser le projet et détecter Node.js automatiquement
3. Clique sur **"Deploy Now"**

*Note: Si tu ne vois pas ton repo, clique sur "Configure GitHub App" et autorise Railway*

---

## Étape 5: Configurer les Variables d'Environnement ⚙️

C'est très important! Railway a besoin de savoir les paramètres secrets.

### Comment ajouter les variables:

1. Sur le dashboard du projet, tu vois un service **"server" ou "backend"**
2. Clique sur ce service
3. Va dans l'onglet **"Variables"**
4. Ajoute ces variables une par une:

```
PORT = 3000
NODE_ENV = production
DEV_ACCESS_CODE = ton-code-secret-ici
SESSION_SECRET = une-clé-très-longue-et-aléatoire
```

**Exemple de SESSION_SECRET:**
```
aJ8kL2mN5pQr9sT3uV6wX1yZ4aB7cD0eF3gH6iJ9kL2mN5pQr9sT3
```

5. Clique **"Save"** après chaque variable

---

## Étape 6: Vérifier le Déploiement

1. Railway va automatiquement:
   - Installer les dépendances (`npm install`)
   - Lancer le serveur (`npm start`)

2. Va dans l'onglet **"Deployments"** pour voir la progression
3. Attends que le status passe à **"Success"** (vert) ✅

---

## Étape 7: Obtenir ton URL Publique

Une fois déployé:

1. Va dans l'onglet **"Networking"**
2. Tu verras une URL publique comme:
   ```
   https://gamehub-production-xyz.up.railway.app
   ```
3. **Copie cette URL** - c'est ton site en production!

4. Teste-la dans ton navigateur:
   ```
   https://gamehub-production-xyz.up.railway.app
   ```

---

## Étape 8: Ajouter un Domaine Personnalisé (Optionnel)

Si tu veux `monsite.com` à la place de `xyz.up.railway.app`:

1. Achète un domaine (Namecheap, Google Domains, etc.)
2. Sur Railway, va dans **"Settings"**
3. Cherche **"Custom Domains"**
4. Ajoute ton domaine
5. Railway te donne les DNS à configurer
6. Configure ces DNS chez ton registrar
7. Ça prend 5-30 min pour que ça fonctionne

---

## Étape 9: Redéployer après des changements

Chaque fois que tu push sur GitHub:
```bash
git push origin main
```

Railway **redéploie automatiquement**! 🎉

Tu peux vérifier dans **"Deployments"** sur le dashboard.

---

## 🧪 Tester le Déploiement

Une fois live, teste:

### 1. Page d'accès
```
https://ton-url.up.railway.app
```
→ Tu dois voir la page "Zone Réservée aux Développeurs"

### 2. Teste le code d'accès
→ Entre le code que tu as configuré (DEV_ACCESS_CODE)

### 3. Teste les pages principales
→ Accueil, soumettre serveur, top serveurs, etc.

### 4. Teste les API (optionnel)
```
https://ton-url.up.railway.app/api/servers
```

---

## 🆘 Problèmes Courants

### "Application Error" au démarrage

**Cause:** Une variable d'environnement manque ou est incorrecte

**Solution:**
1. Va dans "Logs" sur Railway
2. Lis les erreurs (scroll down)
3. Ajoute les variables manquantes dans "Variables"
4. Clique sur le bouton redéployer

### "Cannot GET /"

**Cause:** Le serveur est en cours de démarrage

**Solution:** Attends 30-60 secondes et rafraîchis la page

### "Connection Refused"

**Cause:** Le serveur n'a pas démarré correctement

**Solution:**
1. Vérifiez les logs
2. Vérifiez que `npm start` est correct dans package.json
3. Vérifiez que `PORT` est défini en variable

---

## 📊 Monitoring après Déploiement

Sur le dashboard Railway:

- **Logs** - Voir ce qui se passe en temps réel
- **Metrics** - CPU, mémoire, requêtes
- **Deployments** - Historique des déploiements
- **Settings** - Redéployer, supprimer, config avancée

---

## ✅ Checklist Final

- [ ] Code committé et pushé sur GitHub
- [ ] Compte Railway créé
- [ ] Projet créé et connecté à GitHub
- [ ] Variables d'environnement ajoutées
- [ ] Déploiement réussi (status vert)
- [ ] URL publique testée
- [ ] Code d'accès fonctionne
- [ ] Pages principales accessibles

---

## 🎯 Et après?

Maintenant que c'est en prod:

1. **Partage l'URL** avec tes amis/utilisateurs
2. **Ajoute un domaine personnalisé** si tu veux
3. **Change le code d'accès** de temps en temps pour la sécurité
4. **Monitore les logs** pour voir les erreurs

Tu as besoin d'aide avec une étape spécifique? 😊
