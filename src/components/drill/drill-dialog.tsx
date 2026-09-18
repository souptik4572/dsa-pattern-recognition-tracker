"use client";

import { Target, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { RecognitionDrill } from "@/components/drill/recognition-drill";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/panel";
import type { DrillPattern } from "@/lib/drill";

/** The recognition drill as a modal over the sheet, like the original single-page tracker. */
export function DrillDialog({
  patterns,
  families,
  openOnArrival,
}: {
  patterns: DrillPattern[];
  families: { id: string; name: string }[];
  /** /drill redirects to /sheet?drill=1, which opens the drill straight away. */
  openOnArrival: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(openOnArrival);

  useEffect(() => {
    if (openOnArrival && !dialog.current?.open) dialog.current?.showModal();
  }, [openOnArrival]);

  function show() {
    setOpen(true);
    if (!dialog.current?.open) dialog.current?.showModal();
  }

  function onClose() {
    // Unmounting the drill switches off its keyboard shortcuts; the next session starts a fresh score.
    setOpen(false);
    const url = new URL(window.location.href);
    if (url.searchParams.has("drill")) {
      url.searchParams.delete("drill");
      window.history.replaceState(null, "", url);
    }
  }

  return (
    <>
      <Button variant="secondary" onClick={show}>
        <Target aria-hidden className="size-4" /> Recognition drill
      </Button>
      <dialog
        ref={dialog}
        onClose={onClose}
        aria-labelledby="drill-title"
        className="m-auto max-h-[calc(100dvh-2rem)] w-[min(44rem,calc(100vw-2rem))] overflow-y-auto rounded border border-rule bg-paper p-0 text-ink shadow-2xl backdrop:bg-black/50"
      >
        <div className="flex items-start justify-between gap-4 border-b border-rule bg-card px-4 py-3 sm:px-6">
          <div>
            <Eyebrow>Recognition drill</Eyebrow>
            <h2 id="drill-title" className="mt-1 font-mono text-lg font-bold tracking-tight">
              Name the pattern from its trigger
            </h2>
          </div>
          <Button variant="ghost" size="sm" aria-label="Close the drill" onClick={() => dialog.current?.close()}>
            <X aria-hidden className="size-4" />
          </Button>
        </div>
        <div className="p-4 sm:p-6">
          {open && <RecognitionDrill patterns={patterns} families={families} onStudy={() => dialog.current?.close()} />}
        </div>
      </dialog>
    </>
  );
}
