"use client";

import { useState, useTransition, type FormEvent } from "react";
import { updateNameAction } from "@/app/actions/account";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { nameSchema } from "@/lib/validation/auth";

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = nameSchema.safeParse(new FormData(event.currentTarget).get("name"));
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      return;
    }
    setError(undefined);
    startTransition(async () => {
      const result = await updateNameAction(parsed.data);
      if (result.ok) toast("Profile updated");
      else setError(result.error);
    });
  }

  return (
    <form noValidate onSubmit={onSubmit} className="grid max-w-xl gap-4 sm:grid-cols-2">
      <Field label="Name" htmlFor="profile-name" error={error}>
        <Input
          id="profile-name"
          name="name"
          defaultValue={name}
          autoComplete="name"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "profile-name-error" : undefined}
        />
      </Field>
      <Field label="Email" htmlFor="profile-email" hint="Email can't be changed yet.">
        <Input id="profile-email" value={email} readOnly disabled />
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save profile"}
        </Button>
      </div>
    </form>
  );
}
