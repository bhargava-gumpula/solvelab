mod ollama;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            ollama::ollama_install,
            ollama::ollama_open,
            ollama::mac_info_cmd
        ])
        .run(tauri::generate_context!())
        .expect("error while running SolveLab");
}
