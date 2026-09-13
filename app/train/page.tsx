import Link from "next/link";
import { ArrowUpRight, Crosshair, Layers3, Timer } from "lucide-react";
import { PageHeading } from "@/components/layout/page-heading";
import { PhaseNotice } from "@/components/layout/phase-notice";
import { exercises } from "@/data/exercises";
export const metadata = { title: "Train" };
export default function TrainPage() {
  const previews = exercises.filter(item => ["cross_first_pair", "slow_f2l", "normal_solves"].includes(item.id));
  return <><PageHeading eyebrow="Practice with a purpose" title="Turn focus into progress." description="Focused exercises. Measurable improvement. A plan that adapts."/>
    <section className="training-intro panel"><span className="eyebrow">Your training plan</span><h2>A plan built around you.</h2><p>Complete a baseline and targeted diagnostics to discover which exercises belong in your practice. There’s no personal plan yet.</p><Link href="/coach" className="text-link">See the diagnostic approach <ArrowUpRight size={16}/></Link></section>
    <div className="section-title"><h2>A look at the exercise library</h2><span>Exercise previews</span></div>
    <div className="catalog-grid">{previews.map((item, i) => { const Icon = [Timer, Crosshair, Layers3][i]; return <article key={item.id} className="catalog-card"><div className="catalog-top"><Icon size={24}/><span className="small-badge">{item.category.replace("_", " ")}</span></div><h2>{item.name}</h2><p>{item.description}</p><div className="card-foot"><span>{item.recommendedSampleCount} suggested repetitions</span><span>V2</span></div></article>; })}</div>
    <PhaseNotice phase="V2">These are exercise definitions, not active drills or a personal recommendation. Training will include a retest.</PhaseNotice></>;
}
