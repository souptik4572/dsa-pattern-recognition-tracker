"use client";

import { ChevronDown } from "lucide-react";
import { Fragment, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type MultiSelectOption<T extends string> = {
  value: T;
  label: string;
  /** Optional visual before the label, e.g. a status dot. */
  marker?: ReactNode;
  /** Consecutive options with the same group are listed under one heading. */
  group?: string;
};

/**
 * A dropdown of checkboxes. Each change applies straight away: the checkboxes update at once and
 * the results follow. Closes on Escape, on a click outside, or when focus leaves it.
 */
export function MultiSelect<T extends string>({
  label,
  anyLabel,
  options,
  value,
  onChange,
}: {
  /** What is being filtered, e.g. "Difficulty". Used for the accessible name. */
  label: string;
  /** Shown when nothing is selected, e.g. "Any difficulty". */
  anyLabel: string;
  options: readonly MultiSelectOption<T>[];
  value: readonly T[];
  onChange: (next: T[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<readonly T[]>(value);
  const [syncedKey, setSyncedKey] = useState(value.join(","));
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  // Follow outside changes such as "Clear filters", but never overwrite choices while the list is open.
  const valueKey = value.join(",");
  if (valueKey !== syncedKey) {
    setSyncedKey(valueKey);
    if (!open) setDraft(value);
  }

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function apply(next: T[]) {
    setDraft(next);
    onChange(next);
  }

  function toggle(option: T) {
    // Rebuild from the option list so values keep a stable order.
    apply(options.map((item) => item.value).filter((item) => (item === option ? !draft.includes(item) : draft.includes(item))));
  }

  const selected = options.filter((option) => draft.includes(option.value));
  const summary =
    selected.length === 0
      ? anyLabel
      : selected.length <= 2
        ? selected.map((option) => option.label).join(", ")
        : `${selected.length} selected`;

  return (
    <div
      ref={container}
      className="relative"
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.stopPropagation();
          setOpen(false);
          trigger.current?.focus();
        }
      }}
      onBlur={(event) => {
        if (open && !container.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`${label}: ${summary}`}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex h-9 w-full items-center gap-2 rounded-[3px] border bg-card px-3 text-left text-sm text-ink hover:border-ink-3",
          selected.length > 0 ? "border-accent" : "border-rule",
        )}
      >
        <span className="min-w-0 flex-1 truncate">{summary}</span>
        {selected.length > 0 && (
          <span aria-hidden className="rounded-[2px] bg-accent-soft px-1.5 font-mono text-[10px] text-accent tabular-nums">
            {selected.length}
          </span>
        )}
        <ChevronDown aria-hidden className={cn("size-3.5 shrink-0 text-ink-3 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        // tabIndex -1: clicking the panel's padding keeps focus inside, so it doesn't close itself.
        <div
          id={panelId}
          role="group"
          aria-label={label}
          tabIndex={-1}
          className="absolute left-0 z-30 mt-1 w-full min-w-40 rounded border border-rule bg-card p-1 shadow-lg outline-none"
        >
          {options.map((option, index) => (
            <Fragment key={option.value}>
              {option.group && option.group !== options[index - 1]?.group && (
                <p className="px-2 pt-2 pb-1 font-mono text-[10px] tracking-[0.12em] text-ink-3 uppercase">{option.group}</p>
              )}
              <label className="flex cursor-pointer items-center gap-2 rounded-[3px] px-2 py-1.5 text-sm hover:bg-card-hover">
                <input
                  type="checkbox"
                  checked={draft.includes(option.value)}
                  onChange={() => toggle(option.value)}
                  className="size-4 shrink-0 accent-accent"
                />
                {option.marker}
                <span>{option.label}</span>
              </label>
            </Fragment>
          ))}
          {draft.length > 0 && (
            <div className="mt-1 border-t border-rule pt-1">
              <button
                type="button"
                onClick={() => apply([])}
                className="w-full rounded-[3px] px-2 py-1.5 text-left font-mono text-xs text-ink-2 hover:bg-card-hover hover:text-ink"
              >
                Clear {label.toLowerCase()}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
