@echo off
echo 🚀 Iniciando Blog de Noticias...

REM Verificar si existe el entorno virtual
if not exist "entorno" (
    echo 📦 Creando entorno virtual...
    python -m venv entorno
)

REM Activar entorno virtual
echo 🔧 Activando entorno virtual...
call entorno\Scripts\activate

REM Instalar dependencias del backend
echo 📚 Instalando dependencias del backend...
pip install -r requirements.txt

REM Ejecutar migraciones
echo 🗄️ Ejecutando migraciones...
python manage.py makemigrations
python manage.py migrate

REM Crear superusuario si no existe
echo 👤 Verificando superusuario...
python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('admin', 'admin@example.com', 'admin123') if not User.objects.filter(is_superuser=True).exists() else print('Superusuario ya existe')"

REM Instalar dependencias del frontend
echo 🎨 Instalando dependencias del frontend...
cd frontend
npm install
cd ..

echo ✅ Configuración completada!
echo.
echo Para iniciar la aplicación:
echo 1. Backend:  python manage.py runserver
echo 2. Frontend: cd frontend ^&^& npm run dev
echo.
echo URLs:
echo - Frontend: http://localhost:3000
echo - Backend:  http://localhost:8000
echo - Admin:    http://localhost:8000/admin (admin/admin123)

pause