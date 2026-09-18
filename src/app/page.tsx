import { Filter, Gauge, Layers, Target } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/app-shell/logo";
import { ButtonLink } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/panel";
import { getCurrentUser } from "@/server/auth";
import { getCatalog, getSheetTotals } from "@/server/sheet";

const FEATURES = [
  {
    icon: Layers,
    title: "Track by pattern, not topic",
    body: "Every problem sits under the pattern it trains, so your progress shows which recognitions you actually own.",
  },
  {
    icon: Filter,
    title: "Filter the whole sheet",
    body: "Search and filter every slot by family, pattern, difficulty, tier or status, then sort and page through the results.",
  },
  {
    icon: Gauge,
    title: "Solved vs pending, everywhere",
    body: "See solved and pending counts overall and per pattern, family, tier and difficulty, plus what's due for a revisit.",
  },
  {
    icon: Target,
    title: "Recognition drill",
    body: "Read a trigger, name the pattern. It trains the skill interviews actually test: knowing what a problem is.",
  },
];

export default async function HomePage() {
  // Reading the session first opts this page into request-time rendering before any query starts,
  // so `next build` never reaches for the database while trying to prerender it.
  const user = await getCurrentUser();
  const [catalog, totals] = await Promise.all([getCatalog(), getSheetTotals()]);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <header className="flex items-center justify-between gap-4 py-5">
        <Logo />
        {user ? (
          <ButtonLink href="/sheet" size="sm">
            Open the sheet
          </ButtonLink>
        ) : (
          <div className="flex gap-2">
            <ButtonLink href="/sign-in" variant="ghost" size="sm">
              Sign in
            </ButtonLink>
            <ButtonLink href="/sign-up" size="sm">
              Get started
            </ButtonLink>
          </div>
        )}
      </header>

      <main className="pb-24">
        <section className="border-b-2 border-ink pt-12 pb-10 sm:pt-20">
          <Eyebrow>Built from MAZHARMIK / Interview_DS_Algo</Eyebrow>
          <h1 className="mt-3 max-w-3xl font-mono text-4xl leading-[1.1] font-bold tracking-tight text-balance sm:text-5xl">
            Pattern Recognition Tracker
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-ink-2">
            {totals.patterns} named patterns across {totals.families} families and {totals.problems} curated problems.
            Track by pattern, not by topic. The goal is to read a statement and know what it is before you write a line.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {user ? (
              <ButtonLink href="/sheet">Open your sheet</ButtonLink>
            ) : (
              <>
                <ButtonLink href="/sign-up">Create a free account</ButtonLink>
                <ButtonLink href="/sign-in" variant="secondary">
                  I already have an account
                </ButtonLink>
              </>
            )}
          </div>
          <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-3 font-mono text-sm text-ink-2">
            {[
              ["problem slots", totals.slots],
              ["distinct problems", totals.problems],
              ["patterns", totals.patterns],
              ["families", totals.families],
            ].map(([label, value]) => (
              <div key={label} className="flex items-baseline gap-2">
                <dt className="sr-only">{label}</dt>
                <dd>
                  <b className="text-ink">{value}</b> {label}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="features" className="py-12">
          <h2 id="features" className="sr-only">
            Features
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded border border-rule bg-card p-5">
                <Icon aria-hidden className="size-5 text-accent" />
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-ink-2">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="families" className="rounded border border-rule bg-card p-5 sm:p-6">
          <h2 id="families" className="font-mono text-xs font-semibold tracking-[0.12em] text-ink-3 uppercase">
            The {catalog.length} families
          </h2>
          <ol className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {catalog.map((family) => (
              <li key={family.id} className="flex gap-3">
                <span className="font-mono font-bold text-accent tabular-nums">{family.id}</span>
                <span className="text-ink-2">
                  {family.name} <span className="text-ink-3">· {family.patterns.length}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="flex flex-wrap justify-between gap-2 border-t border-rule py-6 font-mono text-xs text-ink-3">
        <span>Problem curation and solutions by codestorywithMIK.</span>
        <span className="flex gap-4">
          <Link href="https://www.youtube.com/@codestorywithMIK" target="_blank" rel="noopener noreferrer" className="hover:text-accent">
            YouTube ↗
          </Link>
          <Link href="https://github.com/MAZHARMIK/Interview_DS_Algo" target="_blank" rel="noopener noreferrer" className="hover:text-accent">
            GitHub ↗
          </Link>
        </span>
      </footer>
    </div>
  );
}
