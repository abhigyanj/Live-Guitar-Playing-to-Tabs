#!/bin/bash

# Guitar Tab Studio - Run Script
# This script starts both the backend and frontend servers

echo "Starting Guitar Tab Studio..."
echo ""

# Check if we're in the right directory
if [ ! -f "run_backend.py" ]; then
    echo "Error: run_backend.py not found. Please run this script from the project root directory."
    exit 1
fi

# Start the Flask backend
echo "Starting Flask backend on port 5000..."
source .venv/bin/activate 2>/dev/null || python3 -m venv .venv && source .venv/bin/activate
pip install -q -r requirements.txt
python run_backend.py &
BACKEND_PID=$!

# Wait a moment for the backend to start
sleep 2

# Start the React frontend
echo "Starting React frontend..."
cd frontend
npm install --silent
npm run dev &
FRONTEND_PID=$!

echo ""
echo "=========================================="
echo "Guitar Tab Studio is running!"
echo "=========================================="
echo ""
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
