"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/panel";

export default function AppError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50dvh] max-w-md flex-col items-center justify-center text-center">
      <Eyebrow>Something went wrong</Eyebrow>
      <h1 className="mt-2 font-mono text-2xl font-bold tracking-tight">This page couldn&apos;t load</h1>
      <p className="mt-2 text-ink-2">
        Your progress is safe. Try again, and if it keeps happening, share this reference with an admin
        {error.digest ? (
          <>
            : <code className="font-mono text-xs">{error.digest}</code>
          </>
        ) : (
          "."
        )}
      </p>
      <Button className="mt-6" onClick={() => retry()}>
        Try again
      </Button>
    </div>
  );
}
