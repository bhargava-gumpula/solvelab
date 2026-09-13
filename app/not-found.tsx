import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/layout/page-heading";

export default function NotFound() {
  return (
    <>
      <PageHeading
        eyebrow="Page not found"
        title="Let’s get back to your practice."
        description="This page doesn’t exist. Your local data is still here."
      />
      <Button asChild variant="outline">
        <Link href="/timer">Go to timer</Link>
      </Button>
    </>
  );
}
