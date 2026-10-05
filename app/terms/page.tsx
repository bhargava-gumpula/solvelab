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
        {brand.name} is a personal speedcubing timer and diagnostic coach. It runs in your browser,
        and as a Mac app (Apple silicon, macOS 14 or newer) that adds an AI coach. The timer and the
        algorithm pages work without an account; Coach, Stats, Train and Learn need Google Sign-In,
        because they keep data of yours on the account and sync it between devices. {brand.name} is
        not affiliated with the World Cube Association.
      </p>

      <h2>Your data</h2>
      <p>
        While you are signed out, solves stay in this browser and the timer still works. Signing out
        clears this browser’s copy. After you sign in, times are stored in Google Cloud Firestore on
        your Google account so they can restore on another device. They are not kept as a database
        on the operator’s laptop. See the Privacy Policy. You can still export a JSON backup from
        Settings → Data.
      </p>
      <p>
        Finished skill test results are also used to train {brand.name}’s coach, and for nothing
        else. This is on by default and does not include your name, email, notes or scrambles. You
        can turn it off at any time in Settings → Your data, which deletes what you shared. The
        Privacy Policy lists exactly what is shared.
      </p>

      <h2 id="mac-app" className="scroll-mt-24">
        The Mac app and its AI coach
      </h2>
      <p>
        The Mac app is free and provided as-is. It is not signed with an Apple Developer ID and
        Apple has not notarized it, so macOS warns you the first time you open it, and you approve
        it in System Settings → Privacy &amp; Security with an administrator’s password. Download it
        only from the link on this site. A Mac managed by a school or employer may not allow it.
      </p>
      <p>
        The coach in the app runs on your Mac and no data leaves your Mac for it; the Privacy Policy
        explains. Its advice is written by an AI model and can be wrong, including about cube moves.
        Check every algorithm in the algorithm bank before you learn it, and use your own judgement.
      </p>
      <p>
        The app uses Ollama (MIT licence) and Qwen models (Apache-2.0 licence), which are
        third-party software under their own licences. {brand.name} ships their notices and is not
        affiliated with either.
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
