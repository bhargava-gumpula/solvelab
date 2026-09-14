import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/legal-document";
import { brand } from "@/lib/config/brand";
import { legal } from "@/lib/config/legal";

export const metadata: Metadata = { title: "Terms of Use" };

export default function TermsPage() {
  return (
    <LegalDocument title="Terms of Use" updated={`Effective ${legal.effectiveDate}`}>
      <p>
        These terms cover your use of {brand.name} at {legal.publicOrigin} and on local previews of
        the same app. The operator is {legal.operator} ({legal.contactEmail}).
      </p>

      <h2>What {brand.name} is</h2>
      <p>
        {brand.name} is a personal speedcubing timer and (later) coach. The timer runs in your
        browser. Google Sign-In is required only for Coach, Train, and Learn. {brand.name} is not
        affiliated with the World Cube Association.
      </p>

      <h2>Your data</h2>
      <p>
        While you are signed out, solves stay in this browser. After you sign in, times are stored
        in Google Cloud Firestore on your Google account so they can restore on another device. They
        are not kept as a database on the operator’s laptop. See the Privacy Policy. You can still
        export a JSON backup from Settings → Data.
      </p>

      <h2>Acceptable use</h2>
      <p>
        Use the app for timing and training. Do not attempt to break authentication, scrape other
        people’s accounts, or use the service to harm anyone. We may revoke access if Google or
        Firebase reports abuse.
      </p>

      <h2>Accounts</h2>
      <p>
        You must be allowed to use the Google account you sign in with. If Google shows that this
        app is unverified, that is expected for a personal project; you can continue only if you
        trust the operator named above.
      </p>

      <h2>No warranty</h2>
      <p>
        The app is provided as-is, without guarantees that times, averages, or future coaching
        advice are correct. Competition results remain your responsibility.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the extent allowed by law, {legal.operator} is not liable for lost solves, lost training
        time, or damages arising from use of {brand.name}.
      </p>

      <h2>Changes</h2>
      <p>
        These terms may be updated when the product changes. Continued use after an update means you
        accept the new terms.
      </p>

      <h2>Contact</h2>
      <p>
        <a
          className="text-primary underline-offset-4 hover:underline"
          href={`mailto:${legal.contactEmail}`}
        >
          {legal.contactEmail}
        </a>
      </p>
    </LegalDocument>
  );
}
