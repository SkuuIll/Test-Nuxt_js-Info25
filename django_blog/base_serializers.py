"""
Base serializers for consistent API responses and data validation
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.exceptions import ValidationError as DjangoValidationError
from django_blog.api_utils import ErrorMessages
import re

User = get_user_model()


class BaseModelSerializer(serializers.ModelSerializer):
    """
    Base serializer with common functionality and validation
    """
    
    def validate(self, attrs):
        """Base validation with common checks"""
        attrs = super().validate(attrs)
        
        # Add any common validation logic here
        self._validate_common_fields(attrs)
        return attrs
    
    def _validate_common_fields(self, attrs):
        """Common field validation"""
        # Validate text fields for XSS and basic security
        text_fields = ['titulo', 'title', 'nombre', 'name', 'contenido', 'content']
        for field in text_fields:
            if field in attrs and attrs[field]:
                attrs[field] = self._sanitize_text(attrs[field])
        
        return attrs
    
    def _sanitize_text(self, text):
        """Basic text sanitization"""
        if not text:
            return text
        
        # Remove null bytes and control characters
        import re
        text = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', str(text))
        
        # Basic XSS protection for non-HTML fields
        dangerous_patterns = [
            r'<script[^>]*>.*?</script>',
            r'javascript:',
            r'vbscript:',
            r'onload\s*=',
            r'onerror\s*=',
            r'onclick\s*='
        ]
        
        for pattern in dangerous_patterns:
            text = re.sub(pattern, '', text, flags=re.IGNORECASE | re.DOTALL)
        
        return text.strip()
    
    def to_internal_value(self, data):
        """Override to provide better error messages"""
        try:
            return super().to_internal_value(data)
        except serializers.ValidationError as e:
            # Enhance error messages
            if hasattr(e, 'detail') and isinstance(e.detail, dict):
                enhanced_errors = {}
                for field, errors in e.detail.items():
                    if isinstance(errors, list):
                        enhanced_errors[field] = [self._enhance_error_message(str(error)) for error in errors]
                    else:
                        enhanced_errors[field] = self._enhance_error_message(str(errors))
                raise serializers.ValidationError(enhanced_errors)
            raise
    
    def _enhance_error_message(self, message):
        """Enhance error messages for better UX"""
        error_mappings = {
            'This field is required.': 'Este campo es obligatorio.',
            'This field may not be blank.': 'Este campo no puede estar vacío.',
            'This field may not be null.': 'Este campo no puede ser nulo.',
            'Enter a valid email address.': 'Ingresa una dirección de email válida.',
            'Enter a valid URL.': 'Ingresa una URL válida.',
            'Ensure this field has no more than': 'Este campo no puede tener más de',
            'Ensure this field has at least': 'Este campo debe tener al menos',
            'Invalid choice.': 'Opción inválida.',
            'Not a valid integer.': 'No es un número entero válido.',
            'Not a valid boolean.': 'No es un valor booleano válido.',
        }
        
        for key, value in error_mappings.items():
            if key in message:
                return message.replace(key, value)
        
        return message
    
    def to_representation(self, instance):
        """Override to add consistent response formatting"""
        data = super().to_representation(instance)
        
        # Add metadata if requested
        request = self.context.get('request')
        if request and hasattr(request, 'query_params') and request.query_params.get('include_meta', '').lower() == 'true':
            data['_meta'] = self._get_instance_metadata(instance)
        
        return data
    
    def _get_instance_metadata(self, instance):
        """Get metadata for the instance"""
        meta = {}
        
        # Add timestamps if available
        if hasattr(instance, 'created_at'):
            meta['created_at'] = instance.created_at
        if hasattr(instance, 'updated_at'):
            meta['updated_at'] = instance.updated_at
        
        # Add model info
        meta['model'] = instance._meta.model_name
        meta['app'] = instance._meta.app_label
        
        return meta


class TimestampedSerializer(serializers.Serializer):
    """Mixin for timestamped fields"""
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user information serializer"""
    full_name = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'avatar_url', 'is_active', 'date_joined'
        ]
        read_only_fields = ['id', 'username', 'date_joined', 'is_active']
    
    def get_full_name(self, obj):
        """Get user's full name"""
        if obj.first_name or obj.last_name:
            return f"{obj.first_name} {obj.last_name}".strip()
        return obj.username
    
    def get_avatar_url(self, obj):
        """Get user's avatar URL (placeholder for now)"""
        # In the future, this could return actual avatar URL
        return f"https://ui-avatars.com/api/?name={obj.username}&background=random"


