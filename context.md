# Resumen del Proyecto: Blog con Django y Nuxt

Este documento proporciona un resumen completo del proyecto de blog, diseñado para ser entendido por una IA. El proyecto está compuesto por un backend de Django y un frontend de Nuxt.

## Arquitectura General

El proyecto sigue una arquitectura de aplicación de una sola página (SPA) desacoplada:

*   **Backend:** Una API RESTful construida con Django y Django REST Framework.
*   **Frontend:** Una aplicación de una sola página (SPA) construida con Nuxt 3 (Vue 3).

## Backend (Django)

El backend de Django es responsable de la lógica de negocio, la gestión de datos y la autenticación.

### Aplicaciones Principales

*   `posts`: Gestiona las publicaciones del blog, categorías y etiquetas.
*   `users`: Gestiona la autenticación y los perfiles de usuario.
*   `comments`: Gestiona los comentarios en las publicaciones.
*   `dashboard`: Proporciona endpoints para el panel de administración del frontend.
*   `accounts`: Define el modelo de usuario personalizado.
*   `media_files`: Gestiona la subida y el almacenamiento de archivos multimedia.

### Tecnologías Clave

*   **Framework:** Django
*   **API:** Django REST Framework
*   **Autenticación:** `djangorestframework-simplejwt` (JSON Web Tokens)
*   **Base de datos:** SQLite (para desarrollo)
*   **CORS:** `django-cors-headers`
*   **Editor de texto enriquecido:** `django-tinymce`

### Estructura de la API

*   Todas las URLs de la API están prefijadas con `/api/v1/`.
*   Los endpoints están organizados por aplicación (p. ej., `/api/v1/posts/`, `/api/v1/users/`).

## Frontend (Nuxt)

El frontend de Nuxt es responsable de la interfaz de usuario y la interacción con el usuario.

### Características Principales

*   Renderizado del lado del cliente (CSR).
*   Sistema de componentes reutilizables.
*   Manejo de estado centralizado con Pinia.
*   Enrutamiento basado en el sistema de archivos.

### Tecnologías Clave

*   **Framework:** Nuxt 3 (Vue 3)
*   **Estilos:** Tailwind CSS
*   **Manejo de estado:** Pinia
*   **Pruebas:** Vitest (unitarias) y Playwright (end-to-end)
*   **Llamadas a la API:** `useApi` composable (basado en `fetch`)

### Estructura del Frontend

*   `components`: Componentes de Vue reutilizables.
*   `composables`: Funciones de composición reutilizables (p. ej., `useApi`, `useAuth`).
*   `pages`: Rutas de la aplicación.
*   `stores`: Módulos de Pinia para el manejo de estado.
*   `layouts`: Diseños de página.
*   `assets`: Archivos estáticos como CSS e imágenes.

## Flujo de Datos

1.  El frontend de Nuxt se carga en el navegador del usuario.
2.  El frontend realiza llamadas a la API del backend de Django para obtener y enviar datos (p. ej., obtener publicaciones, iniciar sesión, crear comentarios).
3.  El backend de Django procesa las solicitudes, interactúa con la base de datos y devuelve respuestas en formato JSON.
4.  El frontend de Nuxt actualiza la interfaz de usuario en función de las respuestas de la API.

## Cómo Empezar

1.  **Backend:**
    *   Instalar las dependencias de Python: `pip install -r requirements.txt`
    *   Ejecutar las migraciones de la base de datos: `python manage.py migrate`
    *   Iniciar el servidor de desarrollo: `python manage.py runserver`
2.  **Frontend:**
    *   Instalar las dependencias de Node.js: `npm install`
    *   Iniciar el servidor de desarrollo: `npm run dev`
