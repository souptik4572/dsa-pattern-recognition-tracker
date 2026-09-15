"use client";

import { useOptimistic, useState, useTransition } from "react";
import { banUserAction, setRoleAction, unbanUserAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

export function RoleSelect({
  userId,
  userLabel,
  role,
  disabled,
}: {
  userId: string;
  userLabel: string;
  role: "admin" | "user";
  disabled: boolean;
}) {
  const [optimisticRole, setOptimisticRole] = useOptimistic(role);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  return (
    <Select
      aria-label={`Role for ${userLabel}`}
      value={optimisticRole}
      disabled={disabled || isPending}
      title={disabled ? "You can't change your own role" : undefined}
      onChange={(event) => {
        const next = event.target.value as "admin" | "user";
        startTransition(async () => {
          setOptimisticRole(next);
          const result = await setRoleAction(userId, next);
          toast(result.ok ? `${userLabel} is now ${next === "admin" ? "an admin" : "a user"}` : result.error, result.ok ? "neutral" : "danger");
        });
      }}
      className="h-8 w-28 text-xs"
    >
      <option value="user">User</option>
      <option value="admin">Admin</option>
    </Select>
  );
}

export function BanControls({
  userId,
  userLabel,
  banned,
  disabled,
}: {
  userId: string;
  userLabel: string;
  banned: boolean;
  disabled: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  function run(action: () => ReturnType<typeof unbanUserAction>, success: string) {
    startTransition(async () => {
      const result = await action();
      toast(result.ok ? success : result.error, result.ok ? "neutral" : "danger");
      if (result.ok) {
        setConfirming(false);
        setReason("");
      }
    });
  }

  if (disabled) return <span className="text-xs text-ink-3">You</span>;

  if (banned) {
    return (
      <Button variant="secondary" size="sm" disabled={isPending} onClick={() => run(() => unbanUserAction(userId), `${userLabel} unbanned`)}>
        Unban
      </Button>
    );
  }

  if (!confirming) {
    return (
      <Button variant="secondary" size="sm" onClick={() => setConfirming(true)}>
        Ban
      </Button>
    );
  }

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        run(() => banUserAction(userId, reason), `${userLabel} banned and signed out`);
      }}
    >
      <Input
        aria-label={`Ban reason for ${userLabel}`}
        placeholder="Reason (optional)"
        value={reason}
        maxLength={200}
        onChange={(event) => setReason(event.target.value)}
        className="h-8 w-40 text-xs"
        autoFocus
      />
      <Button type="submit" variant="danger" size="sm" disabled={isPending}>
        Confirm
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
        Cancel
      </Button>
    </form>
  );
}
