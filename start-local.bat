@echo off
setlocal
cd /d "%~dp0"
if errorlevel 1 goto :startup_error

set "WORKSPACE=%CD%"
set "PNPM_CMD="
echo Northstar Motors local launcher
echo Workspace: "%WORKSPACE%"
echo.

for /f "delims=" %%P in ('where pnpm.cmd 2^>nul') do if not defined PNPM_CMD set "PNPM_CMD=%%P"
if not defined PNPM_CMD if exist "%LOCALAPPDATA%\pnpm\pnpm.cmd" set "PNPM_CMD=%LOCALAPPDATA%\pnpm\pnpm.cmd"
if not defined PNPM_CMD if exist "%APPDATA%\npm\pnpm.cmd" set "PNPM_CMD=%APPDATA%\npm\pnpm.cmd"
if not defined PNPM_CMD if exist "%ProgramFiles%\nodejs\pnpm.cmd" set "PNPM_CMD=%ProgramFiles%\nodejs\pnpm.cmd"
if not defined PNPM_CMD if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd" set "PNPM_CMD=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd"
if not defined PNPM_CMD goto :pnpm_missing
for %%P in ("%PNPM_CMD%") do set "PNPM_DIR=%%~dpP"
set "PATH=%PNPM_DIR%;%PATH%"

if not exist "%WORKSPACE%\apps\api\.env" goto :env_missing
if not exist "%WORKSPACE%\node_modules\.pnpm" goto :dependencies_missing

if /i "%~1"=="--verify" goto :verify_only

echo pnpm: "%PNPM_CMD%"
call "%PNPM_CMD%" --version
if errorlevel 1 goto :pnpm_failed
echo.
echo API URL: http://localhost:3001
echo Web URL: http://localhost:3000
echo PostgreSQL must be running and Prisma migrations must already be applied.
echo Keep this window open. Press Ctrl+C to stop both development servers.
echo.
call pnpm dev
set "APP_EXIT_CODE=%ERRORLEVEL%"
echo.
echo The development command has exited with code %APP_EXIT_CODE%.
echo See the output above for startup details. This window will remain open.
pause
endlocal & exit /b %APP_EXIT_CODE%

:verify_only
echo pnpm resolved to: "%PNPM_CMD%"
call "%PNPM_CMD%" --version
if errorlevel 1 goto :pnpm_failed
echo Workspace and local dependency paths are present.
endlocal & exit /b 0

:pnpm_missing
echo ERROR: Could not find pnpm.cmd on PATH or in the standard Windows install locations.
echo Install pnpm 11.25.0 or add its installation directory to PATH, then retry.
goto :startup_error

:pnpm_failed
echo ERROR: pnpm was found but could not run. Check the pnpm and Node.js installation.
goto :startup_error

:env_missing
echo ERROR: "%WORKSPACE%\apps\api\.env" was not found.
echo Copy apps\api\.env.example to apps\api\.env and configure DATABASE_URL and JWT_SECRET.
goto :startup_error

:dependencies_missing
echo ERROR: "%WORKSPACE%\node_modules\.pnpm" was not found.
echo Open a terminal in "%WORKSPACE%" and run: pnpm install
goto :startup_error

:startup_error
echo.
echo Startup stopped. Review the error above. This window will remain open.
pause
endlocal & exit /b 1
