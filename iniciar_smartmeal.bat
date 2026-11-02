
@echo off
setlocal
title SmartMeal 2.0 - Iniciador
cd /d "%~dp0"

echo.
echo ==========================================
echo           SMARTMEAL 2.0
echo         INICIANDO APLICACION
echo ==========================================
echo.

REM ==========================================
REM 1. COMPROBAR PYTHON Y CREAR ENTORNO
REM ==========================================

if not exist ".venv\Scripts\python.exe" (

    echo [1/4] Preparando entorno de Python...

    py -3 --version >nul 2>&1

    if not errorlevel 1 (
        py -3 -m venv ".venv"
    ) else (
        python --version >nul 2>&1

        if errorlevel 1 goto sin_python

        python -m venv ".venv"
    )

    if errorlevel 1 goto error_general

) else (

    echo [1/4] Entorno de Python encontrado.

)

REM ==========================================
REM 2. INSTALAR DEPENDENCIAS
REM ==========================================

echo.
echo [2/4] Comprobando dependencias...

".venv\Scripts\python.exe" -m pip --disable-pip-version-check install -r requirements.txt

if errorlevel 1 goto error_general

REM ==========================================
REM 3. PREPARAR BASE DE DATOS
REM ==========================================

echo.
echo [3/4] Preparando base de datos...

".venv\Scripts\python.exe" -c "from models import inicializar_base_datos; inicializar_base_datos()"

if errorlevel 1 goto error_general

REM ==========================================
REM 4. COMPROBAR CUENTA DE USUARIO
REM ==========================================

echo.
echo [4/4] Comprobando usuario...

".venv\Scripts\python.exe" -c "import sys; from models import Usuario, db; db.connect(reuse_if_open=True); sys.exit(0 if Usuario.select().exists() else 1)"

if errorlevel 1 (

    echo.
    echo No existe una cuenta de usuario.
    echo Vamos a crear la primera cuenta.
    echo.

    ".venv\Scripts\python.exe" crear_usuario.py

    if errorlevel 1 goto error_general

    REM Confirmar que se haya creado la cuenta

    ".venv\Scripts\python.exe" -c "import sys; from models import Usuario, db; db.connect(reuse_if_open=True); sys.exit(0 if Usuario.select().exists() else 1)"

    if errorlevel 1 (
        echo.
        echo No se creo ninguna cuenta.
        echo Volve a ejecutar este archivo.
        pause
        exit /b 1
    )

) else (

    echo Cuenta existente encontrada.

)

REM ==========================================
REM 5. INICIAR SMARTMEAL
REM ==========================================

echo.
echo ==========================================
echo    SMARTMEAL ESTA LISTO PARA INICIAR
echo ==========================================
echo.
echo Abri Google Chrome y entra a:
echo.
echo       http://127.0.0.1:5000/
echo.
echo Para detener SmartMeal presiona CTRL+C.
echo No cierres esta ventana mientras uses la app.
echo.

".venv\Scripts\python.exe" app.py

if errorlevel 1 goto error_general

goto fin

REM ==========================================
REM MENSAJES DE ERROR
REM ==========================================

:sin_python

echo.
echo ERROR: No se encontro Python 3.
echo Instala Python 3 y volve a ejecutar
echo iniciar_smartmeal.bat.
echo.
pause
exit /b 1

:error_general

echo.
echo ERROR: SmartMeal no pudo iniciarse.
echo Revisa el mensaje que aparece arriba.
echo.
pause
exit /b 1

:fin

echo.
echo SmartMeal se ha detenido.
pause
endlocal
