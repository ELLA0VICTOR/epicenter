import { BlastRadiusGraph } from "../components/epicenter/BlastRadiusGraph";
import { ExposureSummary } from "../components/epicenter/ExposureSummary";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/Button";
import { SectionLabel } from "../components/ui/SectionLabel";
import { Reveal } from "../components/ui/Reveal";
import type { AnalyzeResponse } from "../lib/types";

interface ResultsSectionProps {
  result: AnalyzeResponse | null;
}

export function ResultsSection({ result }: ResultsSectionProps) {
  return (
    <section id="results" className="scroll-mt-[74px] bg-black py-24 md:py-32">
      <PageShell>
        <Reveal><SectionLabel number="03" label="Blast radius" /></Reveal>
        <Reveal className="mt-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between" delay={70}>
          <h2 className="max-w-3xl text-4xl font-medium leading-[1.05] tracking-[-0.045em] text-white md:text-6xl">
            {result ? (result.exposure.exposed ? "Exposure found in the resolved tree." : "This tree is clear of the seeded set.") : "Your dependency path appears here."}
          </h2>
          {result ? <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-dim">Query / {result.traversal.queryId}</div> : null}
        </Reveal>
        {result ? (
          <div className="mt-14 grid gap-5 xl:grid-cols-[0.72fr_1.28fr]">
            <Reveal><ExposureSummary result={result} /></Reveal>
            <Reveal delay={100}><BlastRadiusGraph graph={result.graph} /></Reveal>
          </div>
        ) : (
          <Reveal delay={130}>
            <div className="mt-14 flex min-h-64 items-center justify-center border border-dashed border-rule bg-black p-8 text-center">
              <div>
                <div className="mx-auto h-3 w-3 bg-accent" />
                <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">Waiting for a package-lock.json</p>
                <p className="mt-2 text-sm text-dim">The summary and HydraDB path graph will render after analysis.</p>
                <Button className="mt-6" href="#analyze">Analyze a lockfile</Button>
              </div>
            </div>
          </Reveal>
        )}
      </PageShell>
    </section>
  );
}
