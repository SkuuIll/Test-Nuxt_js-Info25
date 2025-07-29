# Dashboard Design Document

## Overview

El dashboard administrativo será una aplicación web moderna que se integrará con el proyecto existente de Django + Nuxt. Proporcionará una interfaz centralizada para gestionar todo el contenido del blog, incluyendo posts, usuarios, comentarios y estadísticas. El diseño seguirá los principios de Material Design y será completamente responsive.

## Architecture

### Frontend Architecture
- **Framework**: Nuxt 3 con TypeScript
- **Styling**: Tailwind CSS (ya configurado en el proyecto)
- **State Management**: Pinia (ya configurado)
- **Componentes UI**: Headless UI + Tailwind para componentes personalizados
- **Autenticación**: JWT tokens con refresh token rotation
- **Routing**: Nuxt router con middleware de autenticación

### Backend Architecture
- **Framework**: Django REST Framework (ya configurado)
- **Autenticación**: JWT con django-rest-framework-simplejwt (ya configurado)
- **Permisos**: Django permissions system con grupos personalizados
- **Serializers**: DRF serializers para APIs del dashboard
- **ViewSets**: DRF ViewSets para operaciones CRUD

### Integration Points
- **API Communication**: Axios/Fetch API con interceptors para JWT
- **CORS**: Ya configurado para localhost:3000
- **Media Handling**: Django media files servidos estáticamente
- **Real-time Updates**: WebSocket opcional para notificaciones

## Components and Interfaces

### Frontend Components Structure

```
pages/
├── dashboard/
│   ├── index.vue                 # Dashboard principal con estadísticas
│   ├── posts/
│   │   ├── index.vue            # Lista de posts
│   │   ├── create.vue           # Crear post
│   │   └── [id]/
│   │       └── edit.vue         # Editar post
│   ├── users/
│   │   ├── index.vue            # Lista de usuarios
│   │   └── [id]/
│   │       └── profile.vue      # Perfil de usuario
│   ├── comments/
│   │   └── index.vue            # Gestión de comentarios
│   └── settings/
│       └── index.vue            # Configuraciones
├── auth/
│   ├── login.vue                # Login del dashboard
│   └── logout.vue               # Logout
```

### Shared Components

```
components/
├── Dashboard/
│   ├── Layout/
│   │   ├── Sidebar.vue          # Navegación lateral
│   │   ├── Header.vue           # Header con usuario y notificaciones
│   │   └── Breadcrumb.vue       # Navegación de migas
│   ├── Stats/
│   │   ├── StatCard.vue         # Tarjetas de estadísticas
│   │   ├── Chart.vue            # Gráficos con Chart.js
│   │   └── RecentActivity.vue   # Actividad reciente
│   ├── Posts/
│   │   ├── PostTable.vue        # Tabla de posts
│   │   ├── PostForm.vue         # Formulario de post
│   │   └── PostPreview.vue      # Vista previa de post
│   ├── Users/
│   │   ├── UserTable.vue        # Tabla de usuarios
│   │   └── UserForm.vue         # Formulario de usuario
│   ├── Comments/
│   │   ├── CommentTable.vue     # Tabla de comentarios
│   │   └── CommentCard.vue      # Tarjeta de comentario
│   └── Common/
│       ├── DataTable.vue        # Tabla de datos reutilizable
│       ├── Modal.vue            # Modal reutilizable
│       ├── Toast.vue            # Notificaciones toast
│       └── LoadingSpinner.vue   # Indicador de carga
```

### Backend API Endpoints

```python
# URLs del dashboard
urlpatterns = [
    path('api/dashboard/', include([
        # Estadísticas
        path('stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
        
        # Posts management
        path('posts/', PostViewSet.as_view({'get': 'list', 'post': 'create'})),
        path('posts/<int:pk>/', PostViewSet.as_view({
            'get': 'retrieve', 'put': 'update', 'delete': 'destroy'
        })),
        
        # Users management
        path('users/', UserViewSet.as_view({'get': 'list'})),
        path('users/<int:pk>/', UserViewSet.as_view({
            'get': 'retrieve', 'put': 'update'
        })),
        
        # Comments management
        path('comments/', CommentViewSet.as_view({'get': 'list'})),
        path('comments/<int:pk>/', CommentViewSet.as_view({
            'put': 'update', 'delete': 'destroy'
        })),
        
        # Categories
        path('categories/', CategoryViewSet.as_view({'get': 'list', 'post': 'create'})),
    ])),
]
```

## Data Models

### Existing Models (Already Implemented)
- **Post**: titulo, contenido, fecha_publicacion, imagen, categoria, autor, status, featured
- **Categoria**: nombre, descripcion, fecha_creacion
- **Comentario**: post, usuario, contenido, fecha_creacion, approved, parent
- **User**: Django's built-in User model

### New Models for Dashboard

```python
class DashboardPermission(models.Model):
    """Permisos específicos del dashboard"""
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    can_manage_posts = models.BooleanField(default=False)
    can_manage_users = models.BooleanField(default=False)
    can_manage_comments = models.BooleanField(default=False)
    can_view_stats = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

class ActivityLog(models.Model):
    """Log de actividades del dashboard"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    action = models.CharField(max_length=100)  # 'created_post', 'deleted_user', etc.
    target_model = models.CharField(max_length=50)  # 'Post', 'User', etc.
    target_id = models.IntegerField()
    description = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
```

