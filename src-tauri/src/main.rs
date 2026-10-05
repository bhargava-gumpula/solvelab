mod menu;
#[cfg(feature = "smoke")]
mod smoke;

use std::sync::Mutex;

use tauri::Manager;

fn main() {
    #[cfg(target_os = "macos")]
    hide_emoji_menu_item();

    let builder = tauri::Builder::default()
        // Sign-in return: macOS opens the app with solvelab://auth/callback?... (Info.plist scheme from tauri.conf.json).
        .plugin(tauri_plugin_deep_link::init())
        // Opens the Supabase/Google sign-in page in the person's own browser.
        .plugin(tauri_plugin_opener::init())
        .manage(menu::Zoom(Mutex::new(1.0)))
        .menu(menu::build)
        .on_menu_event(menu::on_event)
        .invoke_handler(tauri::generate_handler![
            #[cfg(feature = "smoke")]
            smoke::smoke_health,
            #[cfg(feature = "smoke")]
            smoke::smoke_report,
        ])
        .setup(|app| {
            #[cfg(target_os = "macos")]
            if let Some(window) = app.get_webview_window("main") {
                tab_focuses_links(&window)?;
            }
            Ok(())
        });
    #[cfg(feature = "smoke")]
    let builder = builder.plugin(smoke::init());
    builder
        .run(tauri::generate_context!())
        .expect("error while running SolveLab");
}

/// macOS adds "Emoji & Symbols" (Control-Command-Space) to any menu titled Edit;
/// Space belongs to the timer (plan 1.5), so the app opts out of that item.
#[cfg(target_os = "macos")]
fn hide_emoji_menu_item() {
    use objc2_foundation::{ns_string, NSUserDefaults};
    NSUserDefaults::standardUserDefaults()
        .setBool_forKey(true, ns_string!("NSDisabledCharacterPaletteMenuItem"));
}

/// Tab reaches links and buttons, as on the website in Chrome (plan 1.7). WebKit
/// leaves this off by default, like Safari without "Press Tab to highlight each item".
#[cfg(target_os = "macos")]
fn tab_focuses_links<R: tauri::Runtime>(window: &tauri::WebviewWindow<R>) -> tauri::Result<()> {
    window.with_webview(|webview| unsafe {
        let view: &objc2_web_kit::WKWebView = &*webview.inner().cast();
        view.configuration().preferences().setTabFocusesLinks(true);
        #[cfg(feature = "smoke")]
        println!(
            "SMOKE pref {{\"tabFocusesLinks\":{}}}",
            view.configuration().preferences().tabFocusesLinks()
        );
    })
}
