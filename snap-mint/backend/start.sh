#!/usr/bin/env bash
# start.sh — Northflank startup script for SnapMint backend

set -e

# Start gunicorn
echo "[start.sh] Starting gunicorn on port ${PORT:-5000}..."
exec gunicorn app:app \
    --bind "0.0.0.0:${PORT:-5000}" \
    --timeout 300 \
    --workers 1 \
    --threads 8
