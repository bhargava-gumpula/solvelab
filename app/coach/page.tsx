import Link from "next/link";
import { ArrowUpRight, ScanLine, Timer, Target, Repeat2 } from "lucide-react";
import { PageHeading } from "@/components/layout/page-heading";
import { PhaseNotice } from "@/components/layout/phase-notice";
import { Button } from "@/components/ui/button";
import { milestones } from "@/data/milestones";
export const metadata = { title: "Coach" };
const steps = [
  { icon: Timer, name: "Establish your baseline", detail: "A series of normal solves gives us a starting point." },
  { icon: ScanLine, name: "Investigate the slowdown", detail: "Focused tests help separate recognition, execution, and transitions." },
  { icon: Target, name: "Practice what matters", detail: "A targeted plan follows the evidence from your tests." },
  { icon: Repeat2, name: "Retest and adjust", detail: "Measure the change, then update the plan." },
];
export default function CoachPage() {
  return <><PageHeading eyebrow="Evidence before advice" title="Know what to practice next." description="A coach that starts with measurements, not assumptions."/>
    <section className="coach-intro panel"><div className="feature-icon"><ScanLine size={28}/></div><div><span className="eyebrow">Your starting point</span><h2>Every improvement starts<br/>with understanding your solves.</h2><p>There isn’t enough evidence to identify a weakness yet. Once timing and diagnostics are available, your results will guide the next step.</p><Button asChild variant="outline"><Link href="/timer">Back to your timer <ArrowUpRight/></Link></Button></div></section>
    <div className="section-title"><h2>A clear path from solving to improving</h2><span>How coaching will work</span></div>
    <div className="workflow-grid">{steps.map(({ icon: Icon, name, detail }, i) => <article className="workflow-card" key={name}><div className="workflow-top"><Icon size={22}/><span>0{i + 1}</span></div><h3>{name}</h3><p>{detail}</p></article>)}</div>
    <section className="milestone-panel panel"><div className="section-title"><h2>Your next milestone, at your pace</h2><span>No goal selected</span></div><div className="milestone-track">{milestones.map(item => <span key={item.id}>{item.label}</span>)}</div><p>Progress will be based on sustained performance, never a single lucky solve.</p></section>
    <PhaseNotice phase="V2">Diagnostics, skill scores, and training plans will use your real results. No diagnosis has been generated.</PhaseNotice></>;
}
