import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/legal-document";
import { brand } from "@/lib/config/brand";
import { legal } from "@/lib/config/legal";

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
          choices such as chart ranges), skill tests, daily checks and training plans, finished
          lessons, and algorithm choices are stored in Google Cloud Firestore under your Firebase
          user id (<code className="text-foreground">users/&lt;uid&gt;/…</code>). That copy is what
          restores them on a new device or after you clear this browser. It is not stored as a file
          on {legal.operator}’s laptop, Raspberry Pi, or git repository.
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
          and a Firebase user id) is stored by Google Firebase Authentication. The browser also
          keeps a local Firebase session so you stay signed in on this device.
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
          <strong className="text-foreground">Where it goes.</strong> Google Cloud Firestore, under
          a random Firebase id (
          <code className="text-foreground">trainingContributions/&lt;id&gt;/…</code>). If you are
          signed in, that is your account id. If you are signed out, the app creates an anonymous id
          that holds nothing but these test results. Only that id can read or delete them.{" "}
          {legal.operator} downloads the results to retrain the coach, with the ids replaced by new
          random ones, and ships improved coaches in normal updates.
        </li>
        <li>
          <strong className="text-foreground">On by default, off anytime.</strong> Sharing starts
          when you finish your first test. Turn off <em>Help improve the coach</em> in Settings →
          Your data to stop it; turning it off also deletes from our database everything this
          browser or your account shared. A coach already trained on your results keeps what it
          learned, but not the results themselves. Results are otherwise kept until you turn sharing
          off or email us to delete them.
        </li>
      </ul>

      <h2>Google Sign-In</h2>
      <p>
        Coach works without an account. Sign in if you want times to follow you to another device.
        The timer, Stats, Algorithms, and Settings stay usable either way. When you choose Sign in
        with Google, Google shares your basic profile (name, email, photo) with this app. We use
        that to show your account and attach your timer data to that account in Firestore. We do not
        post to Google on your behalf, read your Gmail, or attach your solves to Google Drive.
      </p>

      <h2>What we do not collect</h2>
      <p>
        {brand.name} does not run ads, does not sell personal information, and does not use
        third-party analytics pixels. Firestore security rules allow only the signed-in user to read
        or write their own <code className="text-foreground">users/&lt;uid&gt;</code> tree, and only
        the id that shared a test result to read or delete it.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>Sign out from the header or Settings. That ends the Google session on this device.</li>
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
