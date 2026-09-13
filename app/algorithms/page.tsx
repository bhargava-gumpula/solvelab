import { PageHeading } from "@/components/layout/page-heading";
import { PhaseNotice } from "@/components/layout/phase-notice";
import { AlgorithmCatalog } from "@/components/algorithms/algorithm-catalog";
export const metadata = { title: "Algorithms" };
export default function AlgorithmsPage() {
  return <><PageHeading eyebrow="Recognize. Recall. Execute." title="Build a repertoire you can rely on." description="From your first triggers to advanced last-layer systems."/><AlgorithmCatalog/><PhaseNotice phase="V1.5–V1.75">Browse the planned set catalog now. Case diagrams, variants, drills, and mastery tracking come in the algorithm phases.</PhaseNotice></>;
}
