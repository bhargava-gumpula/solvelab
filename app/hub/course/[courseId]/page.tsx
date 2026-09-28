import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseView } from "@/components/hub/hub-home";
import { COURSES, getCourse } from "@/data/hub/courses";

type Props = { params: Promise<{ courseId: string }> };

export function generateStaticParams() {
  return COURSES.map((course) => ({ courseId: course.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { courseId } = await params;
  return { title: getCourse(courseId)?.title ?? "Course" };
}

export default async function CoursePage({ params }: Props) {
  const { courseId } = await params;
  if (!getCourse(courseId)) notFound();
  return <CourseView courseId={courseId} />;
}
