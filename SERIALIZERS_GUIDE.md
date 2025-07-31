# Guía de Serializers Consistentes

Esta guía documenta el sistema de serializers estandarizados implementado para garantizar consistencia en toda la API.

## 📋 Estructura de Serializers

### Serializers Base

#### `BaseModelSerializer`
Serializer base con funcionalidad común y validación mejorada.

**Características:**
- Mensajes de error mejorados en español
- Validación común para todos los modelos
- Manejo consistente de errores

#### `TimestampedSerializer`
Mixin para campos de timestamp consistentes.

**Campos:**
- `created_at` - Fecha de creación (solo lectura)
- `updated_at` - Fecha de actualización (solo lectura)

#### `UserBasicSerializer`
Información básica de usuario para referencias.

**Campos:**
```json
{
  "id": 1,
  "username": "usuario",
  "email": "usuario@example.com",
  "first_name": "Nombre",
  "last_name": "Apellido",
  "full_name": "Nombre Apellido",
  "avatar_url": "https://ui-avatars.com/api/?name=usuario",
  "is_active": true,
  "date_joined": "2025-01-01T00:00:00Z"
}
```

## 🔧 Serializers de Posts

### `PostSerializer`
Serializer completo para posts con toda la información.

**Campos principales:**
- Información básica del post
- Datos del autor y categoría
- Métricas de engagement
- Metadatos SEO
- Tags y contenido

**Ejemplo de respuesta:**
```json
{
  "id": 1,
  "titulo": "Mi Post",
  "slug": "1-mi-post",
  "excerpt": "Resumen del post...",
  "contenido": "Contenido completo...",
  "content_preview": "Vista previa...",
  "author": {
    "id": 1,
    "username": "autor",
    "full_name": "Autor Completo"
  },
  "category": {
    "id": 1,
    "nombre": "Categoría",
    "posts_count": 5
  },
  "engagement": {
    "comments_count": 3,
    "reading_time": 5,
    "engagement_score": 45,
    "is_trending": false
  },
  "meta_title": "Título SEO",
  "meta_description": "Descripción SEO",
  "published_at": "2025-01-01T00:00:00Z"
}
```

### `PostListSerializer`
Serializer optimizado para listas de posts.

**Características:**
- Campos esenciales únicamente
- Optimizado para rendimiento
- Información de engagement básica

### `PostCreateUpdateSerializer`
Serializer para crear y actualizar posts.

**Validaciones:**
- Título mínimo 5 caracteres, máximo 200
- Contenido mínimo 50 caracteres
- Estado válido (draft, published, archived)
- Validación cruzada para publicación

## 👥 Serializers de Usuarios

### `UserRegistrationSerializer`
Serializer para registro de nuevos usuarios.

**Validaciones:**
- Username único, 3-30 caracteres, solo letras, números y guiones bajos
- Email único y válido
- Contraseñas coincidentes y seguras
- Aceptación de términos obligatoria

### `UserUpdateSerializer`
Serializer para actualizar perfil de usuario.

**Campos editables:**
- `first_name`
- `last_name`
- `email` (con validación de unicidad)

### `ChangePasswordSerializer`
Serializer para cambio de contraseña.

**Validaciones:**
- Contraseña actual correcta
- Nueva contraseña segura
- Confirmación de contraseña
- Nueva contraseña diferente a la actual

## 🔍 Serializers de Filtrado y Búsqueda

### `FilterSerializer`
Serializer base para filtros y búsqueda.

**Campos comunes:**
```json
{
  "search": "término de búsqueda",
  "page": 1,
  "page_size": 12,
  "ordering": "-created_at"
}
```

**Validaciones:**
- Término de búsqueda mínimo 2 caracteres
- Protección XSS básica
- Paginación válida (1-100 elementos por página)
- Campos de ordenamiento permitidos

### `PostSearchSerializer`
Serializer específico para búsqueda de posts.

**Campos adicionales:**
- `category` - ID de categoría
- `author` - ID de autor
- `status` - Estado del post
- `featured` - Posts destacados
- `date_from` / `date_to` - Rango de fechas

## 📊 Serializers de Estadísticas

### `StatsSerializer`
Serializer base para estadísticas.

