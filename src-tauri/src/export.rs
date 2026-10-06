//! "Export backup" inside the app window. WKWebView ignores a blob `<a download>`, so the page
//! hands the backup text to this one fixed command, which saves it into ~/Downloads. The page
//! picks no folder: only a plain `*.json` file name is accepted, never a path.

use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

/// Backups are a few MB at most (the page refuses to import more than this too).
const MAX_BYTES: usize = 64 * 1024 * 1024;

/// A plain file name ending `.json`: letters, digits, `-`, `_` and `.`, with no path parts.
fn safe_name(name: &str) -> Option<&str> {
    let stem = name.strip_suffix(".json")?;
    let ok = !stem.is_empty()
        && name.len() <= 100
        && !stem.starts_with('.')
        && !stem.contains("..")
        && name
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || matches!(c, '-' | '_' | '.'));
    ok.then_some(name)
}

/// `name`, or `name-2.json`, `name-3.json`... so an earlier backup is never overwritten.
fn free_path(dir: &Path, name: &str) -> PathBuf {
    let first = dir.join(name);
    if !first.exists() {
        return first;
    }
    let stem = name.trim_end_matches(".json");
    (2..)
        .map(|n| dir.join(format!("{stem}-{n}.json")))
        .find(|p| !p.exists())
        .expect("an unused name")
}

/// Saves the backup into Downloads and returns the file name it got.
#[tauri::command]
pub fn save_backup(app: AppHandle, name: String, text: String) -> Result<String, String> {
    let name = safe_name(&name).ok_or("That isn't a backup file name.")?;
    if text.len() > MAX_BYTES {
        return Err("The backup is too large to save.".into());
    }
    let dir = app
        .path()
        .download_dir()
        .map_err(|_| "This Mac has no Downloads folder.".to_string())?;
    let path = free_path(&dir, name);
    std::fs::write(&path, text).map_err(|e| e.to_string())?;
    Ok(path
        .file_name()
        .map(|n| n.to_string_lossy().into_owned())
        .unwrap_or_else(|| name.to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn only_plain_json_names_pass() {
        assert_eq!(
            safe_name("solvelab-backup-2026-10-05.json"),
            Some("solvelab-backup-2026-10-05.json")
        );
        for bad in ["", ".json", "a.txt", "../a.json", "a/b.json", "/etc/a.json", "..a.json", ".hidden.json", "a b.json", "a\\b.json"] {
            assert_eq!(safe_name(bad), None, "{bad}");
        }
    }

    #[test]
    fn never_overwrites() {
        let dir = std::env::temp_dir().join(format!("solvelab-export-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let first = free_path(&dir, "b.json");
        assert_eq!(first.file_name().unwrap(), "b.json");
        std::fs::write(&first, "x").unwrap();
        assert_eq!(free_path(&dir, "b.json").file_name().unwrap(), "b-2.json");
        std::fs::remove_dir_all(&dir).unwrap();
    }
}
