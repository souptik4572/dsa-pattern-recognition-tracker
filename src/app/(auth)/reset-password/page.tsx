import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { FormAlert } from "@/components/ui/field";
import { firstParam, type RawSearchParams } from "@/lib/search-param";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const params = await searchParams;
  const token = firstParam(params.token);
  const invalid = !token || firstParam(params.error) === "INVALID_TOKEN";

  return (
    <>
      <h1 className="font-mono text-xl font-bold tracking-tight">Choose a new password</h1>
      <p className="mt-1 mb-6 text-sm text-ink-2">Signing in with the new password will end your other sessions.</p>
      {invalid ? (
        <FormAlert>
          This reset link is invalid or has expired.{" "}
          <Link href="/forgot-password" className="underline">
            Request a new one
          </Link>
          .
        </FormAlert>
      ) : (
        <ResetPasswordForm token={token} />
      )}
    </>
  );
}
