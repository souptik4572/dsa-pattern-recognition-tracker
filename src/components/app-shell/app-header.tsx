import Link from "next/link";
import type { CurrentUser } from "@/server/auth";
import { Logo } from "./logo";
import { NavLinks } from "./nav-links";
import { UserMenu } from "./user-menu";

export function AppHeader({ user }: { user: CurrentUser }) {
  const links = [
    { href: "/sheet", label: "Sheet" },
    ...(user.role === "admin" ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/sheet" className="shrink-0">
          <Logo />
        </Link>
        <div className="order-3 w-full sm:order-2 sm:w-auto sm:flex-1">
          <NavLinks links={links} />
        </div>
        <div className="order-2 ml-auto sm:order-3">
          <UserMenu name={user.name} email={user.email} isAdmin={user.role === "admin"} />
        </div>
      </div>
    </header>
  );
}
