from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Post, Category, Comment

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']

class CategorySerializer(serializers.ModelSerializer):
    posts_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'posts_count', 'created_at']
    
    def get_posts_count(self, obj):
        return obj.posts.filter(status='published').count()

class PostSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    reading_time = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = [
            'id', 'title', 'slug', 'content', 'excerpt', 'image',
            'author', 'category', 'meta_title', 'meta_description',
            'status', 'created_at', 'updated_at', 'published_at',
            'reading_time', 'comments_count'
        ]
    
    def get_reading_time(self, obj):
        # Estimate reading time (average 200 words per minute)
        word_count = len(obj.content.split())
        return max(1, round(word_count / 200))
    
    def get_comments_count(self, obj):
        return obj.comments.filter(approved=True).count()

class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    replies = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = [
            'id', 'content', 'author', 'post', 'parent',
            'created_at', 'updated_at', 'approved', 'replies'
        ]
    
    def get_replies(self, obj):
        if obj.replies.exists():
            return CommentSerializer(
                obj.replies.filter(approved=True), 
                many=True, 
                context=self.context
            ).data
        return []