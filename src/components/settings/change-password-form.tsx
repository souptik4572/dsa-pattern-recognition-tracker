"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormAlert, Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { authClient } from "@/lib/auth-client";
import {
  authErrorMessage,
  changePasswordSchema,
  fieldErrors,
  PASSWORD_MIN,
  type FieldErrors,
} from "@/lib/validation/auth";

type Fields = "currentPassword" | "password" | "confirmPassword";

export function ChangePasswordForm() {
  const router = useRouter();
  const toast = useToast();
  const [errors, setErrors] = useState<FieldErrors<Fields>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const parsed = changePasswordSchema.safeParse(Object.fromEntries(new FormData(form)));
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }

    setErrors({});
    setFormError(null);
    startTransition(async () => {
      const { error } = await authClient.changePassword({
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.password,
        revokeOtherSessions: true,
      });
      if (error) {
        setFormError(error.code === "INVALID_PASSWORD" ? "Your current password is incorrect." : authErrorMessage(error));
        return;
      }
      form.reset();
      toast("Password changed. Your other sessions were signed out.");
      router.refresh();
    });
  }

  const describedBy = (field: Fields) => (errors[field] ? `${field}-error` : undefined);

  return (
    <form noValidate onSubmit={onSubmit} className="grid max-w-xl gap-4">
      {formError && <FormAlert>{formError}</FormAlert>}
      <Field label="Current password" htmlFor="currentPassword" error={errors.currentPassword}>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(errors.currentPassword)}
          aria-describedby={describedBy("currentPassword")}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="New password" htmlFor="password" error={errors.password} hint={`At least ${PASSWORD_MIN} characters.`}>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={describedBy("password")}
          />
        </Field>
        <Field label="Confirm new password" htmlFor="confirmPassword" error={errors.confirmPassword}>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={describedBy("confirmPassword")}
          />
        </Field>
      </div>
      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Updating…" : "Change password"}
        </Button>
      </div>
    </form>
  );
}
