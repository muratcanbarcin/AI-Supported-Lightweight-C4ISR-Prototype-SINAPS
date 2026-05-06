@echo off
cd /d "%~dp0"

chcp 65001 >nul
set PYTHONIOENCODING=utf-8

echo [ai-service] Gereksinimler yükleniyor...
python -m pip install -r requirements.txt -q

echo [ai-service] http://localhost:8000 ^| Swagger: http://localhost:8000/docs
echo Durdurmak için Ctrl+C
echo.

python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
