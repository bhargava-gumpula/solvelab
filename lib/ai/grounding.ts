import { TEST_ORDER, testTitle } from "@/data/exercises";
import { TRAINING_PACKS } from "@/data/training";

/** Every name an answer may point to: pack titles and skill-test titles. */
const KNOWN = new Set(
  [
    ...TRAINING_PACKS.map((pack) => pack.title),
    ...TEST_ORDER.map((testId) => testTitle(testId)),
  ].map(normalise),
);

function normalise(name: string): string {
  return name
    .toLowerCase()
    .replace(/[“”"*]/g, "")
    .replace(/^the\s+/, "")
    .replace(/\s+(pack|test|drill)$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Names the answer presents as a SolveLab pack, test or drill that SolveLab
 * doesn't have. Deliberately narrow: only a quoted or bold name right beside
 * one of those words counts, so ordinary advice is never flagged.
 */
export function unknownReferences(text: string): string[] {
  const named = [
    // "Cross Mastery" pack, **Cross Mastery** test
    /(?:["“]([^"”\n]{3,60})["”]|\*\*([^*\n]{3,60})\*\*)\s+(?:training\s+)?(?:pack|test|drill)\b/gi,
    // the pack called "Cross Mastery"
    /\b(?:pack|test|drill)\s+(?:called|named)\s+(?:["“]([^"”\n]{3,60})["”]|\*\*([^*\n]{3,60})\*\*)/gi,
  ];
  const found = new Map<string, string>();
  for (const pattern of named) {
    for (const match of text.matchAll(pattern)) {
      const name = (match[1] ?? match[2])!.trim();
      const key = normalise(name);
      // A known name, or one that is known once "pack"/"test" is read as part of it.
      if (KNOWN.has(key) || KNOWN.has(normalise(match[0]))) continue;
      if (!found.has(key)) found.set(key, name);
    }
  }
  return [...found.values()];
}
