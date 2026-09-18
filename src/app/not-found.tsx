import { ButtonLink } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/panel";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60dvh] max-w-md flex-col items-center justify-center px-4 text-center">
      <Eyebrow>Error 404</Eyebrow>
      <h1 className="mt-2 font-mono text-2xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-2 text-ink-2">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <ButtonLink href="/sheet" className="mt-6">
        Back to the sheet
      </ButtonLink>
    </div>
  );
}
