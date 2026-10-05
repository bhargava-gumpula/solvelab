import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/legal-document";
import { brand } from "@/lib/config/brand";
import { accountBackend } from "@/lib/auth/config";
import { legal } from "@/lib/config/legal";

/**
 * Where accounts live for this build (lib/auth/config.ts): Supabase after the
 * move, Firebase before it. The policy names the right one.
 */
const SUPABASE = accountBackend() !== "firebase";
const words = SUPABASE
  ? {
      store: "a Postgres database hosted by Supabase",
      storeShort: "Supabase",
      tree: "rows keyed by your user id",
      authService: "Supabase Auth",
      userId: "Supabase user id",
      contributionsAt: "a random id in the same database",
      rules: "Row level security",
    }
  : {
      store: "Google Cloud Firestore",
      storeShort: "Firestore",
      tree: "users/<uid>/…",
      authService: "Google Firebase Authentication",
      userId: "Firebase user id",
      contributionsAt: "a random Firebase id",
      rules: "Firestore security rules",
    };

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalDocument title="Privacy Policy" updated={`Effective ${legal.effectiveDate}`}>
      <p>
        {brand.name} is a Rubik’s Cube timer operated by {legal.operator} (
        <a
          className="text-primary underline-offset-4 hover:underline"
          href={`mailto:${legal.contactEmail}`}
        >
          {legal.contactEmail}
        </a>
        ). This page explains what the app stores, where it lives, and what Google sees when you
        sign in.
      </p>

      <h2>Where your data is stored</h2>
      <ul>
        <li>
          <strong className="text-foreground">When you are signed in</strong>, your solves,
          sessions, settings (timer options, appearance such as theme and digit style, and view
          choices such as chart ranges), skill tests, daily checks, coach conversations and
          summaries, training plans, finished lessons, and algorithm choices are stored in{" "}
          {words.store} under your {words.userId} (
          <code className="text-foreground">{words.tree}</code>). That copy is what restores them on
          a new device or after you clear this browser. It is not stored as a file on{" "}
          {legal.operator}’s laptop, Raspberry Pi, or git repository.
        </li>
        <li>
          <strong className="text-foreground">A working copy</strong> of the same records also stays
          in this browser, in IndexedDB under the name{" "}
          <code className="text-foreground">speedcubing-local</code>, so the timer stays instant
          while you solve. This browser also keeps a copy of your appearance in localStorage (
          <code className="text-foreground">solvelab.appearance.v1</code>) so the right theme
          appears before the page finishes loading.
        </li>
        <li>
          <strong className="text-foreground">When you are signed out</strong>, solves stay only in
          this browser. Signing in uploads that local copy to the Google account and merges it with
          anything already saved there.
        </li>
        <li>
          <strong className="text-foreground">Google account</strong> (name, email, profile photo,
          and a {words.userId}) is stored by {words.authService}. The browser also keeps a local
          session so you stay signed in on this device.
        </li>
      </ul>
      <p>
        Times saved at <code className="text-foreground">http://127.0.0.1:5173</code> do not appear
        on <code className="text-foreground">{legal.publicOrigin}</code> until you sign in on both.
        Each website address is a separate browser origin; the Google account is what joins them.
      </p>

      <h2 id="coach-training" className="scroll-mt-24">
        How your solve data is used
      </h2>
      <p>
        Your solve data is used for two things only: saving and syncing your own times (above), and
        training {brand.name}’s coach AI so it gets better at spotting what slows cubers down. It is
        never sold, never used for ads, and never shared with anyone else.
      </p>
      <ul>
        <li>
          <strong className="text-foreground">What is shared for training.</strong> When you finish
          a skill test (for example the cross or OLL test), the app shares that test’s attempt
          times, which test it was, whether it used inspection, the goal you picked, the calendar
          day (not the time of day), the app version, and a summary of your normal timer solves (how
          many, their average, and how much they vary).
        </li>
        <li>
          <strong className="text-foreground">What is never shared for training.</strong> Your name,
          email, photo, notes, tags, scrambles, individual timer solves, and device details.
        </li>
        <li>
          <strong className="text-foreground">Where it goes.</strong> {words.storeShort}, under{" "}
          {words.contributionsAt}. Skill tests need an account, so that id is your account id, and
          only it can read or delete the results. {legal.operator} downloads the results to retrain
          the coach, with the ids replaced by new random ones, and ships improved coaches in normal
          updates.
        </li>
        <li>
          <strong className="text-foreground">On by default, off anytime.</strong> Sharing starts
          when you finish your first test. Turn off <em>Help improve the coach</em> in Settings →
          Your data to stop it; turning it off also deletes from our database everything this
          browser or your account shared. A coach already trained on your results keeps what it
          learned, but not the results themselves. Results are otherwise kept until you turn sharing
          off or email us to delete them.
        </li>
        {SUPABASE ? (
          <li>
            <strong className="text-foreground">Results shared before October 2026</strong> were
            kept by the earlier service under an anonymous id. They have moved with everything else,
            and the browser that shared them re-attaches them to itself the first time it opens the
            app after the move, so <em>Help improve the coach</em> still deletes them. A browser
            whose storage was cleared in between can no longer do that itself: email us with roughly
            when you took the tests and we will delete them.
          </li>
        ) : null}
      </ul>

      <h2 id="mac-app" className="scroll-mt-24">
        The Mac app
      </h2>
      <p>
        {brand.name} also comes as a Mac app. It keeps your working copy in its own storage on your
        Mac, the way the website keeps it in your browser. When you sign in, your times sync to your{" "}
        {words.storeShort} account exactly as they do on the website. The app checks for updates
        from time to time. The check sends the app’s version number and the type of Mac, and the
        server that holds the update file sees your IP address, as with any download.
      </p>

      <h2 id="coach-mac" className="scroll-mt-24">
        The coach in the Mac app
      </h2>
      <ul>
        <li>
          <strong className="text-foreground">It runs on your Mac.</strong> The coach is an AI model
          that runs on your Mac through Ollama. Your questions, its replies and your numbers summary
          are not sent to {legal.operator}, {brand.name} or anyone else.
        </li>
        <li>
          <strong className="text-foreground">What it is told.</strong> Numbers and choices only:
          your goal, average, course, solve profile and Learning Hub path. Never your name, email,
          notes, scrambles or individual solves.
        </li>
        <li>
          <strong className="text-foreground">Chats stay on your Mac.</strong> They are stored only
          in the app, are not synced to your account, can be cleared in Settings, and are deleted
          when you sign out of the app. Your backup from Settings → Your data can include them if
          you want to keep a copy.
        </li>
        <li>
          <strong className="text-foreground">The model download.</strong> The app downloads the
          model from Ollama’s servers, which see your IP address like any download. No {brand.name}{" "}
          data is sent with it.
        </li>
        <li>
          <strong className="text-foreground">Ollama</strong> is a separate program with its own
          privacy terms.
        </li>
      </ul>

      <h2 id="copy-summary" className="scroll-mt-24">
        Copy my summary
      </h2>
      <p>
        The website’s “Copy my summary” button only puts the same numbers-only summary on your
        clipboard. {brand.name} sends it nowhere; what you paste into another AI is between you and
        that service. Earlier versions of the website could connect your own AI with an OpenRouter
        sign-in or an API key, kept only in your browser. That feature is gone, and any saved key is
        deleted from your browser the next time you open the site.
      </p>

      <h2>Google Sign-In</h2>
      <p>
        Coach, Stats, Train and Learn need a Google account, because they hold data of yours that
        lives on the account. The timer, Algorithms and Settings work without one. When you choose
        Sign in with Google, Google shares your basic profile (name, email, photo) with this app. We
        use that to show your account and attach your timer data to that account in{" "}
        {words.storeShort}. We do not post to Google on your behalf, read your Gmail, or attach your
        solves to Google Drive.
      </p>

      <h2>What we do not collect</h2>
      <p>
        {brand.name} does not run ads, does not sell personal information, and does not use
        third-party analytics pixels. {words.rules} allow only the signed-in user to read or write
        their own rows, and only the id that shared a test result to read or delete it.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>
          Sign out from the header or Settings. That ends the Google session on this device and
          clears this browser’s copy of your data — times, sessions, coach conversations, tests and
          your solve profile. Only how the app looks is kept. Your account keeps its own copy, so
          signing back in restores it.
        </li>
        <li>
          Export or delete your data from Settings → Data. A backup file holds everything listed
          above. Deleting solves while signed in also removes them from the Google account copy.
          Clearing this site’s data in your browser removes the local copy only; sign in again to
          restore from the account.
        </li>
        <li>
          You can remove {brand.name}’s access in your{" "}
          <a
            className="text-primary underline-offset-4 hover:underline"
            href="https://myaccount.google.com/permissions"
          >
            Google Account permissions
          </a>
          .
        </li>
      </ul>

      <h2>Children</h2>
      <p>
        {brand.name} is a training tool, not a service directed at children under 13, and we do not
        knowingly collect personal information from them. Do not create a Google sign-in for{" "}
        {brand.name} if you are under 13. A parent or guardian can turn off{" "}
        <em>Help improve the coach</em> in Settings, or email us to delete anything a child shared.
      </p>

      <h2>Changes</h2>
      <p>If how data is stored changes, we will update this page and the effective date above.</p>

      <h2>Contact</h2>
      <p>
        Questions:{" "}
        <a
          className="text-primary underline-offset-4 hover:underline"
          href={`mailto:${legal.contactEmail}`}
        >
          {legal.contactEmail}
        </a>
        .
      </p>
    </LegalDocument>
  );
}
