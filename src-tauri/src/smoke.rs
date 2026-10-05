//! Test-only (cargo feature `smoke`, never in a release build): a tiny IPC health
//! check and a reporter. `smoke.js` walks the main pages inside the real app and
//! reports policy violations and checks; scripts/desktop-smoke.mjs reads stdout.

use tauri::plugin::{Builder, TauriPlugin};
use tauri::{AppHandle, Runtime};

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("solvelab-smoke")
        .js_init_script(include_str!("smoke.js"))
        // An occluded window gets its timers throttled (App Nap); keep it in front for the walk.
        .on_webview_ready(|webview| {
            let window = webview.window();
            let _ = window.set_always_on_top(true);
            let _ = window.set_focus();
        })
        .build()
}

#[tauri::command]
pub fn smoke_health<R: Runtime>(app: AppHandle<R>) -> serde_json::Value {
    let csp = app
        .config()
        .app
        .security
        .csp
        .as_ref()
        .map(|csp| csp.to_string());
    serde_json::json!({
        "identifier": app.config().identifier,
        "version": app.package_info().version.to_string(),
        "csp": csp,
    })
}

#[tauri::command]
pub fn smoke_report(kind: String, data: String) {
    println!("SMOKE {kind} {data}");
}
