"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useTransition, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { serializeQuery } from "@/lib/query-string";

type Changes = Record<string, string | null>;

type UrlState = {
  isPending: boolean;
  /** Merges changes into the current query string. Any change other than `page` resets paging. */
  navigate: (changes: Changes) => void;
};

const UrlStateContext = createContext<UrlState | null>(null);

/** The URL is the single source of truth for filters, sorting and paging, so every view is linkable. */
export function UrlStateProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const committed = serializeQuery(searchParams);

  // useSearchParams only updates once a navigation has landed. Two quick changes (Easy, then Hard)
  // would otherwise both build on the old URL and the first would be lost, so later changes build on
  // the most recent requested query until the URL catches up.
  const requested = useRef<string | null>(null);
  useEffect(() => {
    if (requested.current === committed) requested.current = null;
  }, [committed]);

  const navigate = useCallback(
    (changes: Changes) => {
      const next = new URLSearchParams(requested.current ?? committed);
      for (const [key, value] of Object.entries(changes)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
      }
      if (!("page" in changes)) next.delete("page");

      const query = serializeQuery(next);
      requested.current = query;
      startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }));
    },
    [router, pathname, committed],
  );

  const value = useMemo(() => ({ isPending, navigate }), [isPending, navigate]);
  return <UrlStateContext value={value}>{children}</UrlStateContext>;
}

export function useUrlState(): UrlState {
  const context = useContext(UrlStateContext);
  if (!context) throw new Error("useUrlState must be used inside <UrlStateProvider>");
  return context;
}

/** Keeps the previous results on screen, dimmed, while the next ones load. */
export function PendingRegion({ children }: { children: ReactNode }) {
  const { isPending } = useUrlState();
  return (
    <div aria-busy={isPending} className={cn("transition-opacity duration-150", isPending && "opacity-60")}>
      {children}
    </div>
  );
}
