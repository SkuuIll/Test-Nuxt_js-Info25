@echo off
echo 🚀 Iniciando Blog de Noticias...
echo.

echo 📊 Verificando dependencias...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python no encontrado. Por favor instala Python.
    pause
    exit /b 1
)

node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js no encontrado. Por favor instala Node.js.
    pause
    exit /b 1
)

echo ✅ Dependencias verificadas.
echo.

echo 🔍 Verificando puertos disponibles...
netstat -aon | findstr :8000 >nul
if %errorlevel% equ 0 (
    echo ❌ Puerto 8000 ya está en uso. Por favor, libera el puerto.
    pause
    exit /b 1
)

netstat -aon | findstr :3000 >nul
if %errorlevel% equ 0 (
    echo ❌ Puerto 3000 ya está en uso. Por favor, libera el puerto.
    pause
    exit /b 1
)

echo ✅ Puertos disponibles.
echo.

echo 🔧 Verificando entorno virtual...
if not exist "entorno\Scripts\activate.bat" (
    echo ⚠️ Entorno virtual no encontrado. Creando entorno virtual...
    python -m venv entorno
    if %errorlevel% neq 0 (
        echo ❌ Error al crear el entorno virtual.
        pause
        exit /b 1
    )
    echo ✅ Entorno virtual creado.
    
    echo 📦 Instalando dependencias...
    call entorno\Scripts\activate.bat
    pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo ❌ Error al instalar dependencias.
        pause
        exit /b 1
    )
    echo ✅ Dependencias instaladas.
) else (
    echo ✅ Entorno virtual encontrado.
)
echo.

echo 🔧 Configurando usuario administrador...
call entorno\Scripts\activate.bat
python setup_admin_only.py
if %errorlevel% neq 0 (
    echo ❌ Error al configurar el usuario administrador.
    pause
    exit /b 1
)
echo ✅ Usuario administrador configurado.
echo.

echo 🔧 Iniciando Backend (Django)...
start "Django Backend" cmd /k "call entorno\Scripts\activate.bat && python manage.py runserver 0.0.0.0:8000"

echo ⏳ Esperando que el backend se inicie...
timeout /t 5 /nobreak >nul

echo 🎨 Iniciando Frontend (Nuxt.js)...
start "Nuxt Frontend" cmd /k "cd frontend && npx nuxt dev"

echo ⏳ Esperando que el frontend se inicie...
timeout /t 10 /nobreak >nul

echo.
echo ✅ ¡Proyecto iniciado exitosamente!
echo.
echo 🌐 URLs disponibles:
echo   - Frontend: http://localhost:3000
echo   - Backend API: http://localhost:8000/api/v1/
echo   - Django Admin: http://localhost:8000/admin/
echo.
echo 👤 Usuario disponible:
echo   - admin / admin123 (Superuser)
echo.
echo 🔧 Para detener los servidores, cierra las ventanas de terminal.
echo.

echo 🌐 Abriendo navegador...
timeout /t 3 /nobreak >nul
start http://localhost:3000

pause