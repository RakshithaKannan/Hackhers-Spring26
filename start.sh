#!/bin/bash
# Start both WaterWise frontend and backend

ROOT="$(cd "$(dirname "$0")" && pwd)"

# Backend
echo "Starting backend on http://localhost:8000 ..."
cd "$ROOT/backend"
./venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Frontend
echo "Starting frontend on http://localhost:5173 ..."
cd "$ROOT/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Both servers running. Press Ctrl+C to stop."

# Stop both on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
