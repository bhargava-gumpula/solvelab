import type { Metadata, Viewport } from "next";
import { Doto, Instrument_Sans, Instrument_Serif } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { brand } from "@/lib/config/brand";
import { APPEARANCE_BOOT_SCRIPT } from "@/lib/appearance/preferences";
import { AppProviders } from "@/components/layout/app-providers";
import { AppShell } from "@/components/layout/app-shell";
import { UpdatePrompt } from "@/components/desktop/update-prompt";

// Fonts are downloaded at build time and self-hosted; no runtime network needed.
// Studio type system, two families: an editorial serif for display headlines and
// one grotesk for everything else (interface, scramble, figures and the time).
const studioSans = Instrument_Sans({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-studio-sans",
});
const studioSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-studio-serif",
});
// The optional LCD and dot-matrix digit faces load when chosen, not on every page.
const doto = Doto({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-doto",
  preload: false,
});
// DSEG7 Classic by keshikan, SIL Open Font License (app/fonts/DSEG-LICENSE.txt).
const dseg = localFont({
  src: "./fonts/DSEG7Classic-Bold.woff2",
  variable: "--font-dseg",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: { default: brand.name, template: `%s · ${brand.name}` },
  description: brand.tagline,
  applicationName: brand.name,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2eee6" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0d0f" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {/* Applies the saved theme before first paint to avoid a flash. */}
        <script dangerouslySetInnerHTML={{ __html: APPEARANCE_BOOT_SCRIPT }} />
      </head>
      <body
        className={`${studioSans.variable} ${studioSerif.variable} ${doto.variable} ${dseg.variable} antialiased`}
      >
        <AppProviders>
          <AppShell>{children}</AppShell>
          <UpdatePrompt />
        </AppProviders>
      </body>
    </html>
  );
}
