@echo off
title CampusBite System Startup
color 0A
echo.
echo ========================================
echo    CampusBite System Startup Script
echo ========================================
echo.
echo This script will start:
echo 1. PostgreSQL Database (if not running)
echo 2. Backend API Server
echo 3. Frontend Development Server
echo.
echo Please make sure PostgreSQL is installed and running
echo.
pause

echo.
echo [1/3] Checking PostgreSQL Database...
echo.

REM Check if PostgreSQL is running
netstat -an | findstr 5432 >nul
if %errorlevel% neq 0 (
    echo PostgreSQL is not running on port 5432
    echo Please start PostgreSQL service manually
    echo.
    echo On Windows: 
    echo - Open Services (services.msc)
    echo - Find "postgresql-x64-14" (or similar)
    echo - Right-click and select "Start"
    echo.
    pause
    exit /b 1
) else (
    echo ✅ PostgreSQL is running on port 5432
)

echo.
echo [2/3] Starting Backend API Server...
echo.

REM Start Backend Server
cd /d "%~dp0CampusBite_Backend-main\CampusBite_Backend-main"
start "CampusBite Backend" cmd /k "echo Backend Server Starting... && npm start"

REM Wait for backend to start
echo Waiting for backend to initialize...
timeout /t 10 /nobreak >nul

REM Check if backend is running
netstat -an | findstr 5000 >nul
if %errorlevel% neq 0 (
    echo ❌ Backend failed to start on port 5000
    pause
    exit /b 1
) else (
    echo ✅ Backend is running on port 5000
)

echo.
echo [3/3] Starting Frontend Development Server...
echo.

REM Start Frontend Server
cd /d "%~dp0CampusBite_App-main\CampusBite_App-main"
start "CampusBite Frontend" cmd /k "echo Frontend Server Starting... && npx expo start --web --port 8082"

REM Wait for frontend to start
echo Waiting for frontend to initialize...
timeout /t 15 /nobreak >nul

REM Check if frontend is running
netstat -an | findstr 8082 >nul
if %errorlevel% neq 0 (
    echo ❌ Frontend failed to start on port 8082
    pause
    exit /b 1
) else (
    echo ✅ Frontend is running on port 8082
)

echo.
echo ========================================
echo    CampusBite System Started Successfully!
echo ========================================
echo.
echo 🌐 Frontend: http://localhost:8082
echo 🔧 Backend API: http://localhost:5000
echo 🗄️  Database: PostgreSQL (localhost:5432)
echo.
echo 🎯 Test Accounts:
echo    Consumer: mark@campusbite.com / password123
echo    Admin: sysadmin@campusbite.com / password123
echo    Vendor: vendor2@campusbite.com / password123 (needs approval)
echo    Rider: rider@campusbite.com / password123 (needs approval)
echo.
echo Press any key to open the application in your browser...
pause >nul

start http://localhost:8082

echo.
echo 🚀 CampusBite is now running!
echo Keep this window open to maintain the services.
echo.
echo To stop all services:
echo 1. Close this window
echo 2. Close the Backend and Frontend windows that opened
echo.
pause
