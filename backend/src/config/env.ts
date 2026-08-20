const readString = (name: string, fallback: string): string => {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : fallback;
};

const readPort = (name: string, fallback: number): number => {
  const raw = process.env[name];
  if (!raw) return fallback;

  const value = Number.parseInt(raw, 10);
  if (!Number.isInteger(value) || value < 1 || value > 65_535) {
    throw new Error(`${name} must be an integer between 1 and 65535`);
  }
  return value;
};

export const env = Object.freeze({
  hydraHttpUrl: readString("HYDRA_HTTP_URL", "http://127.0.0.1:8443").replace(/\/$/, ""),
  hydraAuthToken: readString(
    "HYDRA_AUTH_TOKEN",
    "local-development-token-32-bytes",
  ),
  hydraNamespace: readString("HYDRA_NAMESPACE", "default"),
  hydraGraphId: readString("HYDRA_GRAPH_ID", "epicenter"),
  hydraCellId: readString("HYDRA_CELL_ID", "cell-0"),
  backendPort: readPort("BACKEND_PORT", readPort("PORT", 3001)),
  frontendOrigin: readString("FRONTEND_ORIGIN", "*"),
});
