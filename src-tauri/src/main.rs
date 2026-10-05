fn main() {
    tauri::Builder::default()
        // Sign-in return: macOS opens the app with solvelab://auth/callback?... (Info.plist scheme from tauri.conf.json).
        .plugin(tauri_plugin_deep_link::init())
        // Opens the Supabase/Google sign-in page in the person's own browser.
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running SolveLab");
}
