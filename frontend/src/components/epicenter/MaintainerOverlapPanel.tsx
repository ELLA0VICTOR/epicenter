import { useState } from "react";

import { useMaintainerOverlap } from "../../hooks/useMaintainerOverlap";
import type { Incident } from "../../lib/types";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";

interface MaintainerOverlapPanelProps {
  incidents: Incident[];
}

export function MaintainerOverlapPanel({
  incidents,
}: MaintainerOverlapPanelProps) {
  const defaultIncidentId =
    incidents.find((incident) => incident.id.includes("sap"))?.id ??
    incidents[0]?.id ??
    "teampcp-sap-2026-04-29";
  const [incidentId, setIncidentId] = useState(defaultIncidentId);
  const { data, error, isLoading } = useMaintainerOverlap(incidentId);
  const result = data?.incident.id === incidentId ? data : null;

  return (
    <Card cornerAccent eyebrow="05 / Maintainer overlap" className="h-full">
      <div className="border-b border-rule p-6 md:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-2xl font-medium tracking-[-0.035em] text-white">
              Shared publishing trust
            </h3>
            <p className="mt-3 max-w-lg text-sm leading-6 text-muted">
              Follow real MAINTAINS edges from an incident&apos;s compromised set
              to packages outside that set.
            </p>
          </div>
          <Badge tone={result?.overlaps.length ? "critical" : "safe"}>
            {isLoading ? "Querying" : `${result?.overlaps.length ?? 0} overlaps`}
          </Badge>
        </div>
        <label className="mt-7 block font-mono text-[9px] uppercase tracking-[0.16em] text-dim" htmlFor="incident-overlap-select">
          Incident
        </label>
        <select
          id="incident-overlap-select"
          className="mt-2 min-h-12 w-full border border-rule-strong bg-black px-4 font-mono text-[10px] uppercase tracking-[0.1em] text-white outline-none focus:border-accent"
          value={incidentId}
          onChange={(event) => setIncidentId(event.target.value)}
        >
          {incidents.map((incident) => (
            <option value={incident.id} key={incident.id}>
              {incident.name}
            </option>
          ))}
        </select>
      </div>
      <div className="p-6 md:p-8" aria-live="polite">
        {error ? (
          <p role="alert" className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent">{error}</p>
        ) : isLoading || !result ? (
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-dim">Traversing maintainer edges...</p>
        ) : result.overlaps.length === 0 ? (
          <div>
            <div className="font-display text-5xl text-white">0</div>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-white">No outside-package overlap</p>
            <p className="mt-3 text-sm leading-6 text-dim">
              The {result.summary.compromisedPackageCount} compromised packages
              in this incident share no maintainer with another package in the
              curated graph.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {result.overlaps.map((overlap) => (
              <div className="border border-rule p-4" key={overlap.maintainer}>
                <div className="font-mono text-xs text-accent">@{overlap.maintainer}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {overlap.otherPackages.map((packageName) => (
                    <Badge key={packageName}>{packageName}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
