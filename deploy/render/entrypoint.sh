#!/bin/sh
set -eu

: "${HYDRA_AUTH_TOKEN:?HYDRA_AUTH_TOKEN must be set}"

export PORT="${PORT:-10000}"
export BACKEND_PORT="$PORT"
export FRONTEND_ORIGIN="${FRONTEND_ORIGIN:-*}"

mkdir -p /data/store /data/cache /data/auth
printf '%s\n' "$HYDRA_AUTH_TOKEN" > /data/auth/token
chmod 600 /data/auth/token

hydra_pid=""
backend_pid=""

shutdown() {
  if [ -n "$backend_pid" ]; then
    kill "$backend_pid" 2>/dev/null || true
  fi
  if [ -n "$hydra_pid" ]; then
    kill "$hydra_pid" 2>/dev/null || true
  fi
  wait 2>/dev/null || true
}

trap shutdown EXIT INT TERM

echo "[startup] launching HydraDB"
/usr/local/bin/graph-node > /tmp/hydradb.log 2>&1 &
hydra_pid=$!

attempt=0
until node -e "fetch('http://127.0.0.1:9090/readyz').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 60 ]; then
    echo "[startup] HydraDB did not become ready"
    cat /tmp/hydradb.log
    exit 1
  fi
  sleep 1
done

echo "[startup] seeding the incident graph"
node dist/scripts/seed-incidents.js
node dist/scripts/seed-typosquat-list.js

echo "[startup] launching Epicenter API on port $PORT"
node dist/src/index.js &
backend_pid=$!
wait "$backend_pid"
