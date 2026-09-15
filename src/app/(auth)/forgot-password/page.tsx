import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="font-mono text-xl font-bold tracking-tight">Reset your password</h1>
      <p className="mt-1 mb-6 text-sm text-ink-2">Enter your account email and we&apos;ll send you a reset link.</p>
      <ForgotPasswordForm />
      <p className="mt-6 text-center text-sm text-ink-2">
        <Link href="/sign-in" className="text-accent hover:underline">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
