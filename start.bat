@echo off
title QuantumShield Production Server
echo ===================================================
echo   QuantumShield - Post-Quantum Cryptographic Plane
echo ===================================================
echo.
cd /d "%~dp0"

echo Checking dependencies and database...
call npx prisma db push --skip-generate

echo.
echo Starting QuantumShield on http://localhost:3000 ...
echo Press Ctrl+C to stop the server.
echo.
call npm start
pause
