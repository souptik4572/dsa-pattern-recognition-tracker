import type { Metadata } from "next";
import { z } from "zod";
import { BanControls, RoleSelect } from "@/components/admin/user-controls";
import { Pagination } from "@/components/pagination";
import { StatTile } from "@/components/progress/stat-tile";
import { SearchInput } from "@/components/search-input";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PendingRegion, UrlStateProvider } from "@/components/url-state";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { firstParam, type RawSearchParams } from "@/lib/search-param";
import { ADMIN_PAGE_SIZE, getPlatformStats, listUsers } from "@/server/admin";
import { requireAdmin } from "@/server/auth";

export const metadata: Metadata = { title: "Admin" };

const querySchema = z.object({
  q: z.string().trim().max(100).catch(""),
  page: z.coerce.number().int().min(1).max(100_000).catch(1),
});

export default async function AdminPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const admin = await requireAdmin();
  const raw = await searchParams;
  const { q, page } = querySchema.parse({ q: firstParam(raw.q), page: firstParam(raw.page) });
  const [platform, users] = await Promise.all([getPlatformStats(), listUsers({ q, page })]);

  const hrefForPage = (target: number) => {
    const search = new URLSearchParams();
    if (q) search.set("q", q);
    if (target > 1) search.set("page", String(target));
    const query = search.toString();
    return query ? `/admin?${query}` : "/admin";
  };

  return (
    <UrlStateProvider>
      <PageHeader
        eyebrow="Admin"
        title="Users & access"
        description="Change roles and ban accounts. Changes apply on the user's next request; bans also end their sessions."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatTile label="Users" value={platform.users} />
        <StatTile label="Admins" value={platform.admins} />
        <StatTile label="Banned" value={platform.banned} />
        <StatTile label="Active in 7 days" value={platform.activeThisWeek} detail="Updated a status" />
        <StatTile label="Statuses tracked" value={platform.progressRows} />
      </div>

      <div className="mt-6 rounded border border-rule bg-card p-3 sm:p-4">
        <SearchInput value={q} label="Search users by name or email" placeholder="Search by name or email" />
      </div>

      <PendingRegion>
        {users.rows.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No users match that search" />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded border border-rule bg-card">
            <table className="w-full min-w-[820px] text-sm">
              <caption className="sr-only">Users</caption>
              <thead>
                <tr className="border-b border-rule text-left font-mono text-[11px] tracking-[0.1em] text-ink-3 uppercase">
                  <th scope="col" className="py-2.5 pr-2 pl-4 font-semibold">
                    User
                  </th>
                  <th scope="col" className="px-2 py-2.5 font-semibold">
                    Role
                  </th>
                  <th scope="col" className="px-2 py-2.5 text-right font-semibold">
                    Solved
                  </th>
                  <th scope="col" className="px-2 py-2.5 text-right font-semibold">
                    Tracked
                  </th>
                  <th scope="col" className="px-2 py-2.5 font-semibold">
                    Joined
                  </th>
                  <th scope="col" className="px-2 py-2.5 font-semibold">
                    Access
                  </th>
                  <th scope="col" className="py-2.5 pr-4 pl-2 font-semibold">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.rows.map((row) => {
                  const isSelf = row.id === admin.id;
                  return (
                    <tr key={row.id} className="border-b border-rule-soft last:border-b-0">
                      <td className="max-w-[16rem] py-2.5 pr-2 pl-4">
                        <p className="truncate font-medium">{row.name}</p>
                        <p className="truncate text-xs text-ink-3">{row.email}</p>
                      </td>
                      <td className="px-2 py-2.5">
                        <RoleSelect userId={row.id} userLabel={row.name} role={row.role} disabled={isSelf} />
                      </td>
                      <td className="px-2 py-2.5 text-right tabular-nums">{row.solved}</td>
                      <td className="px-2 py-2.5 text-right tabular-nums">{row.tracked}</td>
                      <td className="px-2 py-2.5 whitespace-nowrap text-ink-2">{formatDate(row.createdAt)}</td>
                      <td className="px-2 py-2.5">
                        <span
                          className={cn(
                            "rounded-[2px] px-1.5 py-0.5 font-mono text-[10px] tracking-wider uppercase",
                            row.banned ? "bg-danger-soft text-danger" : "bg-accent-soft text-accent",
                          )}
                          title={row.banReason ?? undefined}
                        >
                          {row.banned ? "Banned" : "Active"}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 pl-2 text-right">
                        <BanControls userId={row.id} userLabel={row.name} banned={row.banned} disabled={isSelf} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {users.total > 0 && (
          <Pagination
            page={users.page}
            pageCount={users.pageCount}
            total={users.total}
            pageSize={ADMIN_PAGE_SIZE}
            noun="users"
            hrefForPage={hrefForPage}
          />
        )}
      </PendingRegion>
    </UrlStateProvider>
  );
}
