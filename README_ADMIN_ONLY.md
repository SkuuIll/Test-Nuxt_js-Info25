# 🚀 Blog de Noticias - Configuración Administrador Único

## ⚡ Inicio Rápido

### Opción 1: Script Automático (Recomendado)
```bash
# Windows
.\start_project.bat

# Linux/Mac
./start.sh
```

### Opción 2: Manual
```bash
# 1. Configurar usuario administrador
python setup_admin_only.py

# 2. Iniciar backend
python manage.py runserver 0.0.0.0:8000

# 3. Iniciar frontend (en otra terminal)
cd frontend && npm run dev
```

## 🌐 URLs de la Aplicación

- **🎨 Frontend**: http://localhost:3000
- **🔧 Backend API**: http://localhost:8000/api/v1/
- **👨‍💼 Django Admin**: http://localhost:8000/admin/
- **📊 Dashboard**: http://localhost:3000/dashboard

## 👤 Usuario Administrador

| Usuario | Email | Contraseña | Tipo |
|---------|-------|------------|------|
| admin | admin@test.com | admin123 | Superuser |

**Características del usuario admin:**
- ✅ Acceso completo al Django Admin
- ✅ Puede crear, editar y eliminar posts
- ✅ Puede gestionar categorías
- ✅ Acceso completo al dashboard
- ✅ Todos los posts existentes son de su autoría

## 📊 Datos de Prueba

- **4 Categorías**: Tecnología, Noticias, Tutorial, Opinión
- **5 Posts**: Todos creados por el usuario admin
- **Contenido variado**: Posts con código, tutoriales y artículos

## 🔧 Scripts Disponibles

### `setup_admin_only.py`
- Crea o verifica el usuario administrador
- Elimina otros usuarios si existen
- Actualiza posts existentes para usar admin como autor
- Crea categorías y posts de ejemplo

### `start_project.bat` / `start.sh`
- Ejecuta automáticamente `setup_admin_only.py`
- Inicia backend y frontend
- Abre el navegador automáticamente

## 🧪 Páginas de Prueba

- **Frontend Principal**: http://localhost:3000
- **Dashboard**: http://localhost:3000/dashboard
- **Testing Integral**: http://localhost:3000/test/integration
- **API Posts**: http://localhost:8000/api/v1/posts/

## 🛠️ Comandos Útiles

```bash
# Ver usuarios existentes
python manage.py shell -c "from accounts.models import User; [print(f'{u.username} - {u.email} - {'Superuser' if u.is_superuser else 'Normal'}') for u in User.objects.all()]"

# Ver posts y sus autores
python manage.py shell -c "from posts.models import Post; [print(f'{p.titulo[:30]} - {p.autor.username}') for p in Post.objects.all()]"

# Reconfigurar proyecto (eliminar otros usuarios y actualizar posts)
python setup_admin_only.py
```

## 🔄 Reconfiguración

Si necesitas reconfigurar el proyecto para usar solo el usuario admin:

```bash
python setup_admin_only.py
```

Este script:
- ✅ Mantiene el usuario admin existente
- 🗑️ Elimina otros usuarios
- 🔄 Actualiza todos los posts para usar admin como autor
- ✅ Verifica categorías y datos de prueba

## 🚀 Características del Proyecto

- **Backend**: Django 5.2 + DRF + JWT
- **Frontend**: Nuxt.js 3 + Vue 3 + TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite (dev)
- **Autenticación**: JWT con un solo usuario administrador
- **API REST**: Completamente funcional
- **Dashboard**: Interfaz administrativa completa

---

**¡Proyecto configurado con usuario administrador único!** 🎉

**Credenciales:**
- Usuario: `admin`
- Contraseña: `admin123`
- Email: `admin@test.com`