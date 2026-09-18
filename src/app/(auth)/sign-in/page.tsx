import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/auth/sign-in-form";
import { enabledSocialProviders } from "@/lib/auth";
import { DEFAULT_REDIRECT, safeCallbackUrl } from "@/lib/safe-redirect";
import { firstParam, type RawSearchParams } from "@/lib/search-param";
import { getCurrentUser } from "@/server/auth";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(firstParam(params.callbackUrl));
  if (await getCurrentUser()) redirect(callbackUrl);

  const signUpHref = callbackUrl === DEFAULT_REDIRECT ? "/sign-up" : `/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  return (
    <>
      <h1 className="font-mono text-xl font-bold tracking-tight">Sign in</h1>
      <p className="mt-1 mb-6 text-sm text-ink-2">Pick up where you left off.</p>
      <SignInForm
        callbackUrl={callbackUrl}
        providers={enabledSocialProviders}
        notice={firstParam(params.reset) === "1" ? "Password updated. Sign in with your new password." : undefined}
      />
      <p className="mt-6 text-center text-sm text-ink-2">
        New here?{" "}
        <Link href={signUpHref} className="text-accent hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
