import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "solid" | "outline";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  href?: string;
  external?: boolean;
}

const styles: Record<ButtonVariant, string> = {
  solid: "border-accent bg-accent text-black hover:bg-white hover:border-white",
  outline: "border-rule-strong bg-black text-fg hover:border-accent hover:text-accent",
};

export function Button({
  children,
  className = "",
  variant = "solid",
  href,
  external = false,
  ...buttonProps
}: ButtonProps) {
  const classes = `inline-flex min-h-12 items-center justify-center gap-3 border px-5 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${styles[variant]} ${className}`;
  if (href) {
    return (
      <a className={classes} href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>
        {children}
        {external ? <span aria-hidden="true">↗</span> : null}
      </a>
    );
  }
  return (
    <button className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
