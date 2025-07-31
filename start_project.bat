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

echo 🔧 Configurando usuario administrador...
python setup_admin_only.py

echo 🔧 Iniciando Backend (Django)...
start "Django Backend" cmd /k "python manage.py runserver 0.0.0.0:8000"

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