#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Deserialize;

fn default_offset_x() -> i32 {
    0
}
fn default_offset_y() -> i32 {
    0
}

#[derive(Debug, Deserialize)]
struct AppConfig {
    shortcut: String,

    #[serde(default = "default_offset_x")]
    offset_x: i32,

    #[serde(default = "default_offset_y")]
    offset_y: i32,
}

use once_cell::sync::Lazy;
use std::fs;
use std::path::PathBuf;
use std::str::FromStr;
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::path::BaseDirectory;
use tauri::PhysicalPosition;
use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WindowEvent, Wry,
};
use tauri_plugin_dialog;
use tauri_plugin_fs;
use tauri_plugin_autostart;
use tauri_plugin_clipboard_manager;
use tauri_plugin_global_shortcut::{GlobalShortcut, Shortcut, ShortcutState};
use tauri_plugin_sql::{Builder, Migration, MigrationKind};

fn ensure_icon_dir(app: &tauri::AppHandle) -> std::path::PathBuf {
    let dir = app.path().resolve("icons", BaseDirectory::AppData).unwrap();

    std::fs::create_dir_all(&dir).ok();
    dir
}

// Sous Wayland, le curseur global n'est pas accessible (tao renvoie (0,0)) et
// XGrabKey (global-hotkey) n'est pas relayé par le compositeur pour les apps
// tierces : on bascule sur le moniteur primaire et on laisse le raccourci
// clavier être déclenché depuis l'extérieur (voir tauri_plugin_single_instance).
fn is_wayland() -> bool {
    std::env::var("WAYLAND_DISPLAY").is_ok()
}

// Sous Wayland, on ne connaît l'écran réel qu'une fois la fenêtre mappée par
// le compositeur (il ignore nos set_position/appelle sa propre heuristique de
// placement). Ce flag signale au handler `Focused(true)` qu'un resize post-show
// est attendu, pour corriger la taille une fois `current_monitor()` fiable.
static PENDING_WAYLAND_RESIZE: AtomicBool = AtomicBool::new(false);

fn toggle_main_window(app: &tauri::AppHandle) {
    let window = app.get_webview_window("main").unwrap();
    let visible = window.is_visible().unwrap_or(false);
    if visible {
        let _ = window.hide();
    } else {
        if is_wayland() {
            PENDING_WAYLAND_RESIZE.store(true, Ordering::SeqCst);
        }
        let _ = show_on_active_monitor(app, &window);
    }
}

// Sous Wayland, `set_position` n'a jamais d'effet (le compositeur ignore le
// placement absolu demandé par le client). Le premier `show()` a donc centré
// la fenêtre sur l'écran actif en se basant sur la mauvaise taille (celle du
// premier moniteur listé, prise avant qu'on sache où elle allait apparaître) :
// le coin haut-gauche reste figé sur ce mauvais centrage, même après
// `set_size`. La seule façon de faire recentrer par le compositeur est de
// cacher puis réafficher la fenêtre une fois qu'elle a la bonne taille — un
// nouvel affichage à la taille exacte de l'écran se recentre pile sur (0,0).
fn resize_to_current_monitor(window: &tauri::Window<Wry>) {
    let Ok(Some(monitor)) = window.current_monitor() else {
        return;
    };
    let size = *monitor.size();

    if window.outer_size().map(|s| s == size).unwrap_or(false) {
        return;
    }

    let _ = window.hide();
    let _ = window.set_size(size);
    let _ = window.show();
    let _ = window.set_focus();
}

fn load_config() -> AppConfig {
    let path = PathBuf::from("config.json");

    let content = fs::read_to_string(&path).unwrap_or_else(|_| {
        println!("⚠️ config.json not found, using default shortcut");
        r#"{"shortcut":"CmdOrControl+Alt+Space","offset_x":-9,"offset_y":-1}"#.to_string()
    });

    serde_json::from_str(&content).expect("❌ invalid config.json format")
}

static CONFIG: Lazy<AppConfig> = Lazy::new(|| load_config());

