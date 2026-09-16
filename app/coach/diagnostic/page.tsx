import type { Metadata } from "next";
import { FullDiagnosticSandbox } from "@/components/coach/full-diagnostic-sandbox";

export const metadata: Metadata = {
  title: "Diagnostic",
};

export default function FullDiagnosticPage() {
  return <FullDiagnosticSandbox />;
}
