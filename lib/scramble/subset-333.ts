import type { CubeEvent } from "@/types/domain";

/**
 * Random-state 3×3 patterns for CFOP stage practice.
 *
 * Cubing.js / WCA piece order, white on U:
 *   edges   UF UR UB UL DF DR DB DL FR FL BR BL
 *   corners UFR URB UBL ULF DRF DFL DLB DBR
 *
 * F2L: D-cross solved. LS: cross and three F2L pairs solved (one random slot
 * open). OLL: F2L solved. PLL: F2L + last layer oriented.
 */

export const SUBSET_333_EVENTS = ["333f2l", "333ls", "333oll", "333pll"] as const;
export type Subset333Event = (typeof SUBSET_333_EVENTS)[number];

export function is333SubsetEvent(event: CubeEvent): event is Subset333Event {
  return (SUBSET_333_EVENTS as readonly string[]).includes(event);
}

export interface CubieOrbit {
  pieces: number[];
  orientation: number[];
}

export interface CubiePatternData {
  EDGES: CubieOrbit;
  CORNERS: CubieOrbit;
  CENTERS: CubieOrbit & { orientationMod: number[] };
}

const CROSS_EDGES = [4, 5, 6, 7];
const F2L_EDGES = [4, 5, 6, 7, 8, 9, 10, 11];
const F2L_CORNERS = [4, 5, 6, 7];
/** F2L slots as [edge, corner]: FR/DRF, FL/DFL, BL/DLB, BR/DBR. */
export const F2L_SLOTS: readonly (readonly [edge: number, corner: number])[] = [
  [8, 4],
  [9, 5],
  [11, 6],
  [10, 7],
];

function randomInt(maxExclusive: number): number {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0] % maxExclusive;
}

function shuffle<T>(items: readonly T[]): T[] {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index--) {
    const swap = randomInt(index + 1);
    [next[index], next[swap]] = [next[swap], next[index]];
  }
  return next;
}

function permutationParity(perm: readonly number[]): number {
  let inversions = 0;
  for (let i = 0; i < perm.length; i++) {
    for (let j = i + 1; j < perm.length; j++) {
      if (perm[i] > perm[j]) inversions++;
    }
  }
  return inversions & 1;
}

function identity(count: number): number[] {
  return Array.from({ length: count }, (_, index) => index);
}

function zeros(count: number): number[] {
  return Array.from({ length: count }, () => 0);
}

function freeSlots(count: number, frozen: readonly number[]): number[] {
  const locked = new Set(frozen);
  return identity(count).filter((index) => !locked.has(index));
}

function permuteSlots(perm: number[], slots: readonly number[]): void {
  const shuffled = shuffle(slots.map((slot) => perm[slot]));
  slots.forEach((slot, index) => {
    perm[slot] = shuffled[index];
  });
}

function frozenPieces(event: Subset333Event): {
  edges: number[];
  corners: number[];
  openSlot: readonly [number, number] | null;
} {
  if (event === "333f2l") return { edges: CROSS_EDGES, corners: [], openSlot: null };
  if (event === "333ls") {
    const openSlot = F2L_SLOTS[randomInt(F2L_SLOTS.length)];
    return {
      edges: F2L_EDGES.filter((edge) => edge !== openSlot[0]),
      corners: F2L_CORNERS.filter((corner) => corner !== openSlot[1]),
      openSlot,
    };
  }
  return { edges: F2L_EDGES, corners: F2L_CORNERS, openSlot: null };
}

function randomSubsetCubies(event: Subset333Event): {
  ep: number[];
  eo: number[];
  cp: number[];
  co: number[];
} {
  const { edges: freezeEdges, corners: freezeCorners, openSlot } = frozenPieces(event);
  const ep = identity(12);
  const cp = identity(8);
  const eo = zeros(12);
  const co = zeros(8);
  const edgeSlots = freeSlots(12, freezeEdges);
  const cornerSlots = freeSlots(8, freezeCorners);

  permuteSlots(ep, edgeSlots);
  permuteSlots(cp, cornerSlots);

  if (event !== "333pll") {
    for (const slot of edgeSlots) eo[slot] = randomInt(2);
    for (const slot of cornerSlots) co[slot] = randomInt(3);
    if (eo.reduce((sum, value) => sum + value, 0) % 2 === 1) {
      eo[edgeSlots[0]] ^= 1;
    }
    const twist = co.reduce((sum, value) => sum + value, 0) % 3;
    if (twist !== 0) {
      co[cornerSlots[0]] = (co[cornerSlots[0]] + (3 - twist)) % 3;
    }
  }

  if (permutationParity(ep) !== permutationParity(cp)) {
    [ep[edgeSlots[0]], ep[edgeSlots[1]]] = [ep[edgeSlots[1]], ep[edgeSlots[0]]];
  }

  // A last-slot scramble must leave its pair to solve (about 1 draw in 150 doesn't).
  if (openSlot) {
    const [edge, corner] = openSlot;
    const pairSolved =
      ep[edge] === edge && eo[edge] === 0 && cp[corner] === corner && co[corner] === 0;
    if (pairSolved) return randomSubsetCubies(event);
  }

  return { ep, eo, cp, co };
}

/** Uniform legal cubie pattern with the requested pieces already solved. */
export function randomSubset333Pattern(event: Subset333Event): CubiePatternData {
  const { ep, eo, cp, co } = randomSubsetCubies(event);
  return {
    EDGES: { pieces: ep, orientation: eo },
    CORNERS: { pieces: cp, orientation: co },
    CENTERS: {
      pieces: [0, 1, 2, 3, 4, 5],
      orientation: [0, 0, 0, 0, 0, 0],
      orientationMod: [1, 1, 1, 1, 1, 1],
    },
  };
}
