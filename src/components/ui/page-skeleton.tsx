import { cn } from "@/lib/cn";

function Bar({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-[3px] bg-rule-soft", className)} />;
}

/**
 * Route-level loading state. With a loading.tsx in place, Next.js can show this the moment a tab
 * is clicked while the page renders on the server.
 */
export function PageSkeleton({ variant }: { variant: "dashboard" | "table" | "sections" }) {
  return (
    <div role="status" aria-label="Loading">
      <div className="mb-8 border-b-2 border-rule pb-5">
        <Bar className="h-3 w-24" />
        <Bar className="mt-3 h-8 w-72 max-w-full" />
        <Bar className="mt-3 h-4 w-96 max-w-full" />
      </div>

      {variant === "dashboard" && (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Bar className="h-48 lg:col-span-2" />
            <Bar className="h-48" />
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Bar key={i} className="h-28" />
            ))}
          </div>
          <Bar className="h-64" />
        </div>
      )}

      {variant === "table" && (
        <div className="space-y-4">
          <Bar className="h-28" />
          <div className="space-y-2 rounded border border-rule bg-card p-4">
            {Array.from({ length: 10 }, (_, i) => (
              <Bar key={i} className="h-8" />
            ))}
          </div>
        </div>
      )}

      {variant === "sections" && (
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, i) => (
            <Bar key={i} className="h-44" />
          ))}
        </div>
      )}

      <span className="sr-only">Loading…</span>
    </div>
  );
}
