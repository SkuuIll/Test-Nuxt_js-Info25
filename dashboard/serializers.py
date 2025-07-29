from rest_framework import serializers
from django.contrib.auth.models import User
from posts.models import Post, Categoria, Comentario
from .models import DashboardPermission, ActivityLog


class DashboardPermissionSerializer(serializers.ModelSerializer):
    """Serializer para permisos del dashboard"""
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = DashboardPermission
        fields = [
            'id', 'username', 'email', 'can_manage_posts', 
            'can_manage_users', 'can_manage_comments', 'can_view_stats',
            'created_at', 'updated_at'
        ]


class ActivityLogSerializer(serializers.ModelSerializer):
    """Serializer para logs de actividad"""
    username = serializers.CharField(source='user.username', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    
    class Meta:
        model = ActivityLog
        fields = [
            'id', 'username', 'action', 'action_display', 'target_model',
            'target_id', 'description', 'timestamp', 'ip_address'
        ]


class DashboardUserSerializer(serializers.ModelSerializer):
    """Serializer para usuarios en el dashboard"""
    dashboard_permission = DashboardPermissionSerializer(read_only=True)
    posts_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    last_login_display = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'is_active', 'is_staff', 'date_joined', 'last_login',
            'last_login_display', 'dashboard_permission', 
            'posts_count', 'comments_count'
        ]
    
    def get_posts_count(self, obj):
        return obj.post_set.count()
    
    def get_comments_count(self, obj):
        return obj.comentario_set.count()
    
    def get_last_login_display(self, obj):
        if obj.last_login:
            return obj.last_login.strftime('%d/%m/%Y %H:%M')
        return 'Nunca'


class DashboardPostSerializer(serializers.ModelSerializer):
    """Serializer para posts en el dashboard"""
    autor_username = serializers.CharField(source='autor.username', read_only=True)
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    comments_count = serializers.SerializerMethodField()
    excerpt = serializers.CharField(read_only=True)
    
    class Meta:
        model = Post
        fields = [
            'id', 'titulo', 'contenido', 'excerpt', 'status', 'featured',
            'imagen', 'categoria', 'categoria_nombre', 'autor', 'autor_username',
            'fecha_creacion', 'fecha_publicacion', 'fecha_actualizacion',
            'comments_count'
        ]
    
    def get_comments_count(self, obj):
        return obj.comentarios.count()


class DashboardCommentSerializer(serializers.ModelSerializer):
    """Serializer para comentarios en el dashboard"""
    usuario_username = serializers.CharField(source='usuario.username', read_only=True)
    post_titulo = serializers.CharField(source='post.titulo', read_only=True)
    replies_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Comentario
        fields = [
            'id', 'contenido', 'usuario', 'usuario_username',
            'post', 'post_titulo', 'approved', 'parent',
            'fecha_creacion', 'fecha_actualizacion', 'replies_count'
        ]
    
    def get_replies_count(self, obj):
        return obj.replies.count()


class DashboardStatsSerializer(serializers.Serializer):
    """Serializer para estadísticas del dashboard"""
    total_posts = serializers.IntegerField()
    total_users = serializers.IntegerField()
    total_comments = serializers.IntegerField()
    published_posts = serializers.IntegerField()
    draft_posts = serializers.IntegerField()
    pending_comments = serializers.IntegerField()
    active_users = serializers.IntegerField()
    popular_posts = serializers.ListField(child=serializers.DictField())
    recent_activity = ActivityLogSerializer(many=True)
    monthly_stats = serializers.DictField()


class CategorySerializer(serializers.ModelSerializer):
    """Serializer para categorías"""
    posts_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Categoria
        fields = ['id', 'nombre', 'descripcion', 'fecha_creacion', 'posts_count']
    
    def get_posts_count(self, obj):
        return obj.post_set.count()