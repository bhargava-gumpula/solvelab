/**
 * The Fundamentals set: the short chunks every algorithm is made of.
 *
 * A trigger has nothing to "solve", so it can't be checked the way a case is.
 * What can be checked is what each one claims: how many in a row bring a solved
 * cube back to solved, and which part of the cube it touches. The unit tests
 * hold every entry here to both.
 */

export type TriggerTouches = "front-right" | "front-left" | "back-right" | "top";

export interface Trigger {
  /** Stable: what a person's label is saved against, as `fund-<id>`. */
  id: string;
  name: string;
  moves: string;
  group: string;
  aliases?: string[];
  /** Where it turns up, and why it is worth owning as one movement. */
  purpose: string;
  /** How the hands do it from the usual grip, where that is settled. */
  fingers?: string;
  /** How many in a row bring a solved cube back to solved. */
  repeats: number;
  /** The only part of a solved cube it moves. */
  touches: TriggerTouches;
}

export const FUNDAMENTALS_SET_ID = "fundamentals";

/** What a trigger's label is saved against. */
export function triggerProgressId(trigger: Pick<Trigger, "id">): string {
  return `fund-${trigger.id}`;
}

const WRIST = "R and R' turn from the right wrist, with the thumb resting on the front face.";

export const FUNDAMENTALS: readonly Trigger[] = [
  {
    id: "sexy",
    name: "Sexy move",
    moves: "R U R' U'",
    group: "The trigger",
    aliases: ["the trigger"],
    purpose:
      "The chunk most algorithms are built from. On its own it lifts the front-right pair out of its slot; inside an algorithm it is the run your hands should do as one movement, not four turns.",
    fingers: `${WRIST} The U is a push with the left index finger from the back; the U' is a flick with the right index finger.`,
    repeats: 6,
    touches: "front-right",
  },
  {
    id: "inverse-sexy",
    name: "Inverse sexy",
    moves: "U R U' R'",
    group: "The trigger",
    aliases: ["reverse sexy"],
    purpose:
      "The same four turns from the other end, so it puts back what the sexy move takes out. It is the insert for a joined pair sitting on the right of the top layer with the corner's white facing you, and the insert Winter Variation is built around.",
    fingers:
      "U with the left index finger, R from the wrist, U' with the right index finger, R' from the wrist: the sexy move's fingers in the other order.",
    repeats: 6,
    touches: "front-right",
  },
  {
    id: "sledgehammer",
    name: "Sledgehammer",
    moves: "R' F R F'",
    group: "The trigger",
    purpose:
      "The second chunk to own. It also lifts the front-right pair out, but through the front face, so an algorithm can pair a sexy move with a sledgehammer and leave the first two layers exactly as they were. It inserts the same joined pair as the inverse sexy, leaving the top edges differently, which is what edge control is built on.",
    fingers:
      "R' and R from the wrist. The F and F' are the part to work out: do them without the right hand leaving its grip, and the same way every time.",
    repeats: 6,
    touches: "front-right",
  },
  {
    id: "reverse-sledgehammer",
    name: "Reverse sledgehammer",
    moves: "F R' F' R",
    group: "The trigger",
    aliases: ["hedgeslammer"],
    purpose:
      "The sledgehammer backwards: it puts back what the sledgehammer takes out. It is the front-side insert: several of the F2L set's algorithms end with it, finishing a pair through the front without turning the cube.",
    repeats: 6,
    touches: "front-right",
  },
  {
    id: "left-sexy",
    name: "Left-hand sexy",
    moves: "L' U' L U",
    group: "The other hands",
    purpose:
      "The sexy move in the mirror, for the front-left slot. Own it early and a pair at the front left no longer needs a rotation.",
    fingers:
      "L' and L turn from the left wrist. The U' is a flick with the right index finger, the U a push with the left.",
    repeats: 6,
    touches: "front-left",
  },
  {
    id: "left-inverse-sexy",
    name: "Left-hand inverse sexy",
    moves: "U' L' U L",
    group: "The other hands",
    purpose:
      "The left-hand insert: a joined pair on the left of the top layer goes into the front-left slot without the cube turning in your hands.",
    fingers:
      "U' with the right index finger, L' from the left wrist, U with the left index finger, L from the wrist.",
    repeats: 6,
    touches: "front-left",
  },
  {
    id: "back-right-sexy",
    name: "Back-right sexy",
    moves: "R' U' R U",
    group: "The other hands",
    purpose:
      "The sexy move for the slot behind your right hand. It reaches the back-right slot from the usual grip, which is how the front-and-back drills fill both right-hand slots without a rotation.",
    fingers: `${WRIST} The U' is a flick with the right index finger, the U a push with the left.`,
    repeats: 6,
    touches: "back-right",
  },
  {
    id: "insert",
    name: "Three-move insert",
    moves: "R U R'",
    group: "Inserts",
    purpose:
      "The plain insert. With the corner above its slot, white facing right, and the edge at the back of the top layer, these three turns join the pair and drop it in at once.",
    fingers: `${WRIST} The U is a push with the left index finger.`,
    repeats: 4,
    touches: "front-right",
  },
  {
    id: "insert-back",
    name: "Three-move insert, other way",
    moves: "R U' R'",
    group: "Inserts",
    purpose:
      "For the pair that is already joined one top turn from its slot: corner at the front left of the top layer, edge beside it at the front. It is the undo of R U R', which is why one of the two always works when the other has taken a pair out.",
    fingers: `${WRIST} The U' is a flick with the right index finger.`,
    repeats: 4,
    touches: "front-right",
  },
  {
    id: "lift",
    name: "The lift",
    moves: "R U2 R'",
    group: "Inserts",
    purpose:
      "Turns a corner whose white faces up so that it faces a side, which is how the F2L cases with white on top begin. Twice in a row and it has undone itself.",
    fingers: `${WRIST} The U2 is a double flick: index then middle finger, or one flick from each hand.`,
    repeats: 2,
    touches: "front-right",
  },
  {
    id: "sune",
    name: "Sune",
    moves: "R U R' U R U2 R'",
    group: "Sunes",
    purpose:
      "Twists three of the top corners where they stand and sends three top edges round, while the first two layers stay put. It is the OLL case of the same name, one of the seven corner cases in 2-look OLL, and the run inside dozens of longer algorithms.",
    fingers: `${WRIST} The U turns are left-index pushes and the U2 a double flick; the whole thing runs without a regrip.`,
    repeats: 6,
    touches: "top",
  },
  {
    id: "antisune",
    name: "Antisune",
    moves: "R U2 R' U' R U' R'",
    group: "Sunes",
    purpose:
      "The Sune undone. A Sune followed by an Antisune brings a solved cube straight back, which makes the pair a good loop for warming up the right hand.",
    fingers: `${WRIST} The U' turns are right-index flicks and the U2 a double flick.`,
    repeats: 6,
    touches: "top",
  },
  {
    id: "left-sune",
    name: "Left-hand Sune",
    moves: "L' U' L U' L' U2 L",
    group: "Sunes",
    purpose:
      "The Sune in the mirror. Held the other way round it solves the Antisune case, so it doubles as a second Antisune for the angles where the right-hand one starts awkwardly.",
    fingers:
      "L' and L turn from the left wrist. The U' turns are right-index flicks and the U2 a double flick.",
    repeats: 6,
    touches: "top",
  },
  {
    id: "f-sexy-f",
    name: "Sexy move in F",
    moves: "F R U R' U' F'",
    group: "Blocks",
    purpose:
      "A sexy move wrapped in F and F'. It is the edge step of 2-look OLL for the line, and with wide f turns it does the L shape. Keep the sexy move as one movement; the two F turns are the only new part.",
    repeats: 6,
    touches: "top",
  },
  {
    id: "sexy-sledge",
    name: "Sexy sledge",
    moves: "R U R' U' R' F R F'",
    group: "Blocks",
    purpose:
      "A sexy move, then a sledgehammer. Each one lifts the front-right pair out; together they put it back, and what is left is the T-shape OLL. It is the pattern behind most last-layer algorithms: every chunk that takes a pair out is matched by one that puts it back.",
    fingers: "Run it as two chunks you already own, with no pause between them.",
    repeats: 3,
    touches: "top",
  },
];

/** The claim about repeats, in words. */
export function repeatsText(trigger: Pick<Trigger, "repeats">): string {
  const times: Record<number, string> = {
    2: "Twice",
    3: "Three times",
    4: "Four times",
    6: "Six times",
  };
  return `${times[trigger.repeats] ?? `${trigger.repeats} times`} in a row and the cube is back where it started.`;
}

/** The claim about what it moves, in words. */
export function touchesText(trigger: Pick<Trigger, "touches">): string {
  if (trigger.touches === "top")
    return "Leaves the first two layers alone: all of its work is on top.";
  return `Moves only the ${trigger.touches} pair and the top layer.`;
}
