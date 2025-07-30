"""
Serializadores base para mantener consistencia en toda la aplicación
"""

from rest_framework import serializers
from rest_framework.pagination import PageNumberPagination
from django.contrib.auth import get_user_model
from django.utils import timezone
import re

User = get_user_model()


class BaseModelSerializer(serializers.ModelSerializer):
    """
    Serializador base que proporciona campos y métodos comunes
    """
    created_at = serializers.SerializerMethodField()
    updated_at = serializers.SerializerMethodField()
    
    def get_created_at(self, obj):
        """Obtener fecha de creación en formato ISO"""
        if hasattr(obj, 'fecha_creacion') and obj.fecha_creacion:
            return obj.fecha_creacion.isoformat()
        elif hasattr(obj, 'date_joined') and obj.date_joined:
            return obj.date_joined.isoformat()
        return None
    
    def get_updated_at(self, obj):
        """Obtener fecha de actualización en formato ISO"""
        if hasattr(obj, 'fecha_actualizacion') and obj.fecha_actualizacion:
            return obj.fecha_actualizacion.isoformat()
        return None


class UserBasicSerializer(BaseModelSerializer):
    """
    Serializador básico de usuario para uso público (sin información sensible)
    """
    full_name = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'full_name',
            'avatar_url', 'created_at', 'updated_at'
        ]
    
    def get_full_name(self, obj):
        """Obtener nombre completo del usuario"""
        full_name = f"{obj.first_name} {obj.last_name}".strip()
        return full_name if full_name else obj.username
    
    def get_avatar_url(self, obj):
        """Obtener URL del avatar (placeholder por ahora)"""
        # En el futuro se puede implementar con Gravatar o campo de imagen
        return f"https://ui-avatars.com/api/?name={obj.username}&background=random"


class UserDetailSerializer(BaseModelSerializer):
    """
    Serializador detallado de usuario con información adicional
    """
    full_name = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()
    stats = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'avatar_url', 'is_active', 'is_staff', 'last_login',
            'permissions', 'stats', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'is_staff', 'last_login', 'created_at', 'updated_at']
    
    def get_full_name(self, obj):
        """Obtener nombre completo del usuario"""
        full_name = f"{obj.first_name} {obj.last_name}".strip()
        return full_name if full_name else obj.username
    
    def get_avatar_url(self, obj):
        """Obtener URL del avatar"""
        return f"https://ui-avatars.com/api/?name={obj.username}&background=random"
    
    def get_permissions(self, obj):
        """Obtener permisos del usuario"""
        permissions = {
            'is_staff': obj.is_staff,
            'is_superuser': obj.is_superuser,
            'is_active': obj.is_active
        }
        
        # Agregar permisos del dashboard si existen
        try:
            if hasattr(obj, 'dashboard_permission'):
                dashboard_perm = obj.dashboard_permission
                permissions['dashboard'] = {
                    'can_manage_posts': dashboard_perm.can_manage_posts,
                    'can_manage_users': dashboard_perm.can_manage_users,
                    'can_manage_comments': dashboard_perm.can_manage_comments,
                    'can_view_stats': dashboard_perm.can_view_stats,
                }
        except Exception:
            pass
        
        return permissions
    
    def get_stats(self, obj):
        """Obtener estadísticas del usuario"""
        stats = {
            'posts_count': 0,
            'comments_count': 0,
            'published_posts_count': 0
        }
        
        try:
            if hasattr(obj, 'post_set'):
                stats['posts_count'] = obj.post_set.count()
                stats['published_posts_count'] = obj.post_set.filter(status='published').count()
            
            if hasattr(obj, 'comentario_set'):
                stats['comments_count'] = obj.comentario_set.count()
        except Exception:
            pass
        
        return stats


class CategoryBasicSerializer(BaseModelSerializer):
    """
    Serializador básico de categoría
    """
    name = serializers.CharField(source='nombre', read_only=True)
    description = serializers.CharField(source='descripcion', read_only=True)
    posts_count = serializers.SerializerMethodField()
    slug = serializers.SerializerMethodField()
    
    class Meta:
        model = None  # Se definirá en las subclases
        fields = [
            'id', 'name', 'description', 'posts_count', 'slug',
            'created_at', 'updated_at'
        ]
        abstract = True
    
    def get_posts_count(self, obj):
        """Obtener número de posts publicados en la categoría"""
        try:
            return obj.post_set.filter(status='published').count()
        except Exception:
            return 0
    
    def get_slug(self, obj):
        """Generar slug para la categoría"""
        if hasattr(obj, 'nombre') and obj.nombre:
            slug = re.sub(r'[^\w\s-]', '', obj.nombre.lower())
            slug = re.sub(r'[-\s]+', '-', slug)
            return f"{obj.id}-{slug[:50]}"
        return str(obj.id)


