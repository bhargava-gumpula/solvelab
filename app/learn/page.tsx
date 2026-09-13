import { BookOpen } from "lucide-react";
import { PageHeading } from "@/components/layout/page-heading";
import { PhaseNotice } from "@/components/layout/phase-notice";
import { learningPaths } from "@/data/learning/paths";
export const metadata = { title: "Learn" };
export default function LearnPage() { return <><PageHeading eyebrow="Understanding makes it faster" title="The next thing worth learning." description="A path for where you are now, with room for where you’re going."/><div className="learning-grid">{learningPaths.map(path => <article className="learning-card panel" key={path.id}><div className="catalog-top"><BookOpen size={24}/><span className="small-badge">{path.level}</span></div><h2>{path.name}</h2><p>{path.description}</p><ol>{path.topics.map((topic, i) => <li key={topic}><span>0{i + 1}</span>{topic}</li>)}</ol><div className="card-foot">Path outline · lessons not yet available</div></article>)}</div><PhaseNotice phase="the learning phase">These are curriculum outlines. Coaching will initially focus on CFOP; the timer will remain usable with any method.</PhaseNotice></>; }
