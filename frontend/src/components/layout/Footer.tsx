import { Divider } from "../ui/Divider";
import { PixelMark } from "../ui/PixelMark";
import { Reveal } from "../ui/Reveal";
import { PageShell } from "./PageShell";

export function Footer() {
  return (
    <footer className="mt-28 border-t border-rule bg-black pt-16">
      <PageShell>
        <Reveal className="grid gap-14 pb-16 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3 text-accent">
              <PixelMark className="h-5 w-5" />
              <div className="font-display text-3xl text-white">EPI<span className="text-accent">CENTER</span></div>
            </div>
            <p className="mt-6 max-w-sm text-sm leading-6 text-muted">
              Trace the software supply chain from a lockfile to the exact compromised release—across every dependency hop.
            </p>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.16em]">
            <div className="mb-5 text-dim">Explore</div>
            <div className="grid gap-3 text-muted">
              <a className="hover:text-accent" href="#problem">The problem</a>
              <a className="hover:text-accent" href="#analyze">Analyze</a>
              <a className="hover:text-accent" href="#results">Blast radius</a>
              <a className="hover:text-accent" href="#signals">Adjacent signals</a>
            </div>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.16em]">
            <div className="mb-5 text-dim">Built for</div>
            <div className="grid gap-3 text-muted">
              <a className="hover:text-accent" href="https://hackhydra.hydradb.com" target="_blank" rel="noreferrer">Hack Hydra ↗</a>
              <a className="hover:text-accent" href="https://github.com/hydra-db/hydradb" target="_blank" rel="noreferrer">HydraDB ↗</a>
            </div>
          </div>
        </Reveal>
        <Divider />
        <div className="flex flex-col gap-3 py-6 font-mono text-[9px] uppercase tracking-[0.15em] text-dim sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Epicenter / MIT</span>
          <span>Hack Hydra · Track 2A · Supply-chain blast radius</span>
        </div>
      </PageShell>
    </footer>
  );
}
