interface PixelMarkProps {
  className?: string;
  title?: string;
}

export function PixelMark({ className = "h-5 w-5", title }: PixelMarkProps) {
  return (
    <svg className={className} viewBox="0 0 18 18" role={title ? "img" : "presentation"} aria-hidden={!title}>
      {title ? <title>{title}</title> : null}
      <rect x="0" y="0" width="5" height="5" fill="currentColor" />
      <rect x="7" y="0" width="5" height="5" fill="currentColor" opacity="0.36" />
      <rect x="14" y="0" width="4" height="5" fill="currentColor" opacity="0.7" />
      <rect x="0" y="7" width="5" height="5" fill="currentColor" opacity="0.36" />
      <rect x="7" y="7" width="5" height="5" fill="#fff" />
      <rect x="14" y="7" width="4" height="5" fill="currentColor" />
      <rect x="0" y="14" width="5" height="4" fill="currentColor" opacity="0.7" />
      <rect x="7" y="14" width="5" height="4" fill="currentColor" />
      <rect x="14" y="14" width="4" height="4" fill="currentColor" opacity="0.36" />
    </svg>
  );
}
