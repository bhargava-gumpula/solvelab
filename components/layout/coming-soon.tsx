import { PageHeading } from "@/components/layout/page-heading";
import { PhaseNotice } from "@/components/layout/phase-notice";

export function ComingSoon({
  area,
  phase,
  title,
  children,
}: {
  area: string;
  phase: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <PageHeading eyebrow={area} title={title} description={`Planned for ${phase}.`} />
      <PhaseNotice phase={phase}>{children}</PhaseNotice>
    </>
  );
}
