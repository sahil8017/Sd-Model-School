#!/bin/sh
# start.sh — starts the Express API server and the Nitro SSR server together.
# The Nitro server owns PORT=7860 (public, HuggingFace Spaces).
# The Express API server owns API_PORT=3001 (internal only).

set -e

echo "===== Application Startup at $(date '+%Y-%m-%d %H:%M:%S') ====="

# Start Express API server in the background
node server.cjs &
API_PID=$!

# Wait a moment for the API server + MongoDB to initialise
sleep 3

# Start Nitro SSR server in the foreground (owns PORT=7860)
# NITRO_PORT is used by the node-server preset; PORT is the fallback.
NITRO_PORT=${PORT:-7860} node .output/server/index.mjs &
NITRO_PID=$!

# If either process dies, kill the other and exit
wait_any() {
  wait -n 2>/dev/null || true
}

# Keep container alive as long as both processes are running
trap "kill $API_PID $NITRO_PID 2>/dev/null; exit 0" INT TERM

wait $API_PID $NITRO_PID
