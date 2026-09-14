import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/legal-document";
import { brand } from "@/lib/config/brand";
import { planned, shipped } from "@/lib/config/overview";

export const metadata: Metadata = { title: "Overview" };

export default function OverviewPage() {
  return (
    <LegalDocument title={`${brand.name} ${brand.version}`} updated={brand.versionLabel}>
      <p>
        {brand.name} is a Rubik’s Cube timer that will grow into a coach. This page is a short
        record of what {brand.version} includes and what is planned next. It is not a redesign of
        the timer.
      </p>

      {shipped.map((release) => (
        <section key={release.version}>
          <h2>
            {release.version} — {release.title}
          </h2>
          <ul>
            {release.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ))}

      <h2>Planned</h2>
      {planned.map((release) => (
        <section key={release.version}>
          <h2>
            {release.version} — {release.title}
          </h2>
          <ul>
            {release.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ))}
    </LegalDocument>
  );
}
