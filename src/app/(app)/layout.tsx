import type { ReactNode } from "react";
import { AppHeader } from "@/components/app-shell/app-header";
import { requireUser } from "@/server/auth";

// The layout only renders the shell. Layouts don't re-run on client navigation,
// so every page below still performs its own requireUser()/authorize() check.
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  return (
    <div className="min-h-dvh">
      <AppHeader user={user} />
      <main className="mx-auto w-full max-w-6xl px-4 pt-8 pb-24 sm:px-6">{children}</main>
    </div>
  );
}
