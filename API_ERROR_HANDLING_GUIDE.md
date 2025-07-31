# API Error Handling Guide

Este documento describe el sistema estandarizado de manejo de errores y respuestas para la API del blog.

## 📋 Formato de Respuesta Estandarizado

### Respuestas Exitosas

```json
{
  "success": true,
  "data": {
    // Datos de la respuesta
  },
  "message": "Operación exitosa" // Opcional
}
```

### Respuestas de Error

```json
{
  "success": false,
  "error": "Mensaje de error principal",
  "message": "Detalles adicionales", // Opcional
  "errors": {
    // Errores específicos de validación
  }
}
```

## 🛠️ Uso de StandardAPIResponse

### Importar la Clase

```python
from django_blog.api_utils import StandardAPIResponse, HTTPStatus, ErrorMessages
```

### Respuestas Exitosas

```python
# Respuesta simple
return StandardAPIResponse.success(
    data={'posts': posts_data},
    message='Posts retrieved successfully'
)

# Respuesta con código de estado personalizado
return StandardAPIResponse.success(
    data=serializer.data,
    message='Post created successfully',
    status_code=HTTPStatus.CREATED
)
```

### Respuestas de Error

```python
# Error básico
return StandardAPIResponse.error(
    error_message='Invalid data provided',
    status_code=HTTPStatus.BAD_REQUEST
)

# Error de validación
return StandardAPIResponse.validation_error(
    serializer_errors=serializer.errors,
    message='Post validation failed'
)

# Error 404
return StandardAPIResponse.not_found(
    message='Post not found',
    resource_type='Post'
)

# Error de permisos
return StandardAPIResponse.permission_denied(
    message='You do not have permission to edit this post'
)

# Error de autenticación
return StandardAPIResponse.unauthorized(
    message='Please log in to continue'
)

# Error del servidor
return StandardAPIResponse.server_error(
    message='Failed to process request',
    exception=e
)
```

## 🎯 Uso de BaseAPIView

### Heredar de BaseAPIView

```python
from django_blog.api_utils import BaseAPIView

class PostListView(BaseAPIView):
    def get(self, request):
        try:
            posts = Post.objects.all()
            serializer = PostSerializer(posts, many=True)
            return self.success_response(
                data=serializer.data,
                message='Posts retrieved successfully'
            )
        except Exception as e:
            return self.server_error_response(exception=e)
```

### Métodos Disponibles en BaseAPIView

- `success_response(data, message, status_code, **kwargs)`
- `error_response(error_message, message, status_code, errors, **kwargs)`
- `not_found_response(message, resource_type)`
- `permission_denied_response(message, required_permission)`
- `unauthorized_response(message)`
- `validation_error_response(serializer_errors, message)`
- `server_error_response(message, exception)`
- `handle_exceptions(func, *args, **kwargs)`

## 🔧 Decoradores Útiles

### @api_error_handler

Maneja automáticamente las excepciones comunes:

```python
from django_blog.decorators import api_error_handler

@api_error_handler
def my_api_view(request):
    # Si ocurre una excepción, se maneja automáticamente
    return StandardAPIResponse.success(data={'result': 'ok'})
```

### @require_fields

Valida que los campos requeridos estén presentes:

```python
from django_blog.decorators import require_fields

@require_fields('title', 'content')
def create_post(request):
    # Los campos 'title' y 'content' están garantizados
    return StandardAPIResponse.success(message='Post created')
```

### @dashboard_permission_required

Verifica permisos específicos del dashboard:

```python
from django_blog.decorators import dashboard_permission_required

@dashboard_permission_required('can_manage_posts')
def dashboard_posts_view(request):
    # Usuario tiene permisos para gestionar posts
    return StandardAPIResponse.success(data={'posts': []})
```

### @validate_pagination_params

Valida parámetros de paginación:

```python
from django_blog.decorators import validate_pagination_params

@validate_pagination_params
def paginated_view(request):
    # page y page_size están validados
    return StandardAPIResponse.success(data={'results': []})
```

### @log_api_call

Registra llamadas a la API para monitoreo:

```python
from django_blog.decorators import log_api_call

@log_api_call
def important_api_view(request):
    # La llamada se registra automáticamente
    return StandardAPIResponse.success(data={'result': 'logged'})
```

## 📊 Constantes Útiles

### Códigos de Estado HTTP

```python
from django_blog.api_utils import HTTPStatus

# Usar en lugar de números mágicos
return StandardAPIResponse.success(
    data=data,
    status_code=HTTPStatus.CREATED  # 201
)
```

