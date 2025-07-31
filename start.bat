(entorno) PS C:\Users\Skull\Desktop\Proyecto> python manage.py createsuperuser
🔧 Enhanced CORS Development Mode:
   - Allow all origins: True
   - Configured origins: 20 origins
   - Allowed headers: 76 headers
   - Exposed headers: 63 headers
   - Preflight cache: 600 seconds
   - Private network: True
🔧 CORS Development Mode:
   - Allow all origins: True
   - Allowed origins: ['http://localhost:8080', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001', 'http://127.0.0.1:8080', 'http://localhost:3000', 'http://localhost:3001']
   - Allow credentials: True
Email: a@a.com
Error: That email is already taken.
Email: 
Error: Este campo no puede estar vacío.
Email: a
Error: Introduzca una dirección de correo electrónico válida.
Email: skull@a.com
Nombre de usuario: skull
Password: 
Password (again):
La contraseña es demasiado similar a la de nombre de usuario.
This password is too short. It must contain at least 8 characters.    
Bypass password validation and create user anyway? [y/N]: y
Traceback (most recent call last):
  File "C:\Users\Skull\Desktop\Proyecto\entorno\Lib\site-packages\django\db\backends\utils.py", line 105, in _execute
    return self.cursor.execute(sql, params)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\Skull\Desktop\Proyecto\entorno\Lib\site-packages\django\db\backends\sqlite3\base.py", line 360, in execute
    return super().execute(query, params)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
sqlite3.IntegrityError: UNIQUE constraint failed: accounts_user.username

The above exception was the direct cause of the following exception:  

Traceback (most recent call last):
  File "C:\Users\Skull\Desktop\Proyecto\manage.py", line 22, in <module>
    main()
  File "C:\Users\Skull\Desktop\Proyecto\manage.py", line 18, in main  
    execute_from_command_line(sys.argv)
  File "C:\Users\Skull\Desktop\Proyecto\entorno\Lib\site-packages\django\core\management\__init__.py", line 442, in execute_from_command_line
    utility.execute()
  File "C:\Users\Skull\Desktop\Proyecto\entorno\Lib\site-packages\django\core\management\__init__.py", line 436, in execute
    self.fetch_command(subcommand).run_from_argv(self.argv)
  File "C:\Users\Skull\Desktop\Proyecto\entorno\Lib\site-packages\django\core\management\base.py", line 416, in run_from_argv
    self.execute(*args, **cmd_options)
  File "C:\Users\Skull\Desktop\Proyecto\entorno\Lib\site-packages\django\contrib\auth\management\commands\createsuperuser.py", line 90, in execute
    return super().execute(*args, **options)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\Skull\Desktop\Proyecto\entorno\Lib\site-packages\django\core\management\base.py", line 460, in execute
    output = self.handle(*args, **options)
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\Skull\Desktop\Proyecto\entorno\Lib\site-packages\django\contrib\auth\management\commands\createsuperuser.py", line 239, in handle
    self.UserModel._default_manager.db_manager(database).create_superuser(
  File "C:\Users\Skull\Desktop\Proyecto\entorno\Lib\site-packages\django\contrib\auth\models.py", line 195, in create_superuser
    return self._create_user(username, email, password, **extra_fields)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\Skull\Desktop\Proyecto\entorno\Lib\site-packages\django\contrib\auth\models.py", line 163, in _create_user
    user.save(using=self._db)
  File "C:\Users\Skull\Desktop\Proyecto\entorno\Lib\site-packages\django\contrib\auth\base_user.py", line 65, in save
    super().save(*args, **kwargs)
  File "C:\Users\Skull\Desktop\Proyecto\entorno\Lib\site-packages\django\db\models\base.py", line 902, in save
    self.save_base(
  File "C:\Users\Skull\Desktop\Proyecto\entorno\Lib\site-packages\django\db\models\base.py", line 1008, in save_base
    updated = self._save_table(
              ^^^^^^^^^^^^^^^^^
  File "C:\Users\Skull\Desktop\Proyecto\entorno\Lib\site-packages\django\db\models\base.py", line 1169, in _save_table
    results = self._do_insert(
              ^^^^^^^^^^^^^^^^
  File "C:\Users\Skull\Desktop\Proyecto\entorno\Lib\site-packages\django\db\models\base.py", line 1210, in _do_insert
    return manager._insert(
           ^^^^^^^^^^^^^^^^
  File "C:\Users\Skull\Desktop\Proyecto\entorno\Lib\site-packages\django\db\models\manager.py", line 87, in manager_method
    return getattr(self.get_queryset(), name)(*args, **kwargs)        
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^        
  File "C:\Users\Skull\Desktop\Proyecto\entorno\Lib\site-packages\django\db\models\query.py", line 1868, in _insert
    return query.get_compiler(using=using).execute_sql(returning_fields)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\Skull\Desktop\Proyecto\entorno\Lib\site-packages\django\db\models\sql\compiler.py", line 1882, in execute_sql
    cursor.execute(sql, params)
  File "C:\Users\Skull\Desktop\Proyecto\entorno\Lib\site-packages\django\db\backends\utils.py", line 122, in execute
    return super().execute(sql, params)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\Skull\Desktop\Proyecto\entorno\Lib\site-packages\django\db\backends\utils.py", line 79, in execute
    return self._execute_with_wrappers(
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\Skull\Desktop\Proyecto\entorno\Lib\site-packages\django\db\backends\utils.py", line 92, in _execute_with_wrappers
    return executor(sql, params, many, context)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\Skull\Desktop\Proyecto\entorno\Lib\site-packages\django\db\backends\utils.py", line 100, in _execute
    with self.db.wrap_database_errors:
         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\Skull\Desktop\Proyecto\entorno\Lib\site-packages\django\db\utils.py", line 91, in __exit__
    raise dj_exc_value.with_traceback(traceback) from exc_value       
  File "C:\Users\Skull\Desktop\Proyecto\entorno\Lib\site-packages\django\db\backends\utils.py", line 105, in _execute
    return self.cursor.execute(sql, params)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\Skull\Desktop\Proyecto\entorno\Lib\site-packages\django\db\backends\sqlite3\base.py", line 360, in execute
    return super().execute(query, params)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
django.db.utils.IntegrityError: UNIQUE constraint failed: accounts_user.username
(entorno) PS C:\Users\Skull\Desktop\Proyecto> @echo off
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

REM Mostrar usuarios existentes
echo 👤 Usuarios existentes en la base de datos:
python manage.py shell -c "from accounts.models import User; [print(f'- {u.username} ({u.email}) - Superuser: {u.is_superuser}') for u in User.objects.all()]"

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
echo - Frontend: http://localhost:3000 (o http://localhost:3001)
echo - Backend:  http://localhost:8000
echo - Admin:    http://localhost:8000/admin
echo.
echo 👤 Usuarios disponibles:
echo - admin (admin@test.com) - Superuser
echo - skull (a@a.com) - Superuser  
echo - editor (editor@test.com) - Usuario normal
echo.
echo 🧪 Páginas de prueba:
echo - http://localhost:3000/dashboard/users/test
echo - http://localhost:3000/dashboard/comments/test  
echo - http://localhost:3000/dashboard/posts/test
echo - http://localhost:3000/test/integration

pause