import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/Button";
import { Divider } from "../components/ui/Divider";
import { PixelMark } from "../components/ui/PixelMark";
import { Reveal } from "../components/ui/Reveal";

export function Hero() {
  return (
    <section id="top" className="bg-black pt-20 md:pt-28">
      <PageShell>
        <div className="grid items-end gap-12 lg:grid-cols-[1fr_310px]">
          <Reveal>
            <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              <PixelMark className="h-3 w-3 text-accent" />
              Hack Hydra / Track 2A / Supply-chain blast radius
            </div>
            <h1 className="mt-9 font-display text-[clamp(4rem,13vw,10.5rem)] font-medium uppercase leading-[0.78] tracking-[-0.075em] text-white">
              Trace<br />the <span className="text-accent">impact.</span>
            </h1>
          </Reveal>
          <Reveal className="pb-2" delay={140}>
            <p className="text-lg leading-7 text-muted">
              Paste one lockfile. Epicenter traverses the real dependency graph to show exactly where a compromised release entered—and everything it can reach.
            </p>
            <div className="mt-7 flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
              <Button href="#analyze">Paste your lockfile</Button>
              <Button href="#problem" variant="outline">See how it works</Button>
            </div>
          </Reveal>
        </div>
        <Reveal className="mt-20 grid border-l border-t border-rule sm:grid-cols-2 lg:grid-cols-4" delay={220}>
          {([
            ["Analyze now", "#analyze"],
            ["GitHub repo ↗", "https://github.com/hydra-db/hydradb"],
            ["How it works", "#problem"],
            ["View track ↗", "https://hackhydra.hydradb.com"],
          ] as const).map(([label, href]) => (
            <a className="flex min-h-16 items-center justify-between border-b border-r border-rule px-5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted transition-colors hover:border-accent hover:text-accent" href={href} key={label} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined}>
              {label}<span aria-hidden="true">→</span>
            </a>
          ))}
        </Reveal>
        <Reveal className="flex flex-col gap-2 py-5 font-mono text-[9px] uppercase tracking-[0.15em] text-dim sm:flex-row sm:items-center sm:justify-between" delay={280}>
          <span>Built on HydraDB / one multi-source path query</span>
          <span>50 sourced packages / 94 compromised artifacts</span>
        </Reveal>
      </PageShell>
      <Divider />
    </section>
  );
}
