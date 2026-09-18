"use client";

import { Check, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useEffectEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { Eyebrow } from "@/components/ui/panel";
import { cn } from "@/lib/cn";
import { buildQuestion, type DrillPattern, type DrillQuestion } from "@/lib/drill";
import { patternHref } from "@/lib/sheet/ids";

type Score = { correct: number; answered: number; streak: number; best: number };

const EMPTY_SCORE: Score = { correct: 0, answered: 0, streak: 0, best: 0 };

export function RecognitionDrill({
  patterns,
  families,
  onStudy,
}: {
  patterns: DrillPattern[];
  families: { id: string; name: string }[];
  /** Called when the user follows a link to study a pattern, e.g. to close the dialog around the drill. */
  onStudy?: () => void;
}) {
  const [familyId, setFamilyId] = useState<string | null>(null);
  // Questions are generated only after a user action, so server and client renders never disagree.
  const [question, setQuestion] = useState<DrillQuestion | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState<Score>(EMPTY_SCORE);

  function nextQuestion(family = familyId) {
    setQuestion(buildQuestion(patterns, family, question?.answer.id));
    setPicked(null);
  }

  function choose(id: string) {
    if (!question || picked) return;
    const correct = id === question.answer.id;
    setPicked(id);
    setScore((current) => {
      const streak = correct ? current.streak + 1 : 0;
      return {
        correct: current.correct + (correct ? 1 : 0),
        answered: current.answered + 1,
        streak,
        best: Math.max(current.best, streak),
      };
    });
  }

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (!question || event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target as HTMLElement;
    if (["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName)) return;
    // Enter on a focused button already activates it; handling it here as well would skip a question.
    const onButton = target.tagName === "BUTTON";

    const index = Number(event.key) - 1;
    if (!picked && Number.isInteger(index) && index >= 0 && index < question.options.length) {
      choose(question.options[index].id);
    } else if (picked && ((event.key === "Enter" && !onButton) || event.key.toLowerCase() === "n")) {
      nextQuestion();
    }
  });

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const familySelect = (
    <label className="flex items-center gap-2 text-sm text-ink-2">
      <span className="whitespace-nowrap">Drill</span>
      <Select
        value={familyId ?? ""}
        onChange={(event) => {
          const next = event.target.value || null;
          setFamilyId(next);
          if (question) nextQuestion(next);
        }}
        className="w-auto max-w-[16rem]"
      >
        <option value="">All families</option>
        {families.map((family) => (
          <option key={family.id} value={family.id}>
            {family.id} · {family.name}
          </option>
        ))}
      </Select>
    </label>
  );

  if (!question) {
    return (
      <div className="rounded border border-rule bg-card p-6 sm:p-8">
        <p className="max-w-2xl text-ink-2">
          Each round shows the “recognise it when” line for one pattern. Pick the pattern it describes. Use keys{" "}
          <kbd className="rounded border border-rule px-1 font-mono text-xs">1</kbd>–
          <kbd className="rounded border border-rule px-1 font-mono text-xs">4</kbd> to answer and{" "}
          <kbd className="rounded border border-rule px-1 font-mono text-xs">Enter</kbd> for the next trigger.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {familySelect}
          <Button onClick={() => nextQuestion()}>Start drill</Button>
        </div>
      </div>
    );
  }

  const answeredCorrectly = picked === question.answer.id;

  return (
    <div className="rounded border border-rule bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-4 py-3 sm:px-6">
        {familySelect}
        <p aria-live="polite" className="font-mono text-xs text-ink-2 tabular-nums">
          {score.correct}/{score.answered} correct · streak {score.streak} · best {score.best}
        </p>
      </div>

      <div className="p-4 sm:p-6">
        <Eyebrow>Which pattern does this trigger belong to?</Eyebrow>
        <blockquote className="mt-3 border-l-[3px] border-accent pl-4 text-lg leading-relaxed">{question.answer.trigger}</blockquote>

        <ol className="mt-6 grid gap-2">
          {question.options.map((option, index) => {
            const isAnswer = option.id === question.answer.id;
            const isPicked = option.id === picked;
            return (
              <li key={option.id}>
                <button
                  type="button"
                  onClick={() => choose(option.id)}
                  disabled={picked !== null}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[3px] border px-4 py-3 text-left transition-colors disabled:cursor-default",
                    !picked && "border-rule hover:border-accent",
                    picked && isAnswer && "border-status-clean bg-status-clean/10",
                    picked && isPicked && !isAnswer && "border-status-help bg-status-help/10",
                    picked && !isAnswer && !isPicked && "border-rule opacity-60",
                  )}
                >
                  <kbd className="flex size-6 shrink-0 items-center justify-center rounded border border-rule font-mono text-xs text-ink-3">
                    {index + 1}
                  </kbd>
                  <span className="min-w-0 flex-1">
                    <span className="font-mono text-xs font-semibold text-accent">{option.id}</span> {option.name}
                  </span>
                  {picked && isAnswer && <Check aria-label="Correct answer" className="size-4 shrink-0 text-status-clean" />}
                  {picked && isPicked && !isAnswer && <X aria-label="Your answer" className="size-4 shrink-0 text-status-help" />}
                </button>
              </li>
            );
          })}
        </ol>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-4">
          <p aria-live="polite" className="text-sm">
            {picked ? (
              <>
                <b>{answeredCorrectly ? "Correct." : "Not quite."}</b>{" "}
                <span className="text-ink-2">
                  It&apos;s {question.answer.id} from {question.answer.familyName}.{" "}
                </span>
                <Link href={patternHref(question.answer.id)} onClick={onStudy} className="text-accent hover:underline">
                  Study this pattern →
                </Link>
              </>
            ) : (
              <span className="text-ink-2">Name the pattern before you look at the options.</span>
            )}
          </p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setScore(EMPTY_SCORE);
                nextQuestion();
              }}
            >
              Reset score
            </Button>
            <Button variant={picked ? "primary" : "secondary"} onClick={() => nextQuestion()}>
              {picked ? "Next trigger" : "Skip"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
