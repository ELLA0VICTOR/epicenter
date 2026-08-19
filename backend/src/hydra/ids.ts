import { createHash } from "node:crypto";

/**
 * HydraDB uses a non-negative integer `id` as vertex/relationship identity.
 * Keep ids below 2^52 so JSON and JavaScript preserve them exactly.
 */
export function stableGraphId(namespace: string, value: string): number {
  const hex = createHash("sha256")
    .update(`${namespace}\0${value}`)
    .digest("hex")
    .slice(0, 13);
  const id = Number.parseInt(hex, 16);
  return id === 0 ? 1 : id;
}
