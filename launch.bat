@echo off
echo ========================================
echo  Azure Networking Academy - Local Server
echo ========================================
echo.

cd /d "%~dp0"

:: Try Python first
where python >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo Starting server with Python...
    echo.
    echo  Open your browser to: http://localhost:8080
    echo  Press Ctrl+C to stop the server
    echo.
    python -m http.server 8080
    goto :eof
)

:: Try Python3
where python3 >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo Starting server with Python3...
    echo.
    echo  Open your browser to: http://localhost:8080
    echo  Press Ctrl+C to stop the server
    echo.
    python3 -m http.server 8080
    goto :eof
)

:: Try Node.js
where npx >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo Starting server with Node.js...
    echo.
    echo  Open your browser to: http://localhost:8080
    echo  Press Ctrl+C to stop the server
    echo.
    npx http-server -p 8080 -c-1
    goto :eof
)

:: Fallback — just open the HTML file directly
echo No Python or Node.js found. Opening directly in browser...
echo Note: Some features work best with a local server.
echo.
start "" "index.html"
