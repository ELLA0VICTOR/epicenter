import { useEffect, useRef, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";

interface RevealProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  delay?: number;
}

export function Reveal({ children, className = "", delay = 0, style, ...props }: RevealProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || !("IntersectionObserver" in window)) {
      element.dataset.revealVisible = "true";
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        element.dataset.revealVisible = "true";
        observer.unobserve(element);
      },
      { rootMargin: "0px 0px -7%", threshold: 0.12 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={elementRef}
      className={`reveal ${className}`}
      style={{ ...style, "--reveal-delay": `${delay}ms` } as CSSProperties}
      {...props}
    >
      {children}
    </div>
  );
}
