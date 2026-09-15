"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { MASTERY_LABEL, type MasteryLevel } from "@/lib/progress/stats";
import { patternHref } from "@/lib/sheet/ids";

export type MasteryCell = {
  id: string;
  slug: string;
  name: string;
  solved: number;
  pending: number;
  total: number;
  level: MasteryLevel;
};

export type MasteryRow = { id: string; name: string; patterns: MasteryCell[] };

const levelClass: Record<MasteryLevel, string> = {
  0: "bg-mastery-0",
  1: "bg-mastery-1",
  2: "bg-mastery-2",
  3: "bg-mastery-3",
  4: "bg-mastery-4",
};

const LEVELS: MasteryLevel[] = [0, 1, 2, 3, 4];

/**
 * One cell per pattern, one row per family, in sheet order. Hovering or focusing a cell
 * fills the readout line below instead of a floating tooltip, so nothing is clipped at the
 * viewport edge. Each cell's accessible name carries the same values.
 */
export function MasteryGrid({ rows }: { rows: MasteryRow[] }) {
  const [active, setActive] = useState<MasteryCell | null>(null);

  return (
    <div>
      <div className="space-y-1">
        {rows.map((family) => (
          <div key={family.id} className="flex items-center gap-3">
            <span className="w-6 shrink-0 font-mono text-[11px] text-ink-3 tabular-nums" title={family.name}>
              {family.id}
            </span>
            <div className="flex flex-wrap gap-1">
              {family.patterns.map((cell) => (
                <Link
                  key={cell.id}
                  href={patternHref(cell.id)}
                  aria-label={`${cell.id} ${cell.name}: ${cell.solved} of ${cell.total} solved, ${cell.pending} pending`}
                  onPointerEnter={() => setActive(cell)}
                  onPointerLeave={() => setActive(null)}
                  onFocus={() => setActive(cell)}
                  onBlur={() => setActive(null)}
                  className={cn(
                    "size-5 rounded-[3px] transition-transform hover:scale-110 focus-visible:scale-110",
                    levelClass[cell.level],
                  )}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <p aria-hidden className="mt-4 min-h-10 text-sm text-ink-2 sm:min-h-5">
        {active ? (
          <>
            <span className="font-mono font-semibold text-accent">{active.id}</span> {active.name} ·{" "}
            <b className="text-ink tabular-nums">{active.solved}</b>/{active.total} solved · {active.pending} pending
          </>
        ) : (
          "Hover or focus a cell to see its pattern. Select it to open the pattern's problems."
        )}
      </p>

      <ul aria-label="Scale" className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[11px] text-ink-3">
        {LEVELS.map((level) => (
          <li key={level} className="flex items-center gap-1.5">
            <span aria-hidden className={cn("size-2.5 rounded-[2px]", levelClass[level])} />
            {MASTERY_LABEL[level]}
          </li>
        ))}
      </ul>
    </div>
  );
}
