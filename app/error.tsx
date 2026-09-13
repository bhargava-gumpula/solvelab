"use client";

import { Button } from "@/components/ui/button";

export default function PageError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section role="alert" className="rounded-2xl p-6 glass">
      <h1 className="text-xl font-semibold">This page couldn’t load.</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your local records have not been reset. Try loading the page again.
      </p>
      <Button variant="outline" className="mt-4" onClick={reset}>
        Try again
      </Button>
    </section>
  );
}
