import { MaintainerOverlapPanel } from "../components/epicenter/MaintainerOverlapPanel";
import { PropagationReplay } from "../components/epicenter/PropagationReplay";
import { TyposquatPanel } from "../components/epicenter/TyposquatPanel";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/Button";
import { Reveal } from "../components/ui/Reveal";
import { SectionLabel } from "../components/ui/SectionLabel";
import type { Incident } from "../lib/types";

interface PanelsSectionProps {
  hasAnalysis: boolean;
  incidents: Incident[];
}

export function PanelsSection({ hasAnalysis, incidents }: PanelsSectionProps) {
  return (
    <section id="signals" className="scroll-mt-[74px] border-t border-rule bg-black py-24 md:py-32">
      <PageShell>
        <Reveal><SectionLabel number="04" label="Propagation replay" /></Reveal>
        {hasAnalysis ? (
          <>
            <Reveal className="mt-12" delay={70}>
              <PropagationReplay incidents={incidents} />
            </Reveal>
            <Reveal className="mt-24 border-t border-rule pt-20 md:mt-32 md:pt-24">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                <span className="text-accent">05—06</span> / Adjacent signals
              </div>
              <h2 className="mt-10 max-w-4xl text-4xl font-medium leading-[1.05] tracking-[-0.045em] text-white md:text-6xl">
                Trust and naming signals around the <span className="text-accent">blast radius.</span>
              </h2>
            </Reveal>
            <div className="mt-14 grid gap-5 xl:grid-cols-2">
              <Reveal><MaintainerOverlapPanel incidents={incidents} /></Reveal>
              <Reveal delay={100}><TyposquatPanel /></Reveal>
            </div>
          </>
        ) : (
          <Reveal delay={70}>
            <div className="mt-12 flex min-h-64 items-center justify-center border border-dashed border-rule bg-black p-8 text-center">
              <div>
                <div className="mx-auto h-3 w-3 bg-accent" />
                <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                  Analyze first to unlock signals
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-dim">
                  Submit a package-lock.json to connect replay and adjacent supply-chain signals to an analysis.
                </p>
                <Button className="mt-6" href="#analyze">Go to Analyze</Button>
              </div>
            </div>
          </Reveal>
        )}
      </PageShell>
    </section>
  );
}
