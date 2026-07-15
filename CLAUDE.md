# Command Memo

Launcher desktop "spotlight-style" pour stocker et retrouver des commandes (shell, SQL, etc.) qu'on ne tape pas assez souvent pour s'en souvenir par cœur.

## Résumé fonctionnel

- Fenêtre 500×400, sans décorations, transparente, always-on-top, cachée au démarrage.
- Activée par un raccourci global (défaut `CmdOrControl+Alt+Space`, surchargeable — voir plus bas) ou via l'icône de tray. Se positionne sur l'écran sous le curseur (sauf sous Wayland, voir plus bas).
- Deux types d'entrées :
  - **Command** : texte brut, copié tel quel dans le clipboard.
  - **Template** : contenu avec des `{{placeholders}}` résolus avant copie, coloration syntaxique (highlight.js) selon un `type` (langage).
- Les entrées sont groupées par **icon** (qui fait office de catégorie/tag).
- **Workspaces** : scoping optionnel ; `workspace_id = NULL` = visible dans tous les workspaces ("🌐 Global").

## Stack technique

- **Frontend** : SvelteKit (Svelte 5) en mode SPA (`@sveltejs/adapter-static`), TypeScript, Vite, UI Sveltestrap/Bootstrap, highlight.js.
- **Backend** : Tauri v2 (Rust). Toute la logique réelle est dans `src-tauri/src/main.rs`.
  - `src-tauri/src/lib.rs` est du **boilerplate de template inutilisé** (contient un `greet` et un `run()` jamais appelés) — ignorer ce fichier.
- **Persistance** : SQLite via `tauri-plugin-sql`, accédé **directement depuis le frontend** en SQL brut (`src/lib/db.ts`). Pas de couche CRUD côté Rust.
- Seules commandes Rust exposées au frontend : `get_user_icon_dir`, `list_user_icons` (gestion des icônes SVG custom déposées par l'utilisateur).

## Fichiers clés

| Fichier | Rôle |
|---|---|
| `src/routes/+page.svelte` | Toute l'UI/logique principale (recherche, grille, panneau d'ajout, modals, raccourcis clavier) |
| `src/lib/db.ts` | Toute la couche SQL (CRUD commands/templates/workspaces, export/import, reset) |
| `src/lib/types.ts` | Types `Command`, `Template`, `TemplateParams`, `Workspace`, `CmdItem` |
| `src/lib/components/*.svelte` | `CommandForm`, `TemplateForm`, `TemplateParamsManager`, `CategoryHeader`, `IconSelect`, `WorkspaceDropdown`, `BaseModal` |
| `src/lib/stores/workspace.ts` | Store du workspace courant + constante `GLOBAL_WORKSPACE` |
| `src/lib/iconResolver.ts`, `src/lib/icons.ts` | Résolution des icônes (bundlées dans `static/assets/svg/` ou custom via `get_user_icon_dir`) |
| `src/lib/styles/global.css` | Styles globaux (grille de commandes, cards, tabs...) importés depuis `+layout.svelte` — pas de `<style>` dans `+layout.svelte` lui-même (il ne rend qu'un `<slot/>`, rien à scoper localement) |
| `src-tauri/src/main.rs` | Migrations SQL versionnées, config du raccourci global, tray, positionnement fenêtre |
| `src-tauri/tauri.conf.json` | Config fenêtre / CSP / plugins |

## Modèle de données (SQLite, `commands.db`)

```sql
commands        (id, name, description, command, icon, workspace_id)
workspaces      (id, name UNIQUE, last_used)
templates       (id, name, description, content, icon, workspace_id, type)
template_params (id, template_id, name, type, placeholder, description)
```

Migrations versionnées dans `main.rs` (v1 → v4) via `tauri_plugin_sql::Migration`. Pas de `created_at`/`updated_at` ; seul `workspaces.last_used` existe (timestamp du dernier workspace actif).

## Commandes de dev

```bash
npm run dev            # vite dev (frontend seul, web)
npm run tauri dev      # app desktop complète
npm run build          # build frontend
npm run tauri build    # build desktop (msi/deb/rpm)
npm run check          # svelte-check
npm run check:watch
```

Il n'existe **pas** de script `lint`, `test`, ni `start` — le `README.md` en mentionne mais ils n'existent pas dans `package.json` (reliquat d'un template React copié-collé, à ne pas suivre pour ces sections).

## Limitation Wayland (Linux)

Trois comportements diffèrent sous Wayland (confirmé sur GNOME) par rapport à Windows/macOS/X11 — ce sont des restrictions de la plateforme, pas des bugs de l'app :

- **Raccourci global** : `global-hotkey` (via `tauri-plugin-global-shortcut`) n'implémente que le grab X11 (`XGrabKey`, cf. `platform_impl/x11/mod.rs` du crate). Sous Wayland, le compositeur ne relaie pas les événements clavier globaux aux apps tierces, même via XWayland — le raccourci configuré dans `config.json` ne se déclenche donc jamais.
- **Position par rapport au curseur** : `tao` (lib de fenêtrage de Tauri) renvoie `(0, 0)` en dur pour `cursor_position()` dès qu'il détecte Wayland (`platform_impl/linux/util.rs`) — Wayland n'expose pas la position globale du curseur par design.
- **`set_position` sans effet** : le compositeur ignore toute demande de placement absolu d'un client Wayland (pas de coordonnées globales exposées à l'appli, contrairement à X11). Seul `set_size` a un effet ; le placement à l'écran est décidé entièrement par le compositeur (il centre le nouveau toplevel sur l'écran actif — celui qui a le focus clavier au moment du `show()`).

