"use client";
import { useState } from "react";
import { Layers3, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { algorithmSets } from "@/data/algorithms/sets";
export function AlgorithmCatalog() {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("all");
  const sets = algorithmSets.filter(set => (level === "all" || (level === "advanced" ? ["advanced", "expert"].includes(set.difficulty) : set.difficulty === level)) && `${set.name} ${set.description} ${set.category}`.toLowerCase().includes(query.toLowerCase().trim()));
  return <><div className="catalog-toolbar"><Tabs value={level} onValueChange={setLevel}><TabsList aria-label="Algorithm level"><TabsTrigger value="all">All sets</TabsTrigger><TabsTrigger value="beginner">Beginner</TabsTrigger><TabsTrigger value="intermediate">CFOP</TabsTrigger><TabsTrigger value="advanced">Advanced</TabsTrigger></TabsList></Tabs><div className="search-field"><Search size={16}/><Input aria-label="Search algorithm sets" placeholder="Search sets…" value={query} onChange={event => setQuery(event.target.value)}/></div></div><p className="result-count" role="status">{sets.length} planned {sets.length === 1 ? "set" : "sets"}</p><div className="catalog-grid">{sets.map(set => <article className="catalog-card" key={set.id}><div className="catalog-top"><Layers3 size={24}/><span className="small-badge">{set.difficulty}</span></div><h2>{set.name}</h2><p>{set.description}</p><div className="card-foot"><span>Cases and drills coming in {set.phase}</span></div></article>)}</div>{sets.length === 0 && <Empty className="panel"><EmptyHeader><EmptyTitle>No matching sets</EmptyTitle><EmptyDescription>Try a broader name or choose a different level.</EmptyDescription></EmptyHeader></Empty>}</>;
}
