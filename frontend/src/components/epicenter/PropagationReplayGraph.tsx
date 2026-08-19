import type { ReplayEvent } from "../../lib/types";
import { Badge } from "../ui/Badge";

interface PropagationReplayGraphProps {
  events: ReplayEvent[];
  incidentName: string;
  visibleCount: number;
}

interface ReplayPosition {
  x: number;
  y: number;
}

const WIDTH = 760;
const HEIGHT = 420;
const CENTER = { x: WIDTH / 2, y: 202 };

function getRingCounts(total: number): number[] {
  if (total <= 12) return [total];
  if (total <= 36) return [12, total - 12];
  return [12, 24, total - 36];
}

function buildReplayLayout(total: number): ReplayPosition[] {
  const ringCounts = getRingCounts(total);
  const radii =
    ringCounts.length === 1
      ? [105]
      : ringCounts.length === 2
        ? [78, 154]
        : [66, 126, 186];

  return ringCounts.flatMap((count, ringIndex) =>
    Array.from({ length: count }, (_, slotIndex) => {
      const angle = -Math.PI / 2 + (slotIndex / count) * Math.PI * 2;
      const radius = radii[ringIndex] ?? 186;
      return {
        x: CENTER.x + Math.cos(angle) * radius,
        y: CENTER.y + Math.sin(angle) * radius,
      };
    }),
  );
}

export function PropagationReplayGraph({
  events,
  incidentName,
  visibleCount,
}: PropagationReplayGraphProps) {
  const positions = buildReplayLayout(events.length);
  const visibleEvents = events.slice(0, visibleCount);
  const currentEvent = visibleEvents.at(-1) ?? null;

  return (
    <div className="border border-rule bg-black">
      <div className="flex flex-col gap-3 border-b border-rule px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted">
          Incident membership map
        </div>
        <div className="flex flex-wrap gap-4 font-mono text-[8px] uppercase tracking-[0.12em] text-dim">
          <span className="flex items-center gap-2">
            <i className="h-2 w-2 bg-accent" /> compromised version
          </span>
          <span>Lines mean “part of incident”</span>
        </div>
      </div>
      <svg
        className="block aspect-[760/420] min-h-[250px] w-full"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`${incidentName} replay graph with ${visibleCount} of ${events.length} compromised versions visible`}
      >
        <g fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" aria-hidden="true">
          <rect x="311" y="133" width="138" height="138" />
          <rect x="247" y="69" width="266" height="266" />
          <rect x="187" y="9" width="386" height="386" />
        </g>

        <g aria-hidden="true">
          {visibleEvents.map((event, index) => {
            const position = positions[index] ?? CENTER;
            return (
              <line
                className="replay-edge-enter"
                data-replay-edge
                key={`edge-${event.nodeId}`}
                pathLength="1"
                x1={CENTER.x}
                y1={CENTER.y}
                x2={position.x}
                y2={position.y}
                stroke="rgba(255,87,25,0.28)"
                strokeWidth="1"
              />
            );
          })}
        </g>

        <g>
          {visibleEvents.map((event, index) => {
            const position = positions[index] ?? CENTER;
            const isCurrent = index === visibleEvents.length - 1;
            const size = isCurrent ? 10 : 7;
            return (
              <g
                className="replay-node-enter"
                data-replay-node
                key={event.nodeId}
                transform={`translate(${position.x} ${position.y})`}
              >
                <title>{`${event.packageName}@${event.version}`}</title>
                {isCurrent ? (
                  <rect
                    x="-8"
                    y="-8"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="#FF5719"
                    strokeWidth="1"
                  />
                ) : null}
                <rect
                  x={-size / 2}
                  y={-size / 2}
                  width={size}
                  height={size}
                  fill={isCurrent ? "#FFFFFF" : "#FF5719"}
                />
              </g>
            );
          })}
        </g>

        <g transform={`translate(${CENTER.x} ${CENTER.y})`}>
          <rect x="-17" y="-17" width="34" height="34" fill="#FF5719" />
          <rect x="-7" y="-7" width="14" height="14" fill="#000000" />
          <text
            y="36"
            textAnchor="middle"
            fill="#FFFFFF"
            fontFamily="var(--font-mono)"
            fontSize="9"
            letterSpacing="1.5"
          >
            INCIDENT
          </text>
          <text
            y="51"
            textAnchor="middle"
            fill="#6E7180"
            fontFamily="var(--font-mono)"
            fontSize="8"
            letterSpacing="1"
          >
            {visibleCount} / {events.length}
          </text>
        </g>
      </svg>
      <div className="min-h-24 border-t border-rule p-4" aria-live="polite">
        {currentEvent ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="font-mono text-[8px] uppercase tracking-[0.14em] text-dim">
                Latest node / #{String(visibleCount).padStart(2, "0")} / +{currentEvent.timestampOffsetSeconds}s
              </div>
              <div className="mt-2 break-all font-mono text-xs text-white">
                {currentEvent.packageName}@{currentEvent.version}
              </div>
            </div>
            <Badge tone="critical">Compromised</Badge>
          </div>
        ) : (
          <div className="flex min-h-16 items-center justify-center text-center">
            <div>
              <div className="mx-auto h-2 w-2 bg-accent" />
              <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                Press play to connect release nodes
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