class PostBasicSerializer(BaseModelSerializer):
    """
    Serializador básico de post
    """
    title = serializers.CharField(source='titulo', read_only=True)
    content = serializers.CharField(source='contenido', read_only=True)
    image = serializers.ImageField(source='imagen', read_only=True)
    author = UserBasicSerializer(source='autor', read_only=True)
    category = serializers.SerializerMethodField()
    published_at = serializers.DateTimeField(source='fecha_publicacion', read_only=True)
    is_featured = serializers.BooleanField(source='featured', read_only=True)
    slug = serializers.SerializerMethodField()
    reading_time = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    
    class Meta:
        model = None  # Se definirá en las subclases
        fields = [
            'id', 'title', 'content', 'excerpt', 'image', 'author', 'category',
            'status', 'is_featured', 'slug', 'published_at', 'reading_time',
            'comments_count', 'created_at', 'updated_at'
        ]
        abstract = True
    
    def get_category(self, obj):
        """Obtener información de la categoría"""
        if hasattr(obj, 'categoria') and obj.categoria:
            return {
                'id': obj.categoria.id,
                'name': obj.categoria.nombre,
                'slug': self._generate_slug(obj.categoria.nombre, obj.categoria.id)
            }
        return None
    
    def get_slug(self, obj):
        """Generar slug para el post"""
        if hasattr(obj, 'titulo') and obj.titulo:
            slug = re.sub(r'[^\w\s-]', '', obj.titulo.lower())
            slug = re.sub(r'[-\s]+', '-', slug)
            return f"{obj.id}-{slug[:50]}"
        return str(obj.id)
    
    def get_reading_time(self, obj):
        """Calcular tiempo de lectura estimado"""
        if hasattr(obj, 'contenido') and obj.contenido:
            word_count = len(obj.contenido.split())
            return max(1, round(word_count / 200))  # 200 palabras por minuto
        return 1
    
    def get_comments_count(self, obj):
        """Obtener número de comentarios aprobados"""
        try:
            if hasattr(obj, 'comentarios'):
                return obj.comentarios.filter(approved=True).count()
        except Exception:
            pass
        return 0
    
    def _generate_slug(self, text, obj_id):
        """Generar slug a partir de texto"""
        if text:
            slug = re.sub(r'[^\w\s-]', '', text.lower())
            slug = re.sub(r'[-\s]+', '-', slug)
            return f"{obj_id}-{slug[:50]}"
        return str(obj_id)


class CommentBasicSerializer(BaseModelSerializer):
    """
    Serializador básico de comentario
    """
    content = serializers.CharField(source='contenido', read_only=True)
    author = UserBasicSerializer(source='usuario', read_only=True)
    post_title = serializers.CharField(source='post.titulo', read_only=True)
    replies_count = serializers.SerializerMethodField()
    can_reply = serializers.SerializerMethodField()
    
    class Meta:
        model = None  # Se definirá en las subclases
        fields = [
            'id', 'content', 'author', 'post', 'post_title', 'parent',
            'approved', 'replies_count', 'can_reply', 'created_at', 'updated_at'
        ]
        abstract = True
    
    def get_replies_count(self, obj):
        """Obtener número de respuestas"""
        try:
            if hasattr(obj, 'replies'):
                return obj.replies.filter(approved=True).count()
        except Exception:
            pass
        return 0
    
    def get_can_reply(self, obj):
        """Verificar si se puede responder al comentario"""
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return False
        
        # Solo se puede responder a comentarios aprobados
        return obj.approved


class PaginatedResponseSerializer(serializers.Serializer):
    """
    Serializador para respuestas paginadas estandarizadas
    """
    success = serializers.BooleanField(default=True)
    data = serializers.ListField()
    pagination = serializers.DictField()
    message = serializers.CharField(required=False)
    
    def to_representation(self, instance):
        """Personalizar la representación de la respuesta paginada"""
        if hasattr(instance, 'data'):
            # Es una respuesta de DRF PageNumberPagination
            return {
                'success': True,
                'data': instance.data,
                'pagination': {
                    'count': getattr(instance, 'count', 0),
                    'next': getattr(instance, 'next', None),
                    'previous': getattr(instance, 'previous', None),
                    'page_size': getattr(instance, 'page_size', 12),
                    'current_page': getattr(instance, 'current_page', 1),
                    'total_pages': getattr(instance, 'total_pages', 1),
                    'has_next': getattr(instance, 'has_next', False),
                    'has_previous': getattr(instance, 'has_previous', False)
                }
            }
        return super().to_representation(instance)


