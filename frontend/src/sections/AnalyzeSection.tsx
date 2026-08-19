import { LockfileUploader } from "../components/epicenter/LockfileUploader";
import { PageShell } from "../components/layout/PageShell";
import { SectionLabel } from "../components/ui/SectionLabel";
import { Reveal } from "../components/ui/Reveal";

interface AnalyzeSectionProps {
  isLoading: boolean;
  error: string | null;
  onAnalyze: (lockfile: string, sourceLabel?: string) => Promise<unknown>;
}

export function AnalyzeSection({ isLoading, error, onAnalyze }: AnalyzeSectionProps) {
  return (
    <section id="analyze" className="border-y border-rule bg-black py-24 md:py-32">
      <PageShell>
        <Reveal><SectionLabel number="02" label="Analyze" /></Reveal>
        <div className="mt-12 grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
          <Reveal delay={70}>
            <h2 className="text-4xl font-medium leading-[1.05] tracking-[-0.045em] text-white md:text-6xl">
              Find the path, not just the <span className="text-accent">package.</span>
            </h2>
            <p className="mt-7 max-w-md text-base leading-7 text-muted">
              Epicenter reads lockfile v2 and v3, resolves the installed dependency tree, merges it into HydraDB, and checks all sources against the full incident corpus.
            </p>
            <div className="mt-9 border-l border-rule pl-5 font-mono text-[9px] uppercase leading-6 tracking-[0.14em] text-dim">
              <div>01 / Parse exact versions</div>
              <div>02 / Merge dependency edges</div>
              <div>03 / Run algo.MSpaths</div>
              <div>04 / Render exposure paths</div>
            </div>
          </Reveal>
          <Reveal delay={150}>
            <LockfileUploader isLoading={isLoading} error={error} onAnalyze={onAnalyze} />
          </Reveal>
        </div>
      </PageShell>
    </section>
  );
}
