# 🚀 Inicio Rápido - Blog de Noticias

## ⚡ Comandos Rápidos

### Windows:
```bash
# Ejecutar script de inicio automático
start.bat

# O manualmente:
python manage.py runserver
# En otra terminal:
cd frontend && npm run dev
```

### Linux/Mac:
```bash
# Ejecutar script de inicio automático
./start.sh

# O manualmente:
python manage.py runserver
# En otra terminal:
cd frontend && npm run dev
```

## 🌐 URLs de la Aplicación

- **🎨 Frontend**: http://localhost:3000 (o 3001 si 3000 está ocupado)
- **🔧 Backend API**: http://localhost:8000/api/v1/
- **👨‍💼 Django Admin**: http://localhost:8000/admin/
- **📊 Dashboard**: http://localhost:3000/dashboard

## 👤 Usuario Disponible

| Usuario | Email | Contraseña | Tipo |
|---------|-------|------------|------|
| admin | admin@test.com | admin123 | Superuser |

## 🧪 Páginas de Prueba

### Dashboard Testing:
- **Usuarios**: http://localhost:3000/dashboard/users/test
- **Comentarios**: http://localhost:3000/dashboard/comments/test  
- **Posts**: http://localhost:3000/dashboard/posts/test

### Testing Integral:
- **Sistema completo**: http://localhost:3000/test/integration

## 🔧 Comandos Útiles

### Backend (Django):
```bash
# Crear migraciones
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Shell de Django
python manage.py shell

# Ver usuarios existentes
python manage.py shell -c "from accounts.models import User; [print(f'{u.username} - {u.email}') for u in User.objects.all()]"
```

### Frontend (Nuxt.js):
```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview de producción
npm run preview

# Linting
npm run lint
```

## 📋 Funcionalidades Principales

### ✅ Completadas:
- [x] Sistema de autenticación JWT
- [x] API REST completa
- [x] Dashboard administrativo
- [x] Gestión de posts, usuarios y comentarios
- [x] Manejo global de errores
- [x] Estados de carga avanzados
- [x] Testing integral
- [x] Diseño responsivo
- [x] Configuración CORS
- [x] Documentación completa

### 🎯 Características:
- **Backend**: Django 5.2 + DRF + JWT
- **Frontend**: Nuxt.js 3 + Vue 3 + TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **Testing**: Páginas de prueba incluidas
- **Docker**: Configuración lista

## 🐛 Solución de Problemas

### Puerto ocupado:
- Frontend automáticamente usa puerto 3001 si 3000 está ocupado
- Backend siempre usa puerto 8000

### Error de CORS:
- La configuración CORS está optimizada para desarrollo
- Permite todos los orígenes en modo DEBUG

### Error de base de datos:
```bash
# Resetear base de datos
rm db.sqlite3
python manage.py migrate
python manage.py loaddata fixtures/initial_data.json  # Si existe
```

### Error de dependencias:
```bash
# Backend
pip install -r requirements.txt

# Frontend
cd frontend && npm install
```

## 📚 Documentación Adicional

- **README.md**: Documentación completa del proyecto
- **API Docs**: http://localhost:8000/api/v1/ (endpoints disponibles)
- **Testing**: Usar las páginas de prueba para validar funcionalidades

## 🚀 Despliegue

### Desarrollo:
- Usar los scripts `start.bat` o `start.sh`
- Ambos servidores deben estar ejecutándose

### Producción:
- Configurar variables de entorno
- Usar PostgreSQL en lugar de SQLite
- Configurar servidor web (Nginx + Gunicorn)
- Ver `docker-compose.yml` para despliegue con Docker

---

**¡El proyecto está 100% funcional y listo para usar!** 🎉