**Campos:**
- `period` - Período (day, week, month, year)
- `start_date` / `end_date` - Rango personalizado

### `PostStatsSerializer`
Estadísticas específicas de posts.

### `CommentStatsSerializer`
Estadísticas específicas de comentarios.

## 🔄 Serializers de Acciones Masivas

### `BulkActionSerializer`
Serializer base para acciones masivas.

**Estructura:**
```json
{
  "action": "publish",
  "ids": [1, 2, 3, 4, 5]
}
```

### `PostBulkActionSerializer`
Acciones masivas para posts.

**Acciones disponibles:**
- `publish` - Publicar
- `unpublish` - Despublicar
- `archive` - Archivar
- `delete` - Eliminar
- `feature` - Destacar
- `unfeature` - Quitar destaque

### `CommentBulkActionSerializer`
Acciones masivas para comentarios.

**Acciones disponibles:**
- `approve` - Aprobar
- `reject` - Rechazar
- `delete` - Eliminar
- `mark_spam` - Marcar como spam

## 🎯 Serializers de Validación

### `PostValidationSerializer`
Validación de calidad de posts.

**Métricas:**
```json
{
  "title_valid": true,
  "content_valid": true,
  "category_valid": true,
  "image_valid": true,
  "seo_score": 85,
  "readability_score": 78,
  "word_count": 450,
  "reading_time": 3,
  "quality_score": 92,
  "suggestions": ["Agregar más subtítulos"],
  "warnings": ["Meta descripción muy larga"],
  "errors": []
}
```

## 🔐 Serializers SEO

### `SEOSerializer`
Mixin para campos SEO.

**Campos:**
- `meta_title` (máximo 60 caracteres)
- `meta_description` (máximo 160 caracteres)
- `canonical_url`
- `og_title`
- `og_description`
- `og_image`

## 📤 Serializers de Respuesta

### `SuccessResponseSerializer`
Formato estándar para respuestas exitosas.

```json
{
  "success": true,
  "data": { ... },
  "message": "Operación exitosa",
  "pagination": { ... }
}
```

### `ErrorResponseSerializer`
Formato estándar para respuestas de error.

```json
{
  "success": false,
  "error": "Mensaje de error",
  "message": "Detalles adicionales",
  "errors": { ... },
  "error_code": "VALIDATION_ERROR"
}
```

## 🎨 Mejores Prácticas

### 1. Consistencia de Nombres
- Usar `snake_case` para nombres de campos
- Nombres descriptivos y claros
- Evitar abreviaciones confusas

### 2. Validación Robusta
- Validar longitud de campos
- Verificar unicidad cuando sea necesario
- Protección contra XSS y inyección
- Mensajes de error claros en español

### 3. Optimización de Rendimiento
- Usar `select_related` y `prefetch_related`
- Serializers específicos para listas vs detalles
- Campos calculados eficientes

### 4. Seguridad
- Campos de solo lectura apropiados
- Validación de permisos en serializers
- Sanitización de entrada

### 5. Documentación
- Docstrings claros en todos los serializers
- Ejemplos de uso en comentarios
- Documentación de validaciones

## 🧪 Testing

### Ejecutar Pruebas de Consistencia
```bash
python test_serializers_consistency.py
```

### Métricas de Calidad
- ✅ 100% de éxito en pruebas principales
- ✅ Validación robusta implementada
- ✅ Formato de respuesta consistente
- ✅ Mensajes de error en español
- ✅ Campos de timestamp estandarizados

## 🔄 Migración de Serializers Existentes

### Pasos para Actualizar
1. Heredar de serializers base apropiados
2. Actualizar nombres de campos a `snake_case`
3. Implementar validaciones robustas
4. Agregar campos de timestamp
5. Probar con script de consistencia

### Ejemplo de Migración
```python
# Antes
class OldPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ['title', 'content']

# Después
class PostSerializer(PostBasicSerializer, SEOSerializer):
    engagement = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = PostBasicSerializer.Meta.fields + [
            'contenido', 'engagement', 'meta_title'
        ]
    
    def get_engagement(self, obj):
        return {
            'comments_count': obj.comentarios.count(),
            'reading_time': self.get_reading_time(obj)
        }
```

¡Los serializers están ahora completamente estandarizados y listos para uso en producción! 🎉