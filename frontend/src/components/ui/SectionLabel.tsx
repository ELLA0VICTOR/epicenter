import { PixelMark } from "./PixelMark";

interface SectionLabelProps {
  number: string;
  label: string;
}

export function SectionLabel({ number, label }: SectionLabelProps) {
  return (
    <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.19em]">
      <PixelMark className="h-3 w-3 text-accent" />
      <span className="text-accent">{number}</span>
      <span className="text-dim">/</span>
      <span className="text-muted">{label}</span>
    </div>
  );
}
