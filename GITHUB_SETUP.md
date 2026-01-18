# Installation et Configuration GitHub - GameHub

## Étape 1: Installer Git

### Option 1: Installer via Chocolatey (le plus simple)
```powershell
# Ouvre PowerShell en tant qu'Administrateur, puis:
choco install git
```

### Option 2: Télécharger directement
Va sur https://git-scm.com/download/win et télécharge l'installateur.

---

## Étape 2: Vérifier l'installation

Ouvre un nouveau terminal PowerShell et tape:
```powershell
git --version
```

Tu dois voir: `git version 2.xx.x`

---

## Étape 3: Configurer Git localement

```powershell
git config --global user.name "Ton Nom"
git config --global user.email "ton.email@example.com"
```

---

## Étape 4: Créer un Repo GitHub

1. Va sur https://github.com
2. **Sign up** si tu n'as pas de compte
3. Clique sur **"+"** en haut à droite
4. **"New repository"**
5. Configure:
   - **Name:** `Game-Hub-repertoire`
   - **Description:** "Répertoire Discord français avec système de rôles"
   - **Public** ou **Private** (au choix)
   - **Initialise sans README** (on va le faire nous-mêmes)
6. Clique **"Create repository"**

Tu auras une page avec une URL comme:
```
https://github.com/ton-username/Game-Hub-repertoire.git
```

---

## Étape 5: Pousser le projet sur GitHub

Dans PowerShell:

```powershell
cd "c:\Users\Utilisateur\Documents\Visual-studio\Site Web\Game Hub repertoire"

# Initialiser le repo Git local
git init

# Ajouter tous les fichiers
git add .

# Commit initial
git commit -m "Initial commit - GameHub Repertoire"

# Ajouter le remote (remplace l'URL par la tienne!)
git remote add origin https://github.com/TON-USERNAME/Game-Hub-repertoire.git

# Créer la branche main et pousser
git branch -M main
git push -u origin main
```

---

## Étape 6: Générer un Token GitHub (optionnel mais recommandé)

Pour éviter de mettre ton mot de passe à chaque fois:

1. Va sur GitHub → **Settings** (en haut à droite)
2. **Developer settings** (bas à gauche)
3. **Personal access tokens** → **Tokens (classic)**
4. **Generate new token**
5. Configure:
   - **Note:** "Git local"
   - **Expiration:** 90 days
   - **Scopes:** Coche `repo` seulement
6. Clique **"Generate token"**
7. **Copie le token** (ne le montre à personne!)

Ensuite, quand Git demande le mot de passe:
- **Username:** ton username GitHub
- **Password:** Colle le token

---

## ✅ Vérifier que tout fonctionne

```powershell
git remote -v
```

Tu dois voir:
```
origin  https://github.com/ton-username/Game-Hub-repertoire.git (fetch)
origin  https://github.com/ton-username/Game-Hub-repertoire.git (push)
```

---

## Besoin d'aide?

Dis-moi:
1. Tu as installé Git? ✅
2. Tu as créé le repo GitHub? ✅
3. Quel est ton GitHub username?

Je peux t'aider avec la configuration!
