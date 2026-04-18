#!/usr/bin/env bash
# start.sh — Northflank startup script for SnapMint backend
#
# Starts the bgutil PO Token provider server in the background, waits for it
# to be ready, then launches gunicorn.

set -e

# ── Forward PROXY_URL to bgutil so tokens are generated via residential IP ──
if [ -n "$PROXY_URL" ]; then
    export HTTPS_PROXY="$PROXY_URL"
    export HTTP_PROXY="$PROXY_URL"
    echo "[start.sh] Proxy set: $PROXY_URL"
fi

# ── Start bgutil PO Token provider (auto-refreshing tokens) ─────────────────
echo "[start.sh] Starting bgutil PO Token provider..."
npx --yes bgutil-ytdlp-pot-provider &
BGUTIL_PID=$!

# Wait up to 30s for bgutil to be ready on port 4416
BGUTIL_READY=false
for i in $(seq 1 30); do
    if curl -sf http://localhost:4416/ > /dev/null 2>&1; then
        echo "[start.sh] bgutil ready on port 4416 (took ${i}s)"
        BGUTIL_READY=true
        break
    fi
    sleep 1
done

if [ "$BGUTIL_READY" = false ]; then
    echo "[start.sh] WARNING: bgutil did not respond after 30s"
    if [ -n "$PO_TOKEN" ] && [ -n "$VISITOR_DATA" ]; then
        echo "[start.sh] Falling back to static PO_TOKEN / VISITOR_DATA env vars"
    else
        echo "[start.sh] No static PO_TOKEN set either — YouTube may block requests"
    fi
fi

# ── Start gunicorn ───────────────────────────────────────────────────────────
echo "[start.sh] Starting gunicorn on port ${PORT:-5000}..."
exec gunicorn app:app \
    --bind "0.0.0.0:${PORT:-5000}" \
    --timeout 300 \
    --workers 1 \
    --threads 8
