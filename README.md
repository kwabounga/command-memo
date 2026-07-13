# Command-Memo

[![Node Version](https://img.shields.io/badge/node-v18+-green)](https://nodejs.org/)
[![Tauri Build & Release (Windows & Linux)](https://github.com/kwabounga/command-memo/actions/workflows/tauri-build.yml/badge.svg)](https://github.com/kwabounga/command-memo/actions/workflows/tauri-build.yml)
[![License](https://img.shields.io/badge/license-MIT-blue)]

**Command-Memo** est une application qui permet de prendre, organiser et retrouver facilement des mémos et commandes importantes. L'app combine la simplicité d'une note avec la puissance de l'organisation type "command prompt".

---

## 📌 Fonctionnalités principales

* Créer et gérer des mémos rapides (commandes) et des templates paramétrables
* Organiser les mémos par catégories (icônes) et par workspaces
* Rechercher rapidement via des mots-clés
* Interface simple et moderne, accessible via un raccourci clavier global

---

## ⚙️ Installation & Setup

### Prérequis

* Node.js v18+ / npm
* Git
* Rust + Cargo (pour Tauri)
* Pour Windows : WSL2 recommandé pour dev côté Linux, mais build possible sur Windows natif

### Installation

```bash
git clone https://github.com/ton-utilisateur/command-memo.git
cd command-memo
npm install
```

---

## 🛠️ Commandes de développement

| Commande              | Description                                                  |
| ---------------------- | -------------------------------------------------------------|
| `npm run dev`          | Démarre le frontend seul (SvelteKit/Vite), sans la coquille Tauri |
| `npm run tauri dev`    | Démarre l'application complète en mode développement (desktop) |
| `npm run build`        | Compile le frontend pour la production                       |
| `npm run tauri build`  | Génère les installeurs desktop (`msi`, `deb`, `rpm`) pour l'OS cible |
| `npm run check`        | Vérifie les types (svelte-check)                              |
| `npm run check:watch`  | Idem, en mode watch                                            |

Rust + Cargo sont requis dès que `tauri` est utilisé. Le build natif se fait depuis l'OS cible (ou via cross-compilation si la toolchain est installée) ; sous Windows, WSL peut servir pour le dev mais pas pour produire un build Windows.

---

## 🧩 Structure du projet

```
command-memo/
├─ src/                  # Frontend SvelteKit
│   ├─ routes/           # UI principale (+page.svelte)
│   └─ lib/              # db.ts (accès SQL), types.ts, components/, stores/
├─ src-tauri/            # Backend Rust/Tauri (main.rs, migrations SQL, tauri.conf.json)
├─ static/               # Icônes SVG bundlées
├─ package.json
└─ README.md
```

---

## 📦 Build / Production

```bash
npm run tauri build
```

Génère les installeurs (`msi`, `deb`, `rpm`) dans `src-tauri/target/release/bundle/`. C'est une application desktop uniquement — pas de déploiement web.

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

---

## Côté utilisateur

En fonction de l'OS cible, le dossier de données de l'application se trouve :

| OS        | Path                                                          |
|-----------|----------------------------------------------------------------|
| `linux`   | `/home/<user>/.local/share/com.jychaillou.command-memo/`       |
| `windows` | `C:\Users\<user>\AppData\Roaming\com.jychaillou.command-memo\` |

### Icônes personnalisées

Pour ajouter des icônes custom, déposer des fichiers `icon.svg` dans le sous-dossier `icons/` de ce dossier de données (créé automatiquement au premier lancement s'il n'existe pas) :

| OS        | Path                                                                  |
|-----------|------------------------------------------------------------------------|
| `linux`   | `~/.local/share/com.jychaillou.command-memo/icons/`                    |
| `windows` | `%AppData%\com.jychaillou.command-memo\icons\` (soit `C:\Users\<user>\AppData\Roaming\com.jychaillou.command-memo\icons\`) |

Seuls les fichiers `.svg` sont pris en compte.

### Raccourci clavier sous Linux/Wayland

Le raccourci global intégré (via `global-hotkey`/X11) **ne fonctionne pas sous une session Wayland** (GNOME, etc.) : Wayland empêche volontairement une app tierce d'intercepter une touche au niveau système. C'est une limitation de la plateforme, pas un bug de l'app. Ça fonctionne toujours normalement sous X11 (et sous Windows/macOS).

Pour retrouver le même comportement (afficher/cacher la fenêtre) sous Wayland, il faut créer le raccourci **au niveau du bureau** (GNOME, KDE, etc.) plutôt que dans l'app :

1. Paramètres système → Clavier → Raccourcis personnalisés (sous GNOME : *Paramètres > Clavier > Voir et personnaliser les raccourcis > Raccourcis personnalisés*).
2. Créer un raccourci dont la commande est le binaire installé (ex. `/usr/bin/command-memo`), avec la combinaison de touches souhaitée.
3. Grâce au mécanisme *single instance* de l'app, relancer le binaire alors qu'une instance tourne déjà ne lance pas une deuxième fenêtre : ça bascule simplement l'affichage (show/hide) de l'instance déjà en cours (celle démarrée par l'autostart, par exemple).

### Config (raccourci clavier & offsets)

```json
{
    "shortcut": "CmdOrControl+Alt+F12",
    "offset_x": -9,
    "offset_y": -1
}
```

Le champ `shortcut` n'a d'effet que sous Windows, macOS et Linux/X11 (voir la limitation Wayland ci-dessus). Les offsets (`offset_x`/`offset_y`) s'appliquent partout : ils décalent la fenêtre par rapport au coin du moniteur choisi (celui sous le curseur sous X11/Windows/macOS, le moniteur primaire sous Wayland).

⚠️ Important : contrairement au dossier de données ci-dessus, `config.json` **n'est pas résolu par Tauri** — le code le cherche avec un chemin relatif, donc dans le **répertoire de travail courant au lancement du process**, pas dans un emplacement fixe.

* **Windows** : placer `config.json` dans le dossier d'installation, à côté du binaire (`.exe`). Ça fonctionne parce que le raccourci créé dans le menu Démarrer démarre avec ce dossier comme répertoire de travail.
* **Linux** : **comportement non garanti actuellement**, ça dépend de comment l'app est lancée (terminal, entrée `.desktop`, autostart) et n'a pas encore été fiabilisé. Pistes :
  * Lancer le binaire depuis un terminal en étant positionné dans le dossier où on veut mettre `config.json` (le cwd du terminal devient celui du process).
  * Si un lanceur `.desktop` ou une entrée d'autostart est utilisée, vérifier/fixer son `Path=`/`WorkingDirectory=`.
  * Une piste d'amélioration future serait de faire résoudre ce fichier par rapport au dossier de l'exécutable plutôt qu'au répertoire courant — pas encore fait.

#### Shortcuts

Pour les raccourcis/shortcuts, si le raccourci par défaut (`Ctrl+Alt+Espace`) est déjà pris par le système, on peut surcharger la config via ce `config.json`.

Un listing des noms de touches valides se trouve ici :
https://github.com/tauri-apps/global-hotkey/blob/c9913a97667b3e44cb000de384cd8937d5a0050a/src/hotkey.rs#L212

#### Offset

En fonction de l'écran, des ajustements (décalages) sont peut-être à faire sur votre OS.

--------

## Code pour du dev

### Auto-alimenter la DB pour faire des tests de front avec beaucoup d'éléments

```js
/*    seed ( dev only ) */
    async function seedDatabase() {
        const icons = [
            'nim',
            'nix',
            'nodejs',
            'nodejs_1',
            'nodejs_alt',
            'nodemon',
            'npm',
            'npm_alt',
            'nrwl',
            'nuget',
            'nunjucks',
            'nuxt',
            'ocaml',
            'opa',
            'opam',
            'pascal',
            'pawn',
            'pdf',
            'percy',
            'perl',
            'php',
            'php_elephant',
            'pipeline',
            'postcss',
            'posthtml',
            'powerpoint',
            'powershell',
            'prettier',
            'prisma',
            'processing',
            'processing_light',
            'prolog',
            'protractor',
            'pug',
            'puppet',
            'purescript',
            'python',
            'qsharp',
            'quasar',
            'r',
            'racket',
            'raml',
            'razor',
            'react',
            'react_ts',
            'readme',
            'reason',
            'red',
            'replit',
            'rescript',
            'restql',
            'riot',
        ];

        console.log("🌱 Seeding database…");

        for (const icon of icons) {
            const count = Math.floor(Math.random() * 50) + 1;

            for (let i = 1; i <= count; i++) {
                await addCommand(
                    `${icon} command ${i}`,
                    `Description ${i} pour ${icon}`,
                    `${icon} --do-something-${i}`,
                    icon // 👈 colonne icon
                );
            }
        }

        await refresh();
        console.log("✅ Seed terminé");
    }


    /*  delete all ( dev only ) */
    async function deleteAll() {
        if (!confirm("⚠️ Supprimer TOUTES les commandes ?")) return;

        console.log("🧨 Deleting all commands…");

        const all = await getCommands("");
        for (const c of all) {
            await deleteCommand(c.id);
        }

        await refresh();
        console.log("✅ Database cleared");
    }

```

```html
<!--                 Seed Db (dev Only)-->
            <Button color="warning" bsSize="sm" on:click={seedDatabase}>
                🌱 Seed DB (DEV)
            </Button>
<!--                 Delete All (dev Only)-->
            <Button color="danger" bsSize="sm" on:click={deleteAll}>
                🧨 Delete ALL (DEV)
            </Button>
```
