import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  cornerAccent?: boolean;
  eyebrow?: string;
}

export function Card({ children, cornerAccent = false, eyebrow, className = "", ...props }: CardProps) {
  return (
    <div className={`relative border border-rule bg-black ${className}`} {...props}>
      {eyebrow ? (
        <div className="border-b border-rule px-5 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-dim">
          {eyebrow}
        </div>
      ) : null}
      {children}
      {cornerAccent ? <span className="absolute right-[-1px] top-[-1px] h-[9px] w-[9px] bg-accent" aria-hidden="true" /> : null}
    </div>
  );
}
