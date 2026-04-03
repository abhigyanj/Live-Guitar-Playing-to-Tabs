@echo off
REM Guitar Tab Studio - Windows Run Script
REM This script starts both the backend and frontend servers

echo Starting Guitar Tab Studio...
echo.

REM Check if we're in the right directory
if not exist "run_backend.py" (
    echo Error: run_backend.py not found. Please run this script from the project root directory.
    exit /b 1
)

REM Create virtual environment if it doesn't exist
if not exist ".venv" (
    echo Creating Python virtual environment...
    python -m venv .venv
)

REM Activate virtual environment and install dependencies
echo Installing Python dependencies...
call .venv\Scripts\activate.bat
pip install -q -r requirements.txt

REM Start the Flask backend in a new window
echo Starting Flask backend on port 5000...
start "Guitar Tab Studio - Backend" cmd /k "call .venv\Scripts\activate.bat && python run_backend.py"

REM Wait a moment for the backend to start
timeout /t 3 /nobreak >nul

REM Start the React frontend in a new window
echo Starting React frontend...
cd frontend
if not exist "node_modules" (
    echo Installing npm dependencies...
    call npm install
)
start "Guitar Tab Studio - Frontend" cmd /k "npm run dev"

echo.
echo ==========================================
echo Guitar Tab Studio is running!
echo ==========================================
echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:5000
echo.
echo Close the terminal windows to stop the servers.
echo.

cd ..
