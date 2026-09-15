import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatTile } from "@/components/progress/stat-tile";
import { StatusBar, StatusLegend } from "@/components/progress/status-bar";
import { ProblemTable } from "@/components/problems/problem-table";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { emptyCounts, percent } from "@/lib/progress/stats";
import { parseSheetParams, sheetHref } from "@/lib/sheet/search-params";
import { requireUser } from "@/server/auth";
import { getCatalog, getPatternDetail, getProgressStats } from "@/server/sheet";

type Props = { params: Promise<{ slug: string }> };

const SLUG = /^\d{1,2}-\d{1,2}$/;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const catalog = await getCatalog();
  const pattern = catalog.flatMap((family) => family.patterns).find((entry) => entry.slug === slug);
  return { title: pattern ? `${pattern.id} ${pattern.name}` : "Pattern" };
}

export default async function PatternPage({ params }: Props) {
  const user = await requireUser();
  const { slug } = await params;
  if (!SLUG.test(slug)) notFound();

  const [pattern, stats] = await Promise.all([getPatternDetail(user.id, slug), getProgressStats(user.id)]);
  if (!pattern) notFound();

  const counts = stats.byPattern[pattern.id] ?? emptyCounts();

  return (
    <>
      <PageHeader
        eyebrow={
          <Link href={`/patterns?family=${pattern.family.id}`} className="hover:text-accent">
            Family {pattern.family.id} · {pattern.family.name}
          </Link>
        }
        title={
          <>
            <span className="text-accent">{pattern.id}</span> {pattern.name}
          </>
        }
        actions={
          <ButtonLink href={sheetHref(parseSheetParams({}), { pattern: pattern.id })} variant="secondary">
            Open in sheet
          </ButtonLink>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="How to recognise it" className="lg:col-span-2">
          <h2 className="font-mono text-[11px] font-semibold tracking-[0.12em] text-ink-3 uppercase">Recognise it when</h2>
          <p className="mt-1.5 border-l-[3px] border-accent pl-3 text-ink">{pattern.trigger}</p>
          <h2 className="mt-5 font-mono text-[11px] font-semibold tracking-[0.12em] text-ink-3 uppercase">Template</h2>
          <p className="mt-1.5 text-ink-2">{pattern.template}</p>
          <p className="mt-5 inline-block rounded-[3px] bg-accent-soft px-2.5 py-1 font-mono text-xs text-accent">
            {pattern.complexity}
          </p>
        </Panel>

        <Panel title="Your progress">
          <p className="text-4xl font-semibold tracking-tight">{percent(counts.solved, counts.total)}%</p>
          <p className="mt-1 text-sm text-ink-2">
            <b className="text-ink">{counts.solved}</b> of {counts.total} solved
          </p>
          <StatusBar counts={counts} className="mt-4" />
          <StatusLegend counts={counts} className="mt-3" />
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <StatTile label="Solved" value={counts.solved} />
        <StatTile label="Pending" value={counts.pending} />
        <StatTile label="Revisit" value={counts.revisit} />
      </div>

      <h2 className="mt-8 mb-3 font-mono text-xs font-semibold tracking-[0.12em] text-ink-3 uppercase">
        Problems ({pattern.rows.length})
      </h2>
      <ProblemTable rows={pattern.rows} showPattern={false} caption={`Problems for pattern ${pattern.id}`} />

      <nav aria-label="Adjacent patterns" className="mt-8 flex flex-wrap justify-between gap-3">
        {pattern.previous ? (
          <Link
            href={`/patterns/${pattern.previous.slug}`}
            className="flex max-w-[48%] items-center gap-2 text-sm text-ink-2 hover:text-accent"
          >
            <ArrowLeft aria-hidden className="size-4 shrink-0" />
            <span className="truncate">
              <span className="font-mono text-xs text-accent">{pattern.previous.id}</span> {pattern.previous.name}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {pattern.next && (
          <Link
            href={`/patterns/${pattern.next.slug}`}
            className="ml-auto flex max-w-[48%] items-center gap-2 text-right text-sm text-ink-2 hover:text-accent"
          >
            <span className="truncate">
              <span className="font-mono text-xs text-accent">{pattern.next.id}</span> {pattern.next.name}
            </span>
            <ArrowRight aria-hidden className="size-4 shrink-0" />
          </Link>
        )}
      </nav>
    </>
  );
}
