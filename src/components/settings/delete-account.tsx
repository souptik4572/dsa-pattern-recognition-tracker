"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormAlert, Input } from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/validation/auth";

export function DeleteAccount({ requiresPassword }: { requiresPassword: boolean }) {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    if (requiresPassword && !password) {
      setError("Enter your password to confirm.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const { error: deleteError } = await authClient.deleteUser(requiresPassword ? { password } : {});
      if (deleteError) {
        setError(
          deleteError.code === "INVALID_PASSWORD"
            ? "That password is incorrect."
            : deleteError.code === "SESSION_EXPIRED"
              ? "For your security, sign out and back in, then try again."
              : authErrorMessage(deleteError),
        );
        return;
      }
      router.replace("/");
      router.refresh();
    });
  }

  return (
    <form noValidate onSubmit={onSubmit} className="max-w-xl space-y-4">
      <p className="text-sm text-ink-2">
        Permanently deletes your account, sessions and all tracked progress. There&apos;s no recovery.
      </p>
      {error && <FormAlert>{error}</FormAlert>}
      {requiresPassword && (
        <Field label="Password" htmlFor="delete-password">
          <Input id="delete-password" name="password" type="password" autoComplete="current-password" />
        </Field>
      )}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
          className="size-4 accent-danger"
        />
        I understand this can&apos;t be undone
      </label>
      <Button type="submit" variant="danger" disabled={!confirmed || isPending}>
        {isPending ? "Deleting…" : "Delete my account"}
      </Button>
    </form>
  );
}
