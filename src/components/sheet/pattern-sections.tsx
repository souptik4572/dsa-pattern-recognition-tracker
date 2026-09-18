import { PatternPanel, SectionExpandControls } from "@/components/patterns/pattern-accordion";
import type { PatternSectionData } from "@/server/sheet";

/** Families in sheet order, each with its expandable pattern panels. */
export function PatternSections({ sections, filtered }: { sections: PatternSectionData[]; filtered: boolean }) {
  return (
    <>
      {sections.map((section) => (
        <section key={section.id} aria-labelledby={`family-${section.id}`} className="mt-8 first:mt-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-ink pb-2">
            <span className="font-mono text-2xl font-bold tracking-tight text-accent">{section.id}</span>
            <h2 id={`family-${section.id}`} className="min-w-0 flex-1 text-lg font-semibold">
              {section.name}
            </h2>
            <span className="font-mono text-xs text-ink-3 tabular-nums">
              {section.counts.solved}/{section.counts.total} solved · {section.counts.pending} pending
            </span>
            <SectionExpandControls patternIds={section.patterns.map((pattern) => pattern.id)} sectionName={section.name} />
          </div>
          <p className="mt-2 max-w-3xl text-sm text-ink-2">{section.why}</p>
          <div className="mt-3 space-y-2">
            {section.patterns.map((pattern) => (
              <PatternPanel key={pattern.id} pattern={pattern} filtered={filtered} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
