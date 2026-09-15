import { cn } from "@/lib/cn";
import type { Status } from "@/lib/progress/status";

const dotClass: Record<Status, string> = {
  NOT_STARTED: "border-status-none bg-transparent",
  NEEDED_HELP: "border-status-help bg-status-help",
  SOLVED_SLOW: "border-status-slow bg-status-slow",
  SOLVED_CLEAN: "border-status-clean bg-status-clean",
};

export function StatusDot({ status, className }: { status: Status; className?: string }) {
  return <span aria-hidden className={cn("inline-block size-3 shrink-0 rounded-full border-2", dotClass[status], className)} />;
}
