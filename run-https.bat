@echo off
title Menjalankan Jimamet 2.0 (HTTPS - Kamera Mobile/LAN)
echo ==============================================
echo   Memulai Server Jimamet 2.0 (Mode HTTPS)
echo ==============================================
echo.

echo Menyiapkan Backend (Django + Daphne di Port 8000)...
powershell -Command "$conn = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue; if ($conn) { $conn | Select-Object -ExpandProperty OwningProcess | Select-Object -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } }"
start "Jimamet - Backend" cmd /k "cd backend && title Jimamet Backend && call venv\Scripts\activate && python -m daphne -b 0.0.0.0 -p 8000 config.asgi:application"

echo Menyiapkan Frontend HTTPS (Next.js di Port 3000)...
powershell -Command "$conn = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue; if ($conn) { $conn | Select-Object -ExpandProperty OwningProcess | Select-Object -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } }"
start "Jimamet - Frontend (HTTPS)" cmd /k "cd frontend && title Jimamet Frontend HTTPS && npm run dev:https"

echo.
echo Selesai! Buka alamat https://[IP-WiFi]:3000 di HP untuk memakai Kamera Real-Time.
echo Anda bisa menutup jendela ini.

