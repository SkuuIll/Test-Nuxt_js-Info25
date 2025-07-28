# Blog de Noticias - Vue.js + Nuxt.js + Django

Un blog moderno y responsive construido con Vue.js 3, Nuxt.js 3, Tailwind CSS y Django REST Framework.

## 🚀 Características

### Frontend (Vue.js + Nuxt.js)
- ✅ **Diseño Moderno**: Interfaz limpia y responsive con Tailwind CSS
- ✅ **Modo Oscuro**: Sistema de temas con persistencia
- ✅ **Autenticación JWT**: Login/registro con manejo de tokens
- ✅ **Búsqueda Avanzada**: Filtros por categoría, fecha y etiquetas
- ✅ **Scroll Infinito**: Carga automática de contenido
- ✅ **Progreso de Lectura**: Barra de progreso y tabla de contenidos
- ✅ **Compartir Social**: Botones para redes sociales
- ✅ **PWA Ready**: Optimizado para dispositivos móviles
- ✅ **SEO Optimizado**: Meta tags dinámicos y sitemap
- ✅ **TypeScript**: Tipado estático para mejor desarrollo

### Backend (Django REST Framework)
- ✅ **API REST**: Endpoints completos para posts, categorías, usuarios
- ✅ **Autenticación JWT**: Sistema seguro de tokens
- ✅ **Admin Interface**: Panel de administración personalizado
- ✅ **Base de Datos**: SQLite para desarrollo, PostgreSQL para producción
- ✅ **Media Handling**: Gestión de imágenes y archivos

## 📁 Estructura del Proyecto

```
├── frontend/                 # Aplicación Vue.js + Nuxt.js
│   ├── components/          # Componentes Vue reutilizables
│   ├── composables/         # Composables de Vue
│   ├── layouts/             # Layouts de Nuxt
│   ├── middleware/          # Middleware de autenticación
│   ├── pages/               # Páginas de la aplicación
│   ├── plugins/             # Plugins de Nuxt
│   ├── stores/              # Stores de Pinia
│   └── types/               # Tipos de TypeScript
├── django_blog/             # Configuración principal de Django
├── posts/                   # App de posts
├── users/                   # App de usuarios
├── custom_admin/            # Admin personalizado
└── media/                   # Archivos multimedia
```

## 🛠️ Tecnologías Utilizadas

### Frontend
- **Vue.js 3** - Framework JavaScript reactivo
- **Nuxt.js 3** - Framework full-stack para Vue
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Framework de CSS utility-first
- **Pinia** - Gestión de estado
- **VueUse** - Composables utilitarios
- **Vitest** - Testing unitario
- **Playwright** - Testing E2E

### Backend
- **Django 4.x** - Framework web de Python
- **Django REST Framework** - API REST
- **SQLite/PostgreSQL** - Base de datos
- **Pillow** - Procesamiento de imágenes
- **django-cors-headers** - Manejo de CORS

## 🚀 Instalación y Configuración

### Prerrequisitos
- Python 3.8+
- Node.js 18+
- npm o yarn

### Backend (Django)

1. **Crear entorno virtual**:
```bash
python -m venv entorno
source entorno/bin/activate  # Linux/Mac
# o
entorno\Scripts\activate     # Windows
```

2. **Instalar dependencias**:
```bash
pip install -r requirements.txt
```

3. **Configurar base de datos**:
```bash
python manage.py makemigrations
python manage.py migrate
```

4. **Crear superusuario**:
```bash
python manage.py createsuperuser
```

5. **Ejecutar servidor**:
```bash
python manage.py runserver
```

### Frontend (Nuxt.js)

1. **Navegar al directorio frontend**:
```bash
cd frontend
```

2. **Instalar dependencias**:
```bash
npm install
```

3. **Ejecutar en desarrollo**:
```bash
npm run dev
```

4. **Construir para producción**:
```bash
npm run build
```

## 🔧 Scripts Disponibles

### Frontend
```bash
npm run dev          # Servidor de desarrollo
npm run build        # Construir para producción
npm run preview      # Vista previa de producción
npm run lint         # Linter ESLint
npm run lint:fix     # Corregir errores de linting
npm run test         # Tests unitarios
npm run test:e2e     # Tests E2E con Playwright
```

### Backend
```bash
python manage.py runserver    # Servidor de desarrollo
python manage.py test         # Ejecutar tests
python manage.py collectstatic # Recopilar archivos estáticos
```

## 🌐 URLs Principales

### Frontend (Nuxt.js)
- **Inicio**: http://localhost:3000/
- **Posts**: http://localhost:3000/posts
- **Búsqueda**: http://localhost:3000/search
- **Login**: http://localhost:3000/login

### Backend (Django)
- **API**: http://localhost:8000/api/v1/
- **Admin**: http://localhost:8000/admin/
- **API Docs**: http://localhost:8000/api/docs/

## 📱 Características Responsive

- **Mobile First**: Diseño optimizado para móviles
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Touch Friendly**: Navegación táctil optimizada
- **PWA**: Funcionalidades de aplicación web progresiva

## 🎨 Sistema de Diseño

### Colores
- **Primary**: Azul (#2563eb)
- **Gray Scale**: Escala de grises completa
- **Dark Mode**: Soporte completo para modo oscuro

### Tipografía
- **Font**: Inter (sistema de respaldo)
- **Escalas**: Responsive con Tailwind CSS

## 🔐 Autenticación

- **JWT Tokens**: Autenticación basada en tokens
- **Refresh Tokens**: Renovación automática de sesiones
- **Middleware**: Protección de rutas
- **Persistencia**: Almacenamiento local seguro

## 📊 Performance

- **Lazy Loading**: Carga diferida de imágenes
- **Code Splitting**: División automática de código
- **Tree Shaking**: Eliminación de código no utilizado
- **Caching**: Estrategias de caché optimizadas

## 🧪 Testing

- **Unit Tests**: Vitest para componentes
- **E2E Tests**: Playwright para flujos completos
- **Coverage**: Reportes de cobertura de código

## 🚀 Despliegue

### Frontend
- **Vercel/Netlify**: Despliegue estático
- **Docker**: Contenedorización
- **CDN**: Distribución de contenido

### Backend
- **Heroku/Railway**: Plataformas cloud
- **Docker**: Contenedorización
- **PostgreSQL**: Base de datos en producción

## 📝 Licencia

Este proyecto está bajo la Licencia MIT.

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Para soporte y preguntas, por favor abre un issue en el repositorio.

---

**Desarrollado con ❤️ usando Vue.js, Nuxt.js y Django**