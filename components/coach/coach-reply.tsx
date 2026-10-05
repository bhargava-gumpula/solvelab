"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { AiAnswer } from "@/components/hub/ai-answer";
import { coachCatalogue } from "@/lib/coach-chat/context";
import { refLinks } from "@/lib/coach-chat/links";
import { parseCoachReply, partialAnswer } from "@/lib/coach-chat/reply";
import { cn } from "@/lib/utils";

/**
 * One reply from the coach. While it streams (or after Stop) only the answer
 * text is shown, already cleared of invented algorithms. A finished reply also
 * shows where it points, as links to the real pages, and the questions the
 * person could ask next (`onFollowUp`, given only for the latest reply).
 */
export function CoachReplyView({
  raw,
  unfinished,
  onFollowUp,
}: {
  raw: string;
  unfinished: boolean;
  onFollowUp?: (question: string) => void;
}) {
  const reply = useMemo(
    () => (unfinished ? null : parseCoachReply(raw, coachCatalogue()).reply),
    [raw, unfinished],
  );
  const links = useMemo(() => (reply ? refLinks(reply.refs) : []), [reply]);
  return (
    <div className="grid gap-3">
      <AiAnswer text={reply ? reply.answer : partialAnswer(raw)} />
      {links.length ? (
        <div className="grid gap-1.5">
          <p className="text-xs font-medium text-muted-foreground">Try next</p>
          <ul className="flex flex-wrap gap-2">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  data-testid="coach-ref"
                  className="inline-flex items-center gap-1.5 rounded-full border bg-background/70 px-3 py-1 text-xs font-medium text-primary transition-colors hover:border-primary/60"
                >
                  {link.title} <ArrowRight className="size-3" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {reply?.followUps.length && onFollowUp ? (
        <ul className="flex flex-wrap gap-2" aria-label="Questions you could ask next">
          {reply.followUps.map((question) => (
            <li key={question}>
              <button
                type="button"
                data-testid="coach-follow-up"
                onClick={() => onFollowUp(question)}
                className={cn(
                  "rounded-full border px-3 py-1 text-left text-xs transition-colors",
                  "hover:border-primary/60 hover:bg-primary/10",
                )}
              >
                {question}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
