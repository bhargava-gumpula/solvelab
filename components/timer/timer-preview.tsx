import Link from "next/link";
import { ArrowUpRight, Timer, Keyboard, Box, History, Info } from "lucide-react";
import { PageHeading } from "@/components/layout/page-heading";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";

export function TimerPreview() {
  return <>
    <PageHeading eyebrow="Make every solve count" title="Your next personal best starts here." description="A little focus. A fresh scramble. Just you and the cube." action={<span className="event-badge"><Box size={16}/>3 × 3 × 3</span>}/>
    <section className="timer-panel" aria-label="Timer design preview">
      <div className="timer-panel-top"><span className="session-label"><span className="session-dot"/>Main session</span><span className="muted-label">Untimed preview</span></div>
      <div className="scramble-block"><p className="eyebrow">Example scramble</p><p className="scramble">R U2 F′ L2 D B2 R′ U F2 D′ L U2 B′ R2 D2 F U′ L2 B</p></div>
      <div className="timer-center"><span className="timer-caption">A clear mind. A clean start.</span><div className="timer-digits" aria-label="Zero seconds">0<span className="timer-decimal">.</span>00</div><div className="timer-instruction"><Keyboard size={17}/><span>Hold <kbd>space</kbd> to prepare. Release to begin.</span></div><p className="preview-explanation">Timing and touch controls arrive in V1.</p></div>
      <div className="timer-metrics">{["Current Ao5", "Current Ao12", "Session mean", "Best single"].map(label => <div key={label}><span>{label}</span><strong>—</strong></div>)}</div>
    </section>
    <div className="timer-bottom"><section className="panel history-panel"><div className="section-header"><h2><History size={17}/>Recent solves</h2><span className="count-label">0 solves</span></div><Empty className="solve-empty"><EmptyHeader><EmptyMedia variant="icon"><Timer/></EmptyMedia><EmptyTitle>A fresh session</EmptyTitle><EmptyDescription>Your times, scrambles, and notes will live here. No sample solves have been added to your history.</EmptyDescription></EmptyHeader></Empty></section><aside className="next-panel"><div className="next-panel-top"><span className="eyebrow">Beyond the stopwatch</span><span className="step-index">01 / 04</span></div><h2>Find your time.<br/>Then find your edge.</h2><p>Build a baseline. Discover what slows you down. Practice with a purpose.</p><div className="practice-loop"><span className="current">Solve</span><span>Diagnose</span><span>Train</span><span>Retest</span></div><Link href="/coach" className="text-link">Explore the coaching approach <ArrowUpRight size={16}/></Link></aside></div>
    <div className="preview-note"><Info size={15}/><span>This is the design foundation. Explore the pages and themes before we build the working timer.</span></div>
  </>;
}
