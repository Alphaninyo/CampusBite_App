# CampusBite System Startup Script
Write-Host "========================================" -ForegroundColor Green
Write-Host "   CampusBite System Startup Script" -ForegroundColor Green  
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "This script will start:" -ForegroundColor Yellow
Write-Host "1. PostgreSQL Database (if not running)" -ForegroundColor Yellow
Write-Host "2. Backend API Server" -ForegroundColor Yellow
Write-Host "3. Frontend Development Server" -ForegroundColor Yellow
Write-Host ""
Write-Host "Please make sure PostgreSQL is installed and running" -ForegroundColor Red
Write-Host ""

# Check if PostgreSQL is running
Write-Host "[1/3] Checking PostgreSQL Database..." -ForegroundColor Cyan
$postgresRunning = netstat -an | Select-String "5432"
if (-not $postgresRunning) {
    Write-Host "❌ PostgreSQL is not running on port 5432" -ForegroundColor Red
    Write-Host "Please start PostgreSQL service manually" -ForegroundColor Red
    Write-Host ""
    Write-Host "On Windows:" -ForegroundColor Yellow
    Write-Host "- Open Services (services.msc)" -ForegroundColor Yellow
    Write-Host "- Find 'postgresql-x64-14' (or similar)" -ForegroundColor Yellow
    Write-Host "- Right-click and select 'Start'" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
} else {
    Write-Host "✅ PostgreSQL is running on port 5432" -ForegroundColor Green
}

Write-Host ""
Write-Host "[2/3] Starting Backend API Server..." -ForegroundColor Cyan

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $scriptDir "CampusBite_Backend-main\CampusBite_Backend-main"

# Start Backend Server
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendDir'; Write-Host 'Backend Server Starting...' -ForegroundColor Yellow; npm start" -WindowStyle Normal

# Wait for backend to start
Write-Host "Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check if backend is running
$backendRunning = netstat -an | Select-String "5000"
if (-not $backendRunning) {
    Write-Host "❌ Backend failed to start on port 5000" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
} else {
    Write-Host "✅ Backend is running on port 5000" -ForegroundColor Green
}

Write-Host ""
Write-Host "[3/3] Starting Frontend Development Server..." -ForegroundColor Cyan

# Start Frontend Server
$frontendDir = Join-Path $scriptDir "CampusBite_App-main\CampusBite_App-main"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendDir'; Write-Host 'Frontend Server Starting...' -ForegroundColor Yellow; npx expo start --web --port 8082" -WindowStyle Normal

# Wait for frontend to start
Write-Host "Waiting for frontend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Check if frontend is running
$frontendRunning = netstat -an | Select-String "8082"
if (-not $frontendRunning) {
    Write-Host "❌ Frontend failed to start on port 8082" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
} else {
    Write-Host "✅ Frontend is running on port 8082" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  CampusBite System Started Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Frontend: http://localhost:8082" -ForegroundColor White
Write-Host "🔧 Backend API: http://localhost:5000" -ForegroundColor White
Write-Host "🗄️  Database: PostgreSQL (localhost:5432)" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Test Accounts:" -ForegroundColor Yellow
Write-Host "   Consumer: mark@campusbite.com / password123" -ForegroundColor White
Write-Host "   Admin: sysadmin@campusbite.com / password123" -ForegroundColor White
Write-Host "   Vendor: vendor2@campusbite.com / password123 (needs approval)" -ForegroundColor White
Write-Host "   Food Courier: rider@campusbite.com / password123 (needs approval)" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to open the application in your browser..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Start-Process "http://localhost:8082"

Write-Host ""
Write-Host "🚀 CampusBite is now running!" -ForegroundColor Green
Write-Host "Keep this window open to maintain the services." -ForegroundColor Yellow
Write-Host ""
Write-Host "To stop all services:" -ForegroundColor Red
Write-Host "1. Close this window" -ForegroundColor Red
Write-Host "2. Close the Backend and Frontend windows that opened" -ForegroundColor Red
Write-Host ""
Read-Host "Press Enter to exit"