#[tauri::command]
fn list_user_icons(app: tauri::AppHandle) -> Vec<String> {
    let dir = ensure_icon_dir(&app);

    std::fs::read_dir(dir)
        .map(|rd| {
            rd.filter_map(|e| e.ok())
                .filter_map(|e| e.file_name().to_str().map(|s| s.to_string()))
                .filter(|name| name.ends_with(".svg"))
                .collect()
        })
        .unwrap_or_default()
}

#[tauri::command]
fn get_user_icon_dir(app: tauri::AppHandle) -> String {
    let dir = app.path().app_data_dir().unwrap().join("icons");

    dir.to_string_lossy().to_string()
}

fn main() {
    tauri::Builder::default()
        // ✅ Single instance : doit être le premier plugin enregistré.
        // Relance sur un raccourci clavier système (ex: GNOME Custom Shortcut)
        // -> toggle la fenêtre déjà lancée au lieu d'ouvrir une 2e instance.
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            toggle_main_window(app);
        }))
        .plugin(tauri_plugin_autostart::Builder::new().build())
        // ✅ Clipboard Manager
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        // ✅ Export file
         .plugin(tauri_plugin_dialog::init())
         .plugin(tauri_plugin_fs::init())
        // ✅ Global Shortcut
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(move |app, shortcut, event| {
                    // println!("{:?}", shortcut);
                    match event.state {
                        ShortcutState::Pressed => {
                            println!("🔵 Pressed: {:?}", shortcut);
                            toggle_main_window(app);
                        }
                        ShortcutState::Released => {
                            println!("⚪ Released: {:?}", shortcut);
                        }
                    }
                })
                .build(),
        )
        .invoke_handler(tauri::generate_handler![get_user_icon_dir, list_user_icons,])
        // ✅ SQL plugin
        .plugin(
            Builder::default()
                .add_migrations(
                    "sqlite:commands.db",
                    vec![
                    Migration {
                        version: 1,
                        description: "create commands table",
                        sql: "
                                CREATE TABLE IF NOT EXISTS commands (
                                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                                    name TEXT NOT NULL,
                                    description TEXT,
                                    command TEXT NOT NULL,
                                    icon TEXT
                                );
                            ",
                        kind: MigrationKind::Up,
                    },
                    Migration {
                        version: 2,
                        description: "add workspaces and templates",
                        sql: "
                            -- workspaces
                            CREATE TABLE IF NOT EXISTS workspaces (
                                id INTEGER PRIMARY KEY AUTOINCREMENT,
                                name TEXT NOT NULL UNIQUE
                            );

                            -- add workspace_id to commands
                            ALTER TABLE commands
                            ADD COLUMN workspace_id INTEGER;

                            -- templates
                            CREATE TABLE IF NOT EXISTS templates (
                                id INTEGER PRIMARY KEY AUTOINCREMENT,
                                name TEXT NOT NULL,
                                description TEXT,
                                content TEXT NOT NULL,
                                icon TEXT,
                                workspace_id INTEGER,
                                FOREIGN KEY(workspace_id) REFERENCES workspaces(id)
                            );

                            -- template parameters
                            CREATE TABLE IF NOT EXISTS template_params (
                                id INTEGER PRIMARY KEY AUTOINCREMENT,
                                template_id INTEGER NOT NULL,
                                name TEXT NOT NULL,
                                type TEXT NOT NULL,
                                placeholder TEXT,
                                description TEXT,
                                FOREIGN KEY(template_id) REFERENCES templates(id)
                            );
                        ",
                        kind: MigrationKind::Up,
                    },
                    Migration {
                        version: 3,
                        description: "add workspace save",
                        sql: "
                            -- workspaces
                            ALTER TABLE workspaces ADD COLUMN last_used INTEGER DEFAULT 0;
                        ",
                        kind: MigrationKind::Up,
                    },
                    Migration {
                        version: 4,
                        description: "add language type for templates",
                        sql: "
                            -- workspaces
                            ALTER TABLE templates ADD COLUMN type TEXT DEFAULT '';
                        ",
                        kind: MigrationKind::Up,
                    },
                ],
                )
                .build(),
        )
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();

            /* shortcut part  */
            let custom_shortcut =
                Shortcut::from_str(&CONFIG.shortcut).expect("Invalid shortcut in config");
            // ✅ CRUCIAL POUR WINDOWS
            window.set_decorations(false)?;

            let shortcuts = app.state::<GlobalShortcut<Wry>>();

            // Désenregistre la hotkey au cas où
            let _ = shortcuts.unregister(custom_shortcut);

            // Enregistrement safe
            match shortcuts.register(custom_shortcut) {
                Ok(_) => println!("✅ Hotkey enregistrée : {}", custom_shortcut),
                Err(e) => eprintln!("⚠️ Impossible d'enregistrer la hotkey : {:?}", e),
            }

            /* !shortcut part  */

            /* tray part  */
            let show_app = MenuItemBuilder::with_id("show", "Show").build(app)?;
            let quit_app = MenuItemBuilder::with_id("quit", "Quit").build(app)?;
            let menu = MenuBuilder::new(app)
                .items(&[&show_app, &quit_app])
                .build()?;
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(move |app, event| match event.id().as_ref() {
                    "show" => {
                        println!("🟢 Show application");
                        let _ = show_on_active_monitor(app, &window);
                    }
                    "quit" => {
                        println!("❌ Quit application");
                        app.exit(0);
                    }
                    _ => (),
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(webview_window) = app.get_webview_window("main") {
                            let _ = show_on_active_monitor(app, &webview_window);
                        }
                    }
                })
                .build(app)?;

            /* !tray part  */
            Ok(())
        })
        .on_window_event(|window, event| match event {
            WindowEvent::CloseRequested { .. } => {
                // Désenregistre la hotkey à la fermeture
                let custom_shortcut =
                    Shortcut::from_str(&CONFIG.shortcut).expect("Invalid shortcut in config");
                let shortcuts = window.state::<GlobalShortcut<Wry>>();
                let _ = shortcuts.unregister(custom_shortcut);
            }
            WindowEvent::Focused(true) => {
                // La fenêtre vient d'être mappée par le compositeur : sous
                // Wayland, c'est le premier moment où `current_monitor()` est
                // fiable pour corriger la taille (voir PENDING_WAYLAND_RESIZE).
                if PENDING_WAYLAND_RESIZE.swap(false, Ordering::SeqCst) {
                    resize_to_current_monitor(window);
                }
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri app");
}

fn first_available_monitor(app: &tauri::AppHandle) -> Option<tauri::Monitor> {
    app.available_monitors().ok()?.into_iter().next()
}

fn monitor_from_cursor(app: &tauri::AppHandle) -> Option<tauri::Monitor> {
    let cursor_pos = app.cursor_position().ok()?;

    let monitors = app.available_monitors().ok()?;

    monitors.into_iter().find(|m| {
        let pos = m.position();
        let size = m.size();

        cursor_pos.x >= pos.x as f64
            && cursor_pos.x <= (pos.x + size.width as i32) as f64
            && cursor_pos.y >= pos.y as f64
            && cursor_pos.y <= (pos.y + size.height as i32) as f64
    })
}
fn show_on_active_monitor(
    app: &tauri::AppHandle,
    window: &tauri::WebviewWindow,
) -> tauri::Result<()> {
    // Sous Wayland : la position du curseur n'est pas exposée globalement
    // (tao renvoie toujours (0,0)) et `primary_monitor()` retourne toujours
    // None côté GDK/Wayland (pas de notion de moniteur "primaire" dans le
    // protocole Wayland). On prend donc le premier moniteur listé par
    // `available_monitors()`, qui lui fonctionne indépendamment de la
    // visibilité de la fenêtre et du backend d'affichage.
    let monitor = if is_wayland() {
        first_available_monitor(app)
    } else {
        monitor_from_cursor(app).or_else(|| window.primary_monitor().ok().flatten())
    };

    if let Some(monitor) = monitor {
        let size = monitor.size();
        let position = monitor.position();

        window.set_position(PhysicalPosition::new(position.x, position.y))?;
        window.set_size(*size)?;
        window.set_position(PhysicalPosition::new(
            position.x + &CONFIG.offset_x,
            position.y + &CONFIG.offset_y,
        ))?;
    }

    window.show()?;
    window.set_focus()?;
    Ok(())
}
