"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeatureCard } from "@/components/layout/feature-card";
import { learningPaths } from "@/data/learning/paths";
import { getLesson, lessonsForPath, type Lesson } from "@/data/learning/lessons";
import { cn } from "@/lib/utils";

const PROGRESS_KEY = "solvelab.lessonProgress.v1";

function readProgress(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeProgress(next: Record<string, boolean>) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
}

export function LearnDashboard() {
  const [progress, setProgress] = useState<Record<string, boolean>>(() => readProgress());
  const [activeId, setActiveId] = useState<string | null>(null);

  const active = activeId ? getLesson(activeId) : null;

  const markComplete = (id: string) => {
    const next = { ...progress, [id]: true };
    setProgress(next);
    writeProgress(next);
  };

  return (
    <div className="grid gap-6">
      {active ? (
        <LessonReader
          lesson={active}
          completed={!!progress[active.id]}
          onBack={() => setActiveId(null)}
          onComplete={() => markComplete(active.id)}
        />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        {learningPaths.map((path) => {
          const pathLessons = lessonsForPath(path.id);
          const done = pathLessons.filter((l) => progress[l.id]).length;
          return (
            <FeatureCard
              key={path.id}
              icon={BookOpen}
              title={path.name}
              description={path.description}
              badge={path.level}
              footer={`${done}/${pathLessons.length} lessons complete`}
            >
              <ol className="my-4 divide-y text-sm">
                {pathLessons.map((lesson, index) => (
                  <li key={lesson.id} className="flex items-center gap-2 py-2">
                    <span className="font-mono tabular text-xs text-muted-foreground">
                      0{index + 1}
                    </span>
                    <button
                      type="button"
                      className={cn(
                        "min-w-0 flex-1 text-left hover:text-primary",
                        progress[lesson.id] && "text-muted-foreground",
                      )}
                      onClick={() => setActiveId(lesson.id)}
                    >
                      {lesson.title}
                    </button>
                    {progress[lesson.id] ? (
                      <Check className="size-3.5 text-primary" aria-label="Completed" />
                    ) : null}
                  </li>
                ))}
              </ol>
            </FeatureCard>
          );
        })}
      </div>
    </div>
  );
}

function LessonReader({
  lesson,
  completed,
  onBack,
  onComplete,
}: {
  lesson: Lesson;
  completed: boolean;
  onBack: () => void;
  onComplete: () => void;
}) {
  const steps = useMemo(() => lesson.steps, [lesson]);
  return (
    <article className="rounded-3xl p-6 glass md:p-8" data-testid="lesson-reader">
      <button
        type="button"
        className="text-xs text-muted-foreground hover:text-foreground"
        onClick={onBack}
      >
        ← All lessons
      </button>
      <p className="mt-3 eyebrow">{lesson.minutes} min</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight">{lesson.title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{lesson.summary}</p>
      <div className="mt-6 grid gap-4">
        {steps.map((step) => (
          <section key={step.title} className="rounded-2xl border px-4 py-3">
            <h3 className="text-sm font-semibold">{step.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
          </section>
        ))}
      </div>
      {lesson.practiceHint ? (
        <p className="mt-4 rounded-xl bg-muted/50 px-3 py-2 text-sm">{lesson.practiceHint}</p>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-2">
        <Button type="button" onClick={onComplete} disabled={completed}>
          {completed ? "Completed" : "Mark complete"}
        </Button>
        <Button asChild variant="outline">
          <Link href="/train">Practice on Train</Link>
        </Button>
      </div>
    </article>
  );
}
