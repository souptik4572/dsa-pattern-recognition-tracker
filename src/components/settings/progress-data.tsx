"use client";

import { Download, Upload } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { importProgressAction, resetProgressAction } from "@/app/actions/progress";
import { Button, buttonClasses } from "@/components/ui/button";
import { Field, FormAlert, Input, Label, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

export function ProgressData() {
  const toast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [pasted, setPasted] = useState("");
  const [importMessage, setImportMessage] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [isImporting, startImport] = useTransition();
  const [isResetting, startReset] = useTransition();

  function runImport(text: string) {
    setImportMessage(null);
    startImport(async () => {
      const result = await importProgressAction(text);
      if (!result.ok) {
        setImportMessage({ tone: "danger", text: result.error });
        return;
      }
      const { imported, unknown, skipped } = result.data;
      const ignored = unknown + skipped;
      setImportMessage({
        tone: "success",
        text: `Imported ${imported} ${imported === 1 ? "status" : "statuses"}.${ignored ? ` Ignored ${ignored} entries that don't match a problem in the sheet.` : ""}`,
      });
      setPasted("");
      if (fileInput.current) fileInput.current.value = "";
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <section>
        <h3 className="font-semibold">Export</h3>
        <p className="mt-1 text-sm text-ink-2">Download every status you&apos;ve set as JSON.</p>
        <a href="/api/progress/export" className={buttonClasses({ variant: "secondary", className: "mt-4" })}>
          <Download aria-hidden className="size-4" /> Download JSON
        </a>
      </section>

      <section>
        <h3 className="font-semibold">Import</h3>
        <p className="mt-1 text-sm text-ink-2">
          Accepts a file exported from here, or the saved state of the original single-page tracker (key{" "}
          <code className="font-mono text-xs">mikpattern-v1</code>). Imported statuses overwrite existing ones.
        </p>
        <div className="mt-4 space-y-3">
          {importMessage && <FormAlert tone={importMessage.tone}>{importMessage.text}</FormAlert>}
          <div>
            <Label htmlFor="import-file">From a file</Label>
            <Input
              ref={fileInput}
              id="import-file"
              type="file"
              accept="application/json,.json"
              disabled={isImporting}
              className="h-auto py-1.5 file:mr-3 file:rounded-[3px] file:border-0 file:bg-accent-soft file:px-2 file:py-1 file:font-mono file:text-xs file:text-accent"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (file) runImport(await file.text());
              }}
            />
          </div>
          <Field label="Or paste JSON" htmlFor="import-json">
            <Textarea id="import-json" rows={4} value={pasted} onChange={(event) => setPasted(event.target.value)} />
          </Field>
          <Button variant="secondary" disabled={isImporting || !pasted.trim()} onClick={() => runImport(pasted)}>
            <Upload aria-hidden className="size-4" /> {isImporting ? "Importing…" : "Import pasted JSON"}
          </Button>
        </div>
      </section>

      <section>
        <h3 className="font-semibold">Reset</h3>
        <p className="mt-1 text-sm text-ink-2">
          Clears every status on every problem. This can&apos;t be undone, so export first if you might want it back.
        </p>
        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            startReset(async () => {
              const result = await resetProgressAction(confirmation);
              if (result.ok) {
                setConfirmation("");
                toast(`Progress cleared (${result.data.cleared} statuses removed)`);
              } else {
                toast(result.error, "danger");
              }
            });
          }}
        >
          <Field label="Type RESET to confirm" htmlFor="reset-confirmation">
            <Input
              id="reset-confirmation"
              value={confirmation}
              autoComplete="off"
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </Field>
          <Button type="submit" variant="danger" disabled={isResetting || confirmation !== "RESET"}>
            {isResetting ? "Clearing…" : "Reset all progress"}
          </Button>
        </form>
      </section>
    </div>
  );
}
