import type { Metadata } from "next";
import { TestRedirect } from "@/components/tests/test-redirect";

export const metadata: Metadata = { title: "Test" };

/** Kept so links from earlier versions open the next test to take. */
export default function OldFullDiagnosticPage() {
  return <TestRedirect />;
}
