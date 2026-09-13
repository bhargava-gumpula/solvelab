/**
 * Cube notation parser.
 *
 * Supports outer turns (R U F L D B), wide turns written either lowercase (r)
 * or with a w suffix (Rw), slice turns (M E S) and whole-cube rotations
 * (x y z). Each move may carry an amount of 2 or 3 and/or a prime. Brackets
 * and parentheses used for grouping in published algorithms are ignored.
 */

export const OUTER_FACES = ["U", "D", "L", "R", "F", "B"] as const;
export const WIDE_FACES = ["u", "d", "l", "r", "f", "b"] as const;
export const SLICES = ["M", "E", "S"] as const;
export const ROTATIONS = ["x", "y", "z"] as const;

export type OuterFace = (typeof OUTER_FACES)[number];
export type MoveFamily =
  OuterFace | (typeof WIDE_FACES)[number] | (typeof SLICES)[number] | (typeof ROTATIONS)[number];

/** Clockwise quarter turns, normalized to 1, 2 or 3 (3 is written as prime). */
export type QuarterTurns = 1 | 2 | 3;

export interface Move {
  family: MoveFamily;
  turns: QuarterTurns;
}

export type ParseResult =
  | { ok: true; moves: Move[] }
  | { ok: false; error: { token: string; position: number; message: string } };

const MOVE_PATTERN = /^([UDLRFBudlrfbMESxyz])(w?)(\d*)(['’′]?)$/;
const PRIME_CHARACTERS = /['’′]/g;

export function parseMove(token: string): Move | null {
  const match = MOVE_PATTERN.exec(token);
  if (!match) return null;
  const [, letter, wide, amountText, prime] = match;

  let family = letter as MoveFamily;
  if (wide) {
    if (!(OUTER_FACES as readonly string[]).includes(letter)) return null;
    family = letter.toLowerCase() as MoveFamily;
  }

  const amount = amountText === "" ? 1 : Number(amountText);
  if (!Number.isInteger(amount) || amount < 1 || amount > 3) return null;

  const signed = prime ? -amount : amount;
  const turns = (((signed % 4) + 4) % 4) as 0 | QuarterTurns;
  if (turns === 0) return null;
  return { family, turns };
}

/** Parses a whitespace-separated algorithm. Reports the first invalid token. */
export function parseAlgorithm(text: string): ParseResult {
  const moves: Move[] = [];
  const cleaned = text.replace(/[()[\]]/g, " ");
  const tokenPattern = /\S+/g;
  let match: RegExpExecArray | null;
  while ((match = tokenPattern.exec(cleaned)) !== null) {
    const token = match[0];
    const move = parseMove(token);
    if (!move) {
      return {
        ok: false,
        error: { token, position: match.index, message: `“${token}” is not a valid move.` },
      };
    }
    moves.push(move);
  }
  return { ok: true, moves };
}

export function isValidAlgorithm(text: string): boolean {
  return parseAlgorithm(text).ok;
}

export function formatMove(move: Move): string {
  if (move.turns === 1) return move.family;
  if (move.turns === 2) return `${move.family}2`;
  return `${move.family}'`;
}

export function formatAlgorithm(moves: readonly Move[]): string {
  return moves.map(formatMove).join(" ");
}

export function invertMove(move: Move): Move {
  return { family: move.family, turns: (4 - move.turns) as QuarterTurns };
}

export function invertAlgorithm(moves: readonly Move[]): Move[] {
  return [...moves].reverse().map(invertMove);
}

/** Normalizes typographic primes so stored scrambles are plain ASCII. */
export function normalizeNotation(text: string): string {
  return text.replace(PRIME_CHARACTERS, "'").replace(/\s+/g, " ").trim();
}
