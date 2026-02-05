# Command-Memo

[![Node Version](https://img.shields.io/badge/node-v18+-green)](https://nodejs.org/)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]
[![License](https://img.shields.io/badge/license-MIT-blue)]

**Command-Memo** est une application qui permet de prendre, organiser et retrouver facilement des mémos et commandes importantes. L’app combine la simplicité d’une note avec la puissance de l’organisation type “command prompt”.

---

## 📌 Fonctionnalités principales

* Créer et gérer des mémos rapides
* Organiser les mémos par catégories ou tags
* Rechercher rapidement via des commandes ou mots-clés
* Interface simple et moderne inspirée des apps de notes et des prompts de commande

---

## ⚙️ Installation & Setup

### Prérequis

* Node.js v18+ / npm ou yarn
* Git
* Rust + Cargo (pour Tauri)
* Pour Windows : WSL2 recommandé pour dev côté Linux, mais build possible sur Windows natif

### Installation

```bash
git clone https://github.com/ton-utilisateur/command-memo.git
cd command-memo
npm install   # ou yarn install
```

---

## 🛠️ Commandes de développement

| Commande              | Description                                                 |
| --------------------- | ----------------------------------------------------------- |
| `npm run dev`         | Démarre l’application en mode développement Web (React)     |
| `npm run tauri dev`   | Démarre l’application Tauri en mode développement (desktop) |
| `npm run build`       | Compile le projet Web pour la production                    |
| `npm run tauri build` | Génère le build Tauri (desktop) pour l’OS cible             |
| `npm run start`       | Lance le projet Web ou desktop en production                |
| `npm run lint`        | Vérifie le code avec linter (ESLint/Prettier)               |
| `npm run test`        | Lance les tests unitaires                                   |

### ⚠️ Subtilités pour Tauri / OS

* **Développement WSL / Linux** : vous pouvez lancer `npm run tauri dev` directement dans WSL pour tester l’app desktop.
* **Compilation Windows** : Rust et toolchain Windows nécessaires. Utiliser `npm run tauri build` depuis PowerShell ou WSL configuré avec cross-compilation.
* **Build pour OS cible** : Tauri permet de compiler pour Windows, MacOS ou Linux depuis l’OS correspondant ou via cross-compilation si toolchain installée.

---

## 🧩 Structure du projet

```
command-memo/
│
├─ src/                  # Code source de l'application
│   ├─ components/       # Composants React
│   ├─ pages/            # Pages principales
│   ├─ hooks/            # Hooks personnalisés
│   └─ styles/           # Fichiers CSS / Tailwind
│
├─ src-tauri/            # Code spécifique Tauri (Rust, config)
├─ public/               # Assets publics (images, icônes, logos)
├─ package.json          # Dépendances et scripts
└─ README.md             # Documentation du projet
```

---

## 🔧 Développement

* Lancer l’environnement Web : `npm run dev`
* Lancer l’app desktop : `npm run tauri dev`
* Ajouter un nouveau composant dans `src/components`
* Gérer l’état global via React Context ou Zustand (selon implémentation)
* Utiliser TailwindCSS pour le style rapide et responsive

---

## 📦 Build / Production

```bash
# Build Web
npm run build

# Build Desktop (Tauri)
npm run tauri build
```

* Le build Web génère un dossier `dist` (ou `.next` si Next.js)
* Le build Desktop génère l’exécutable pour l’OS cible (Windows, MacOS, Linux)
* Déployer Web sur Vercel, Netlify ou serveur Node
* Distribuer Desktop via l’exécutable Tauri

---

## 🚀 Contribution

1. Forker le repo
2. Créer une branche feature : `git checkout -b feature/ma-fonctionnalite`
3. Commit et push : `git commit -m "Ajout de ..."` puis `git push origin feature/ma-fonctionnalite`
4. Ouvrir une Pull Request

---

## 📖 Ressources & Inspirations

* Logo minimaliste et moderne pour app de notes
* Interface inspirée des apps comme Notion, Google Keep
* Palette de couleurs simple et lisible pour une UX claire
