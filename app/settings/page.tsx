import { PageHeading } from "@/components/layout/page-heading";
import { SettingsPanel } from "@/components/settings/settings-panel";
export const metadata = { title: "Settings" };
export default function SettingsPage() { return <><PageHeading eyebrow="Make it yours" title="Your practice. Your preferences." description="A comfortable workspace, with your data kept close."/><SettingsPanel/></>; }
