import type { Metadata } from "next";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { DeleteAccount } from "@/components/settings/delete-account";
import { ProfileForm } from "@/components/settings/profile-form";
import { ProgressData } from "@/components/settings/progress-data";
import { SessionList } from "@/components/settings/session-list";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { formatDate, formatRelativeTime } from "@/lib/format";
import { describeUserAgent } from "@/lib/user-agent";
import { getAccountOverview } from "@/server/account";
import { getCurrentSessionId, requireUser } from "@/server/auth";

export const metadata: Metadata = { title: "Settings" };

const PROVIDER_LABEL: Record<string, string> = { github: "GitHub", google: "Google" };

export default async function SettingsPage() {
  const user = await requireUser();
  const overview = await getAccountOverview(user.id, await getCurrentSessionId());

  const sessions = overview.sessions.map((session) => ({
    id: session.id,
    device: describeUserAgent(session.userAgent),
    ipAddress: session.ipAddress,
    lastActive: formatRelativeTime(session.updatedAt),
    signedIn: formatDate(session.createdAt),
    current: session.current,
  }));

  return (
    <>
      <PageHeader eyebrow="Settings" title="Account settings" description="Profile, security and your progress data." />

      <div className="space-y-4">
        <Panel title="Profile">
          <ProfileForm name={user.name} email={user.email} />
        </Panel>

        <Panel title="Password">
          {overview.hasPassword ? (
            <ChangePasswordForm />
          ) : (
            <p className="text-sm text-ink-2">
              You sign in with{" "}
              {overview.socialProviders.map((provider) => PROVIDER_LABEL[provider] ?? provider).join(" and ") || "a social provider"}
              , so this account has no password.
            </p>
          )}
        </Panel>

        <Panel title="Sessions" description="Devices currently signed in to your account.">
          <SessionList sessions={sessions} />
        </Panel>

        <Panel title="Progress data">
          <ProgressData />
        </Panel>

        <Panel title="Delete account" className="border-danger/40">
          <DeleteAccount requiresPassword={overview.hasPassword} />
        </Panel>
      </div>
    </>
  );
}
