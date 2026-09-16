import type { Metadata } from "next";
import { DiagnosticSandbox } from "@/components/coach/diagnostic-sandbox";
import { exercises, getExercise, isSandboxDiagnostic } from "@/data/exercises";

type Props = { params: Promise<{ exerciseId: string }> };

export function generateStaticParams() {
  return exercises.filter((e) => isSandboxDiagnostic(e.id)).map((e) => ({ exerciseId: e.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { exerciseId } = await params;
  const exercise = getExercise(exerciseId);
  return { title: exercise ? `${exercise.name} · Diagnostic` : "Diagnostic" };
}

export default async function DiagnosticSandboxPage({ params }: Props) {
  const { exerciseId } = await params;
  return <DiagnosticSandbox exerciseId={exerciseId} mode="diagnostic" />;
}
