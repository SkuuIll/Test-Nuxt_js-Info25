# 📰 Blog de Noticias - Full Stack Application

Una aplicación web completa de blog de noticias construida con **Django REST Framework** en el backend y **Nuxt.js 3** en el frontend, con un dashboard administrativo completo.

## 🚀 Características Principales

### 🔐 **Sistema de Autenticación**
- Autenticación JWT con refresh tokens
- Registro y login de usuarios
- Gestión de perfiles de usuario
- Sistema de permisos y roles

### 📝 **Gestión de Contenido**
- CRUD completo de posts con editor TinyMCE
- Sistema de categorías y etiquetas
- Comentarios con moderación
- Subida de imágenes y archivos multimedia
- SEO optimizado con meta tags

### 🎛️ **Dashboard Administrativo**
- Panel de control con estadísticas en tiempo real
- Gestión de usuarios con permisos granulares
- Moderación de comentarios con detección de spam
- Analytics de posts con métricas de engagement
- Sistema de notificaciones

### 🛠️ **Características Técnicas**
- API REST estandarizada con paginación
- Manejo global de errores con logging
- Estados de carga con skeleton loading
- Testing integral de endpoints
- Configuración CORS para desarrollo y producción
- Responsive design con Tailwind CSS

## 🏗️ Arquitectura del Proyecto

```
Proyecto/
├── django_blog/          # Backend Django
│   ├── settings.py       # Configuración principal
│   ├── urls.py          # URLs principales
│   └── middleware/      # Middleware personalizado
├── posts/               # App de posts
├── users/               # App de usuarios
├── dashboard/           # App del dashboard
├── accounts/            # App de cuentas
├── comments/            # App de comentarios
├── media_files/         # App de archivos multimedia
└── frontend/            # Frontend Nuxt.js
    ├── components/      # Componentes Vue
    ├── composables/     # Composables de Nuxt
    ├── pages/          # Páginas de la aplicación
    ├── plugins/        # Plugins de Nuxt
    └── types/          # Tipos TypeScript
```

## 🛠️ Tecnologías Utilizadas

### Backend
- **Django 5.2** - Framework web de Python
- **Django REST Framework** - API REST
- **Django CORS Headers** - Configuración CORS
- **SimpleJWT** - Autenticación JWT
- **TinyMCE** - Editor de texto enriquecido
- **SQLite** - Base de datos (desarrollo)

### Frontend
- **Nuxt.js 3** - Framework de Vue.js
- **Vue 3** - Framework JavaScript reactivo
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Framework de CSS
- **Pinia** - Gestión de estado
- **VueUse** - Utilidades para Vue

## 📋 Requisitos Previos

- **Python 3.8+**
- **Node.js 18+**
- **npm** o **yarn**
- **Git**

## 🚀 Instalación y Configuración

### 1. Clonar el Repositorio

```bash
git clone https://github.com/SkuuIll/Test-Nuxt_js-Info25.git
cd Proyecto
```

### 2. Inicio Rápido

#### Windows:
```bash
# Ejecutar script automático
start.bat
```

#### Linux/Mac:
```bash
# Ejecutar script automático
chmod +x start.sh
./start.sh
```

### 3. Configuración Manual

#### Backend (Django):
```bash
# Crear entorno virtual
python -m venv entorno
source entorno/bin/activate  # En Windows: entorno\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar base de datos
python manage.py makemigrations
python manage.py migrate

# Ejecutar servidor de desarrollo
python manage.py runserver
```

#### Frontend (Nuxt.js):
```bash
# Navegar al directorio frontend
cd frontend

# Instalar dependencias
npm install

# Ejecutar servidor de desarrollo
npm run dev
```

## 🌐 URLs de la Aplicación

- **Frontend**: http://localhost:3000 (o 3001 si está ocupado)
- **Backend API**: http://localhost:8000/api/v1/
- **Django Admin**: http://localhost:8000/admin/
- **Dashboard**: http://localhost:3000/dashboard

## 👤 Usuarios de Prueba Incluidos

