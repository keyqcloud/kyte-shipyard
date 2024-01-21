@echo off

:: Update version in kyte-shipyard.js if version argument is provided
if "%~2" neq "" (
    powershell -Command "(Get-Content assets\js\source\kyte-shipyard.js) -replace '^var KS_VERSION = .*;', 'var KS_VERSION = '''%~2''';' | Set-Content assets\js\source\kyte-shipyard.js"
)

:: Obfuscate all files in the source directory if no specific file is specified
if "%~1"=="" (
    echo Obfuscating all JavaScript files...
    for %%f in (assets\js\source\*.js) do (
        call :obfuscate "%%f"
    )
    :obfuscate
        set "filename=%1"
        set "output=%filename%"
        set "output=%output:source\=%"
        if not "%filename%"=="" if not "%output%"=="" (
            echo Obfuscating: %filename% Output: %output%
            javascript-obfuscator.cmd "%filename%" --output "%output%" --compact true --string-array-encoding base64 --string-array-wrappers-type variable
        )
        goto :eof
) else (
    :: Check if the path contains 'source' and obfuscate a single file if true
    echo %~1 | findstr /C:"source" > nul
    if not errorlevel 1 (
        call :obfuscate "%~1"

        echo Obfuscating KyteShipyard JS file
        call :obfuscate "assets\js\source\kyte-shipyard.js"
    ) else (
        echo Please use absolute file paths or execute from root project path.
    )
)
goto :eof