### API Response Formats

```typescript
// Dashboard Stats Response
interface DashboardStats {
  totalPosts: number;
  totalUsers: number;
  totalComments: number;
  monthlyViews: number;
  popularPosts: Array<{
    id: number;
    title: string;
    views: number;
  }>;
  recentActivity: Array<{
    id: number;
    action: string;
    user: string;
    timestamp: string;
  }>;
}

// Post API Response
interface PostResponse {
  id: number;
  titulo: string;
  contenido: string;
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  imagen?: string;
  categoria?: {
    id: number;
    nombre: string;
  };
  autor: {
    id: number;
    username: string;
    email: string;
  };
  fecha_creacion: string;
  fecha_publicacion: string;
}
```

## Error Handling

### Frontend Error Handling
- **API Errors**: Interceptor de Axios para manejar errores HTTP
- **Validation Errors**: Mostrar errores de validación en formularios
- **Network Errors**: Mostrar mensaje de error de conexión
- **Authentication Errors**: Redirigir a login si el token expira

```typescript
// Error handling composable
export const useErrorHandler = () => {
  const toast = useToast();
  
  const handleApiError = (error: any) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      navigateTo('/auth/login');
    } else if (error.response?.status === 403) {
      toast.error('No tienes permisos para realizar esta acción');
    } else if (error.response?.status >= 500) {
      toast.error('Error del servidor. Intenta nuevamente.');
    } else {
      toast.error(error.response?.data?.message || 'Error inesperado');
    }
  };
  
  return { handleApiError };
};
```

### Backend Error Handling
- **Custom Exception Handler**: Para respuestas consistentes de error
- **Validation Errors**: Serializer validation con mensajes en español
- **Permission Errors**: Mensajes claros de permisos denegados
- **Rate Limiting**: Protección contra spam de requests

```python
# Custom exception handler
def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    
    if response is not None:
        custom_response_data = {
            'error': True,
            'message': 'Ha ocurrido un error',
            'details': response.data
        }
        
        if response.status_code == 400:
            custom_response_data['message'] = 'Datos inválidos'
        elif response.status_code == 401:
            custom_response_data['message'] = 'No autorizado'
        elif response.status_code == 403:
            custom_response_data['message'] = 'Permisos insuficientes'
        elif response.status_code == 404:
            custom_response_data['message'] = 'Recurso no encontrado'
        
        response.data = custom_response_data
    
    return response
```

## Testing Strategy

### Frontend Testing
- **Unit Tests**: Vitest para componentes individuales
- **Integration Tests**: Testing Library para interacciones
- **E2E Tests**: Playwright para flujos completos del dashboard
- **Visual Regression**: Chromatic para cambios visuales

### Backend Testing
- **Unit Tests**: Django TestCase para modelos y vistas
- **API Tests**: DRF APITestCase para endpoints
- **Permission Tests**: Verificar permisos de dashboard
- **Performance Tests**: Django Debug Toolbar para optimización

### Test Coverage Goals
- **Frontend**: >80% coverage en componentes críticos
- **Backend**: >90% coverage en APIs del dashboard
- **E2E**: Cobertura de todos los flujos principales

### Testing Structure

```
tests/
├── frontend/
│   ├── components/
│   │   └── Dashboard/
│   ├── pages/
│   │   └── dashboard/
│   └── e2e/
│       └── dashboard.spec.ts
└── backend/
    ├── test_dashboard_views.py
    ├── test_dashboard_permissions.py
    └── test_dashboard_serializers.py
```

## Security Considerations

### Authentication & Authorization
- **JWT Tokens**: Access tokens de corta duración (1 hora)
- **Refresh Tokens**: Tokens de larga duración con rotación
- **Permission Groups**: Grupos específicos para administradores del dashboard
- **Session Management**: Logout automático por inactividad

### Data Protection
- **CSRF Protection**: Django CSRF tokens para formularios
- **XSS Prevention**: Sanitización de contenido HTML
- **SQL Injection**: ORM de Django previene inyecciones
- **File Upload Security**: Validación de tipos y tamaños de archivo

### API Security
- **Rate Limiting**: Límites por usuario y endpoint
- **Input Validation**: Validación estricta en serializers
- **HTTPS Only**: Forzar HTTPS en producción
- **CORS Configuration**: Configuración restrictiva de CORS

## Performance Optimization

### Frontend Performance
- **Code Splitting**: Lazy loading de rutas del dashboard
- **Image Optimization**: Nuxt Image para optimización automática
- **Caching**: Cache de API responses con TTL
- **Bundle Size**: Tree shaking y minificación

### Backend Performance
- **Database Optimization**: Índices en campos frecuentemente consultados
- **Query Optimization**: Select_related y prefetch_related
- **Caching**: Redis cache para estadísticas frecuentes
- **Pagination**: Paginación eficiente para listas grandes

### Monitoring
- **Performance Metrics**: Tiempo de respuesta de APIs
- **Error Tracking**: Sentry para tracking de errores
- **User Analytics**: Tracking de uso del dashboard
- **Database Monitoring**: Queries lentas y optimización