@echo off
echo ============================================
echo C4ISR AI Service - Local Startup
echo ============================================
echo.

cd /d "%~dp0"

echo Checking Python environment...
python --version

echo.
echo Installing dependencies...
pip install -r requirements.txt -q

echo.
echo Starting AI Service on http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo Press Ctrl+C to stop
echo.

uvicorn main:app --host 0.0.0.0 --port 8000 --reload
