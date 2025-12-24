# GameHub Repertoire

Un répertoire public de serveurs Discord français avec système de rôles avancé.

## Fonctionnalités

- **Page d'accueil** : Présentation du site avec annonces
- **Répertoire public** : Liste des serveurs Discord approuvés (non suspendus)
- **Soumission de serveurs** : Réservé aux utilisateurs connectés (non blacklistés)
- **Système de tickets** : Support utilisateur avec réponses des modérateurs/admins
- **Dashboard admin** : Gestion complète selon les rôles

## Rôles et Permissions

### Utilisateur (user)
- Se connecter
- Soumettre des serveurs
- Créer des tickets de support
- Voir les serveurs approuvés

### Modérateur (moderator)
- Tout ce que peut faire un utilisateur
- Approuver/rejeter les soumissions de serveurs
- Répondre aux tickets de support

### Administrateur (admin)
- Tout ce que peut faire un modérateur
- Modifier les informations des serveurs
- Suspendre/désuspendre des serveurs
- Blacklister/déblacklister des utilisateurs

### Développeur (developer)
- Tout ce que peut faire un administrateur
- Gérer les utilisateurs (changer rôles)
- Créer/modifier/supprimer des annonces

## Comptes de test

- **developer** (mot de passe: dev123) - rôle: developer
- **admin** (mot de passe: admin123) - rôle: admin
- **moderator** (mot de passe: mod123) - rôle: moderator
- **user** (mot de passe: user123) - rôle: user

## Installation et exécution

1. Assurez-vous d'avoir Node.js et npm installés
2. Naviguez vers le dossier backend: `cd backend`
3. Installez les dépendances: `npm install`
4. Lancez le serveur: `npm start`
5. Ouvrez `http://localhost:3000` dans votre navigateur

## Structure du projet

- `frontend/`: Pages HTML, CSS, JavaScript
- `backend/`: Serveur Express, routes API, utilitaires
- `data/`: Fichiers JSON pour le stockage des données

## Comptes de test

- **developer** (mot de passe: dev123) - rôle: developer
- **admin** (mot de passe: admin123) - rôle: admin
- **moderator** (mot de passe: mod123) - rôle: moderator
- **user** (mot de passe: user123) - rôle: user

Utilisez ces noms d'utilisateur pour vous connecter via la page de connexion.