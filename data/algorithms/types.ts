import type { CaseKind } from "@/lib/cube/case-check";

/** One way of solving a case. Ids are stable: they are what a person's pick points at. */
export interface CaseAlgorithm {
  /** Unique within the case, and never renumbered. */
  id: string;
  moves: string;
  /** A short note on what makes this one worth knowing. */
  note?: string;
  /** Where it is widely published, when it is one particular person's. */
  source?: string;
}

/** A case in a set, with every algorithm known to work for it. */
export interface CaseEntry {
  id: string;
  name: string;
  /** How the set is broken up for learning, e.g. "Corners only". */
  group: string;
  aliases?: string[];
  /** What to look for on the cube, in the person's terms. */
  recognition?: string;
  algorithms: CaseAlgorithm[];
}

export interface AlgorithmSetData {
  id: string;
  name: string;
  kind: CaseKind;
  cases: CaseEntry[];
}
