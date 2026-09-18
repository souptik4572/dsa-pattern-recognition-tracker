"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ProblemTable } from "@/components/problems/problem-table";
import { StatusBar, StatusLegend } from "@/components/progress/status-bar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { patternAnchor } from "@/lib/sheet/ids";
import { parseSheetParams, sheetHref } from "@/lib/sheet/search-params";
import type { PatternPanelData } from "@/server/sheet";

type OpenState = {
  isOpen: (patternId: string) => boolean;
  toggle: (patternId: string) => void;
  setAll: (open: boolean) => void;
  openCount: number;
  total: number;
};

const OpenStateContext = createContext<OpenState | null>(null);

function useOpenState(): OpenState {
  const context = useContext(OpenStateContext);
  if (!context) throw new Error("Pattern panels must be rendered inside <PatternOpenProvider>");
  return context;
}

/**
 * Which pattern panels are expanded. This is client state, so opening a pattern needs no server
 * round trip, and it survives filter changes and status updates. It resets when the search text
 * changes, because a new search deserves a fresh view.
 */
export function PatternOpenProvider({
  patternIds,
  initiallyOpen,
  resetKey,
  children,
}: {
  /** Patterns currently listed, in page order. */
  patternIds: string[];
  initiallyOpen: string[];
  resetKey: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(() => new Set(initiallyOpen));
  const [lastResetKey, setLastResetKey] = useState(resetKey);
  if (resetKey !== lastResetKey) {
    setLastResetKey(resetKey);
    setOpen(new Set(initiallyOpen));
  }

  useEffect(() => {
    // Links point at #pattern-x-y; bring that panel into view once it has rendered.
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id) document.getElementById(id)?.scrollIntoView({ block: "start" });
  }, []);

  const value = useMemo<OpenState>(
    () => ({
      isOpen: (patternId) => open.has(patternId),
      toggle: (patternId) =>
        setOpen((current) => {
          const next = new Set(current);
          if (next.has(patternId)) next.delete(patternId);
          else next.add(patternId);
          return next;
        }),
      setAll: (expand) => setOpen(expand ? new Set(patternIds) : new Set()),
      openCount: patternIds.filter((patternId) => open.has(patternId)).length,
      total: patternIds.length,
    }),
    [open, patternIds],
  );

  return <OpenStateContext value={value}>{children}</OpenStateContext>;
}

export function ExpandCollapseControls() {
  const { setAll, openCount, total } = useOpenState();
  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" size="sm" disabled={total === 0 || openCount === total} onClick={() => setAll(true)}>
        Expand all
      </Button>
      <Button variant="ghost" size="sm" disabled={openCount === 0} onClick={() => setAll(false)}>
        Collapse all
      </Button>
    </div>
  );
}

const label = "font-mono text-[11px] font-semibold tracking-[0.12em] text-ink-3 uppercase";

export function PatternPanel({ pattern, filtered }: { pattern: PatternPanelData; filtered: boolean }) {
  const { isOpen, toggle } = useOpenState();
  const open = isOpen(pattern.id);
  const anchor = patternAnchor(pattern.id);
  const panelId = `${anchor}-panel`;
  const toggleId = `${anchor}-toggle`;
  const { counts } = pattern;

  return (
    // scroll-mt keeps a linked panel clear of the sticky header.
    <article id={anchor} className="scroll-mt-32 rounded border border-rule bg-card">
      <h3>
        <button
          id={toggleId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => toggle(pattern.id)}
          className="flex w-full items-center gap-3 rounded px-3 py-3 text-left transition-colors hover:bg-card-hover sm:px-4"
        >
          <ChevronRight aria-hidden className={cn("size-4 shrink-0 text-ink-3 transition-transform", open && "rotate-90")} />
          <span className="w-10 shrink-0 font-mono text-xs font-bold text-accent">{pattern.id}</span>
          <span className="min-w-0 flex-1">
            <span className="block font-medium">{pattern.name}</span>
            {!open && (
              <span aria-hidden className="block truncate text-xs text-ink-3">
                {pattern.trigger}
              </span>
            )}
          </span>
          {filtered && (
            <span className="hidden shrink-0 rounded-[2px] bg-accent-soft px-1.5 py-0.5 font-mono text-[10px] text-accent sm:inline">
              {pattern.rows.length} matching
            </span>
          )}
          <span aria-hidden className="hidden w-24 shrink-0 md:block">
            <StatusBar counts={counts} size="sm" />
          </span>
          <span className="w-14 shrink-0 text-right font-mono text-xs text-ink-2 tabular-nums">
            {counts.solved}/{counts.total}
            <span className="sr-only"> solved</span>
          </span>
        </button>
      </h3>

      {open && (
        <div id={panelId} role="region" aria-labelledby={toggleId} className="border-t border-rule p-3 sm:p-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <p className={label}>Recognise it when</p>
              <p className="mt-1.5 border-l-[3px] border-accent pl-3 text-sm">{pattern.trigger}</p>
              <p className={cn(label, "mt-4")}>Template</p>
              <p className="mt-1.5 text-sm text-ink-2">{pattern.template}</p>
              <p className="mt-4 inline-block rounded-[3px] bg-accent-soft px-2.5 py-1 font-mono text-xs text-accent">
                {pattern.complexity}
              </p>
            </div>
            <div>
              <p className={label}>Your progress</p>
              <StatusBar counts={counts} className="mt-2.5" />
              <StatusLegend counts={counts} className="mt-3" />
              <Link
                href={`${sheetHref(parseSheetParams({}), { view: "list", pattern: pattern.id })}#problems`}
                className="mt-3 inline-block font-mono text-xs text-accent hover:underline"
              >
                Show as a list →
              </Link>
            </div>
          </div>

          <div className="mt-4">
            <ProblemTable rows={pattern.rows} showPattern={false} caption={`Problems for ${pattern.id} ${pattern.name}`} />
          </div>
          {filtered && pattern.rows.length < counts.total && (
            <p className="mt-2 text-xs text-ink-3">
              Showing {pattern.rows.length} of {counts.total} problems in this pattern that match your filters.
            </p>
          )}
        </div>
      )}
    </article>
  );
}
