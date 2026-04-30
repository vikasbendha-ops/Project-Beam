/**
 * Rendered automatically by Next.js while the canvas page is fetching
 * (Suspense boundary). Shows the layout shell so users get instant
 * feedback when navigating between sibling MarkUps.
 */
export default function CanvasLoading() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-muted">
      {/* Top bar skeleton */}
      <header className="z-20 flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 shadow-sm md:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="size-9 animate-pulse rounded-md bg-muted" />
          <div className="size-9 animate-pulse rounded-md bg-muted" />
          <div className="hidden flex-col gap-1.5 sm:flex">
            <div className="h-3 w-40 animate-pulse rounded bg-muted" />
            <div className="h-2.5 w-24 animate-pulse rounded bg-muted/70" />
          </div>
        </div>
        <div className="hidden h-8 w-44 animate-pulse rounded-full bg-muted md:block" />
        <div className="flex items-center gap-2">
          <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
          <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar skeleton */}
        <aside className="hidden h-full w-[320px] shrink-0 flex-col border-r border-border bg-card p-3 md:flex">
          <div className="mb-3 flex gap-2">
            <div className="h-6 flex-1 animate-pulse rounded bg-muted" />
            <div className="h-6 flex-1 animate-pulse rounded bg-muted" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="mb-3 flex animate-pulse flex-col gap-2 rounded-card border border-border bg-card p-4 shadow-card"
            >
              <div className="flex items-center gap-2">
                <div className="size-6 rounded-full bg-muted" />
                <div className="size-7 rounded-full bg-muted" />
                <div className="h-3 w-20 rounded bg-muted" />
              </div>
              <div className="h-3 w-full rounded bg-muted/60" />
              <div className="h-3 w-3/4 rounded bg-muted/60" />
            </div>
          ))}
        </aside>

        {/* Canvas area skeleton */}
        <main className="relative flex flex-1 items-stretch justify-center overflow-hidden bg-muted">
          <div className="m-auto h-[80vh] w-[90%] max-w-5xl animate-pulse rounded-lg bg-gradient-to-br from-muted via-card to-muted/60 shadow-card" />
        </main>

        {/* Right rail skeleton */}
        <aside className="hidden h-full w-[160px] shrink-0 flex-col gap-2 border-l border-border bg-card p-2 md:flex">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/3] w-full animate-pulse rounded-lg bg-muted"
            />
          ))}
        </aside>
      </div>
    </div>
  );
}
