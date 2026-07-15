# Command-Memo

[![Node Version](https://img.shields.io/badge/node-v20+-green)](https://nodejs.org/)
[![Tauri Build & Release (Windows & Linux)](https://github.com/kwabounga/command-memo/actions/workflows/tauri-build.yml/badge.svg)](https://github.com/kwabounga/command-memo/actions/workflows/tauri-build.yml)
[![License](https://img.shields.io/badge/license-MIT-blue)]

**Command-Memo** est un launcher desktop façon "spotlight" pour stocker et retrouver rapidement des commandes (shell, SQL, etc.) qu'on ne tape pas assez souvent pour s'en souvenir par cœur.

---

## 📌 Fonctionnalités principales

* **Commands** (texte brut copié tel quel) et **Templates** (contenu avec `{{placeholders}}`, coloration syntaxique)
* Organisation par icône/catégorie et par **workspaces** (optionnel)
* Recherche rapide, accessible via un raccourci clavier global ou l'icône du tray
* Mises à jour automatiques (voir plus bas selon la plateforme/le format installé)

---

## 👤 Utilisation (utilisateur final)

### Installation

Télécharger la dernière version sur la page **[Releases](https://github.com/kwabounga/command-memo/releases/latest)** :

| OS        | Formats disponibles                                    |
|-----------|-----------------------------------------------------------|
| Windows   | `.msi`                                                    |
| Linux     | `.deb`, `.rpm`, `.AppImage`, `.AppImage` "Latest" (voir note ci-dessous) |

* **Windows** : lancer le `.msi`, suivre l'installeur.
* **Linux (.deb/.rpm)** : installer via le gestionnaire de paquets de la distro (`dpkg -i`, `rpm -i`, ou le centre logiciel).
* **Linux (.AppImage)** : la rendre exécutable (`chmod +x Command.memo_*.AppImage`) puis la lancer directement — aucune installation nécessaire, c'est un binaire portable. Pour l'intégrer proprement au menu applications (icône, recherche desktop), [AppImageLauncher](https://github.com/TheAssassin/AppImageLauncher) automatise ça (la PPA officielle est dépréciée, récupérer le `.deb` directement depuis leurs [releases GitHub](https://github.com/TheAssassin/AppImageLauncher/releases)).

> **Note compatibilité Linux** : les binaires standards sont construits sur une base **Ubuntu 22.04** — nécessite une distro équivalente ou plus récente. Sur un système Linux **très récent** (distro/noyau bleeding-edge, GPU récent), l'AppImage standard peut afficher une fenêtre vide (le GTK3 qu'elle embarque est trop ancien pour négocier correctement le rendu EGL avec un système hôte beaucoup plus à jour — cf. `CLAUDE.md` pour le détail du diagnostic). Chaque release fournit donc aussi un **`Command.memo.Latest_*.AppImage`**, buildé sur le runner Ubuntu le plus récent disponible, pour ce cas de figure — mais sans garantie totale sur du matériel vraiment très en avance (testé insuffisant sur GPU AMD "Granite Ridge"/Zen 5 + Ubuntu 26.04 par exemple). Cette variante n'est **pas** branchée sur l'auto-update (téléchargement manuel à chaque nouvelle version) ; si elle ne suffit pas non plus, `.deb`/`.rpm` restent la valeur sûre (mise à jour manuelle).

Au premier lancement, la fenêtre est cachée : elle s'affiche via le raccourci clavier global (par défaut `Ctrl+Alt+Espace`, voir [Config](#config-raccourci-clavier--offsets)) ou l'icône du tray.

### Mises à jour automatiques

Le mécanisme d'auto-update ne fonctionne **pas de la même façon selon le format installé** — c'est une limitation du plugin Tauri utilisé, pas un choix arbitraire :

| Format installé              | Auto-update ? | En pratique |
|--------------------------------|:---:|-------------|
| Windows `.msi`                 | ✅ | Détection silencieuse au démarrage, badge 🔔 à côté de la recherche si une MAJ est dispo, clic → téléchargement + installation + redémarrage automatique |
| Linux `.AppImage` (standard)    | ✅ | Idem — le fichier `.AppImage` se remplace lui-même en place |
| Linux `.AppImage` "Latest"      | ❌ | Pas branchée sur l'auto-update (build spécifique compat récente) : retélécharger manuellement à chaque nouvelle version |
| Linux `.deb` / `.rpm`           | ❌ | Aucune notification automatique : il faut retélécharger et réinstaller manuellement la nouvelle version depuis la page [Releases](https://github.com/kwabounga/command-memo/releases/latest) |

👉 Si tu veux profiter de l'auto-update sous Linux, privilégie l'**AppImage** plutôt que `.deb`/`.rpm`.

### Emplacements de données

| OS        | Path                                                          |
|-----------|----------------------------------------------------------------|
| `linux`   | `/home/<user>/.local/share/com.jychaillou.command-memo/` (données), `~/.config/com.jychaillou.command-memo/` (DB) |
| `windows` | `C:\Users\<user>\AppData\Roaming\com.jychaillou.command-memo\` |

#### Icônes personnalisées

Déposer des fichiers `.svg` dans le sous-dossier `icons/` de ce dossier de données (créé automatiquement au premier lancement) :

| OS        | Path                                                                  |
|-----------|------------------------------------------------------------------------|
| `linux`   | `~/.local/share/com.jychaillou.command-memo/icons/`                    |
| `windows` | `%AppData%\com.jychaillou.command-memo\icons\`                        |

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

Un listing des noms de touches valides pour `shortcut` se trouve ici :
https://github.com/tauri-apps/global-hotkey/blob/c9913a97667b3e44cb000de384cd8937d5a0050a/src/hotkey.rs#L212

---

## 🛠️ Développement / Contribution

### Prérequis

* Node.js v20+ / npm
* Git
* Rust + Cargo (pour Tauri)
* Sous Linux : dépendances système WebKitGTK/GTK (`libwebkit2gtk-4.1-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`, `patchelf`, `build-essential`, `pkg-config`, `libssl-dev` — voir `.github/workflows/tauri-build.yml` pour la liste exacte utilisée en CI)
* Sous Windows : build natif directement sur Windows (WSL2 utilisable pour éditer/tester le frontend seul, mais pas pour produire un installeur `.msi`)

### Setup

```bash
git clone git@github.com:kwabounga/command-memo.git
cd command-memo
npm install
```

### Commandes de développement

| Commande              | Description                                                  |
| ---------------------- | -------------------------------------------------------------|
| `npm run dev`          | Démarre le frontend seul (SvelteKit/Vite), sans la coquille Tauri |
| `npm run tauri dev`    | Démarre l'application complète en mode développement (desktop) |
| `npm run build`        | Compile le frontend pour la production                       |
| `npm run tauri build`  | Génère les installeurs desktop (`msi`, `deb`, `rpm`, `appimage`) pour l'OS courant |
| `npm run check`        | Vérifie les types (svelte-check)                              |
| `npm run check:watch`  | Idem, en mode watch                                            |

Il n'existe pas de script `lint`, `test`, ni `start` dans ce projet (aucun test n'est configuré, ni Rust `#[test]` ni framework JS).

### Structure du projet

```
command-memo/
├─ src/                  # Frontend SvelteKit
│   ├─ routes/           # UI principale (+page.svelte)
│   └─ lib/              # db.ts (accès SQL brut), types.ts, components/, stores/, updater.ts
├─ src-tauri/            # Backend Rust/Tauri
│   ├─ src/main.rs       # Toute la logique réelle (migrations SQL, tray, raccourci, positionnement fenêtre)
│   ├─ src/lib.rs        # Boilerplate de template inutilisé — à ignorer
│   ├─ capabilities/     # Permissions ACL par plugin (main.json est la seule capability active)
│   └─ tauri.conf.json   # Config fenêtre / CSP / plugins / bundle / updater
├─ static/               # Icônes SVG bundlées
├─ .github/workflows/    # CI : build de validation sur push master, build+signature+release sur tag
├─ package.json
└─ README.md
```

Persistance : SQLite via `tauri-plugin-sql`, accédé **directement depuis le frontend** en SQL brut (`src/lib/db.ts`). Pas de couche CRUD côté Rust — les seules commandes Rust exposées au frontend sont `get_user_icon_dir` et `list_user_icons` (gestion des icônes custom).

### Build / release

```bash
npm run tauri build
```

Génère les installeurs (`msi`, `deb`, `rpm`, `appimage`) dans `src-tauri/target/release/bundle/`. C'est une application desktop uniquement — pas de déploiement web.

Une release publique (signée, avec manifest `latest.json` pour l'auto-update) est produite automatiquement par la CI à chaque push d'un tag `vX.Y.Z` — voir `.github/workflows/tauri-build.yml`, jobs `release` (Windows `msi` + Linux `deb`/`rpm`/`appimage` sur `ubuntu-22.04`, wired dans `latest.json`) et `release-linux-latest` (AppImage supplémentaire buildé sur `ubuntu-latest`, publié sous un nom distinct, volontairement **non** wired dans `latest.json` — voir la note de compatibilité Linux plus haut). Ces jobs ont besoin de deux secrets configurés dans les settings GitHub du repo (**Repository secrets**, pas *Environment secrets*) : `TAURI_SIGNING_PRIVATE_KEY` et `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` (clé générée via `npx @tauri-apps/cli signer generate`).

### Contribution

1. Forker le repo
2. Créer une branche feature : `git checkout -b feature/ma-fonctionnalite`
3. Commit et push : `git commit -m "Ajout de ..."` puis `git push origin feature/ma-fonctionnalite`
4. Ouvrir une Pull Request

### Utilitaires de dev (seed / reset de la DB)

Snippets pratiques à coller temporairement dans `+page.svelte` pour tester le front avec beaucoup d'éléments (jamais commités) :

```js
/*    seed ( dev only ) */
async function seedDatabase() {
    const icons = [
        'nim', 'nix', 'nodejs', 'nodejs_1', 'nodejs_alt', 'nodemon', 'npm', 'npm_alt',
        'nrwl', 'nuget', 'nunjucks', 'nuxt', 'ocaml', 'opa', 'opam', 'pascal', 'pawn',
        'pdf', 'percy', 'perl', 'php', 'php_elephant', 'pipeline', 'postcss', 'posthtml',
        'powerpoint', 'powershell', 'prettier', 'prisma', 'processing', 'processing_light',
        'prolog', 'protractor', 'pug', 'puppet', 'purescript', 'python', 'qsharp', 'quasar',
        'r', 'racket', 'raml', 'razor', 'react', 'react_ts', 'readme', 'reason', 'red',
        'replit', 'rescript', 'restql', 'riot',
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
