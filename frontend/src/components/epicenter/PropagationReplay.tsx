import { useEffect, useRef, useState } from "react";

import { useIncidentReplay } from "../../hooks/useIncidentReplay";
import type { Incident } from "../../lib/types";
import { PropagationReplayGraph } from "./PropagationReplayGraph";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

interface PropagationReplayProps {
  incidents: Incident[];
}

const formatPublishedAt = (value: string) =>
  new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(value));

export function PropagationReplay({ incidents }: PropagationReplayProps) {
  const defaultIncidentId =
    incidents.find((incident) => incident.id.includes("tanstack"))?.id ??
    incidents[0]?.id ??
    "teampcp-tanstack-2026-05-11";
  const [incidentId, setIncidentId] = useState(defaultIncidentId);
  const [visibleCount, setVisibleCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timelineRef = useRef<HTMLOListElement>(null);
  const { data, error, isLoading } = useIncidentReplay(incidentId);
  const events = data?.events ?? [];
  const visibleEvents = events.slice(0, visibleCount);
  const incidentName =
    incidents.find((incident) => incident.id === incidentId)?.name ?? incidentId;

  useEffect(() => {
    if (!isPlaying || visibleCount >= events.length) return;
    const timeout = window.setTimeout(() => {
      const nextCount = Math.min(visibleCount + 1, events.length);
      setVisibleCount(nextCount);
      if (nextCount >= events.length) setIsPlaying(false);
    }, 260);
    return () => window.clearTimeout(timeout);
  }, [events.length, isPlaying, visibleCount]);

  useEffect(() => {
    if (visibleCount === 0) return;
    timelineRef.current?.scrollTo({
      top: timelineRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [visibleCount]);

  const changeIncident = (nextIncidentId: string) => {
    setIncidentId(nextIncidentId);
    setVisibleCount(0);
    setIsPlaying(false);
  };

  const togglePlayback = () => {
    if (visibleCount >= events.length) setVisibleCount(0);
    setIsPlaying((playing) => !playing);
  };

  return (
    <Card cornerAccent eyebrow="04 / Propagation replay">
      <div className="grid border-b border-rule lg:grid-cols-[0.8fr_1.2fr]">
        <div className="border-b border-rule p-6 md:p-8 lg:border-b-0 lg:border-r">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-2xl font-medium tracking-[-0.035em] text-white">
                Release sequence
              </h3>
              <p className="mt-3 max-w-lg text-sm leading-6 text-muted">
                Replay compromised versions in the order their sourced publish
                timestamps landed in the registry.
              </p>
            </div>
            <Badge tone={events.length ? "critical" : "neutral"}>
              {isLoading ? "Loading" : `${events.length} events`}
            </Badge>
          </div>
          <label
            className="mt-7 block font-mono text-[9px] uppercase tracking-[0.16em] text-dim"
            htmlFor="replay-incident-select"
          >
            Incident
          </label>
          <select
            id="replay-incident-select"
            className="mt-2 min-h-12 w-full border border-rule-strong bg-black px-4 font-mono text-[10px] uppercase tracking-[0.1em] text-white outline-none focus:border-accent"
            value={incidentId}
            onChange={(event) => changeIncident(event.target.value)}
          >
            {incidents.map((incident) => (
              <option value={incident.id} key={incident.id}>
                {incident.name}
              </option>
            ))}
          </select>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={togglePlayback}
              disabled={isLoading || events.length === 0}
            >
              {isPlaying ? "Pause replay" : "Play replay"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setVisibleCount(0);
                setIsPlaying(false);
              }}
              disabled={visibleCount === 0}
            >
              Reset
            </Button>
          </div>
          <div className="mt-6 border-t border-rule pt-4 font-mono text-[9px] uppercase tracking-[0.14em] text-dim">
            Progress / {visibleCount} of {events.length}
          </div>
        </div>
        <div className="min-h-80 p-6 md:p-8" aria-live="polite">
          {error ? (
            <p role="alert" className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent">
              {error}
            </p>
          ) : isLoading ? (
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-dim">
              Ordering published versions...
            </p>
          ) : (
            <div>
              <PropagationReplayGraph
                events={events}
                incidentName={incidentName}
                visibleCount={visibleCount}
              />
              {visibleEvents.length > 0 ? (
                <ol ref={timelineRef} className="mt-4 max-h-64 overflow-y-auto border-l border-rule pl-5">
                  {visibleEvents.map((event, index) => (
                    <li className="relative border-b border-rule py-4 first:pt-0" key={event.nodeId}>
                      <span
                        className="absolute -left-[1.48rem] top-5 h-2 w-2 bg-accent first:top-1"
                        aria-hidden="true"
                      />
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-dim">
                          #{String(index + 1).padStart(2, "0")} / +{event.timestampOffsetSeconds}s
                        </span>
                        <Badge tone="critical">Compromised</Badge>
                      </div>
                      <div className="mt-3 break-all font-mono text-xs text-white">
                        {event.packageName}@{event.version}
                      </div>
                      <time className="mt-2 block font-mono text-[9px] uppercase tracking-[0.1em] text-dim" dateTime={event.publishedAt}>
                        {formatPublishedAt(event.publishedAt)} UTC
                      </time>
                    </li>
                  ))}
                </ol>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
