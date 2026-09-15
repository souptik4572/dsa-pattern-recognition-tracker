"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormAlert, Input } from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage, fieldErrors, PASSWORD_MIN, resetPasswordSchema, type FieldErrors } from "@/lib/validation/auth";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors<"password" | "confirmPassword">>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = resetPasswordSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }

    setErrors({});
    setFormError(null);
    startTransition(async () => {
      const { error } = await authClient.resetPassword({ newPassword: parsed.data.password, token });
      if (error) {
        setFormError(
          error.code === "INVALID_TOKEN" ? "This reset link is invalid or has expired. Request a new one." : authErrorMessage(error),
        );
        return;
      }
      router.replace("/sign-in?reset=1");
    });
  }

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-4">
      {formError && <FormAlert>{formError}</FormAlert>}
      <Field label="New password" htmlFor="password" error={errors.password} hint={`At least ${PASSWORD_MIN} characters.`}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "password-error" : undefined}
        />
      </Field>
      <Field label="Confirm new password" htmlFor="confirmPassword" error={errors.confirmPassword}>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={Boolean(errors.confirmPassword)}
          aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
        />
      </Field>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Saving…" : "Set new password"}
      </Button>
    </form>
  );
}
