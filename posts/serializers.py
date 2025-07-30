from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Post, Category, Comment

User = get_user_model()


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user serializer for posts (no sensitive information)"""
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'full_name']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username

class CategorySerializer(serializers.ModelSerializer):
    posts_count = serializers.SerializerMethodField()
    name = serializers.CharField(source='nombre', read_only=True)
    description = serializers.CharField(source='descripcion', read_only=True)
    created_at = serializers.DateTimeField(source='fecha_creacion', read_only=True)
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'posts_count', 'created_at']
    
    def get_posts_count(self, obj):
        return obj.post_set.filter(status='published').count()

class PostSerializer(serializers.ModelSerializer):
    author = UserBasicSerializer(source='autor', read_only=True)
    category = CategorySerializer(source='categoria', read_only=True)
    title = serializers.CharField(source='titulo', read_only=True)
    content = serializers.CharField(source='contenido', read_only=True)
    image = serializers.ImageField(source='imagen', read_only=True)
    created_at = serializers.DateTimeField(source='fecha_creacion', read_only=True)
    updated_at = serializers.DateTimeField(source='fecha_actualizacion', read_only=True)
    published_at = serializers.DateTimeField(source='fecha_publicacion', read_only=True)
    reading_time = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    is_featured = serializers.BooleanField(source='featured', read_only=True)
    slug = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = [
            'id', 'titulo', 'title', 'contenido', 'content', 'excerpt', 
            'imagen', 'image', 'author', 'category', 'meta_title', 'meta_description',
            'status', 'featured', 'is_featured', 'slug', 'created_at', 'updated_at', 'published_at',
            'fecha_creacion', 'fecha_publicacion', 'fecha_actualizacion',
            'reading_time', 'comments_count'
        ]
    
    def get_reading_time(self, obj):
        # Estimate reading time (average 200 words per minute)
        if obj.contenido:
            word_count = len(obj.contenido.split())
            return max(1, round(word_count / 200))
        return 1
    
    def get_comments_count(self, obj):
        return obj.comentarios.filter(approved=True).count()
    
    def get_slug(self, obj):
        # Generate a simple slug from title
        import re
        if obj.titulo:
            slug = re.sub(r'[^\w\s-]', '', obj.titulo.lower())
            slug = re.sub(r'[-\s]+', '-', slug)
            return f"{obj.id}-{slug[:50]}"
        return str(obj.id)

class CommentSerializer(serializers.ModelSerializer):
    author = UserBasicSerializer(source='usuario', read_only=True)
    content = serializers.CharField(source='contenido', read_only=True)
    created_at = serializers.DateTimeField(source='fecha_creacion', read_only=True)
    updated_at = serializers.DateTimeField(source='fecha_actualizacion', read_only=True)
    replies = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = [
            'id', 'contenido', 'content', 'author', 'post', 'parent',
            'created_at', 'updated_at', 'fecha_creacion', 'fecha_actualizacion',
            'approved', 'replies'
        ]
    
    def get_replies(self, obj):
        if obj.replies.exists():
            return CommentSerializer(
                obj.replies.filter(approved=True), 
                many=True, 
                context=self.context
            ).data
        return []


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


class CommentCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating comments"""
    
    class Meta:
        model = Comment
        fields = ['contenido', 'post', 'parent']
    
    def validate_contenido(self, value):
        if len(value.strip()) < 5:
            raise serializers.ValidationError('Comment must be at least 5 characters long')
        return value.strip()
    
    def validate_parent(self, value):
        if value and hasattr(self, 'initial_data') and 'post' in self.initial_data:
            post_id = self.initial_data['post']
            if value.post.id != int(post_id):
                raise serializers.ValidationError('Parent comment must belong to the same post')
        return value