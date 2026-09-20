import { brand } from "./brand";

/** Public site URLs and operator contact used by legal pages and Google OAuth. */
export const legal = {
  operator: "Bhargava Gumpula",
  contactEmail: "bhargava.gumpula@gmail.com",
  publicOrigin: "https://solvelab.bhargava-gumpula.com",
  privacyPath: "/privacy/",
  termsPath: "/terms/",
  overviewPath: "/overview/",
  effectiveDate: "September 19, 2026",
} as const;

export const legalLinks = [
  { href: legal.overviewPath, label: "Overview" },
  { href: legal.privacyPath, label: "Privacy" },
  { href: legal.termsPath, label: "Terms" },
] as const;

export const privacyPolicyUrl = `${legal.publicOrigin}${legal.privacyPath}`;
export const termsOfServiceUrl = `${legal.publicOrigin}${legal.termsPath}`;
export const applicationHomeUrl = `${legal.publicOrigin}/timer/`;

export const productLegalName = brand.name;
