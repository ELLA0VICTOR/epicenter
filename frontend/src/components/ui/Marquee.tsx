import { PixelMark } from "./PixelMark";

interface MarqueeProps {
  items: string[];
}

export function Marquee({ items }: MarqueeProps) {
  const content = items.length > 0 ? items : ["HydraDB graph ready", "TeamPCP incident corpus loaded", "Paste a package-lock.json"];
  const repeated = [...content, ...content];
  return (
    <div className="overflow-hidden border-y border-rule bg-black py-3" aria-label="Incident ticker">
      <div className="marquee-track flex items-center">
        {repeated.map((item, index) => (
          <div className="flex items-center gap-5 pr-5 font-mono text-[10px] uppercase tracking-[0.15em] text-muted" key={`${item}-${index}`}>
            <PixelMark className="h-3 w-3 shrink-0 text-accent" />
            <span className="whitespace-nowrap">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
