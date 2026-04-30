import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground shadow-sm">
          <span className="size-1.5 rounded-full bg-primary" />
          v1 in build
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
          Beam
        </h1>
        <p className="text-lg text-muted-foreground sm:text-xl">
          Faster feedback on websites, images, and PDFs.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/signup">Get started</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">Log in</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
