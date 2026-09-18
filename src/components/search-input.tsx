"use client";

import { Search } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Input } from "@/components/ui/field";
import { useUrlState } from "@/components/url-state";
import { cn } from "@/lib/cn";

const subscribeToNothing = () => () => {};

/**
 * Debounced search box bound to the `q` query param. Local state keeps typing responsive;
 * it re-syncs when the URL changes elsewhere (clear filters, back button) but never mid-typing.
 * With `shortcut`, ⌘K / Ctrl+K focuses it from anywhere on the page.
 */
export function SearchInput({
  value,
  label,
  placeholder,
  shortcut = false,
  className,
  inputClassName,
}: {
  value: string;
  label: string;
  placeholder: string;
  shortcut?: boolean;
  className?: string;
  inputClassName?: string;
}) {
  const { navigate } = useUrlState();
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(value);
  const [syncedValue, setSyncedValue] = useState(value);
  const [typing, setTyping] = useState(false);
  // The server can't know the platform; it renders "Ctrl K" and the client corrects it after hydration.
  const isApple = useSyncExternalStore(
    subscribeToNothing,
    () => /Mac|iPhone|iPad|iPod/.test(navigator.userAgent),
    () => false,
  );

  if (value !== syncedValue) {
    setSyncedValue(value);
    if (!typing) setQuery(value);
  }

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed === value) return;
    const timer = setTimeout(() => navigate({ q: trimmed || null }), 300);
    return () => clearTimeout(timer);
  }, [query, value, navigate]);

  useEffect(() => {
    if (!shortcut) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        input.current?.focus();
        input.current?.select();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shortcut]);

  return (
    <div className={cn("relative", className)}>
      <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" />
      <Input
        ref={input}
        type="search"
        aria-label={label}
        aria-keyshortcuts={shortcut ? "Meta+K Control+K" : undefined}
        placeholder={placeholder}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setTyping(true)}
        onBlur={() => setTyping(false)}
        className={cn("pl-9", shortcut && "pr-16", inputClassName)}
      />
      {shortcut && !query && (
        <kbd
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded border border-rule px-1.5 py-0.5 font-mono text-[10px] text-ink-3"
        >
          {isApple ? "⌘K" : "Ctrl K"}
        </kbd>
      )}
    </div>
  );
}
