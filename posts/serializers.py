from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()
from .models import Post, Category, Comment

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']

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
    author = UserSerializer(source='autor', read_only=True)
    category = CategorySerializer(source='categoria', read_only=True)
    title = serializers.CharField(source='titulo', read_only=True)
    content = serializers.CharField(source='contenido', read_only=True)
    image = serializers.ImageField(source='imagen', read_only=True)
    created_at = serializers.DateTimeField(source='fecha_creacion', read_only=True)
    updated_at = serializers.DateTimeField(source='fecha_actualizacion', read_only=True)
    published_at = serializers.DateTimeField(source='fecha_publicacion', read_only=True)
    reading_time = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = [
            'id', 'titulo', 'title', 'contenido', 'content', 'excerpt', 
            'imagen', 'image', 'author', 'category', 'meta_title', 'meta_description',
            'status', 'featured', 'created_at', 'updated_at', 'published_at',
            'fecha_creacion', 'fecha_publicacion', 'fecha_actualizacion',
            'reading_time', 'comments_count'
        ]
    
    def get_reading_time(self, obj):
        # Estimate reading time (average 200 words per minute)
        word_count = len(obj.contenido.split())
        return max(1, round(word_count / 200))
    
    def get_comments_count(self, obj):
        return obj.comentarios.filter(approved=True).count()

class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(source='usuario', read_only=True)
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