| Usuario | Email | Tipo | Descripción |
|---------|-------|------|-------------|
| **admin** | admin@test.com | Superuser | Acceso completo al sistema |
| **skull** | a@a.com | Superuser | Acceso completo al sistema |
| **editor** | editor@test.com | Staff | Puede gestionar contenido |
| **author** | author@test.com | Normal | Puede crear posts |
| **user** | user@test.com | Normal | Usuario básico |

> **Nota**: Para acceder al Django Admin, usa cualquiera de los superusuarios. Las contraseñas se pueden resetear desde el admin.

## 📚 Documentación de la API

### Endpoints Principales

#### Autenticación
```
POST /api/v1/auth/login/          # Login
POST /api/v1/auth/register/       # Registro
POST /api/v1/auth/token/refresh/  # Refresh token
GET  /api/v1/auth/user/           # Perfil usuario
```

#### Posts
```
GET    /api/v1/posts/             # Listar posts
POST   /api/v1/posts/             # Crear post
GET    /api/v1/posts/{id}/        # Obtener post
PUT    /api/v1/posts/{id}/        # Actualizar post
DELETE /api/v1/posts/{id}/        # Eliminar post
```

#### Dashboard
```
GET /api/v1/dashboard/stats/      # Estadísticas
GET /api/v1/dashboard/posts/      # Posts del dashboard
GET /api/v1/dashboard/users/      # Usuarios del dashboard
GET /api/v1/dashboard/comments/   # Comentarios del dashboard
```

## 🧪 Testing

### Páginas de Prueba Incluidas

- **`/dashboard/users/test`** - Testing de gestión de usuarios
- **`/dashboard/comments/test`** - Testing de gestión de comentarios
- **`/dashboard/posts/test`** - Testing de gestión de posts
- **`/test/integration`** - Testing integral del sistema

### Ejecutar Tests

```bash
# Backend
python manage.py test

# Frontend
cd frontend
npm run test
```

## 🔧 Configuración de Producción

### Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
# Django
SECRET_KEY=tu-clave-secreta-muy-segura
DEBUG=False
ALLOWED_HOSTS=tu-dominio.com,www.tu-dominio.com

# Base de datos
DATABASE_URL=postgresql://usuario:password@localhost/blog_db

# Frontend URLs
FRONTEND_URL=https://tu-dominio.com
DASHBOARD_URL=https://tu-dominio.com

# Email (opcional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=tu-email@gmail.com
EMAIL_HOST_PASSWORD=tu-password
```

### Despliegue

1. **Backend**: Configurar con Gunicorn + Nginx
2. **Frontend**: Build estático con `npm run build`
3. **Base de datos**: Migrar a PostgreSQL para producción
4. **Archivos estáticos**: Configurar almacenamiento en la nube

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Funcionalidades Destacadas

### 🎨 **Frontend Avanzado**
- **Skeleton Loading**: Indicadores de carga elegantes
- **Error Handling Global**: Manejo centralizado de errores
- **Estados de Carga**: Progress bars y spinners personalizados
- **Responsive Design**: Optimizado para móviles y desktop

### ⚡ **Backend Robusto**
- **API Estandarizada**: Respuestas consistentes con paginación
- **Middleware Personalizado**: Logging, CORS, y manejo de errores
- **Autenticación Segura**: JWT con blacklist de tokens
- **Permisos Granulares**: Control de acceso por roles

### 🔍 **Dashboard Completo**
- **Analytics en Tiempo Real**: Métricas de posts, usuarios y comentarios
- **Gestión de Contenido**: CRUD completo con validaciones
- **Moderación Avanzada**: Detección automática de spam
- **Reportes Detallados**: Exportación de datos en múltiples formatos

## 📊 Métricas del Proyecto

- **18 Tareas Completadas** ✅
- **50+ Endpoints API** implementados
- **15+ Composables** de Vue/Nuxt
- **20+ Componentes** reutilizables
- **100% TypeScript** en frontend
- **Testing Integral** incluido

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

**Skull**
- GitHub: [@skull](https://github.com/skull)

## 🙏 Agradecimientos

- Django REST Framework por la excelente documentación
- Nuxt.js por el framework increíble
- TinyMCE por el editor de texto
- Tailwind CSS por el sistema de diseño

---

⭐ **¡Si te gusta este proyecto, dale una estrella en GitHub!** ⭐
