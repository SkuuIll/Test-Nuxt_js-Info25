from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Post, Category, Comment
from django_blog.base_serializers import (
    BaseModelSerializer, UserBasicSerializer, CategoryBasicSerializer,
    PostBasicSerializer, CommentBasicSerializer, PaginatedResponseSerializer,
    ErrorResponseSerializer, SuccessResponseSerializer, FilterSerializer,
    MediaUploadSerializer, ValidationErrorSerializer
)

User = get_user_model()


# UserBasicSerializer ahora se importa desde base_serializers

class CategorySerializer(CategoryBasicSerializer):
    """Serializador para categorías con información completa"""
    
    class Meta:
        model = Category
        fields = CategoryBasicSerializer.Meta.fields + [
            'nombre', 'descripcion', 'fecha_creacion', 'fecha_actualizacion'
        ]

class PostSerializer(PostBasicSerializer):
    """Serializador completo para posts"""
    category = CategorySerializer(source='categoria', read_only=True)
    tags = serializers.SerializerMethodField()
    meta_data = serializers.SerializerMethodField()
    engagement = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = PostBasicSerializer.Meta.fields + [
            'titulo', 'contenido', 'imagen', 'meta_title', 'meta_description',
            'fecha_creacion', 'fecha_publicacion', 'fecha_actualizacion',
            'tags', 'meta_data', 'engagement'
        ]
    
    def get_tags(self, obj):
        """Obtener tags del post (placeholder por ahora)"""
        # En el futuro se puede implementar un sistema de tags
        tags = []
        if hasattr(obj, 'categoria') and obj.categoria:
            tags.append({
                'id': obj.categoria.id,
                'name': obj.categoria.nombre,
                'type': 'category'
            })
        return tags
    
    def get_meta_data(self, obj):
        """Obtener metadatos del post"""
        return {
            'meta_title': obj.meta_title or obj.titulo,
            'meta_description': obj.meta_description or obj.excerpt,
            'canonical_url': f"/posts/{self.get_slug(obj)}",
            'og_image': obj.imagen.url if obj.imagen else None,
            'published_date': obj.fecha_publicacion.isoformat() if obj.fecha_publicacion else None,
            'modified_date': obj.fecha_actualizacion.isoformat() if obj.fecha_actualizacion else None
        }
    
    def get_engagement(self, obj):
        """Obtener métricas de engagement"""
        comments_count = self.get_comments_count(obj)
        return {
            'comments_count': comments_count,
            'reading_time': self.get_reading_time(obj),
            'engagement_score': min(100, comments_count * 10 + self.get_reading_time(obj))
        }

class CommentSerializer(CommentBasicSerializer):
    """Serializador completo para comentarios"""
    replies = serializers.SerializerMethodField()
    is_author = serializers.SerializerMethodField()
    moderation_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = CommentBasicSerializer.Meta.fields + [
            'contenido', 'fecha_creacion', 'fecha_actualizacion',
            'replies', 'is_author', 'moderation_info'
        ]
    
    def get_replies(self, obj):
        """Obtener respuestas al comentario"""
        if hasattr(obj, 'replies') and obj.replies.exists():
            replies = obj.replies.filter(approved=True).order_by('fecha_creacion')
            return CommentSerializer(replies, many=True, context=self.context).data
        return []
    
    def get_is_author(self, obj):
        """Verificar si el usuario actual es el autor del comentario"""
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            return obj.usuario == request.user
        return False
    
    def get_moderation_info(self, obj):
        """Información de moderación (solo para staff)"""
        request = self.context.get('request')
        if (request and request.user and 
            (request.user.is_staff or request.user.is_superuser)):
            return {
                'approved': obj.approved,
                'moderated_at': obj.fecha_actualizacion.isoformat() if obj.fecha_actualizacion else None,
                'can_moderate': True
            }
        return None


class PostCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating posts"""
    
    class Meta:
        model = Post
        fields = [
            'titulo', 'contenido', 'excerpt', 'imagen', 'categoria',
            'meta_title', 'meta_description', 'status', 'featured'
        ]
    
    def validate_titulo(self, value):
        if len(value.strip()) < 5:
            raise serializers.ValidationError('Title must be at least 5 characters long')
        return value.strip()
    
    def validate_contenido(self, value):
        if len(value.strip()) < 20:
            raise serializers.ValidationError('Content must be at least 20 characters long')
        return value.strip()
    
    def validate_status(self, value):
        if value not in ['draft', 'published', 'archived']:
            raise serializers.ValidationError('Invalid status')
        return value


class CommentCreateUpdateSerializer(BaseModelSerializer):
    """Serializador para crear y actualizar comentarios"""
    
    class Meta:
        model = Comment
        fields = ['contenido', 'post', 'parent']
    
    def validate_contenido(self, value):
        """Validar contenido del comentario"""
        if not value or len(value.strip()) < 5:
            raise serializers.ValidationError('El comentario debe tener al menos 5 caracteres')
        
        # Validar longitud máxima
        if len(value.strip()) > 1000:
            raise serializers.ValidationError('El comentario no puede exceder 1000 caracteres')
        
        # Validar contenido spam básico
        spam_words = ['spam', 'viagra', 'casino', 'lottery']
        content_lower = value.lower()
        for word in spam_words:
            if word in content_lower:
                raise serializers.ValidationError('El comentario contiene contenido no permitido')
        
        return value.strip()
    
    def validate_post(self, value):
        """Validar que el post existe y está publicado"""
        if not value:
            raise serializers.ValidationError('El post es requerido')
        
        if value.status != 'published':
            raise serializers.ValidationError('No se pueden agregar comentarios a posts no publicados')
        
        return value
    
    def validate_parent(self, value):
        """Validar comentario padre"""
        if value:
            # Verificar que el comentario padre existe y está aprobado
            if not value.approved:
                raise serializers.ValidationError('No se puede responder a un comentario no aprobado')
            
            # Verificar que pertenece al mismo post
            if hasattr(self, 'initial_data') and 'post' in self.initial_data:
                post_id = self.initial_data['post']
                if isinstance(post_id, Post):
                    post_id = post_id.id
                if value.post.id != int(post_id):
                    raise serializers.ValidationError('El comentario padre debe pertenecer al mismo post')
        
        return value
    
    def create(self, validated_data):
        """Crear comentario con usuario actual"""
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            validated_data['usuario'] = request.user
        
        # Los comentarios requieren moderación por defecto
        validated_data['approved'] = False
        
        return super().create(validated_data)


class PostListSerializer(PostBasicSerializer):
    """Serializador optimizado para listas de posts"""
    
    class Meta:
        model = Post
        fields = [
            'id', 'title', 'excerpt', 'image', 'author', 'category',
            'is_featured', 'slug', 'published_at', 'reading_time',
            'comments_count', 'created_at'
        ]


class PostDetailSerializer(PostSerializer):
    """Serializador detallado para vista individual de post"""
    related_posts = serializers.SerializerMethodField()
    comments = serializers.SerializerMethodField()
    breadcrumbs = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = PostSerializer.Meta.fields + [
            'related_posts', 'comments', 'breadcrumbs'
        ]
    
    def get_related_posts(self, obj):
        """Obtener posts relacionados"""
        related = Post.objects.filter(
            categoria=obj.categoria,
            status='published'
        ).exclude(id=obj.id).order_by('-fecha_publicacion')[:3]
        
        return PostListSerializer(related, many=True, context=self.context).data
    
    def get_comments(self, obj):
        """Obtener comentarios del post"""
        comments = obj.comentarios.filter(
            approved=True,
            parent__isnull=True
        ).order_by('-fecha_creacion')[:10]
        
        return CommentSerializer(comments, many=True, context=self.context).data
    
    def get_breadcrumbs(self, obj):
        """Obtener breadcrumbs para navegación"""
        breadcrumbs = [
            {'name': 'Inicio', 'url': '/'},
            {'name': 'Blog', 'url': '/blog/'}
        ]
        
        if obj.categoria:
            breadcrumbs.append({
                'name': obj.categoria.nombre,
                'url': f'/blog/category/{obj.categoria.id}/'
            })
        
        breadcrumbs.append({
            'name': obj.titulo,
            'url': f'/blog/post/{self.get_slug(obj)}/',
            'current': True
        })
        
        return breadcrumbs


class PostSearchSerializer(FilterSerializer):
    """Serializador para filtros de búsqueda de posts"""
    category = serializers.IntegerField(required=False, help_text='ID de categoría')
    author = serializers.IntegerField(required=False, help_text='ID de autor')
    status = serializers.ChoiceField(
        choices=['published', 'draft', 'archived'],
        required=False,
        help_text='Estado del post'
    )
    featured = serializers.BooleanField(required=False, help_text='Posts destacados')
    date_from = serializers.DateTimeField(required=False, help_text='Fecha desde')
    date_to = serializers.DateTimeField(required=False, help_text='Fecha hasta')
    
    def validate(self, attrs):
        """Validar filtros de búsqueda"""
        attrs = super().validate(attrs)
        
        date_from = attrs.get('date_from')
        date_to = attrs.get('date_to')
        
        if date_from and date_to and date_from > date_to:
            raise serializers.ValidationError('date_from debe ser anterior a date_to')
        
        return attrs


class CategoryCreateUpdateSerializer(BaseModelSerializer):
    """Serializador para crear y actualizar categorías"""
    
    class Meta:
        model = Category
        fields = ['nombre', 'descripcion']
    
    def validate_nombre(self, value):
        """Validar nombre de categoría"""
        if not value or len(value.strip()) < 2:
            raise serializers.ValidationError('El nombre debe tener al menos 2 caracteres')
        
        if len(value.strip()) > 100:
            raise serializers.ValidationError('El nombre no puede exceder 100 caracteres')
        
        # Verificar unicidad
        queryset = Category.objects.filter(nombre__iexact=value.strip())
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        
        if queryset.exists():
            raise serializers.ValidationError('Ya existe una categoría con este nombre')
        
        return value.strip()
    
    def validate_descripcion(self, value):
        """Validar descripción de categoría"""
        if value and len(value.strip()) > 500:
            raise serializers.ValidationError('La descripción no puede exceder 500 caracteres')
        
        return value.strip() if value else ''


class PostStatsSerializer(serializers.Serializer):
    """Serializador para estadísticas de posts"""
    total_posts = serializers.IntegerField()
    published_posts = serializers.IntegerField()
    draft_posts = serializers.IntegerField()
    archived_posts = serializers.IntegerField()
    featured_posts = serializers.IntegerField()
    posts_this_month = serializers.IntegerField()
    posts_this_week = serializers.IntegerField()
    most_commented_post = serializers.DictField()
    most_viewed_post = serializers.DictField()
    categories_count = serializers.IntegerField()
    authors_count = serializers.IntegerField()


class CommentStatsSerializer(serializers.Serializer):
    """Serializador para estadísticas de comentarios"""
    total_comments = serializers.IntegerField()
    approved_comments = serializers.IntegerField()
    pending_comments = serializers.IntegerField()
    comments_this_month = serializers.IntegerField()
    comments_this_week = serializers.IntegerField()
    most_active_commenter = serializers.DictField()
    most_commented_post = serializers.DictField()
    spam_comments = serializers.IntegerField()


class MediaUploadResponseSerializer(SuccessResponseSerializer):
    """Serializador para respuesta de subida de archivos"""
    data = serializers.DictField()
    
    def to_representation(self, instance):
        """Personalizar respuesta de subida"""
        return {
            'success': True,
            'data': {
                'id': instance.get('id'),
                'url': instance.get('url'),
                'filename': instance.get('filename'),
                'size': instance.get('size'),
                'content_type': instance.get('content_type'),
                'alt_text': instance.get('alt_text', ''),
                'caption': instance.get('caption', ''),
                'uploaded_at': timezone.now().isoformat()
            },
            'message': 'Archivo subido exitosamente'
        }


class PostValidationSerializer(serializers.Serializer):
    """Serializador para validación de posts"""
    title_valid = serializers.BooleanField()
    content_valid = serializers.BooleanField()
    category_valid = serializers.BooleanField()
    image_valid = serializers.BooleanField()
    seo_score = serializers.IntegerField(min_value=0, max_value=100)
    readability_score = serializers.IntegerField(min_value=0, max_value=100)
    suggestions = serializers.ListField(child=serializers.CharField())
    warnings = serializers.ListField(child=serializers.CharField())
    errors = serializers.ListField(child=serializers.CharField())