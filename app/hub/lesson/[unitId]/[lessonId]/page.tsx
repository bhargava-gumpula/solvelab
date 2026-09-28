import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LessonPlayer } from "@/components/hub/lesson-player";
import { lessonSteps } from "@/lib/hub/steps";
import { ALL_UNITS, lessonContent, lessonHref, unitHref } from "@/lib/hub/units";

type Props = { params: Promise<{ unitId: string; lessonId: string }> };

export function generateStaticParams() {
  return ALL_UNITS.flatMap((unit) =>
    unit.lessons.map((lesson) => ({ unitId: unit.id, lessonId: lesson.id })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { unitId, lessonId } = await params;
  return { title: lessonContent(unitId, lessonId)?.lesson.title ?? "Lesson" };
}

export default async function LessonPage({ params }: Props) {
  const { unitId, lessonId } = await params;
  const content = lessonContent(unitId, lessonId);
  if (!content) notFound();
  const { unit } = content;
  const position = unit.lessons.findIndex((lesson) => lesson.id === lessonId);
  const next = unit.lessons[position + 1];
  return (
    <LessonPlayer
      unitId={unit.id}
      unitTitle={unit.title}
      lessonId={lessonId}
      packId={unit.kind === "pack" ? unit.id : null}
      steps={lessonSteps(content)}
      backHref={unitHref(unit)}
      pathHref="/hub/"
      next={next ? { href: lessonHref(unit.id, next.id), title: next.title } : null}
    />
  );
}
