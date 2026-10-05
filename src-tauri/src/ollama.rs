//! Fixed commands for the Ollama first-run setup (plan 1.5, 2.3). None takes a path or a program
//! name from the page, so injected HTML can't make the app open anything else.
use serde::Serialize;
use std::path::Path;
use std::process::Command;

/// Ollama's Mac app bundle id (Launch Services / `open -b`).
const BUNDLE_ID: &str = "com.electron.ollama";
const CLI_PATHS: [&str; 2] = ["/opt/homebrew/bin/ollama", "/usr/local/bin/ollama"];

#[derive(Serialize, Debug, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct InstallInfo {
    /// The Ollama app is on this Mac, in /Applications, ~/Applications or anywhere Spotlight knows.
    pub app: bool,
    /// Only the command-line tool is there (Homebrew): there is no app to open, run `ollama serve`.
    pub cli: bool,
}

#[derive(Serialize, Debug, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct MacInfo {
    /// Installed memory in bytes (`hw.memsize`); the page picks the model size from it.
    pub ram_bytes: Option<u64>,
    /// Free space in bytes on the volume that holds the home folder (where `~/.ollama` lives).
    pub disk_free_bytes: Option<u64>,
    /// `aarch64` for Apple silicon; Intel Macs (`x86_64`) run models on the CPU only.
    pub arch: &'static str,
}

// Full paths, not names: a GUI app has a short PATH, and nothing on it should stand in for these.
const MDFIND: &str = "/usr/bin/mdfind";
const SYSCTL: &str = "/usr/sbin/sysctl";
const DF: &str = "/bin/df";
const OPEN: &str = "/usr/bin/open";

fn run(program: &str, args: &[&str]) -> Option<String> {
    let out = Command::new(program).args(args).output().ok()?;
    out.status
        .success()
        .then(|| String::from_utf8_lossy(&out.stdout).into_owned())
}

fn home() -> Option<String> {
    std::env::var("HOME").ok().filter(|h| !h.is_empty())
}

/// Spotlight also lists copies that aren't installed: one on a mounted disk image, one in the Trash.
fn is_installed_path(path: &str) -> bool {
    !path.trim().is_empty() && !path.starts_with("/Volumes/") && !path.contains("/.Trash/")
}

fn find_app() -> bool {
    // ponytail: Spotlight (`mdfind`) stands in for a direct Launch Services lookup; it covers any
    // folder on the startup disk but is blind when indexing is off, so the usual folders are checked
    // too. Installs on an external drive are missed. Swap in NSWorkspace if testers report one.
    let query = format!("kMDItemCFBundleIdentifier == '{BUNDLE_ID}'");
    if run(MDFIND, &[&query]).is_some_and(|s| s.lines().any(is_installed_path)) {
        return true;
    }
    let home_app = home().map(|h| format!("{h}/Applications/Ollama.app"));
    ["/Applications/Ollama.app"]
        .into_iter()
        .map(String::from)
        .chain(home_app)
        .any(|p| Path::new(&p).exists())
}

fn parse_ram(sysctl_out: &str) -> Option<u64> {
    sysctl_out.trim().parse().ok()
}

/// `df -kP` prints a header, then `fs 1024-blocks used available capacity mount`.
fn parse_df_free(df_out: &str) -> Option<u64> {
    let kib: u64 = df_out.lines().nth(1)?.split_whitespace().nth(3)?.parse().ok()?;
    kib.checked_mul(1024)
}

pub fn install_info() -> InstallInfo {
    InstallInfo {
        app: find_app(),
        cli: CLI_PATHS.iter().any(|p| Path::new(p).exists()),
    }
}

pub fn mac_info() -> MacInfo {
    MacInfo {
        ram_bytes: run(SYSCTL, &["-n", "hw.memsize"]).and_then(|s| parse_ram(&s)),
        disk_free_bytes: home()
            .and_then(|h| run(DF, &["-kP", &h]))
            .and_then(|s| parse_df_free(&s)),
        arch: std::env::consts::ARCH,
    }
}

pub fn open_ollama() -> Result<(), String> {
    let out = Command::new(OPEN)
        .args(["-b", BUNDLE_ID])
        .output()
        .map_err(|e| e.to_string())?;
    if out.status.success() {
        Ok(())
    } else {
        Err(String::from_utf8_lossy(&out.stderr).trim().to_string())
    }
}

// Async so the short process calls run off the main thread.
#[tauri::command]
pub async fn ollama_install() -> InstallInfo {
    install_info()
}

#[tauri::command]
pub async fn ollama_open() -> Result<(), String> {
    open_ollama()
}

#[tauri::command]
pub async fn mac_info_cmd() -> MacInfo {
    mac_info()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_memory() {
        assert_eq!(parse_ram("25769803776\n"), Some(25_769_803_776));
        assert_eq!(parse_ram("nope"), None);
    }

    #[test]
    fn parses_free_disk() {
        let out = "Filesystem 1024-blocks Used Available Capacity Mounted on\n/dev/disk3s1s1 482746452 13307144 269086864 5% /\n";
        assert_eq!(parse_df_free(out), Some(269_086_864 * 1024));
        assert_eq!(parse_df_free("Filesystem only a header\n"), None);
        assert_eq!(parse_df_free(""), None);
    }

    #[test]
    fn ignores_spotlight_hits_that_are_not_installs() {
        assert!(is_installed_path("/Applications/Ollama.app"));
        assert!(is_installed_path("/Users/me/Applications/Ollama.app"));
        assert!(!is_installed_path("/Volumes/Ollama/Ollama.app"));
        assert!(!is_installed_path("/Users/me/.Trash/Ollama.app"));
        assert!(!is_installed_path(""));
    }

    /// Real calls on the Mac running the tests; `cargo test -- --nocapture` prints them.
    #[cfg(target_os = "macos")]
    #[test]
    fn reads_this_mac() {
        let info = mac_info();
        println!("{info:?} {:?}", install_info());
        assert!(info.ram_bytes.unwrap() >= 4 << 30);
        assert!(info.disk_free_bytes.unwrap() > 0);
    }
}
