@echo off
echo Starting Measure Me dev server...
if exist "C:\Program Files\nodejs\node.exe" (
    "C:\Program Files\nodejs\node.exe" "./node_modules/vite/bin/vite.js" --open
) else (
    "C:\Users\Ikechukwu\AppData\Roaming\Antigravity\bin\agy-node.cmd" "./node_modules/vite/bin/vite.js" --open
)
pause
