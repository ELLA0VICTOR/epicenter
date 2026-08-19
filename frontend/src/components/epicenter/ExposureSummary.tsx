import type { AnalyzeResponse } from "../../lib/types";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";

interface ExposureSummaryProps {
  result: AnalyzeResponse;
}

export function ExposureSummary({ result }: ExposureSummaryProps) {
  const exposed = result.exposure.exposed;
  return (
    <Card cornerAccent eyebrow="Exposure summary" className="h-full">
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between gap-4">
          <Badge tone={exposed ? "critical" : "safe"}>{exposed ? "Exposed" : "Safe"}</Badge>
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-dim">{result.timing.totalMs.toFixed(0)} ms total</span>
        </div>
        <div className={`mt-8 font-display text-5xl leading-none ${exposed ? "text-accent" : "text-white"}`}>
          {result.exposure.totalCount}
        </div>
        <h3 className="mt-4 text-xl font-medium text-white">
          {exposed ? "Compromised releases resolved" : "No seeded compromise found"}
        </h3>
        <p className="mt-3 text-sm leading-6 text-muted">
          {exposed
            ? "These exact package versions intersect the sourced TeamPCP incident graph. Review every path before remediation."
            : "No direct or transitive path from this resolved tree reached the current incident corpus."}
        </p>
        <div className="mt-8 grid grid-cols-2 border-l border-t border-rule">
          {[
            [result.submission.packageCount, "Packages"],
            [result.submission.dependencyEdgeCount, "Edges"],
            [result.exposure.directCount, "Direct"],
            [result.exposure.transitiveCount, "Transitive"],
          ].map(([value, label]) => (
            <div className="border-b border-r border-rule p-4" key={label}>
              <div className="font-mono text-lg text-white">{value}</div>
              <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.15em] text-dim">{label}</div>
            </div>
          ))}
        </div>
        {result.exposures.length > 0 ? (
          <div className="mt-7 space-y-3">
            {result.exposures.map((exposure) => (
              <a
                className="block border border-rule p-4 transition-colors hover:border-accent"
                href={exposure.incident.sourceUrl}
                key={exposure.compromisedKey}
                target="_blank"
                rel="noreferrer"
              >
                <div className="break-all font-mono text-[11px] text-accent">{exposure.compromisedKey}</div>
                <div className="mt-2 font-mono text-[8px] uppercase tracking-[0.13em] text-dim">
                  {exposure.type} / {exposure.incident.name} ↗
                </div>
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
