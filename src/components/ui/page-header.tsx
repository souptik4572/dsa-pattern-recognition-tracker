import type { ReactNode } from "react";
import { Eyebrow } from "./panel";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b-2 border-ink pb-5">
      <div className="min-w-0 max-w-3xl">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className="mt-2 font-mono text-2xl leading-tight font-bold tracking-tight text-balance sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 text-ink-2">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
