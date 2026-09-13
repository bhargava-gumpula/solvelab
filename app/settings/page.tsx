import type { Metadata } from "next";
import { PageHeading } from "@/components/layout/page-heading";
import { SettingsPanel } from "@/components/settings/settings-panel";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <>
      <PageHeading title="Settings" description="Timer behavior, appearance and your data." />
      <SettingsPanel />
    </>
  );
}
