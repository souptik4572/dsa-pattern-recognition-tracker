import { ButtonLink } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/panel";

export default function Forbidden() {
  return (
    <div className="mx-auto flex min-h-[60dvh] max-w-md flex-col items-center justify-center px-4 text-center">
      <Eyebrow>Error 403</Eyebrow>
      <h1 className="mt-2 font-mono text-2xl font-bold tracking-tight">You don&apos;t have access to this page</h1>
      <p className="mt-2 text-ink-2">This area is limited to administrators. Ask an admin if you think you should have access.</p>
      <ButtonLink href="/dashboard" className="mt-6">
        Back to dashboard
      </ButtonLink>
    </div>
  );
}
