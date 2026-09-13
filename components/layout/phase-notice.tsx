import { Info } from "lucide-react";
export function PhaseNotice({ phase, children }: { phase: string; children: React.ReactNode }) {
  return <div className="phase-notice"><Info size={17}/><p><strong>Planned for {phase}.</strong> {children}</p></div>;
}
