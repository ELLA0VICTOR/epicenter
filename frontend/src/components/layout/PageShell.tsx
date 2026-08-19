import type { ReactNode } from "react";

interface PageShellProps {
  children: ReactNode;
  className?: string;
}

export function PageShell({ children, className = "" }: PageShellProps) {
  return <div className={`mx-auto w-full max-w-shell px-6 md:px-10 ${className}`}>{children}</div>;
}
