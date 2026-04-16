#!/usr/bin/env bash
# start.sh — Railway startup script for SnapMint backend
#
# Starts the bgutil PO Token provider server in the background, waits for it
# to be ready, then launches gunicorn. This enables yt-dlp to automatically
# obtain YouTube Proof-of-Origin (PO) Tokens, which are required to bypass
# YouTube's SABR streaming enforcement from data-center IPs (like Railway).
#
# Architecture:
#   [gunicorn/yt-dlp] → (localhost:4416) → [bgutil server] → YouTube JS → PO Token
#   yt-dlp-get-pot plugin bridges yt-dlp ↔ bgutil automatically.

set -e

echo "[start.sh] Starting bgutil PO Token provider..."
npx --yes bgutil-ytdlp-pot-provider &
BGUTIL_PID=$!

# Wait up to 15s for bgutil to be ready on port 4416
for i in $(seq 1 15); do
    if curl -sf http://localhost:4416/ > /dev/null 2>&1; then
        echo "[start.sh] bgutil ready on port 4416 (took ${i}s)"
        break
    fi
    if [ $i -eq 15 ]; then
        echo "[start.sh] WARNING: bgutil did not respond after 15s — continuing anyway"
    fi
    sleep 1
done

echo "[start.sh] Starting gunicorn..."
exec gunicorn app:app \
    --bind "0.0.0.0:${PORT:-5000}" \
    --timeout 300 \
    --workers 1 \
    --threads 8
