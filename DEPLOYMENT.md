# 🚀 Guide de Déploiement - GameHub Repertoire

## Préparation

### 1. **Préparer le code**
```bash
# Assure-toi que tout est committed
git add .
git commit -m "Préparation déploiement"
git push origin main
```

### 2. **Créer un fichier .env**
```bash
# Copie .env.example et remplis les valeurs
cp .env.example .env
```

Remplis les variables importantes:
```
PORT=3000
NODE_ENV=production
DEV_ACCESS_CODE=ton-super-code-secret
DISCORD_CLIENT_ID=ta-clé-discord
DISCORD_CLIENT_SECRET=ton-secret-discord
SESSION_SECRET=une-clé-aléatoire-très-longue
```

### 3. **Ajouter .env à .gitignore**
```bash
echo ".env" >> .gitignore
git add .gitignore
git commit -m "Add .env to gitignore"
```

---

## 🎯 Déploiement sur RAILWAY (Recommandé)

### Étape 1: Créer un compte
- Va sur https://railway.app
- Sign up avec GitHub

### Étape 2: Créer un projet
1. Clique sur "New Project"
2. Sélectionne "Deploy from GitHub"
3. Autorise l'accès et sélectionne ton repo `Game-Hub-repertoire`

### Étape 3: Configurer
1. Railway détecte Node.js automatiquement
2. Va dans "Variables"
3. Ajoute tes variables d'environnement (.env)
4. Clique sur "Deploy"

### Étape 4: Obtenir l'URL
```
Ton app sera accessible à:
https://ton-app-xyz.up.railway.app
```

---

## 🎯 Déploiement sur RENDER

### Étape 1: Créer un compte
- Va sur https://render.com
- Sign up avec GitHub

### Étape 2: Créer un Web Service
1. New > Web Service
2. Connecte ton repo GitHub
3. Configure:
   - **Name:** gamehub-repertoire
   - **Runtime:** node-18
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

### Étape 3: Ajouter les variables
1. Va dans "Environment"
2. Ajoute tes variables .env
3. Clique "Create Web Service"

---

## 🌍 Domaine personnalisé

Une fois déployé:

1. **Achète un domaine** (Namecheap, Google Domains, etc.)
2. **Pointe vers Railway/Render** avec les DNS settings
3. **Met à jour DISCORD_CALLBACK_URL** avec ton domaine

---

## 📊 Considérations Importantes

### Base de données
Actuellement tu utilises des fichiers JSON (data/).
- ✅ Bon pour développement
- ❌ Problématique pour production (plusieurs instances)

**Recommandation:** Migrer vers **PostgreSQL**
```bash
npm install pg dotenv
# Puis adapter tes routes pour utiliser une DB
```

### Uploads de fichiers
Actuellement tu utilises `multer` pour sauvegarder les fichiers localement.

**Problème:** Les fichiers ne persistent pas entre redéploiements.

**Solution:** Utiliser un service cloud
- AWS S3
- Cloudinary
- Firebase Storage

---

## 🔒 Sécurité en Production

- ✅ Change `DEV_ACCESS_CODE` dans les variables
- ✅ Utilise un SESSION_SECRET aléatoire long
- ✅ Définis `NODE_ENV=production`
- ✅ Ajoute un rate limiter (npm install express-rate-limit)
- ✅ HTTPS automatique (Railway/Render le font)

---

## 📝 Checklist Final

- [ ] Fichier .env créé et .gitignore mis à jour
- [ ] Package.json a "start": "node server.js"
- [ ] Code committed et pushed sur GitHub
- [ ] Compte Railway/Render créé
- [ ] Variables d'environnement ajoutées
- [ ] Application déployée
- [ ] URL accessible testée
- [ ] Code d'accès fonctionne

---

## 🆘 Troubleshooting

### "PORT n'est pas défini"
→ Railway/Render l'assigne automatiquement. Vérifiez: `process.env.PORT || 3000`

### "Fichiers d'upload manquants"
→ Utilise un service cloud pour les uploads

### "Erreur de connexion à la DB"
→ Ajoute les variables DATABASE_URL dans l'environnement

### Application redémarre en boucle
→ Vérifiez les logs: `railway logs` ou Render dashboard

---

## 📚 Ressources

- [Railway Docs](https://docs.railway.app)
- [Render Docs](https://render.com/docs)
- [Express Deploy Guide](https://expressjs.com/en/advanced/pm2.html)
