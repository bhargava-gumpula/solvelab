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

      {[
        { heading: "In this issue", releases: shipped },
        { heading: "Planned", releases: planned },
      ]
        .filter(({ releases }) => releases.length > 0)
        .map(({ heading, releases }) => (
          <div key={heading} className="!mt-12">
            <h2 className="!mt-0 border-b border-[var(--hairline)] pb-3">{heading}</h2>
            {releases.map((release) => (
              <section
                key={release.version}
                className="grid gap-x-8 gap-y-2 border-b border-[var(--hairline)] py-6 sm:grid-cols-[7rem_minmax(0,1fr)]"
              >
                <p
                  aria-hidden
                  className="font-display text-[3rem] leading-[0.9] text-foreground italic"
                >
                  {release.version}
                </p>
                <div className="min-w-0">
                  <h3 className="font-display text-[1.5rem] leading-tight text-foreground">
                    <span className="sr-only">{release.version} — </span>
                    {release.title}
                  </h3>
                  <ul className="mt-3">
                    {release.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </section>
            ))}
          </div>
        ))}
    </LegalDocument>
  );
}
