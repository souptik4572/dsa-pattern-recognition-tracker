import { cn } from "@/lib/cn";
import { percent, type ProgressCounts } from "@/lib/progress/stats";
import { STATUS_LABEL, type Status } from "@/lib/progress/status";

/** Solved first, so the filled part of every bar grows from the same left edge. */
export const BAR_ORDER: Status[] = ["SOLVED_CLEAN", "SOLVED_SLOW", "NEEDED_HELP", "NOT_STARTED"];

const fill: Record<Status, string> = {
  SOLVED_CLEAN: "bg-status-clean",
  SOLVED_SLOW: "bg-status-slow",
  NEEDED_HELP: "bg-status-help",
  NOT_STARTED: "bg-status-none",
};

const heights = { sm: "h-1.5", md: "h-2", lg: "h-3" } as const;

/** Part-to-whole bar of the four statuses. Segments are separated by a 2px surface gap. */
export function StatusBar({
  counts,
  size = "md",
  className,
}: {
  counts: ProgressCounts;
  size?: keyof typeof heights;
  className?: string;
}) {
  const breakdown = BAR_ORDER.map((status) => `${STATUS_LABEL[status]} ${counts.byStatus[status]}`).join(", ");

  return (
    <div
      role="img"
      aria-label={`${counts.solved} of ${counts.total} solved. ${breakdown}.`}
      className={cn("flex w-full gap-[2px]", heights[size], className)}
    >
      {counts.total === 0 ? (
        <div className="h-full w-full rounded-[4px] bg-status-none" />
      ) : (
        BAR_ORDER.filter((status) => counts.byStatus[status] > 0).map((status) => (
          <div
            key={status}
            title={`${STATUS_LABEL[status]}: ${counts.byStatus[status]} (${percent(counts.byStatus[status], counts.total)}%)`}
            className={cn("h-full min-w-[3px] first:rounded-l-[4px] last:rounded-r-[4px]", fill[status])}
            style={{ flexGrow: counts.byStatus[status], flexBasis: 0 }}
          />
        ))
      )}
    </div>
  );
}

export function StatusLegend({ counts, className }: { counts: ProgressCounts; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-x-5 gap-y-2 text-sm", className)}>
      {BAR_ORDER.map((status) => (
        <li key={status} className="flex items-center gap-2">
          <span aria-hidden className={cn("size-2.5 rounded-[2px]", fill[status])} />
          <span className="text-ink-2">{STATUS_LABEL[status]}</span>
          <span className="font-semibold tabular-nums">{counts.byStatus[status]}</span>
        </li>
      ))}
    </ul>
  );
}
