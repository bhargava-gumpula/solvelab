# How to open SolveLab on your Mac

SolveLab is free, and it doesn't come from the App Store. It also isn't registered with Apple, which costs $99 a year. So the first time you open it, your Mac says it can't check the app and stops it. That's expected. You say "yes, open it" once in System Settings, and after that SolveLab opens like any other app.

> The website shows the same guide on the "Get the Mac app" page (`components/hub/how-to-open.tsx`). Change both together.

## Before you start

- **An Apple silicon Mac (M1 or newer).** Check with Apple menu → About This Mac: "Chip" should say Apple M1, M2, M3, M4 or newer.
- **macOS 14 Sonoma or newer.** It's on the same About This Mac window.
- **You might need an administrator password.** On a family Mac a parent set up, that's usually a parent's.
- **A school or work Mac may not allow it at all.** If someone else manages the Mac, the setting below can be missing or locked ([Apple](https://support.apple.com/en-us/102445)). Don't try to get around it. Ask whoever manages it, or use the website: the timer and the Learning Hub work there.

## 1. Install it

1. Download the file that ends in `.dmg` from the release page.
2. Double-click it in Downloads. A window opens with SolveLab and an Applications folder.
3. Drag SolveLab onto the Applications folder.
4. Eject the SolveLab disk (Finder sidebar → the eject button next to SolveLab).

Keep SolveLab in Applications. Updates and Google sign-in only work from there.

## 2. Open it the first time

### macOS 15 Sequoia or newer

1. Open Applications and double-click SolveLab. A message says Apple could not verify that SolveLab is free of malware. Click **Done**, not Move to Trash.
2. Open Apple menu → **System Settings** → **Privacy & Security**. Scroll down to **Security**. It says SolveLab was blocked. Click **Open Anyway**.
3. Your Mac asks once more. Click **Open Anyway**, then type your Mac login password or use Touch ID. If it asks for an administrator's name and password, ask whoever set up the Mac (usually a parent) to type theirs.
4. SolveLab opens. From now on it opens normally.

The Open Anyway button only shows for about an hour after you tried to open the app. If it's gone, double-click SolveLab again, then go back to System Settings ([Apple, macOS Sequoia guide](https://support.apple.com/guide/mac-help/mh40616/15.0/mac/15.0)). The old shortcut, Control-click → Open, no longer skips this on macOS 15.

### macOS 14 Sonoma

1. Open Applications in Finder.
2. Control-click (or right-click) SolveLab and choose **Open**.
3. Click **Open** in the message.

The System Settings way from macOS 15 works on macOS 14 too ([Apple, macOS Sonoma guide](https://support.apple.com/guide/mac-help/mh40616/14.0/mac/14.0)).

## Updates

When there's a new version, a small note appears in the corner when you open SolveLab: "Update available. Restart?" Click **Restart**. The app checks that the update really comes from SolveLab before it installs anything. If you click **Later**, it asks again next time. If macOS ever asks you to confirm again after an update, follow the same steps as the first time.

## If something goes wrong

**"SolveLab is damaged and can't be opened."** On Apple silicon Macs, macOS shows this for apps with no signature at all, and there's no Open Anyway button for them ([Tauri](https://v2.tauri.app/distribute/sign/macos/), [tauri#8763](https://github.com/tauri-apps/tauri/issues/8763)). SolveLab has an "ad-hoc" signature: it's signed, just not registered with Apple, so you get the normal "could not verify" message instead. If you still see "damaged", the download probably broke or the file didn't come from SolveLab's release page. Move it to the Trash, download it again from the release page, and tell whoever sent you the link if it happens again. Don't paste Terminal commands from the internet to "fix" it.

**No Open Anyway button.** Either more than an hour has passed (double-click SolveLab again first), or your Mac is managed by a school or workplace and the setting is locked. Use the website instead.

**A message that the app "will damage your computer" or contains malware.** That's different: macOS recognised something harmful. Don't open it. Move it to the Trash and tell whoever sent you the link ([Apple](https://support.apple.com/en-us/102445)).

**It opened from the disk image instead of Applications.** Quit it, drag it into Applications, and open it from there.

## Why does this happen?

Apple checks apps from developers who pay for its Developer Program and send every version to Apple first ("notarization"). SolveLab skips that for now, so your Mac can't check it and asks you to decide. Apple warns that overriding this is the most common way Macs get malware, so only do it for apps you trust that come from the official link ([Apple](https://support.apple.com/guide/mac-help/mh40616/mac)).

## Sources

Checked on 2026-10-04.

- Apple: [Safely open apps on your Mac](https://support.apple.com/en-us/102445) (updated 27 May 2026): Open Anyway in Privacy & Security; settings may be unavailable on managed Macs; never override malware alerts.
- Apple Mac User Guide: [Open a Mac app from an unknown developer](https://support.apple.com/guide/mac-help/mh40616/mac), [macOS Sequoia 15 version](https://support.apple.com/guide/mac-help/mh40616/15.0/mac/15.0) (Open Anyway, login password, button shown for about an hour) and [macOS Sonoma 14 version](https://support.apple.com/guide/mac-help/mh40616/14.0/mac/14.0) (Control-click → Open). The current guide shows the same steps as macOS 15.
- MacRumors: [macOS Sequoia removes the Control-click way past Gatekeeper](https://www.macrumors.com/2024/08/06/macos-sequoia-gatekeeper-security-change/).
- Tauri: [macOS code signing, ad-hoc signing](https://v2.tauri.app/distribute/sign/macos/); [tauri#8763](https://github.com/tauri-apps/tauri/issues/8763) ("damaged" for unsigned apps on Apple silicon).
