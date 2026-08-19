interface DividerProps {
  inset?: boolean;
}

export function Divider({ inset = false }: DividerProps) {
  return <div className={`h-px bg-rule ${inset ? "mx-6 md:mx-10" : "w-full"}`} aria-hidden="true" />;
}