### Mensajes de Error Comunes

```python
from django_blog.api_utils import ErrorMessages

return StandardAPIResponse.error(
    error_message=ErrorMessages.VALIDATION_FAILED,
    status_code=HTTPStatus.BAD_REQUEST
)
```

## 🔄 Paginación Estandarizada

### Usar StandardPagination

```python
from django_blog.api_utils import StandardPagination

class PostListView(generics.ListAPIView):
    pagination_class = StandardPagination
    # ...
```

### Formato de Respuesta Paginada

```json
{
  "success": true,
  "data": [
    // Elementos de la página actual
  ],
  "pagination": {
    "count": 100,
    "next": "http://api.example.com/posts/?page=3",
    "previous": "http://api.example.com/posts/?page=1",
    "page_size": 12,
    "current_page": 2,
    "total_pages": 9,
    "has_next": true,
    "has_previous": true
  }
}
```

## 🛡️ Middleware de Seguridad

El sistema incluye varios middlewares automáticos:

### RequestLoggingMiddleware
- Registra todas las llamadas a la API
- Filtra información sensible

### APIErrorHandlingMiddleware
- Maneja excepciones no capturadas
- Convierte errores de Django a formato API

### SecurityHeadersMiddleware
- Agrega headers de seguridad
- Protege contra ataques comunes

### ResponseTimeMiddleware
- Mide tiempo de respuesta
- Registra requests lentos

## 📝 Ejemplos Completos

### Vista de Lista con Manejo de Errores

```python
from django_blog.api_utils import BaseAPIView, StandardPagination
from django_blog.decorators import api_error_handler, validate_pagination_params

class PostListView(BaseAPIView):
    @api_error_handler
    @validate_pagination_params
    def get(self, request):
        return self.handle_exceptions(self._get_posts, request)
    
    def _get_posts(self, request):
        posts = Post.objects.filter(status='published')
        
        # Aplicar filtros
        search = request.GET.get('search')
        if search:
            posts = posts.filter(title__icontains=search)
        
        # Paginación
        paginator = StandardPagination()
        page = paginator.paginate_queryset(posts, request)
        
        if page is not None:
            serializer = PostSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        serializer = PostSerializer(posts, many=True)
        return self.success_response(data=serializer.data)
```

### Vista de Creación con Validación

```python
from django_blog.decorators import require_fields, api_error_handler

class PostCreateView(BaseAPIView):
    @api_error_handler
    @require_fields('title', 'content', 'category_id')
    def post(self, request):
        return self.handle_exceptions(self._create_post, request)
    
    def _create_post(self, request):
        serializer = PostSerializer(data=request.data)
        
        if serializer.is_valid():
            post = serializer.save(author=request.user)
            return self.success_response(
                data=PostSerializer(post).data,
                message='Post created successfully',
                status_code=HTTPStatus.CREATED
            )
        
        return self.validation_error_response(
            serializer_errors=serializer.errors,
            message='Post validation failed'
        )
```

## 🚀 Mejores Prácticas

1. **Siempre usar StandardAPIResponse** para mantener consistencia
2. **Heredar de BaseAPIView** para vistas personalizadas
3. **Usar decoradores** para funcionalidad común
4. **Manejar excepciones específicas** antes que genéricas
5. **Proporcionar mensajes descriptivos** en los errores
6. **Usar constantes** en lugar de números mágicos
7. **Registrar errores importantes** para debugging
8. **Validar entrada** antes de procesamiento
9. **Usar paginación estandarizada** para listas
10. **Documentar APIs** con ejemplos de respuesta

## 🔍 Debugging y Monitoreo

### Logs Automáticos

El sistema registra automáticamente:
- Todas las llamadas a la API
- Errores y excepciones
- Requests lentos (>1 segundo)
- Cambios de permisos

### Headers de Respuesta

Cada respuesta incluye headers útiles:
- `X-Response-Time`: Tiempo de procesamiento
- `X-API-Version`: Versión de la API
- Headers de seguridad automáticos

### Monitoreo de Errores

Los errores se registran con diferentes niveles:
- `INFO`: Llamadas normales a la API
- `WARNING`: Errores de cliente (4xx)
- `ERROR`: Errores del servidor (5xx)
- `DEBUG`: Información detallada de desarrollo

¡El sistema está diseñado para ser robusto, consistente y fácil de usar! 🎉