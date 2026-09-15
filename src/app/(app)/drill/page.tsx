import type { Metadata } from "next";
import { RecognitionDrill } from "@/components/drill/recognition-drill";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/server/auth";
import { getCatalog, getDrillPatterns } from "@/server/sheet";

export const metadata: Metadata = { title: "Recognition drill" };

export default async function DrillPage() {
  await requireUser();
  const [patterns, catalog] = await Promise.all([getDrillPatterns(), getCatalog()]);

  return (
    <>
      <PageHeader
        eyebrow="Recognition drill"
        title="Name the pattern from its trigger"
        description="The interview skill isn't writing the loop, it's knowing which loop to write. Scores stay in this tab."
      />
      <RecognitionDrill patterns={patterns} families={catalog.map(({ id, name }) => ({ id, name }))} />
    </>
  );
}
