"use client";
import { Button } from "@/components/ui/button";
export default function PageError({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <section className="panel settings-section" role="alert"><h1>This page couldn’t load.</h1><p className="page-description">Your local records have not been reset. Try loading the page again.</p><Button variant="outline" onClick={reset}>Try again</Button></section>; }
