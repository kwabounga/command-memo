#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Deserialize;

fn default_offset_x() -> i32 { -9 }
fn default_offset_y() -> i32 { -1 }

#[derive(Debug, Deserialize)]
struct AppConfig {
    shortcut: String,

    #[serde(default = "default_offset_x")]
    offset_x: i32,

    #[serde(default = "default_offset_y")]
    offset_y: i32,
}



use once_cell::sync::Lazy;
use tauri::{
    Manager, WindowEvent,
    Wry,
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{TrayIconBuilder, TrayIconEvent, MouseButtonState, MouseButton},
};
use tauri_plugin_global_shortcut::{GlobalShortcut, ShortcutState, Shortcut };
use tauri_plugin_sql::{Builder, Migration, MigrationKind};
use tauri_plugin_clipboard_manager;
use tauri_plugin_autostart;
use std::fs;
use std::path::PathBuf;
use std::str::FromStr;
use tauri::PhysicalPosition;
use tauri::path::BaseDirectory;

fn ensure_icon_dir(app: &tauri::AppHandle) -> std::path::PathBuf {
    let dir = app
        .path()
        .resolve("icons", BaseDirectory::AppData)
        .unwrap();

    std::fs::create_dir_all(&dir).ok();
    dir
}

fn load_config() -> AppConfig {
    let path = PathBuf::from("config.json");

    let content = fs::read_to_string(&path)
        .unwrap_or_else(|_| {
            println!("⚠️ config.json not found, using default shortcut");
            r#"{"shortcut":"CmdOrControl+Alt+Space","offset_x":-9,"offset_y":-1}"#.to_string()
        });

    serde_json::from_str(&content)
        .expect("❌ invalid config.json format")
}

static CONFIG: Lazy<AppConfig> = Lazy::new(|| {
    load_config()
});


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
    let dir = app
        .path()
        .app_data_dir()
        .unwrap()
        .join("icons");

    dir.to_string_lossy().to_string()
}


fn main() {
    tauri::Builder::default()
        // ✅ Clipboard Manager
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_autostart::init(
                tauri_plugin_autostart::MacosLauncher::LaunchAgent,
                None
            ))
        // ✅ Global Shortcut
        .plugin(tauri_plugin_global_shortcut::Builder::new()
        .with_handler(move |app, shortcut, event| {
                // println!("{:?}", shortcut);
                match event.state {
                    ShortcutState::Pressed => {
                        println!("🔵 Pressed: {:?}", shortcut);
                        let window = app.get_webview_window("main").unwrap();
                        // ici tu peux show/hide la fenêtre
                        let visible = window.is_visible().unwrap_or(false);
                            if visible {
                                let _ = window.hide();
                            } else {
                                let _ = show_on_active_monitor(app, &window);
                            }
                    }
                    ShortcutState::Released => {
                        println!("⚪ Released: {:?}", shortcut);
                    }
                }
        }).build())

        .invoke_handler(tauri::generate_handler![
            get_user_icon_dir,
            list_user_icons,
        ])

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
                        }
                    ],


                )
                .build(),
        )
        .setup(|app| {

            let window = app.get_webview_window("main").unwrap();

            /* shortcut part  */
            let custom_shortcut = Shortcut::from_str(&CONFIG.shortcut)
                .expect("Invalid shortcut in config");
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
            let menu = MenuBuilder::new(app).items(&[&show_app,&quit_app]).build()?;
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(move |app, event| match event.id().as_ref() {
                    "show" => {
                        println!("🟢 Show application");
                        let _ = show_on_active_monitor(app, &window);
                    },
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

        .on_window_event(|app, event| {
            let custom_shortcut = Shortcut::from_str(&CONFIG.shortcut)
                            .expect("Invalid shortcut in config");
            if let WindowEvent::CloseRequested { .. } = event {
                // Désenregistre la hotkey à la fermeture
                let shortcuts = app.state::<GlobalShortcut<Wry>>();
                let _ = shortcuts.unregister(custom_shortcut);
            }
        })

        .run(tauri::generate_context!())
        .expect("error while running tauri app");
}


fn monitor_from_cursor(
    app: &tauri::AppHandle,
) -> Option<tauri::Monitor> {
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
    let monitor = monitor_from_cursor(app)
        .or_else(|| window.primary_monitor().ok().flatten());

    if let Some(monitor) = monitor {
        let size = monitor.size();
        let position = monitor.position();

        window.set_position(PhysicalPosition::new(position.x, position.y))?;
        window.set_size(*size)?;
        window.set_position(PhysicalPosition::new(position.x + &CONFIG.offset_x, position.y + &CONFIG.offset_y))?;
    }

    window.show()?;
    window.set_focus()?;
    Ok(())
}
