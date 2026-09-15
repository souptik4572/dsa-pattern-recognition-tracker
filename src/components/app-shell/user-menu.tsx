"use client";

import { LogOut, Settings, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";

export function UserMenu({ name, email, isAdmin }: { name: string; email: string; isAdmin: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function signOut() {
    setSigningOut(true);
    await authClient.signOut();
    router.replace("/sign-in");
    router.refresh();
  }

  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div ref={container} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label="Account menu"
        onClick={() => setOpen((value) => !value)}
        className="flex size-8 items-center justify-center rounded-full border border-rule bg-card font-mono text-[11px] font-semibold text-ink hover:border-ink"
      >
        {initials || "?"}
      </button>
      {open && (
        <div
          id={menuId}
          className="absolute right-0 z-40 mt-2 w-64 overflow-hidden rounded border border-rule bg-card shadow-lg"
        >
          <div className="border-b border-rule px-4 py-3">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="truncate text-xs text-ink-3">{email}</p>
          </div>
          <div className="p-1">
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-[3px] px-3 py-2 text-sm text-ink-2 hover:bg-paper hover:text-ink"
            >
              <Settings aria-hidden className="size-4" /> Settings
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-[3px] px-3 py-2 text-sm text-ink-2 hover:bg-paper hover:text-ink"
              >
                <ShieldCheck aria-hidden className="size-4" /> Admin
              </Link>
            )}
            <button
              type="button"
              onClick={signOut}
              disabled={signingOut}
              className="flex w-full items-center gap-2 rounded-[3px] px-3 py-2 text-left text-sm text-ink-2 hover:bg-paper hover:text-ink disabled:opacity-60"
            >
              <LogOut aria-hidden className="size-4" /> {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
