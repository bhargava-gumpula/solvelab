mod ollama;
mod update;

fn main() {
    tauri::Builder::default()
        // Updates from GitHub Releases' latest.json. `plugins.updater.pubkey` in tauri.conf.json
        // must be the owner's updater public key (docs/MAC_APP_RELEASE.md); the placeholder
        // OWNER_ADDS_PUBLIC_KEY makes every install fail its signature check, and the release
        // workflow refuses to build with it.
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            ollama::ollama_install,
            ollama::ollama_open,
            ollama::mac_info_cmd,
            update::update_check,
            update::update_install
        ])
        .run(tauri::generate_context!())
        .expect("error while running SolveLab");
}
