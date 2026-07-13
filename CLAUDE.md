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

Deux comportements diffèrent sous Wayland (confirmé sur GNOME) par rapport à Windows/macOS/X11 — ce sont des restrictions de la plateforme, pas des bugs de l'app :

- **Raccourci global** : `global-hotkey` (via `tauri-plugin-global-shortcut`) n'implémente que le grab X11 (`XGrabKey`, cf. `platform_impl/x11/mod.rs` du crate). Sous Wayland, le compositeur ne relaie pas les événements clavier globaux aux apps tierces, même via XWayland — le raccourci configuré dans `config.json` ne se déclenche donc jamais.
- **Position par rapport au curseur** : `tao` (lib de fenêtrage de Tauri) renvoie `(0, 0)` en dur pour `cursor_position()` dès qu'il détecte Wayland (`platform_impl/linux/util.rs`) — Wayland n'expose pas la position globale du curseur par design.

**Fix appliqué** (`src-tauri/src/main.rs`) :
- `is_wayland()` détecte la session via `WAYLAND_DISPLAY`. Si vrai, `show_on_active_monitor` saute `monitor_from_cursor` et utilise `first_available_monitor` (premier élément de `available_monitors()`) — **pas** `window.primary_monitor()` : celui-ci repose sur `gdk_display_get_primary_monitor()`, qui renvoie toujours `None` sous le backend GDK/Wayland (pas de notion de moniteur "primaire" dans le protocole Wayland lui-même). `current_monitor()` a le même problème tant que la fenêtre est cachée (tao retombe sur `primary_monitor()` si le `GdkWindow` n'est pas encore réalisé). `available_monitors()` fonctionne dans tous les cas car il ne dépend que du `Display`, pas de la fenêtre.
- Ajout de `tauri-plugin-single-instance` (premier plugin enregistré dans `main()`) : relancer le binaire alors qu'une instance tourne déjà appelle `toggle_main_window` sur l'instance existante au lieu d'ouvrir une 2e fenêtre. Ça permet, sous Wayland, de lier un raccourci clavier **au niveau du bureau** (ex. GNOME Custom Shortcut exécutant `/usr/bin/command-memo`) pour retrouver le toggle show/hide — voir le README, section "Raccourci clavier sous Linux/Wayland".
- `toggle_main_window` factorise la logique show/hide, utilisée à la fois par le handler du raccourci global (Windows/macOS/X11) et par le callback single-instance (tous OS).

## Points d'attention

- Aucun test (ni Rust `#[test]`, ni framework JS configuré).
- UI et commentaires majoritairement en français ; noms de types/champs en anglais.
- Le `README.md` contient encore quelques sections historiques à vérifier avant de s'y fier aveuglément (il a été partiellement corrigé, mais en cas de doute, le code fait foi).

## Emplacements runtime (utilisateur)

- Linux : `~/.local/share/com.jychaillou.command-memo/` (icônes custom dans `icons/`)
- DB SQLite : `~/.config/com.jychaillou.command-memo/commands.db`
- `config.json` optionnel à côté du binaire pour surcharger `shortcut`, `offset_x`, `offset_y`.
