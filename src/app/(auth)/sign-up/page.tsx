import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { enabledSocialProviders } from "@/lib/auth";
import { safeCallbackUrl } from "@/lib/safe-redirect";
import { firstParam, type RawSearchParams } from "@/lib/search-param";
import { getCurrentUser } from "@/server/auth";

export const metadata: Metadata = { title: "Create account" };

export default async function SignUpPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const callbackUrl = safeCallbackUrl(firstParam((await searchParams).callbackUrl));
  if (await getCurrentUser()) redirect(callbackUrl);

  return (
    <>
      <h1 className="font-mono text-xl font-bold tracking-tight">Create your account</h1>
      <p className="mt-1 mb-6 text-sm text-ink-2">Your progress is saved to your account and synced across devices.</p>
      <SignUpForm callbackUrl={callbackUrl} providers={enabledSocialProviders} />
      <p className="mt-6 text-center text-sm text-ink-2">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