**Fix appliqué** (`src-tauri/src/main.rs`) :
- `is_wayland()` détecte la session via `WAYLAND_DISPLAY`.
- `show_on_active_monitor` : sous Wayland, saute `monitor_from_cursor` et utilise `first_available_monitor` (premier élément de `available_monitors()`) pour le *premier* affichage — **pas** `window.primary_monitor()` : celui-ci repose sur `gdk_display_get_primary_monitor()`, qui renvoie toujours `None` côté GDK/Wayland (pas de notion de moniteur "primaire" dans le protocole lui-même). Cette taille est volontairement approximative (on ne sait pas encore sur quel écran le compositeur va poser la fenêtre) — c'est le mécanisme ci-dessous qui la corrige.
- `PENDING_WAYLAND_RESIZE` (`AtomicBool`) + handler `WindowEvent::Focused(true)` : une fois la fenêtre effectivement mappée par le compositeur (c'est le premier moment où `current_monitor()` devient fiable — `current_monitor()`/`primary_monitor()` renvoient `None` tant que la fenêtre est cachée), `resize_to_current_monitor` compare la taille réelle de l'écran actif à la taille actuelle de la fenêtre. Si ça diffère : **cache la fenêtre, la redimensionne pendant qu'elle est cachée, puis la réaffiche** (`hide` → `set_size` → `show` → `set_focus`). Un simple `set_size` sans ce cycle hide/show ne suffit pas : comme `set_position` ne fait rien, le coin haut-gauche reste figé sur le mauvais centrage initial (fait avec la mauvaise taille), et un `set_size` seul fait juste grossir/rétrécir depuis ce point fixe — d'où un cadrage décalé (repéré empiriquement : décalage = moitié de la différence de dimensions entre les deux écrans). Réafficher force le compositeur à recentrer, et une fenêtre à la taille exacte de l'écran se recentre pile sur `(0,0)`.
- Ajout de `tauri-plugin-single-instance` (premier plugin enregistré dans `main()`) : relancer le binaire alors qu'une instance tourne déjà appelle `toggle_main_window` sur l'instance existante au lieu d'ouvrir une 2e fenêtre. Ça permet, sous Wayland, de lier un raccourci clavier **au niveau du bureau** (ex. GNOME Custom Shortcut exécutant `/usr/bin/command-memo`) pour retrouver le toggle show/hide — voir le README, section "Raccourci clavier sous Linux/Wayland".
- `toggle_main_window` factorise la logique show/hide, utilisée à la fois par le handler du raccourci global (Windows/macOS/X11) et par le callback single-instance (tous OS).

## Points d'attention

- Aucun test (ni Rust `#[test]`, ni framework JS configuré).
- UI et commentaires majoritairement en français ; noms de types/champs en anglais.
- Le `README.md` contient encore quelques sections historiques à vérifier avant de s'y fier aveuglément (il a été partiellement corrigé, mais en cas de doute, le code fait foi).
- Warning console au lancement sous Linux : `libayatana-appindicator is deprecated. Please use libayatana-appindicator-glib...` — vient de la lib système `libayatana-appindicator3` chargée par le crate `tray-icon` (dépendance Tauri, feature `tray-icon`), pas de notre code. Non actionnable côté app (la lib alternative `-glib` n'est même pas packagée sur les distros courantes actuellement) — purement cosmétique, à ignorer.

## Mises à jour automatiques

Basé sur `tauri-plugin-updater` (mode "static JSON") :

- Check silencieux au démarrage (`checkForUpdate()` dans `src/lib/updater.ts`, appelé depuis `onMount` dans `src/routes/+page.svelte`), pas de popup bloquante. Si une MAJ est trouvée, un petit badge 🔔 apparaît à côté de la barre de recherche (`$updateInfo.available`, store `src/lib/stores/updater.ts`) ; au clic, confirmation via `@tauri-apps/plugin-dialog` puis `update.downloadAndInstall()` + `relaunch()` (`@tauri-apps/plugin-process`).
- Le endpoint du manifest est `plugins.updater.endpoints` dans `src-tauri/tauri.conf.json` : pointe sur `https://github.com/kwabounga/command-memo/releases/latest/download/latest.json`, généré automatiquement à chaque release taguée par `tauri-apps/tauri-action` (voir `.github/workflows/tauri-build.yml`, job `release`).
- **Limitation Linux** : le plugin ne sait auto-updater que le format **AppImage** — pas les `.deb`/`.rpm`. `bundle.targets` inclut donc `appimage` en plus de `msi`/`deb`/`rpm` ; les utilisateurs deb/rpm gardent une mise à jour manuelle (retélécharger le paquet), seuls ceux qui utilisent l'AppImage bénéficient de l'auto-update. Sous Windows, `msi` est bien supporté par l'updater.
- Signature : la clé privée de signature (générée via `tauri signer generate`, jamais commitée) est stockée dans les secrets GitHub du repo (`TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`) ; la clé publique correspondante est dans `plugins.updater.pubkey` (`tauri.conf.json`).
- macOS reste hors scope (le CI ne le build pas).

## Emplacements runtime (utilisateur)

- Linux : `~/.local/share/com.jychaillou.command-memo/` (icônes custom dans `icons/`)
- DB SQLite : `~/.config/com.jychaillou.command-memo/commands.db`
- `config.json` optionnel à côté du binaire pour surcharger `shortcut`, `offset_x`, `offset_y`.
