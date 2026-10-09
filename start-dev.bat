@echo off
start "Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
rem Uncomment when the backend exists:
rem start "Backend" cmd /k "cd /d %~dp0backend && npm run dev"
