"use client";

import { Monitor } from "lucide-react";
import { useTransition } from "react";
import { revokeOtherSessionsAction, revokeSessionAction } from "@/app/actions/account";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export type SessionRow = {
  id: string;
  device: string;
  ipAddress: string | null;
  lastActive: string;
  signedIn: string;
  current: boolean;
};

export function SessionList({ sessions }: { sessions: SessionRow[] }) {
  const [isPending, startTransition] = useTransition();
  const toast = useToast();
  const others = sessions.filter((session) => !session.current).length;

  function run(action: () => ReturnType<typeof revokeOtherSessionsAction>, success: string) {
    startTransition(async () => {
      const result = await action();
      toast(result.ok ? success : result.error, result.ok ? "neutral" : "danger");
    });
  }

  return (
    <div>
      <ul className="divide-y divide-rule-soft">
        {sessions.map((session) => (
          <li key={session.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 first:pt-0">
            <Monitor aria-hidden className="size-4 shrink-0 text-ink-3" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                {session.device}
                {session.current && (
                  <span className="ml-2 rounded-[2px] bg-accent-soft px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-accent uppercase">
                    This device
                  </span>
                )}
              </p>
              <p className="text-xs text-ink-3">
                {session.ipAddress ? `${session.ipAddress} · ` : ""}Active {session.lastActive} · Signed in {session.signedIn}
              </p>
            </div>
            {!session.current && (
              <Button
                variant="secondary"
                size="sm"
                disabled={isPending}
                onClick={() => run(() => revokeSessionAction(session.id), "Session signed out")}
              >
                Sign out
              </Button>
            )}
          </li>
        ))}
      </ul>
      {others > 0 && (
        <Button
          variant="secondary"
          className="mt-4"
          disabled={isPending}
          onClick={() => run(revokeOtherSessionsAction, "Signed out of all other sessions")}
        >
          Sign out of {others} other {others === 1 ? "session" : "sessions"}
        </Button>
      )}
    </div>
  );
}