class ErrorResponseSerializer(serializers.Serializer):
    """
    Serializador para respuestas de error estandarizadas
    """
    success = serializers.BooleanField(default=False)
    error = serializers.CharField()
    message = serializers.CharField(required=False)
    errors = serializers.DictField(required=False)
    status_code = serializers.IntegerField(required=False)
    timestamp = serializers.DateTimeField(default=timezone.now)


class SuccessResponseSerializer(serializers.Serializer):
    """
    Serializador para respuestas exitosas estandarizadas
    """
    success = serializers.BooleanField(default=True)
    data = serializers.JSONField(required=False)
    message = serializers.CharField(required=False)
    timestamp = serializers.DateTimeField(default=timezone.now)


class BulkActionSerializer(serializers.Serializer):
    """
    Serializador base para acciones en lote
    """
    ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1,
        help_text='Lista de IDs de objetos'
    )
    action = serializers.CharField(help_text='Acción a realizar')
    
    def validate_ids(self, value):
        """Validar que los IDs sean únicos"""
        if len(value) != len(set(value)):
            raise serializers.ValidationError('Los IDs deben ser únicos')
        return value


class FilterSerializer(serializers.Serializer):
    """
    Serializador base para filtros
    """
    search = serializers.CharField(required=False, help_text='Término de búsqueda')
    ordering = serializers.CharField(required=False, help_text='Campo de ordenamiento')
    page = serializers.IntegerField(required=False, min_value=1, help_text='Número de página')
    page_size = serializers.IntegerField(required=False, min_value=1, max_value=100, help_text='Tamaño de página')
    
    def validate_ordering(self, value):
        """Validar campo de ordenamiento"""
        if value:
            # Remover el signo menos si existe
            field = value.lstrip('-')
            # Aquí se pueden agregar validaciones específicas según el modelo
            return value
        return value


class MediaUploadSerializer(serializers.Serializer):
    """
    Serializador para subida de archivos multimedia
    """
    file = serializers.FileField(help_text='Archivo a subir')
    alt_text = serializers.CharField(required=False, max_length=200, help_text='Texto alternativo')
    caption = serializers.CharField(required=False, max_length=500, help_text='Descripción del archivo')
    
    def validate_file(self, value):
        """Validar archivo subido"""
        # Validar tamaño (máximo 10MB)
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError('El archivo no puede ser mayor a 10MB')
        
        # Validar tipo de archivo
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if hasattr(value, 'content_type') and value.content_type not in allowed_types:
            raise serializers.ValidationError(
                f'Tipo de archivo no permitido. Tipos permitidos: {", ".join(allowed_types)}'
            )
        
        return value


class StatsSerializer(serializers.Serializer):
    """
    Serializador base para estadísticas
    """
    total = serializers.IntegerField(help_text='Total de elementos')
    active = serializers.IntegerField(required=False, help_text='Elementos activos')
    inactive = serializers.IntegerField(required=False, help_text='Elementos inactivos')
    recent = serializers.IntegerField(required=False, help_text='Elementos recientes')
    period = serializers.CharField(required=False, help_text='Período de las estadísticas')
    last_updated = serializers.DateTimeField(default=timezone.now, help_text='Última actualización')


class ValidationErrorSerializer(serializers.Serializer):
    """
    Serializador para errores de validación detallados
    """
    field = serializers.CharField(help_text='Campo con error')
    message = serializers.CharField(help_text='Mensaje de error')
    code = serializers.CharField(required=False, help_text='Código de error')


class MetadataSerializer(serializers.Serializer):
    """
    Serializador para metadatos adicionales
    """
    version = serializers.CharField(default='1.0', help_text='Versión de la API')
    timestamp = serializers.DateTimeField(default=timezone.now, help_text='Timestamp de la respuesta')
    request_id = serializers.CharField(required=False, help_text='ID de la petición')
    user_id = serializers.IntegerField(required=False, help_text='ID del usuario que hace la petición')