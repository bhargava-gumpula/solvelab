/**
 * Where a reference in a coach reply goes. The model returns a kind and an id;
 * this maps it to the real page and the real title from the catalogue, and
 * returns null for anything that isn't there (so a made-up id never becomes a link).
 */
import { testHref } from "@/data/exercises";
import { getLesson } from "@/data/learning/lessons";
import { TRAINING_PACKS } from "@/data/training";
import { drillHref } from "@/lib/hub/drills";
import { lessonHref, unitHref } from "@/lib/hub/units";
import { coachCatalogue } from "./context";
import type { CoachReply } from "./types";

export interface RefLink {
  title: string;
  href: string;
}

function hrefFor(kind: string, id: string): string | null {
  switch (kind) {
    case "pack":
    case "unit":
      return unitHref({ id });
    case "test":
      return testHref(id);
    case "set":
      return `/algorithms/${id}/`;
    case "drill": {
      const pack = TRAINING_PACKS.find((item) => item.drills.some((drill) => drill.id === id));
      return pack ? drillHref(pack.id, id) : null;
    }
    case "lesson": {
      const pack = TRAINING_PACKS.find((item) => item.lessons.some((lesson) => lesson.id === id));
      if (pack) return lessonHref(pack.id, id);
      const lesson = getLesson(id);
      return lesson ? lessonHref(`method-${lesson.pathId}`, id) : null;
    }
    default:
      return null;
  }
}

export function refLink(ref: CoachReply["refs"][number]): RefLink | null {
  const entry = coachCatalogue().find((item) => item.id === ref.id && item.kind === ref.kind);
  const href = entry ? hrefFor(ref.kind, ref.id) : null;
  return entry && href ? { title: entry.title, href } : null;
}

export function refLinks(refs: CoachReply["refs"]): RefLink[] {
  return refs.flatMap((ref) => refLink(ref) ?? []);
}
