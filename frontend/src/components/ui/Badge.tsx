import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  tone?: "safe" | "critical" | "neutral";
}

export function Badge({ children, tone = "neutral" }: BadgeProps) {
  const toneClass =
    tone === "critical"
      ? "border-accent text-accent"
      : tone === "safe"
        ? "border-white text-white"
        : "border-rule-strong text-muted";
  return (
    <span className={`inline-flex border px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] ${toneClass}`}>
      {children}
    </span>
  );
}