class CategoryBasicSerializer(BaseModelSerializer, TimestampedSerializer):
    """Basic category information serializer"""
    posts_count = serializers.SerializerMethodField()
    
    class Meta:
        model = None  # Will be set by subclasses
        fields = [
            'id', 'nombre', 'descripcion', 'posts_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'posts_count', 'created_at', 'updated_at']
        abstract = True
    
    def get_posts_count(self, obj):
        """Get number of published posts in this category"""
        if hasattr(obj, 'posts_count'):
            return obj.posts_count
        return getattr(obj, 'post_set', []).filter(status='published').count()


class PostBasicSerializer(BaseModelSerializer, TimestampedSerializer):
    """Basic post information serializer"""
    author = UserBasicSerializer(source='autor', read_only=True)
    slug = serializers.SerializerMethodField()
    excerpt = serializers.SerializerMethodField()
    reading_time = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    is_featured = serializers.BooleanField(source='featured', read_only=True)
    published_at = serializers.DateTimeField(source='fecha_publicacion', read_only=True)
    
    class Meta:
        model = None  # Will be set by subclasses
        fields = [
            'id', 'titulo', 'slug', 'excerpt', 'author',
            'image_url', 'is_featured', 'status', 'published_at',
            'reading_time', 'comments_count', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'slug', 'excerpt', 'author', 'image_url',
            'reading_time', 'comments_count', 'created_at', 'updated_at'
        ]
        abstract = True
    
    def get_slug(self, obj):
        """Generate slug from title"""
        if not obj.titulo:
            return ''
        # Simple slug generation
        slug = re.sub(r'[^\w\s-]', '', obj.titulo.lower())
        slug = re.sub(r'[-\s]+', '-', slug)
        return f"{obj.id}-{slug}"
    
    def get_excerpt(self, obj):
        """Get post excerpt"""
        if hasattr(obj, 'excerpt') and obj.excerpt:
            return obj.excerpt
        
        # Generate excerpt from content
        if obj.contenido:
            # Remove HTML tags and get first 150 characters
            import re
            clean_content = re.sub(r'<[^>]+>', '', obj.contenido)
            return clean_content[:150] + '...' if len(clean_content) > 150 else clean_content
        
        return ''
    
    def get_reading_time(self, obj):
        """Calculate reading time in minutes"""
        if not obj.contenido:
            return 1
        
        # Average reading speed: 200 words per minute
        word_count = len(obj.contenido.split())
        reading_time = max(1, round(word_count / 200))
        return reading_time
    
    def get_comments_count(self, obj):
        """Get number of approved comments"""
        if hasattr(obj, 'comments_count'):
            return obj.comments_count
        return getattr(obj, 'comentarios', []).filter(approved=True).count()
    
    def get_image_url(self, obj):
        """Get post image URL"""
        if obj.imagen:
            return obj.imagen.url
        return None


class CommentBasicSerializer(BaseModelSerializer, TimestampedSerializer):
    """Basic comment information serializer"""
    author = UserBasicSerializer(source='usuario', read_only=True)
    post_title = serializers.CharField(source='post.titulo', read_only=True)
    replies_count = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()
    
    class Meta:
        model = None  # Will be set by subclasses
        fields = [
            'id', 'contenido', 'author', 'post_title', 'approved',
            'replies_count', 'can_edit', 'can_delete',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'author', 'post_title', 'replies_count',
            'can_edit', 'can_delete', 'created_at', 'updated_at'
        ]
        abstract = True
    
    def get_replies_count(self, obj):
        """Get number of replies to this comment"""
        if hasattr(obj, 'replies'):
            return obj.replies.filter(approved=True).count()
        return 0
    
    def get_can_edit(self, obj):
        """Check if current user can edit this comment"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        
        # Author can edit within 15 minutes, staff can always edit
        if request.user.is_staff or request.user.is_superuser:
            return True
        
        if obj.usuario == request.user:
            # Check if comment is less than 15 minutes old
            time_diff = timezone.now() - obj.fecha_creacion
            return time_diff.total_seconds() < 900  # 15 minutes
        
        return False
    
    def get_can_delete(self, obj):
        """Check if current user can delete this comment"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        
        # Staff can always delete, author can delete their own
        return (request.user.is_staff or 
                request.user.is_superuser or 
                obj.usuario == request.user)


class PaginatedResponseSerializer(serializers.Serializer):
    """Serializer for consistent paginated responses"""
    success = serializers.BooleanField(default=True)
    data = serializers.ListField(help_text="List of items for current page")
    pagination = serializers.DictField(help_text="Pagination metadata")
    
    def to_representation(self, instance):
        """Custom representation for paginated responses"""
        if hasattr(instance, 'results'):
            # Django paginator object
            return {
                'success': True,
                'data': instance.results,
                'pagination': {
                    'count': instance.paginator.count,
                    'next': instance.next_page_number() if instance.has_next() else None,
                    'previous': instance.previous_page_number() if instance.has_previous() else None,
                    'current_page': instance.number,
                    'total_pages': instance.paginator.num_pages,
                    'page_size': instance.paginator.per_page,
                    'has_next': instance.has_next(),
                    'has_previous': instance.has_previous(),
                    'start_index': instance.start_index(),
                    'end_index': instance.end_index()
                }
            }
        
        # Manual pagination data
        return {
            'success': True,
            'data': instance.get('data', []),
            'pagination': instance.get('pagination', {})
        }


class SuccessResponseSerializer(serializers.Serializer):
    """Serializer for success responses"""
    success = serializers.BooleanField(default=True)
    data = serializers.DictField(required=False)
    message = serializers.CharField(required=False)
    pagination = PaginatedResponseSerializer(required=False)


class ErrorResponseSerializer(serializers.Serializer):
    """Serializer for error responses"""
    success = serializers.BooleanField(default=False)
    error = serializers.CharField()
    message = serializers.CharField(required=False)
    errors = serializers.DictField(required=False)
    error_code = serializers.CharField(required=False)


class ValidationErrorSerializer(ErrorResponseSerializer):
    """Serializer for validation error responses"""
    errors = serializers.DictField(required=True)
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['error'].default = ErrorMessages.VALIDATION_FAILED


class FilterSerializer(serializers.Serializer):
    """Base serializer for filtering and search"""
    search = serializers.CharField(
        required=False, 
        max_length=100,
        help_text="Search term for title and content"
    )
    page = serializers.IntegerField(
        required=False, 
        min_value=1, 
        default=1,
        help_text="Page number"
    )
    page_size = serializers.IntegerField(
        required=False, 
        min_value=1, 
        max_value=100, 
        default=12,
        help_text="Number of items per page"
    )
    ordering = serializers.CharField(
        required=False,
        help_text="Field to order by (prefix with - for descending)"
    )
    
    def validate_search(self, value):
        """Validate search term"""
        if value:
            # Remove extra whitespace
            value = ' '.join(value.split())
            
            # Check for minimum length
            if len(value) < 2:
                raise serializers.ValidationError('Search term must be at least 2 characters long')
            
            # Basic XSS protection
            if '<' in value or '>' in value or 'script' in value.lower():
                raise serializers.ValidationError('Invalid characters in search term')
        
        return value
    
    def validate_ordering(self, value):
        """Validate ordering field"""
        if value:
            # Remove - prefix for validation
            field = value.lstrip('-')
            
            # Define allowed ordering fields (override in subclasses)
            allowed_fields = getattr(self, 'allowed_ordering_fields', [
                'created_at', 'updated_at', 'title', 'name'
            ])
            
            if field not in allowed_fields:
                raise serializers.ValidationError(
                    f'Invalid ordering field. Allowed: {", ".join(allowed_fields)}'
                )
        
        return value


class MediaUploadSerializer(serializers.Serializer):
    """Serializer for media file uploads"""
    file = serializers.FileField()
    alt_text = serializers.CharField(max_length=255, required=False, allow_blank=True)
    caption = serializers.CharField(max_length=500, required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)
    
    def validate_file(self, value):
        """Validate uploaded file"""
        # Check file size (10MB limit)
        max_size = 10 * 1024 * 1024  # 10MB
        if value.size > max_size:
            raise serializers.ValidationError('File size exceeds 10MB limit')
        
        # Check file type
        allowed_types = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'text/plain',
            'video/mp4', 'video/webm',
            'audio/mp3', 'audio/wav'
        ]
        
        if value.content_type not in allowed_types:
            raise serializers.ValidationError(
                f'File type not allowed. Allowed types: {", ".join(allowed_types)}'
            )
        
        return value
    
    def validate_alt_text(self, value):
        """Validate alt text"""
        if value and len(value.strip()) < 3:
            raise serializers.ValidationError('Alt text must be at least 3 characters long')
        return value.strip() if value else ''


