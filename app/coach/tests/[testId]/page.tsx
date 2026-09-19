import type { Metadata } from "next";
import { TestSession } from "@/components/tests/test-session";
import { TEST_ORDER, testTitle } from "@/data/exercises";

type Props = { params: Promise<{ testId: string }> };

export function generateStaticParams() {
  return TEST_ORDER.map((testId) => ({ testId }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { testId } = await params;
  return { title: testTitle(testId) };
}

export default async function TestPage({ params }: Props) {
  const { testId } = await params;
  return <TestSession testId={testId} />;
}
