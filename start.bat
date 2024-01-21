@echo off
for /f "tokens=*" %%i in ('python -c "import sys; print(sys.version_info.major)"') do set ver=%%i

if %ver%==2 (
    python -m SimpleHTTPServer
) else if %ver%==3 (
    python -m http.server
) else (
    echo Unknown python version: %ver%
    python3 -m http.server
)