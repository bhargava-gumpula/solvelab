import type { Metadata } from "next";
import { TestRedirect } from "@/components/tests/test-redirect";
import { TEST_ORDER } from "@/data/exercises";

type Props = { params: Promise<{ exerciseId: string }> };

/** Kept so links from earlier versions still open the right test. */
export function generateStaticParams() {
  return TEST_ORDER.map((exerciseId) => ({ exerciseId }));
}

export const metadata: Metadata = { title: "Test" };

export default async function OldDiagnosticPage({ params }: Props) {
  const { exerciseId } = await params;
  return <TestRedirect testId={exerciseId} />;
}
