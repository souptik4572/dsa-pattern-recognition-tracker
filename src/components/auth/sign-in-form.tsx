"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormAlert, Input } from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage, fieldErrors, signInSchema, type FieldErrors } from "@/lib/validation/auth";
import { SocialButtons, type EnabledProviders } from "./social-buttons";

export function SignInForm({
  callbackUrl,
  providers,
  notice,
}: {
  callbackUrl: string;
  providers: EnabledProviders;
  notice?: string;
}) {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors<"email" | "password">>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = signInSchema.safeParse({ email: form.get("email"), password: form.get("password") });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }

    setErrors({});
    setFormError(null);
    startTransition(async () => {
      const { error } = await authClient.signIn.email({ ...parsed.data, rememberMe: form.get("remember") === "on" });
      if (error) {
        setFormError(authErrorMessage(error));
        return;
      }
      router.replace(callbackUrl);
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {notice && <FormAlert tone="success">{notice}</FormAlert>}
      <SocialButtons providers={providers} callbackUrl={callbackUrl} />
      <form noValidate onSubmit={onSubmit} className="space-y-4">
        {formError && <FormAlert>{formError}</FormAlert>}
        <Field label="Email" htmlFor="email" error={errors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password}>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
        </Field>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-ink-2">
            <input type="checkbox" name="remember" defaultChecked className="size-4 accent-accent" />
            Keep me signed in
          </label>
          <Link href="/forgot-password" className="text-accent hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
