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
          <strong className="text-foreground">When you are signed in</strong>, solves, sessions, and
          timer settings are stored in Google Cloud Firestore under your Firebase user id (
          <code className="text-foreground">users/&lt;uid&gt;/…</code>). That copy is what restores
          times on a new device or after you clear this browser. It is not stored as a file on{" "}
          {legal.operator}’s laptop, Raspberry Pi, or git repository.
        </li>
        <li>
          <strong className="text-foreground">A working copy</strong> of the same records also stays
          in this browser, in IndexedDB under the name{" "}
          <code className="text-foreground">speedcubing-local</code>, so the timer stays instant
          while you solve. Appearance (theme, digit style) stays in this browser’s localStorage (
          <code className="text-foreground">solvelab.appearance.v1</code>) and is not synced. Timer
          settings such as inspection and panel positions are part of the IndexedDB settings record
          and sync with your Google account when you are signed in.
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
        or write their own <code className="text-foreground">users/&lt;uid&gt;</code> tree.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>Sign out from the header or Settings. That ends the Google session on this device.</li>
        <li>
          Export or delete timer data from Settings → Data. Deleting solves while signed in also
          removes them from the Google account copy. Clearing this site’s data in your browser
          removes the local copy only; sign in again to restore from the account.
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
        {brand.name} is a training tool, not a service directed at children under 13. Do not create
        a Google sign-in for {brand.name} if you are under 13.
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
