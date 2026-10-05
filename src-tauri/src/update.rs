//! Updates from GitHub Releases (`plugins.updater` in tauri.conf.json). The page asks first
//! (components/desktop/update-prompt.tsx); nothing downloads or installs without a click, and
//! the plugin refuses any update not signed with the key matching `plugins.updater.pubkey`.

use tauri::AppHandle;
use tauri_plugin_updater::UpdaterExt;

fn text(e: impl std::fmt::Display) -> String {
    e.to_string()
}

/// The newer version on offer, or None. Errors (offline, no published release yet) go back to
/// the page, which stays quiet about them.
#[tauri::command]
pub async fn update_check(app: AppHandle) -> Result<Option<String>, String> {
    let update = app.updater().map_err(text)?.check().await.map_err(text)?;
    Ok(update.map(|u| u.version))
}

/// Downloads the update, checks its signature, replaces the app and restarts it.
#[tauri::command]
pub async fn update_install(app: AppHandle) -> Result<(), String> {
    let Some(update) = app.updater().map_err(text)?.check().await.map_err(text)? else {
        return Ok(());
    };
    update
        .download_and_install(|_, _| {}, || {})
        .await
        .map_err(text)?;
    app.restart()
}
