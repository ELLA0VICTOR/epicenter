FROM node:24-bookworm-slim AS backend-builder

WORKDIR /workspace

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci

COPY backend backend
RUN npm run build --workspace backend

RUN mkdir -p /runtime/backend && \
    cp backend/package.json /runtime/backend/package.json && \
    npm install --prefix /runtime/backend --omit=dev --ignore-scripts

FROM ghcr.io/hydra-db/hydradb@sha256:db78309a233be54662db29744047e985a39b51c45a270d1a1f47c31a62cdb709

USER root

COPY --from=backend-builder /usr/local/bin/node /usr/local/bin/node
COPY --from=backend-builder --chown=10001:10001 /workspace/backend/dist /app/backend/dist
COPY --from=backend-builder --chown=10001:10001 /runtime/backend/node_modules /app/backend/node_modules
COPY --chown=10001:10001 deploy/render/entrypoint.sh /usr/local/bin/epicenter-entrypoint

RUN chmod 0755 /usr/local/bin/epicenter-entrypoint && \
    mkdir -p /data/store /data/cache /data/auth /app/backend && \
    chown -R 10001:10001 /data /app/backend

ENV NODE_ENV=production \
    CLOUD_PROVIDER=local \
    LOCAL_PATH=/data/store \
    GRAPH_NAMESPACE=default \
    GRAPH_ID=epicenter \
    GRAPH_CELL_ID=cell-0 \
    GRAPH_CELLS=cell-0 \
    GRAPH_NODE_ID=node-0 \
    GRAPH_BOLT_ADDR=127.0.0.1:7687 \
    GRAPH_BOLT_NODE_ADDRESSES=node-0=127.0.0.1:7687 \
    GRAPH_ADVERTISED_BOLT_ADDR=127.0.0.1:7687 \
    GRAPH_HTTP_ADDR=127.0.0.1:8443 \
    GRAPH_ADMIN_ADDR=127.0.0.1:9090 \
    GRAPH_DATA_CACHE_DIR=/data/cache \
    GRAPH_AUTH_TOKEN_FILE=/data/auth/token \
    GRAPH_ALLOW_PLAINTEXT=true \
    HYDRA_HTTP_URL=http://127.0.0.1:8443 \
    HYDRA_NAMESPACE=default \
    HYDRA_GRAPH_ID=epicenter \
    HYDRA_CELL_ID=cell-0 \
    RUST_MIN_STACK=33554432

USER 10001:10001
WORKDIR /app/backend

EXPOSE 10000

ENTRYPOINT ["/usr/local/bin/epicenter-entrypoint"]
