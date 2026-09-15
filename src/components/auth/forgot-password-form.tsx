"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormAlert, Input } from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage, fieldErrors, forgotPasswordSchema } from "@/lib/validation/auth";

export function ForgotPasswordForm() {
  const [emailError, setEmailError] = useState<string>();
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = forgotPasswordSchema.safeParse({ email: new FormData(event.currentTarget).get("email") });
    if (!parsed.success) {
      setEmailError(fieldErrors<"email">(parsed.error).email);
      return;
    }

    setEmailError(undefined);
    setFormError(null);
    startTransition(async () => {
      const { error } = await authClient.requestPasswordReset({ email: parsed.data.email, redirectTo: "/reset-password" });
      // Rate limiting is the only error worth surfacing; anything else would hint at whether the account exists.
      if (error?.status === 429) {
        setFormError(authErrorMessage(error));
        return;
      }
      setSent(true);
    });
  }

  if (sent) {
    return (
      <FormAlert tone="success">
        If an account exists for that email, a reset link is on its way. It expires in one hour.
      </FormAlert>
    );
  }

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-4">
      {formError && <FormAlert>{formError}</FormAlert>}
      <Field label="Email" htmlFor="email" error={emailError}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={Boolean(emailError)}
          aria-describedby={emailError ? "email-error" : undefined}
        />
      </Field>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
