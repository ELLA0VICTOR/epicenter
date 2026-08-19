interface StatCellProps {
  value: string | number;
  label: string;
  detail?: string;
}

export function StatCell({ value, label, detail }: StatCellProps) {
  return (
    <div className="min-h-44 border border-rule p-6 md:p-8">
      <div className="font-display text-4xl font-medium leading-none text-accent md:text-5xl">{value}</div>
      <div className="mt-7 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">{label}</div>
      {detail ? <div className="mt-2 text-xs text-dim">{detail}</div> : null}
    </div>
  );
}
