"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

/** Confirms a click right away on routes that can't show a loading state instantly (e.g. /admin). */
function PendingDot() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      className={cn(
        "ml-1.5 inline-block size-1.5 rounded-full bg-current transition-opacity",
        pending ? "animate-pulse opacity-70 delay-100" : "opacity-0",
      )}
    />
  );
}

export function NavLinks({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="-mx-1 flex min-w-0 items-center gap-1 overflow-x-auto">
      {links.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center rounded-[3px] px-2.5 py-1.5 font-mono text-xs whitespace-nowrap transition-colors",
              active ? "bg-ink text-card" : "text-ink-2 hover:bg-card hover:text-ink",
            )}
          >
            {label}
            <PendingDot />
          </Link>
        );
      })}
    </nav>
  );
}
