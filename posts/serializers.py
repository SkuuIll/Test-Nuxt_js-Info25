from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Post, Categoria, Comentario
from django_blog.base_serializers import (
    BaseModelSerializer, UserBasicSerializer, CategoryBasicSerializer,
    PostBasicSerializer, CommentBasicSerializer, PaginatedResponseSerializer,
    ErrorResponseSerializer, SuccessResponseSerializer, FilterSerializer,
    MediaUploadSerializer, ValidationErrorSerializer, SEOSerializer,
    BulkActionSerializer, StatsSerializer
)

User = get_user_model()


# UserBasicSerializer ahora se importa desde base_serializers

class CategorySerializer(CategoryBasicSerializer):
    """Serializador para categorías con información completa"""
    
    class Meta(CategoryBasicSerializer.Meta):
        model = Categoria

class PostSerializer(PostBasicSerializer, SEOSerializer):
    """Serializador completo para posts con todos los campos necesarios"""
    category = CategorySerializer(source='categoria', read_only=True)
    tags = serializers.SerializerMethodField()
    meta_data = serializers.SerializerMethodField()
    engagement = serializers.SerializerMethodField()
    content_preview = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = [
            'id', 'titulo', 'slug', 'excerpt', 'contenido', 'content_preview',
            'author', 'category', 'image_url', 'is_featured', 'status',
            'published_at', 'reading_time', 'comments_count',
            'meta_title', 'meta_description', 'canonical_url',
            'tags', 'meta_data', 'engagement',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'slug', 'excerpt', 'content_preview', 'author', 'category',
            'image_url', 'reading_time', 'comments_count', 'tags',
            'meta_data', 'engagement', 'created_at', 'updated_at'
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
    
    def get_content_preview(self, obj):
        """Get content preview for admin/dashboard"""
        if obj.contenido:
            # Remove HTML tags and get first 200 characters
            import re
            clean_content = re.sub(r'<[^>]+>', '', obj.contenido)
            return clean_content[:200] + '...' if len(clean_content) > 200 else clean_content
        return ''
    
    def get_engagement(self, obj):
        """Obtener métricas de engagement"""
        comments_count = self.get_comments_count(obj)
        reading_time = self.get_reading_time(obj)
        
        # Calculate engagement score based on various factors
        engagement_score = 0
        engagement_score += comments_count * 10  # Comments are valuable
        engagement_score += min(20, reading_time * 2)  # Reading time bonus (capped)
        
        if obj.featured:
            engagement_score += 15  # Featured posts bonus
        
        # Time decay factor (newer posts get slight bonus)
        if obj.fecha_publicacion:
            days_old = (timezone.now() - obj.fecha_publicacion).days
            if days_old < 7:
                engagement_score += 10
            elif days_old < 30:
                engagement_score += 5
        
        return {
            'comments_count': comments_count,
            'reading_time': reading_time,
            'engagement_score': min(100, engagement_score),
            'is_trending': engagement_score > 50 and comments_count > 5
        }

class CommentSerializer(CommentBasicSerializer):
    """Serializador completo para comentarios"""
    replies = serializers.SerializerMethodField()
    is_author = serializers.SerializerMethodField()
    moderation_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Comentario
        fields = [
            'id', 'contenido', 'author', 'post_title', 'approved',
            'replies_count', 'can_edit', 'can_delete',
            'replies', 'is_author', 'moderation_info',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'author', 'post_title', 'replies_count',
            'can_edit', 'can_delete', 'replies', 'is_author',
            'moderation_info', 'created_at', 'updated_at'
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


class PostCreateUpdateSerializer(BaseModelSerializer, SEOSerializer):
    """Serializer for creating and updating posts"""
    
    class Meta:
        model = Post
        fields = [
            'titulo', 'contenido', 'excerpt', 'imagen', 'categoria',
            'meta_title', 'meta_description', 'canonical_url',
            'status', 'featured'
        ]
    
    def validate_titulo(self, value):
        """Validate post title"""
        if not value or len(value.strip()) < 5:
            raise serializers.ValidationError('El título debe tener al menos 5 caracteres')
        
        if len(value.strip()) > 200:
            raise serializers.ValidationError('El título no puede exceder 200 caracteres')
        
        return value.strip()
    
    def validate_contenido(self, value):
        """Validate post content"""
        if not value or len(value.strip()) < 50:
            raise serializers.ValidationError('El contenido debe tener al menos 50 caracteres')
        
        # Check for basic HTML structure
        if '<script' in value.lower():
            raise serializers.ValidationError('No se permite código JavaScript en el contenido')
        
        return value.strip()
    
    def validate_status(self, value):
        """Validate post status"""
        allowed_statuses = ['draft', 'published', 'archived']
        if value not in allowed_statuses:
            raise serializers.ValidationError(
                f'Estado inválido. Debe ser uno de: {", ".join(allowed_statuses)}'
            )
        return value
    
    def validate_excerpt(self, value):
        """Validate post excerpt"""
        if value and len(value.strip()) > 300:
            raise serializers.ValidationError('El resumen no puede exceder 300 caracteres')
        return value.strip() if value else ''
    
    def validate(self, attrs):
        """Cross-field validation"""
        attrs = super().validate(attrs)
        
        # If publishing, ensure required fields are present
        if attrs.get('status') == 'published':
            if not attrs.get('titulo'):
                raise serializers.ValidationError('El título es requerido para publicar')
            
            if not attrs.get('contenido'):
                raise serializers.ValidationError('El contenido es requerido para publicar')
            
            if not attrs.get('categoria'):
                raise serializers.ValidationError('La categoría es requerida para publicar')
        
        return attrs


class CommentCreateUpdateSerializer(BaseModelSerializer):
    """Serializador para crear y actualizar comentarios"""
    
    class Meta:
        model = Comentario
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
    category = CategorySerializer(source='categoria', read_only=True)
    
    class Meta:
        model = Post
        fields = [
            'id', 'titulo', 'slug', 'excerpt', 'author', 'category',
            'image_url', 'is_featured', 'status', 'published_at',
            'reading_time', 'comments_count', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'slug', 'excerpt', 'author', 'category', 'image_url',
            'reading_time', 'comments_count', 'created_at', 'updated_at'
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
    
    # Override allowed ordering fields
    allowed_ordering_fields = [
        'titulo', 'fecha_creacion', 'fecha_publicacion', 'fecha_actualizacion',
        'comments_count', 'reading_time'
    ]
    
    def validate(self, attrs):
        """Validar filtros de búsqueda"""
        attrs = super().validate(attrs)
        
        date_from = attrs.get('date_from')
        date_to = attrs.get('date_to')
        
        if date_from and date_to and date_from > date_to:
            raise serializers.ValidationError('date_from debe ser anterior a date_to')
        
        # Validate category exists
        category_id = attrs.get('category')
        if category_id:
            try:
                Categoria.objects.get(id=category_id)
            except Categoria.DoesNotExist:
                raise serializers.ValidationError('La categoría especificada no existe')
        
        # Validate author exists
        author_id = attrs.get('author')
        if author_id:
            try:
                User.objects.get(id=author_id)
            except User.DoesNotExist:
                raise serializers.ValidationError('El autor especificado no existe')
        
        return attrs


class CategoryCreateUpdateSerializer(BaseModelSerializer):
    """Serializador para crear y actualizar categorías"""
    
    class Meta:
        model = Categoria
        fields = ['nombre', 'descripcion']
    
    def validate_nombre(self, value):
        """Validar nombre de categoría"""
        if not value or len(value.strip()) < 2:
            raise serializers.ValidationError('El nombre debe tener al menos 2 caracteres')
        
        if len(value.strip()) > 100:
            raise serializers.ValidationError('El nombre no puede exceder 100 caracteres')
        
        # Verificar unicidad
        queryset = Categoria.objects.filter(nombre__iexact=value.strip())
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


class PostBulkActionSerializer(BulkActionSerializer):
    """Serializer for bulk post actions"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['action'].choices = [
            ('publish', 'Publish'),
            ('unpublish', 'Unpublish'),
            ('archive', 'Archive'),
            ('delete', 'Delete'),
            ('feature', 'Feature'),
            ('unfeature', 'Unfeature'),
        ]


class CommentBulkActionSerializer(BulkActionSerializer):
    """Serializer for bulk comment actions"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['action'].choices = [
            ('approve', 'Approve'),
            ('reject', 'Reject'),
            ('delete', 'Delete'),
            ('mark_spam', 'Mark as Spam'),
        ]


class PostValidationSerializer(serializers.Serializer):
    """Serializador para validación de posts"""
    title_valid = serializers.BooleanField()
    content_valid = serializers.BooleanField()
    category_valid = serializers.BooleanField()
    image_valid = serializers.BooleanField()
    seo_score = serializers.IntegerField(min_value=0, max_value=100)
    readability_score = serializers.IntegerField(min_value=0, max_value=100)
    word_count = serializers.IntegerField(min_value=0)
    reading_time = serializers.IntegerField(min_value=1)
    suggestions = serializers.ListField(child=serializers.CharField())
    warnings = serializers.ListField(child=serializers.CharField())
    errors = serializers.ListField(child=serializers.CharField())
    
    def validate(self, attrs):
        """Validate post quality metrics"""
        attrs = super().validate(attrs)
        
        # Calculate overall quality score
        quality_score = 0
        if attrs.get('title_valid'):
            quality_score += 20
        if attrs.get('content_valid'):
            quality_score += 30
        if attrs.get('category_valid'):
            quality_score += 10
        if attrs.get('image_valid'):
            quality_score += 10
        
        quality_score += (attrs.get('seo_score', 0) * 0.2)
        quality_score += (attrs.get('readability_score', 0) * 0.1)
        
        attrs['quality_score'] = min(100, int(quality_score))
        
        return attrs


class PostAnalyticsSerializer(StatsSerializer):
    """Serializer for post analytics"""
    post_id = serializers.IntegerField(required=False)
    include_comments = serializers.BooleanField(default=True)
    include_engagement = serializers.BooleanField(default=True)
    
    def validate_post_id(self, value):
        """Validate post exists"""
        if value:
            try:
                Post.objects.get(id=value)
            except Post.DoesNotExist:
                raise serializers.ValidationError('El post especificado no existe')
        return value


class CategoryStatsSerializer(StatsSerializer):
    """Serializer for category statistics"""
    category_id = serializers.IntegerField(required=False)
    include_posts = serializers.BooleanField(default=True)
    
    def validate_category_id(self, value):
        """Validate category exists"""
        if value:
            try:
                Categoria.objects.get(id=value)
            except Categoria.DoesNotExist:
                raise serializers.ValidationError('La categoría especificada no existe')
        return value


class ContentModerationSerializer(serializers.Serializer):
    """Serializer for content moderation"""
    content = serializers.CharField()
    content_type = serializers.ChoiceField(choices=['post', 'comment'])
    auto_moderate = serializers.BooleanField(default=True)
    
    def validate_content(self, value):
        """Validate content for moderation"""
        if not value or len(value.strip()) < 5:
            raise serializers.ValidationError('El contenido debe tener al menos 5 caracteres')
        
        return value.strip()


class ExportSerializer(serializers.Serializer):
    """Serializer for data export"""
    format = serializers.ChoiceField(
        choices=['json', 'csv', 'xml'],
        default='json'
    )
    include_fields = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )
    date_from = serializers.DateTimeField(required=False)
    date_to = serializers.DateTimeField(required=False)
    
    def validate(self, attrs):
        """Validate export parameters"""
        attrs = super().validate(attrs)
        
        date_from = attrs.get('date_from')
        date_to = attrs.get('date_to')
        
        if date_from and date_to and date_from > date_to:
            raise serializers.ValidationError('date_from debe ser anterior a date_to')
        
        return attrs