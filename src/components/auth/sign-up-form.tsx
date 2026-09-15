"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormAlert, Input } from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";
import {
  authErrorMessage,
  fieldErrors,
  PASSWORD_MIN,
  signUpSchema,
  type FieldErrors,
} from "@/lib/validation/auth";
import { SocialButtons, type EnabledProviders } from "./social-buttons";

type Fields = "name" | "email" | "password" | "confirmPassword";

export function SignUpForm({ callbackUrl, providers }: { callbackUrl: string; providers: EnabledProviders }) {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors<Fields>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = signUpSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }

    setErrors({});
    setFormError(null);
    startTransition(async () => {
      const { name, email, password } = parsed.data;
      const { error } = await authClient.signUp.email({ name, email, password });
      if (error) {
        setFormError(authErrorMessage(error));
        return;
      }
      router.replace(callbackUrl);
      router.refresh();
    });
  }

  const describedBy = (field: Fields) => (errors[field] ? `${field}-error` : undefined);

  return (
    <div className="space-y-5">
      <SocialButtons providers={providers} callbackUrl={callbackUrl} />
      <form noValidate onSubmit={onSubmit} className="space-y-4">
        {formError && <FormAlert>{formError}</FormAlert>}
        <Field label="Name" htmlFor="name" error={errors.name}>
          <Input id="name" name="name" autoComplete="name" required aria-invalid={Boolean(errors.name)} aria-describedby={describedBy("name")} />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email}>
          <Input id="email" name="email" type="email" autoComplete="email" required aria-invalid={Boolean(errors.email)} aria-describedby={describedBy("email")} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password} hint={`At least ${PASSWORD_MIN} characters.`}>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            aria-invalid={Boolean(errors.password)}
            aria-describedby={describedBy("password")}
          />
        </Field>
        <Field label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword}>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={describedBy("confirmPassword")}
          />
        </Field>
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </div>
  );
}
