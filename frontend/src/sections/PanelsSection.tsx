import { MaintainerOverlapPanel } from "../components/epicenter/MaintainerOverlapPanel";
import { TyposquatPanel } from "../components/epicenter/TyposquatPanel";
import { PageShell } from "../components/layout/PageShell";
import { Reveal } from "../components/ui/Reveal";
import type { Incident } from "../lib/types";

interface PanelsSectionProps {
  incidents: Incident[];
}

export function PanelsSection({ incidents }: PanelsSectionProps) {
  return (
    <section id="signals" className="border-t border-rule bg-black py-24 md:py-32">
      <PageShell>
        <Reveal>
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
      </PageShell>
    </section>
  );
}
