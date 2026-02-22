#!/bin/bash
# Start the WaterWise backend server
cd "$(dirname "$0")/backend"
echo "Starting WaterWise backend on http://localhost:8000 ..."
./venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --reload
