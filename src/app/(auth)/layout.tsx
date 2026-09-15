import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/app-shell/logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8">
        <Logo />
      </Link>
      <main className="w-full max-w-sm rounded border border-rule bg-card p-6 shadow-sm sm:p-8">{children}</main>
    </div>
  );
}
