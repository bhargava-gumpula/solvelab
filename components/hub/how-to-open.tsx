import { ShieldAlert } from "lucide-react";

/**
 * "How to open SolveLab on your Mac", for the "Get the Mac app" page. The app is ad-hoc signed
 * (no Apple Developer account), so macOS asks once before the first open. Same text as
 * docs/HOW_TO_OPEN_MAC_APP.md, which cites Apple's support pages; change both together.
 */
export function HowToOpen() {
  return (
    <section
      id="how-to-open"
      className="tile grid gap-4 p-5 md:p-6"
      aria-labelledby="how-to-open-title"
      data-testid="how-to-open"
    >
      <div>
        <h2 id="how-to-open-title" className="flex items-center gap-2 text-base font-semibold">
          <ShieldAlert className="size-4 text-primary" aria-hidden /> How to open SolveLab on your
          Mac
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          SolveLab isn&apos;t from the App Store or registered with Apple, so the first time you
          open it your Mac stops it. That&apos;s expected: you confirm once, and after that it opens
          like any other app.
        </p>
      </div>

      <div className="grid gap-1.5 text-sm">
        <h3 className="font-semibold">1. Install</h3>
        <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
          <li>Download the .dmg file and double-click it.</li>
          <li>Drag SolveLab onto the Applications folder, then eject the SolveLab disk.</li>
          <li>Keep it in Applications: updates and Google sign-in only work from there.</li>
        </ol>
      </div>

      <div className="grid gap-1.5 text-sm">
        <h3 className="font-semibold">2. First open on macOS 15 Sequoia or newer</h3>
        <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
          <li>
            Double-click SolveLab. When it says Apple could not verify it, click{" "}
            <strong>Done</strong> (not Move to Trash).
          </li>
          <li>
            Open <strong>System Settings → Privacy &amp; Security</strong>, scroll to Security and
            click <strong>Open Anyway</strong>. The button shows for about an hour after you tried
            to open the app.
          </li>
          <li>
            Click <strong>Open Anyway</strong> (or <strong>Open</strong>) again and type your Mac
            password. If it asks for an administrator, ask whoever set up the Mac (usually a
            parent).
          </li>
        </ol>
      </div>

      <div className="grid gap-1.5 text-sm">
        <h3 className="font-semibold">First open on macOS 14 Sonoma</h3>
        <p className="text-muted-foreground">
          In Applications, Control-click (or right-click) SolveLab, choose <strong>Open</strong>,
          then click <strong>Open</strong>. The System Settings way above works too.
        </p>
      </div>

      <div className="grid gap-1.5 text-sm">
        <h3 className="font-semibold">If something goes wrong</h3>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>
            <strong>School or work Mac:</strong> it may block apps from outside the App Store
            completely. Don&apos;t try to get around it; use the website instead.
          </li>
          <li>
            <strong>&ldquo;SolveLab is damaged&rdquo;:</strong> macOS says this about apps with no
            signature. SolveLab is signed, so the download probably broke. Delete it and download it
            again. Don&apos;t paste Terminal commands from the internet to fix it.
          </li>
          <li>
            <strong>&ldquo;Will damage your computer&rdquo; or malware:</strong> don&apos;t open it.
            Move it to the Trash and tell us.
          </li>
        </ul>
      </div>

      <p className="text-xs text-muted-foreground">
        Based on Apple&apos;s{" "}
        <a
          className="underline underline-offset-2"
          href="https://support.apple.com/en-us/102445"
          target="_blank"
          rel="noreferrer"
        >
          Safely open apps on your Mac
        </a>
        .
      </p>
    </section>
  );
}
