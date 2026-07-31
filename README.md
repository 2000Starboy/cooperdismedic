# Cooper Dismedic — Portail B2B & Catalogue Médical

Bienvenue sur le dépôt officiel du portail web institutionnel et catalogue B2B de **Cooper Dismedic**. Ce projet fournit une plateforme complète pour les professionnels de la santé, les pharmaciens, les laboratoires partenaires et les administrateurs.

---

## Sommaire

1. À propos du projet
2. Identifiants de Connexion par Rôle
3. Fonctionnalités Principales
4. Architecture & Rôles Utilisateurs
5. Modèle de Données & Synchronisation
6. Stack Technique
7. Guide d'Installation et Démarrage
8. Scripts Disponibles
9. Structure du Projet

---

## 1. À propos du projet

Cooper Dismedic est un portail web moderne développé pour offrir une expérience fluide d'accès aux informations sur les médicaments, les dispositifs médicaux et les services pharmaceutiques au Maroc. La plateforme combine un site vitrine d'entreprise et une application web interactive sécurisée avec gestion de rôles.

---

## 2. Identifiants de Connexion par Rôle

Pour tester les différents espaces et fonctionnalités de l'application, voici les coordonnées de connexion de démonstration définies dans le système :

| Rôle | Nom complet | Identifiant (Username) | Mot de passe | Espace & Accès |
|---|---|---|---|---|
| **Super Admin** | Super Administrateur | `superadmin` | `dismedic@2026` | Accès total + Gestion complète des utilisateurs & catalogue |
| **Admin** | Administrateur Cooper | `admin` | `dismedic@2026` | Gestion du catalogue de produits et révision |
| **Pharmacien / Client B2B** | Pharmacien Dismedic | `pharmacien` | `dismedic@2026` | Consultation du catalogue complet B2B, détails & notifications |
| **Laboratoire Partner 1** | Pharma Lab Maroc | `pharmalab` | `dismedic@2026` | Portail dédié Laboratoires (Berrechid) |
| **Laboratoire Partner 2** | BioPharma Casablanca | `biopharma` | `dismedic@2026` | Portail dédié Laboratoires (Casablanca) |

---

## 3. Fonctionnalités Principales

### Authentification & Gestion des Comptes

- **Portail d'accès restreint** : Authentification requise pour accéder aux espaces réservés aux professionnels.
- **Menu utilisateur "Mon Compte"** : Accessible depuis la barre de navigation avec affichage du nom, de l'identifiant, du rôle et un bouton de déconnexion.
- **Gestion des rôles** : Différenciation des accès selon le profil connecté.

### Catalogue Produits & Navigation

- **Affichage dynamique des produits** : Présentation sous forme de cartes avec nom, DCI, classe thérapeutique, statut de prescription (Libre vs Prescription requise) et prix (PPM).
- **Pagination performante** : Chargement fluide et réactif limité à 24 produits par page avec navigation (Page suivante/précédente, numéros avec ellipsis, saut direct vers une page) pour éviter tout ralentissement sur un grand catalogue.
- **Filtres par spécialités / catégories** : Cardiologie, Neurologie, Gastroentérologie, Infectiologie, Dermatologie, Ophtalmologie, Rhumatologie, Pneumologie, etc.
- **Recherche multicritère** : Recherche instantanée par nom, DCI, laboratoire ou description.
- **Fiche détaillée produit** : Fenêtre modale et page détaillée avec indications, posologie, contre-indications, effets secondaires, conservation et produits similaires.

### Système de Synchronisation Automatisé (Cure.ma)

- **Synchronisation en un clic** : Bouton dans la barre de navigation pour récupérer les données les plus récentes.
- **Centre de Notifications** : Notification visuelle des nouveaux produits importés avec gestion des éléments lus/non lus.
- **Moteurs d'équivalence / similarité** : Scripts intelligents basés sur la similarité textuelle et la classification pour enrichir la base de données.

### Portail Laboratoires Partner

