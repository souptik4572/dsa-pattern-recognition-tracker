import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { paginationWindow } from "@/lib/sheet/search-params";

const cell = "flex h-8 min-w-8 items-center justify-center rounded-[3px] border px-2 font-mono text-xs tabular-nums";

function PageLink({
  href,
  disabled,
  current,
  label,
  children,
}: {
  href: string;
  disabled?: boolean;
  current?: boolean;
  label?: string;
  children: ReactNode;
}) {
  if (disabled) {
    return (
      <span aria-disabled className={cn(cell, "border-rule text-ink-3 opacity-50")} aria-label={label}>
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={current ? "page" : undefined}
      className={cn(cell, current ? "border-ink bg-ink text-card" : "border-rule bg-card text-ink hover:border-ink")}
    >
      {children}
    </Link>
  );
}

export function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  hrefForPage,
  pageSizeControl,
  noun = "results",
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  hrefForPage: (page: number) => string;
  pageSizeControl?: ReactNode;
  noun?: string;
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <nav aria-label="Pagination" className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-ink-2">
        Showing{" "}
        <b className="text-ink tabular-nums">
          {from}–{to}
        </b>{" "}
        of <b className="text-ink tabular-nums">{total}</b> {noun}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        {pageSizeControl}
        <ul className="flex items-center gap-1">
          <li>
            <PageLink href={hrefForPage(page - 1)} disabled={page <= 1} label="Previous page">
              <ChevronLeft aria-hidden className="size-4" />
            </PageLink>
          </li>
          {paginationWindow(page, pageCount, 1).map((item, index) =>
            item === "gap" ? (
              <li key={`gap-${index}`} aria-hidden className="px-1 text-ink-3">
                …
              </li>
            ) : (
              <li key={item}>
                <PageLink href={hrefForPage(item)} current={item === page} label={`Page ${item}`}>
                  {item}
                </PageLink>
              </li>
            ),
          )}
          <li>
            <PageLink href={hrefForPage(page + 1)} disabled={page >= pageCount} label="Next page">
              <ChevronRight aria-hidden className="size-4" />
            </PageLink>
          </li>
        </ul>
      </div>
    </nav>
  );
}
