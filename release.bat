@echo off
setlocal enabledelayedexpansion

:: Define the print_error function
goto :main

:print_error
if not "%~1"=="" (
    echo ^<ESC^>[1;31m%~1^<ESC^>[0m
)
exit /b

:main
if "%~1"=="" goto :eof

:: Check the CHANGELOG.md
for /f "tokens=2" %%a in ('findstr "## " CHANGELOG.md') do (
    set changelog_version=%%a
    goto :check_changelog
)
:check_changelog
if not "%changelog_version%"=="%~1" (
    call :print_error "Version in CHANGELOG.md does not match the release version."
    exit /b 1
)

:: Check the kyte-shipyard.js file
for /f "tokens=2 delims=''" %%a in ('findstr /C:"var KS_VERSION =" assets\js\source\kyte-shipyard.js') do (
    set js_version=%%a
    goto :check_js
)
:check_js
if not "%js_version%"=="%~1" (
    call :print_error "Version in kyte-shipyard.js does not match the release version."
    exit /b 1
)

echo Reobfuscating all JS
for %%f in (assets\js\source\*.js) do (
    call :obfuscate "%%f"
)

echo Creating tag for release version %~1

git add .
git commit -m "release %~1"
git push

if errorlevel 1 (
    call :print_error "Git push failed."
    exit /b 1
)

git tag "v%~1"

if errorlevel 1 (
    call :print_error "Git tag creation failed."
    exit /b 1
)

:: Push the tag to the origin
git push origin --tags

if errorlevel 1 (
    call :print_error "Git push failed."
    exit /b 1
)

echo Git push successful. New release v%~1 is available
goto :eof

:obfuscate
set "filename=%~1"
set "output=%filename%"
set "output=%output:source\=%"
if not "%filename%"=="" if not "%output%"=="" (
    echo Obfuscating: %filename% Output: %output%
    javascript-obfuscator.cmd "%filename%" --output "%output%" --compact true --string-array-encoding base64 --string-array-wrappers-type variable
)
goto :eof