import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { TEST_ORDER, testHref, testTitle } from "@/data/exercises";
import { TRAINING_PACKS } from "@/data/training";
import { unitHref } from "@/lib/hub/units";

/** Names the AI may mention, longest first so "Faster PLL" beats "PLL". */
const REFERENCES = [
  ...TRAINING_PACKS.map((pack) => ({ name: pack.title, href: unitHref(pack) })),
  ...TEST_ORDER.map((testId) => ({ name: testTitle(testId), href: testHref(testId) })),
].sort((a, b) => b.name.length - a.name.length);

function escape(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const PATTERN = new RegExp(
  `(\\*\\*[^*]+\\*\\*|${REFERENCES.map((item) => escape(item.name)).join("|")})`,
  "gi",
);

/** Bold text and links to packs and tests the answer names; everything else stays plain text. */
function inline(text: string, key: string): ReactNode[] {
  return text.split(PATTERN).map((part, index) => {
    if (!part) return null;
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${key}-${index}`}>{inline(part.slice(2, -2), `${key}-${index}`)}</strong>
      );
    }
    const reference = REFERENCES.find((item) => item.name.toLowerCase() === part.toLowerCase());
    if (reference) {
      return (
        <Link
          key={`${key}-${index}`}
          href={reference.href}
          className="font-medium text-primary underline underline-offset-4"
        >
          {part}
        </Link>
      );
    }
    return <Fragment key={`${key}-${index}`}>{part}</Fragment>;
  });
}

/**
 * An AI's answer as paragraphs and lists. It's rendered as text, never as
 * HTML, and the only links are to SolveLab's own packs and tests.
 */
export function AiAnswer({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (!list.length) return;
    const items = list;
    blocks.push(
      <ul key={`list-${blocks.length}`} className="ml-5 list-disc space-y-1">
        {items.map((item, index) => (
          <li key={index}>{inline(item, `li-${blocks.length}-${index}`)}</li>
        ))}
      </ul>,
    );
    list = [];
  };
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    const bullet = /^([-*•]|\d+[.)])\s+(.*)$/.exec(line);
    if (bullet) {
      list.push(bullet[2]!);
      continue;
    }
    flush();
    if (!line) continue;
    const heading = /^#{1,4}\s+(.*)$/.exec(line);
    blocks.push(
      heading ? (
        <p key={`h-${blocks.length}`} className="font-semibold">
          {inline(heading[1]!, `h-${blocks.length}`)}
        </p>
      ) : (
        <p key={`p-${blocks.length}`}>{inline(line, `p-${blocks.length}`)}</p>
      ),
    );
  }
  flush();
  return <div className="grid gap-2 text-sm leading-relaxed">{blocks}</div>;
}
