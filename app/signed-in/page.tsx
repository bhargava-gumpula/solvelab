import type { Metadata } from "next";
import { PageHeading } from "@/components/layout/page-heading";

export const metadata: Metadata = { title: "Signed in" };

export default function SignedInPage() {
  return (
    <PageHeading
      eyebrow="Account"
      title="Finishing sign-in…"
      description="Google is sending your account back to this tab."
    />
  );
}
