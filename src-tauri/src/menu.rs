//! The native macOS menu bar. Rule (AGENTS.md, plan 1.5): no item or accelerator
//! here may use Space, with or without modifiers; Space belongs to the timer.

use std::sync::Mutex;

use tauri::menu::{AboutMetadata, Menu, MenuEvent, MenuItem, PredefinedMenuItem, Submenu};
use tauri::{AppHandle, Manager, Runtime};
use tauri_plugin_opener::OpenerExt;

/// Same address as `publicOrigin` in lib/config/legal.ts.
const WEBSITE: &str = "https://solvelab.bhargava-gumpula.com";
const ZOOM_MIN: f64 = 0.5;
const ZOOM_MAX: f64 = 3.0;
const ZOOM_STEP: f64 = 0.1;

/// The page zoom the View menu last set (WKWebView has no getter).
pub struct Zoom(pub Mutex<f64>);

pub fn build<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<Menu<R>> {
    let info = app.package_info();
    let about = AboutMetadata {
        name: Some(info.name.clone()),
        version: Some(info.version.to_string()),
        website: Some(WEBSITE.into()),
        ..Default::default()
    };
    let sep = || PredefinedMenuItem::separator(app);

    let app_menu = Submenu::with_items(
        app,
        &info.name,
        true,
        &[
            &PredefinedMenuItem::about(app, Some("About SolveLab"), Some(about))?,
            &sep()?,
            &MenuItem::with_id(app, "settings", "Settings…", true, Some("CmdOrCtrl+,"))?,
            &sep()?,
            &PredefinedMenuItem::services(app, None)?,
            &sep()?,
            &PredefinedMenuItem::hide(app, None)?,
            &PredefinedMenuItem::hide_others(app, None)?,
            &PredefinedMenuItem::show_all(app, None)?,
            &sep()?,
            &PredefinedMenuItem::quit(app, None)?,
        ],
    )?;
    let edit = Submenu::with_items(
        app,
        "Edit",
        true,
        &[
            &PredefinedMenuItem::undo(app, None)?,
            &PredefinedMenuItem::redo(app, None)?,
            &sep()?,
            &PredefinedMenuItem::cut(app, None)?,
            &PredefinedMenuItem::copy(app, None)?,
            &PredefinedMenuItem::paste(app, None)?,
            &PredefinedMenuItem::select_all(app, None)?,
        ],
    )?;
    let view = Submenu::with_items(
        app,
        "View",
        true,
        &[
            &MenuItem::with_id(app, "zoom-reset", "Actual Size", true, Some("CmdOrCtrl+0"))?,
            &MenuItem::with_id(app, "zoom-in", "Zoom In", true, Some("CmdOrCtrl+="))?,
            &MenuItem::with_id(app, "zoom-out", "Zoom Out", true, Some("CmdOrCtrl+-"))?,
            &sep()?,
            &PredefinedMenuItem::fullscreen(app, None)?,
        ],
    )?;
    let window = Submenu::with_items(
        app,
        "Window",
        true,
        &[
            &PredefinedMenuItem::minimize(app, None)?,
            &PredefinedMenuItem::maximize(app, None)?,
            &sep()?,
            &PredefinedMenuItem::close_window(app, None)?,
        ],
    )?;
    let help = Submenu::with_items(
        app,
        "Help",
        true,
        &[&MenuItem::with_id(
            app,
            "website",
            "SolveLab Website",
            true,
            None::<&str>,
        )?],
    )?;
    #[cfg(target_os = "macos")]
    {
        window.set_as_windows_menu_for_nsapp()?;
        help.set_as_help_menu_for_nsapp()?;
    }
    Menu::with_items(app, &[&app_menu, &edit, &view, &window, &help])
}

pub fn on_event<R: Runtime>(app: &AppHandle<R>, event: MenuEvent) {
    let Some(webview) = app.get_webview_window("main") else {
        return;
    };
    let zoom = |change: Option<f64>| {
        let state = app.state::<Zoom>();
        let mut level = state.0.lock().unwrap();
        *level = change.map_or(1.0, |d| (*level + d).clamp(ZOOM_MIN, ZOOM_MAX));
        let _ = webview.set_zoom(*level);
    };
    match event.id().as_ref() {
        "settings" => {
            if let Ok(mut url) = webview.url() {
                url.set_path("/settings/");
                url.set_query(None);
                url.set_fragment(None);
                let _ = webview.navigate(url);
            }
        }
        "zoom-in" => zoom(Some(ZOOM_STEP)),
        "zoom-out" => zoom(Some(-ZOOM_STEP)),
        "zoom-reset" => zoom(None),
        "website" => {
            let _ = app.opener().open_url(WEBSITE, None::<&str>);
        }
        _ => {}
    }
}
