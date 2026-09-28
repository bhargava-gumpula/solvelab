import type { Metadata } from "next";
import { Library } from "@/components/hub/library";
import { PageHeading } from "@/components/layout/page-heading";

export const metadata: Metadata = { title: "Library" };

export default function LibraryPage() {
  return (
    <>
      <PageHeading
        eyebrow="Learning Hub"
        title="Library"
        description="Every course, unit, lesson, test and algorithm set. Your path suggests an order; you can open anything."
      />
      <Library />
    </>
  );
}
