import { Button } from "../ui/Button";
import { PixelMark } from "../ui/PixelMark";
import { PageShell } from "./PageShell";

export function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-black">
      <PageShell className="flex h-[74px] items-center justify-between gap-6">
        <a href="#top" className="flex items-center gap-3" aria-label="Epicenter home">
          <PixelMark className="h-[18px] w-[18px] text-accent" />
          <span className="font-display text-lg tracking-[-0.03em] text-white">EPI<span className="text-accent">CENTER</span></span>
        </a>
        <nav className="hidden items-center gap-7 font-mono text-[10px] uppercase tracking-[0.16em] text-muted lg:flex" aria-label="Primary navigation">
          <a className="hover:text-accent" href="#problem">The problem</a>
          <a className="hover:text-accent" href="#analyze">Analyze</a>
          <a className="hover:text-accent" href="#results">Results</a>
          <a className="hover:text-accent" href="#signals">Signals</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button className="hidden min-h-10 px-4 sm:inline-flex" variant="outline" href="https://github.com/hydra-db/hydradb" external>
            GitHub
          </Button>
          <Button className="min-h-10 px-4" href="#analyze">Analyze</Button>
        </div>
      </PageShell>
    </header>
  );
}
