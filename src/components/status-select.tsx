"use client";

import { ChevronDown } from "lucide-react";
import { useOptimistic, useTransition } from "react";
import { setStatusAction } from "@/app/actions/progress";
import { StatusDot } from "@/components/progress/status-dot";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { STATUS_HINT, STATUS_LABEL, STATUSES, type Status } from "@/lib/progress/status";

/** Status picker with an optimistic update; the server re-renders stats once the write lands. */
export function StatusSelect({ slotId, status, problemTitle }: { slotId: string; status: Status; problemTitle: string }) {
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(status);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  function change(next: Status) {
    startTransition(async () => {
      setOptimisticStatus(next);
      const result = await setStatusAction(slotId, next);
      if (!result.ok) toast(result.error, "danger");
    });
  }

  return (
    <div className={cn("relative inline-flex w-[9.5rem] items-center", isPending && "opacity-70")}>
      <StatusDot status={optimisticStatus} className="pointer-events-none absolute left-2.5" />
      <select
        aria-label={`Status for ${problemTitle}`}
        title={STATUS_HINT[optimisticStatus]}
        value={optimisticStatus}
        onChange={(event) => change(event.target.value as Status)}
        className="h-8 w-full cursor-pointer appearance-none rounded-full border border-rule bg-card pr-7 pl-7 text-xs text-ink hover:border-ink-3"
      >
        {STATUSES.map((value) => (
          <option key={value} value={value}>
            {STATUS_LABEL[value]}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute right-2 size-3.5 text-ink-3" />
    </div>
  );
}
