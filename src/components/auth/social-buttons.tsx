"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export type EnabledProviders = { github: boolean; google: boolean };

const LABEL = { github: "GitHub", google: "Google" } as const;

export function SocialButtons({ providers, callbackUrl }: { providers: EnabledProviders; callbackUrl: string }) {
  const [pending, setPending] = useState<keyof EnabledProviders | null>(null);
  const enabled = (Object.keys(LABEL) as (keyof EnabledProviders)[]).filter((provider) => providers[provider]);
  if (enabled.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        {enabled.map((provider) => (
          <Button
            key={provider}
            variant="secondary"
            disabled={pending !== null}
            onClick={async () => {
              setPending(provider);
              const { error } = await authClient.signIn.social({ provider, callbackURL: callbackUrl });
              // On success the browser is already navigating to the provider.
              if (error) setPending(null);
            }}
          >
            {pending === provider ? "Redirecting…" : `Continue with ${LABEL[provider]}`}
          </Button>
        ))}
      </div>
      <div className="flex items-center gap-3 font-mono text-[11px] tracking-widest text-ink-3 uppercase">
        <span className="h-px flex-1 bg-rule" />
        or
        <span className="h-px flex-1 bg-rule" />
      </div>
    </div>
  );
}