- **Espace dédié aux laboratoires** : Interface permettant d'accéder au suivi de leurs produits et d'effectuer des propositions d'enrichissement.

### Espace Administration & Gestion du Catalogue

- **Tableau de bord Admin** : Consultation, ajout, édition et suppression de produits.
- **Validation des produits importés** : Approbation des fiches en attente avant publication officielle.

### Ergonomie, Thème & Multilingue

- **Mode Clair / Sombre (Light & Dark Mode)** : Prise en charge complète avec basculement dynamique et persistance du choix utilisateur.
- **Internationalisation (i18n)** : Support multi-langue (Français, English, العربية) avec gestion du sens de lecture RTL/LTR.

---

## 4. Architecture & Rôles Utilisateurs

Le système gère plusieurs rôles avec des droits adaptés :

- **Pharmacien / Client B2B** : Consultation du catalogue, détails des produits et notifications.
- **Laboratoire Partner** : Accès à l'espace Portail Lab dédié.
- **Admin & Super Admin** : Accès complet à la gestion du catalogue et à l'administration des données.

---

## 5. Modèle de Données & Synchronisation

Les données produits comprennent :
- ID, Nom commercial, DCI (Substance active)
- Laboratoire fabricant, Forme, Dosage
- Classe thérapeutique, Catégories
- Description, Indications, Posologie, Contre-indications
- Effets secondaires, Mises en garde (Grossesse), Mode de conservation
- Statut d'ordonnance (`isPrescriptionRequired`)
- Prix PPM en Dirhams (MAD)

Les scripts situés dans le dossier `/scripts` permettent de scraper, nettoyer et synchroniser automatiquement le catalogue avec les sources de référence.

---

## 6. Stack Technique

- **Frontend** : React 19, TypeScript, Vite
- **Styling** : TailwindCSS, Vanilla CSS, CSS Variables pour le Design System
- **Animations & Smooth Scroll** : GSAP, ScrollTrigger, Lenis
- **Backend / Scripts API** : Node.js ES Modules, Playwright (pour l'extraction)
- **Internationalisation** : Module i18n sur-mesure (FR, EN, AR)

---

## 7. Guide d'Installation et Démarrage

### Prérequis

- Node.js (version 18 ou supérieure)
- npm ou yarn

### 1. Cloner le dépôt

```bash
git clone https://github.com/2000Starboy/cooperdismedic.git
cd cooperdismedic
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Lancer le serveur de développement

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173`.

### 4. Lancer le serveur API (Facultatif - pour la synchronisation et la gestion dynamique des utilisateurs)

```bash
npm run api
```

---

## 8. Scripts Disponibles

- `npm run dev` : Lance l'application en mode développement.
- `npm run build` : Compile le projet pour la production.
- `npm run preview` : Prévisualise le build de production.
- `npm run api` : Démarre le serveur backend Node.js pour les requêtes API et la synchronisation.
- `npm run products:sync` : Exécute le script de synchronisation du catalogue.

---

## 9. Structure du Projet

```text
cooperdismedic/
├── public/                # Fichiers statiques et images
├── scripts/               # Scripts Node.js de synchronisation et scraping
├── server/                # Serveur API Node.js
├── src/
│   ├── components/        # Composants réutilisables (Navigation, Modales, Auth...)
│   ├── data/              # Données statiques et fallback du catalogue
│   ├── hooks/             # Custom Hooks React
│   ├── lib/               # Utilities (i18n, Theme, Data Processing)
│   ├── pages/             # Pages principales (ProductsPage, AdminPage, LabPortalPage)
│   ├── sections/          # Sections de la page d'accueil (Hero, About, Team, etc.)
│   ├── types/             # Definitions TypeScript
│   ├── App.tsx            # Composant Racine et Routing
│   ├── index.css          # Styles globaux & Design Tokens
│   └── main.tsx           # Point d'entrée React
├── package.json
├── tailwind.config.js
└── vite.config.ts
```
