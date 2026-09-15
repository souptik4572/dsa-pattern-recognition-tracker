"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/field";
import { useUrlState } from "@/components/url-state";
import { cn } from "@/lib/cn";

/**
 * Debounced search box bound to the `q` query param. Local state keeps typing responsive;
 * it re-syncs when the URL changes elsewhere (clear filters, back button) but never mid-typing.
 */
export function SearchInput({
  value,
  label,
  placeholder,
  className,
  inputClassName,
}: {
  value: string;
  label: string;
  placeholder: string;
  className?: string;
  inputClassName?: string;
}) {
  const { navigate } = useUrlState();
  const [query, setQuery] = useState(value);
  const [syncedValue, setSyncedValue] = useState(value);
  const [typing, setTyping] = useState(false);

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

  return (
    <div className={cn("relative", className)}>
      <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" />
      <Input
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setTyping(true)}
        onBlur={() => setTyping(false)}
        className={cn("pl-9", inputClassName)}
      />
    </div>
  );
}
