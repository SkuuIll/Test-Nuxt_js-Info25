@echo off
echo 🚀 Iniciando Blog de Noticias con verificaciones...
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
if errorlevel 1 (
    echo ❌ Error configurando usuario administrador.
    pause
    exit /b 1
)

echo.
echo 🔧 Iniciando Backend (Django)...
start "Django Backend" cmd /k "python manage.py runserver 0.0.0.0:8000"

echo ⏳ Esperando que el backend se inicie...
timeout /t 8 /nobreak >nul

echo 🧪 Verificando conectividad del backend...
curl -s http://localhost:8000/ >nul 2>&1
if errorlevel 1 (
    echo ⚠️ Backend no responde aún, continuando...
) else (
    echo ✅ Backend respondiendo correctamente.
)

echo.
echo 🎨 Iniciando Frontend (Nuxt.js)...
start "Nuxt Frontend" cmd /k "cd frontend && npx nuxt dev"

echo ⏳ Esperando que el frontend se inicie...
timeout /t 15 /nobreak >nul

echo.
echo ✅ ¡Proyecto iniciado!
echo.
echo 🌐 URLs disponibles:
echo   - Frontend: http://localhost:3000
echo   - Backend API: http://localhost:8000/api/v1/
echo   - Django Admin: http://localhost:8000/admin/
echo   - Test API: http://localhost:3000/test-api.html
echo   - Test Posts: http://localhost:3000/test-posts
echo   - Simple Test: http://localhost:3000/simple-test
echo.
echo 👤 Usuario disponible:
echo   - admin / admin123 (Superuser)
echo.
echo 🧪 Páginas de diagnóstico:
echo   - http://localhost:3000/test-api.html (Test conectividad)
echo   - http://localhost:3000/test-posts (Test composables)
echo   - http://localhost:3000/simple-test (Test cliente)
echo.

echo 🌐 Abriendo navegador...
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo.
echo 🔧 Si tienes problemas:
echo   1. Verifica que ambos servidores estén corriendo
echo   2. Usa las páginas de diagnóstico
echo   3. Revisa la consola del navegador
echo   4. Verifica la consola de los servidores
echo.

pause