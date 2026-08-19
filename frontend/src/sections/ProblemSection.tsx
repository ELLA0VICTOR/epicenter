import type { IncidentsResponse } from "../lib/types";
import { PageShell } from "../components/layout/PageShell";
import { SectionLabel } from "../components/ui/SectionLabel";
import { StatCell } from "../components/ui/StatCell";
import { Reveal } from "../components/ui/Reveal";

interface ProblemSectionProps {
  data: IncidentsResponse | null;
  error: string | null;
}

export function ProblemSection({ data, error }: ProblemSectionProps) {
  const summary = data?.summary;
  const stats = [
    [summary?.packageCount ?? "—", "Packages", "known compromised projects"],
    [summary?.compromisedVersionCount ?? "—", "Artifacts", "exact malicious releases"],
    [summary?.incidentCount ?? "—", "Incidents", "sourced campaign waves"],
    [summary?.maintainerCount ?? "—", "Maintainers", "registry and repo identities"],
  ] as const;

  return (
    <section id="problem" className="bg-black py-24 md:py-32">
      <PageShell>
        <Reveal><SectionLabel number="01" label="The problem" /></Reveal>
        <div className="mt-12 grid gap-8 lg:grid-cols-2 lg:gap-20">
          <Reveal delay={70}>
            <h2 className="max-w-2xl text-4xl font-medium leading-[1.06] tracking-[-0.045em] text-white md:text-6xl">
              A package name tells you almost nothing about its <span className="text-accent">blast radius.</span>
            </h2>
          </Reveal>
          <Reveal delay={140}>
            <p className="text-base leading-7 text-muted">
              TeamPCP moved through trusted build pipelines, maintainer credentials, and exact release versions. Similarity search can flag a name; it cannot reconstruct the route from your resolved tree to a poisoned artifact.
            </p>
            <p className="mt-5 text-base leading-7 text-muted">
              Epicenter stores those relationships as a graph, then asks every package in your lockfile against every sourced compromise in one bounded traversal.
            </p>
            {error ? <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.13em] text-accent">Live incident stats unavailable / {error}</p> : null}
          </Reveal>
        </div>
        <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 [&>*:not(:first-child)]:-ml-px">
          {stats.map(([value, label, detail], index) => (
            <Reveal className="h-full" delay={index * 75} key={label}>
              <StatCell value={value} label={label} detail={detail} />
            </Reveal>
          ))}
        </div>
      </PageShell>
    </section>
  );
}
