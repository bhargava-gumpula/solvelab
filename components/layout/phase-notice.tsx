import { Info } from "lucide-react";

export function PhaseNotice({ phase, children }: { phase: string; children: React.ReactNode }) {
  return (
    <div className="mt-6 flex items-start gap-3 rounded-2xl px-4 py-3 text-sm text-muted-foreground glass">
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>
        <strong className="font-medium text-foreground">Planned for {phase}.</strong> {children}
      </p>
    </div>
  );
}
