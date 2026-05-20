#!/bin/bash
# Jess Trading Content App — Start both backend and frontend

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

echo "Starting Jess Trading Content App..."
echo ""

# Activate Python venv
if [ -f .venv/bin/activate ]; then
    source .venv/bin/activate
else
    echo "Error: Python venv not found. Run: uv venv .venv && uv pip install -r backend/requirements.txt"
    exit 1
fi

# Kill any process already on port 8000
lsof -ti:8000 | xargs kill -9 2>/dev/null || true

# Start backend
echo "[Backend] Starting FastAPI on http://localhost:8000"
uvicorn backend.main:app --reload --port 8000 &
BACKEND_PID=$!

# Start frontend
echo "[Frontend] Starting Vite on http://localhost:5173"
cd frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "Open http://localhost:5173 in your browser"
echo "Press Ctrl+C to stop both servers"
echo ""

# Handle cleanup
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
