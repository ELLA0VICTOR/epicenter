import { useEffect, useMemo, useState } from "react";
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";

import type { GraphEdge, GraphNode } from "../../lib/types";
import { Card } from "../ui/Card";

interface BlastRadiusGraphProps {
  graph: { nodes: GraphNode[]; edges: GraphEdge[] };
}

interface SimNode extends GraphNode, SimulationNodeDatum {}
interface SimLink extends SimulationLinkDatum<SimNode> {
  id: string;
  source: string | SimNode;
  target: string | SimNode;
  type: string;
}

const WIDTH = 820;
const HEIGHT = 470;

export function BlastRadiusGraph({ graph }: BlastRadiusGraphProps) {
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const nodes = useMemo<SimNode[]>(() => graph.nodes.map((node) => ({ ...node })), [graph.nodes]);
  const links = useMemo<SimLink[]>(
    () => graph.edges.map((edge) => ({ ...edge })),
    [graph.edges],
  );

  useEffect(() => {
    if (nodes.length === 0) {
      return;
    }
    const simulation = forceSimulation(nodes)
      .force("link", forceLink<SimNode, SimLink>(links).id((node) => node.id).distance(145).strength(0.7))
      .force("charge", forceManyBody().strength(-380))
      .force("collide", forceCollide(42))
      .force("center", forceCenter(WIDTH / 2, HEIGHT / 2))
      .alphaDecay(0.055)
      .on("tick", () => {
        setPositions(
          new Map(
            nodes.map((node) => [
              node.id,
              {
                x: Math.max(36, Math.min(WIDTH - 36, node.x ?? WIDTH / 2)),
                y: Math.max(36, Math.min(HEIGHT - 36, node.y ?? HEIGHT / 2)),
              },
            ]),
          ),
        );
      });
    return () => {
      simulation.stop();
    };
  }, [links, nodes]);

  return (
    <Card eyebrow="HydraDB / resolved exposure paths" className="h-full overflow-hidden">
      {nodes.length === 0 ? (
        <div className="flex min-h-[470px] items-center justify-center p-8 text-center">
          <div>
            <div className="mx-auto h-3 w-3 bg-white" />
            <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.15em] text-muted">No exposure path to render</p>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-dim">The graph stays empty when no compromised target is reachable.</p>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden">
          <div className="absolute left-4 top-4 z-10 flex gap-4 font-mono text-[8px] uppercase tracking-[0.12em] text-dim">
            <span className="flex items-center gap-2"><i className="h-2 w-2 bg-white" /> dependency</span>
            <span className="flex items-center gap-2"><i className="h-2 w-2 bg-accent" /> compromised</span>
          </div>
          <svg className="block min-h-[470px] w-full" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Dependency exposure graph">
            <g stroke="rgba(255,255,255,0.22)" strokeWidth="1">
              {links.map((link) => {
                const sourceId = typeof link.source === "string" ? link.source : link.source.id;
                const targetId = typeof link.target === "string" ? link.target : link.target.id;
                const source = positions.get(sourceId);
                const target = positions.get(targetId);
                return source && target ? <line key={link.id} x1={source.x} y1={source.y} x2={target.x} y2={target.y} /> : null;
              })}
            </g>
            {nodes.map((node) => {
              const position = positions.get(node.id) ?? { x: WIDTH / 2, y: HEIGHT / 2 };
              return (
                <g key={node.id} transform={`translate(${position.x} ${position.y})`}>
                  <rect x="-8" y="-8" width="16" height="16" fill={node.compromised ? "#FF5719" : "#FFFFFF"} />
                  <text className="graph-label" x="14" y="4">{node.name}@{node.version}</text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </Card>
  );
}