class BulkActionSerializer(serializers.Serializer):
    """Serializer for bulk actions"""
    action = serializers.ChoiceField(choices=[])  # Override in subclasses
    ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        min_length=1,
        max_length=100
    )
    
    def validate_ids(self, value):
        """Validate IDs list"""
        # Remove duplicates while preserving order
        seen = set()
        unique_ids = []
        for id_val in value:
            if id_val not in seen:
                seen.add(id_val)
                unique_ids.append(id_val)
        
        return unique_ids


class StatsSerializer(serializers.Serializer):
    """Base serializer for statistics"""
    period = serializers.ChoiceField(
        choices=['day', 'week', 'month', 'year'],
        default='month',
        help_text="Time period for statistics"
    )
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)
    
    def validate(self, attrs):
        """Validate date range"""
        start_date = attrs.get('start_date')
        end_date = attrs.get('end_date')
        
        if start_date and end_date:
            if start_date > end_date:
                raise serializers.ValidationError('start_date must be before end_date')
            
            # Limit date range to prevent performance issues
            date_diff = (end_date - start_date).days
            if date_diff > 365:
                raise serializers.ValidationError('Date range cannot exceed 365 days')
        
        return attrs


class SEOSerializer(serializers.Serializer):
    """Serializer for SEO-related fields"""
    meta_title = serializers.CharField(max_length=60, required=False, allow_blank=True)
    meta_description = serializers.CharField(max_length=160, required=False, allow_blank=True)
    canonical_url = serializers.URLField(required=False, allow_blank=True)
    og_title = serializers.CharField(max_length=60, required=False, allow_blank=True)
    og_description = serializers.CharField(max_length=160, required=False, allow_blank=True)
    og_image = serializers.URLField(required=False, allow_blank=True)
    
    def validate_meta_title(self, value):
        """Validate meta title length"""
        if value and len(value) > 60:
            raise serializers.ValidationError('Meta title should not exceed 60 characters for optimal SEO')
        return value
    
    def validate_meta_description(self, value):
        """Validate meta description length"""
        if value and len(value) > 160:
            raise serializers.ValidationError('Meta description should not exceed 160 characters for optimal SEO')
        return value