# 📋 Formulaire - Architecture Complète

## 🎯 Structure Générale

```
┌─────────────────────────────────────────────┐
│   Soumettre un serveur Discord              │
├─────────────────────────────────────────────┤
│                                             │
│   📊 Barre de Progression (0-100%)         │
│   ████████░░░░░░░░░░  65% complété        │
│                                             │
├─────────────────────────────────────────────┤
│   🔔 Alertes (Success/Error)               │
├─────────────────────────────────────────────┤
│                                             │
│   ┌─ FIELDSET 1: Infos Basiques ─┐        │
│   │  • Nom du serveur             │        │
│   │  • Lien d'invitation          │        │
│   │  • Nombre de membres          │        │
│   └───────────────────────────────┘        │
│                                             │
│   ┌─ FIELDSET 2: Images ──────────┐        │
│   │  • Icône [upload] ▶ aperçu   │        │
│   │  • Bannière [upload] ▶ aperçu │        │
│   └───────────────────────────────┘        │
│                                             │
│   ┌─ FIELDSET 3: Contenu ─────────┐        │
│   │  • Description [textarea]      │        │
│   │  • Tags/Catégories            │        │
│   │  • Règles du serveur          │        │
│   └───────────────────────────────┘        │
│                                             │
│   ┌─ FIELDSET 4: Configuration ───┐        │
│   │  • Type de serveur            │        │
│   │  • Langue                     │        │
│   │  • Région                     │        │
│   │  • Âge minimum                │        │
│   └───────────────────────────────┘        │
│                                             │
│   [Soumettre] [Réinitialiser]             │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🔧 Détails des Champs

### Fieldset 1: Informations Basiques

| Champ | Type | Validation | Max |
|-------|------|-----------|-----|
| Nom | text | Alphanumériques | 100 |
| Invite Discord | URL | Format https://discord.gg/ | - |
| Membres | number | > 0 | - |

### Fieldset 2: Images

| Champ | Type | Validation | Max |
|-------|------|-----------|-----|
| Icône | file | PNG/JPG/GIF/WebP | 5 MB |
| Bannière | file | PNG/JPG/GIF/WebP | 10 MB |

### Fieldset 3: Contenu

| Champ | Type | Validation | Max |
|-------|------|-----------|-----|
| Description | textarea | 50-2000 chars | 2000 |
| Catégories | select | Required | - |
| Règles | textarea | Optional | 5000 |

### Fieldset 4: Configuration

| Champ | Type | Validation | Options |
|-------|------|-----------|---------|
| Type Serveur | select | Required | Gaming, Social, Study... |
| Langue | select | Required | FR, EN, DE, ES... |
| Région | select | Required | EU, US, ASIA... |
| Âge min | number | Optional | 13+ |

---

## 🎨 Système de Validation

```javascript
// Exemple de règle de validation
{
  name: {
    minLength: 3,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-_àâä...]+$/,
    message: 'Le nom doit contenir 3-100 caractères alphanumériques'
  }
}
```

---

## 📊 Barre de Progression

```
Calcul: (Champs remplis / Champs total) × 100

Champs obligatoires pour 100%:
✓ name
✓ inviteLink
✓ memberCount
✓ description
✓ category
✓ serverType
✓ language
✓ region
```

---

## 🎯 Flux de Soumission

```
1. Utilisateur remplit formulaire
   ↓
2. Validation en temps réel par champ
   ├─ Si erreur → Afficher message d'erreur ❌
   └─ Si valide → Effacer message ✓
   ↓
3. Mise à jour barre de progression
   ↓
4. Clic "Soumettre"
   ↓
5. Afficher dialogue de confirmation
   ├─ Si "Annuler" → Retour au formulaire
   └─ Si "Confirmer" → Continuer
   ↓
6. Validation finale du formulaire
   ├─ Si erreur → Afficher alerte ❌
   └─ Si valide → Continuer
   ↓
7. Bouton en mode "loading" (disabled + spinner)
   ↓
8. POST /api/servers
   ↓
9. Réponse serveur
   ├─ Succès → Afficher alerte verte ✓
   │         → Rediriger vers /index.html
   └─ Erreur → Afficher alerte rouge ❌
              → Reprise saisie possible
```

---

## 💾 Stockage Données

```javascript
// Objet envoyé au serveur
{
  name: "Mon Super Serveur",
  inviteLink: "https://discord.gg/abc123",
  memberCount: 500,
  icon: File,          // Fichier binaire
  banner: File,        // Fichier binaire
  description: "Un serveur génial...",
  category: "gaming",
  serverType: "competitive",
  language: "fr",
  region: "eu",
  minAge: 13,
  rules: "Respecter les autres..."
}
```

---

## 🎨 Palette de Couleurs

```
Primaire:     #3b82f6   (Bleu)
Secondaire:   #1d4ed8   (Bleu foncé)
Success:      #22c55e   (Vert)
Error:        #ef4444   (Rouge)
Warning:      #f59e0b   (Orange)
Texte:        #1f2937   (Gris foncé)
Subtle:       #6b7280   (Gris)
Border:       #e5e7eb   (Gris clair)
Background:   #ffffff   (Blanc)
```

---

## 📱 Points de Rupture Responsive

```
Desktop:   > 1024px   → Grille 2 colonnes
Tablet:    768-1024px → Grille 1 colonne
Mobile:    < 768px    → Optimisé écran petit
```

---

## ✨ Effets & Animations

| Effet | Duration | Easing |
|-------|----------|--------|
| Slide In Up | 0.8s | cubic-bezier(0.34,1.56,0.64,1) |
| Fade In | 0.6s | ease-out |
| Progress Bar | 0.4s | cubic-bezier(0.4,0,0.2,1) |
| Shimmer | 2s | infinite |
| Spin (Loader) | 0.8s | linear |
| Transition Focus | 0.3s | ease |

---

## 🔗 Points d'Intégration API

```javascript
// Charger les catégories au démarrage
GET /api/categories

// Soumettre le formulaire
POST /api/servers
Content-Type: multipart/form-data

// Vérifier authentification
GET /api/auth/me
```

---

## 🧪 Données de Test

```javascript
// Exemple de serveur valide
{
  name: "Discord Testing",
  inviteLink: "https://discord.gg/example",
  memberCount: 1000,
  description: "Ceci est un serveur de test pour la plateforme GameHub...",
  category: "gaming",
  serverType: "casual",
  language: "fr",
  region: "eu",
  minAge: 13
}
```

---

## ✅ Checklist Avant Production

- [ ] Tester tous les champs de validation
- [ ] Tester upload fichiers (valides/invalides)
- [ ] Tester responsive design
- [ ] Tester barre de progression
- [ ] Tester alertes (success/error)
- [ ] Tester dialogue de confirmation
- [ ] Tester état bouton loading
- [ ] Tester intégration API
- [ ] Tester gestion d'erreurs
- [ ] Tester logout

---

**Document généré**: 2024
**Version**: 1.0
**Status**: Production Ready ✓
