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

class DashboardPostCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear y actualizar posts en el dashboard
    """
    class Meta:
        model = Post
        fields = [
            'titulo', 'contenido', 'status', 'featured', 'imagen', 
            'categoria', 'meta_title', 'meta_description'
        ]
    
    def validate_titulo(self, value):
        if len(value.strip()) < 5:
            raise serializers.ValidationError('El título debe tener al menos 5 caracteres.')
        return value.strip()
    
    def validate_contenido(self, value):
        if len(value.strip()) < 20:
            raise serializers.ValidationError('El contenido debe tener al menos 20 caracteres.')
        return value.strip()
    
    def validate_status(self, value):
        if value not in ['draft', 'published', 'archived']:
            raise serializers.ValidationError('Estado inválido.')
        return value


class DashboardPostDetailSerializer(serializers.ModelSerializer):
    """
    Serializer detallado para posts en el dashboard
    """
    autor_username = serializers.CharField(source='autor.username', read_only=True)
    autor_email = serializers.CharField(source='autor.email', read_only=True)
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    comments_count = serializers.SerializerMethodField()
    excerpt = serializers.CharField(read_only=True)
    can_edit = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = [
            'id', 'titulo', 'contenido', 'excerpt', 'status', 'featured',
            'imagen', 'categoria', 'categoria_nombre', 'autor', 'autor_username', 'autor_email',
            'fecha_creacion', 'fecha_publicacion', 'fecha_actualizacion',
            'meta_title', 'meta_description', 'comments_count', 'can_edit'
        ]
    
    def get_comments_count(self, obj):
        return obj.comentarios.count()
    
    def get_can_edit(self, obj):
        request = self.context.get('request')
        if not request or not request.user:
            return False
        
        # El autor puede editar su propio post
        if obj.autor == request.user:
            return True
        
        # Usuarios con permisos de gestión pueden editar cualquier post
        try:
            return (request.user.is_superuser or 
                   request.user.dashboard_permission.can_manage_posts)
        except:
            return False


class BulkPostActionSerializer(serializers.Serializer):
    """
    Serializer para acciones en lote sobre posts
    """
    post_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1,
        help_text='Lista de IDs de posts'
    )
    action = serializers.ChoiceField(
        choices=['delete', 'publish', 'draft', 'archive', 'feature', 'unfeature'],
        help_text='Acción a realizar'
    )
    
    def validate_post_ids(self, value):
        # Verificar que todos los IDs existan
        existing_ids = Post.objects.filter(id__in=value).values_list('id', flat=True)
        missing_ids = set(value) - set(existing_ids)
        
        if missing_ids:
            raise serializers.ValidationError(
                f'Los siguientes IDs de posts no existen: {list(missing_ids)}'
            )
        
        return value


class CategoryCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear y actualizar categorías
    """
    class Meta:
        model = Categoria
        fields = ['nombre', 'descripcion']
    
    def validate_nombre(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError('El nombre debe tener al menos 2 caracteres.')
        
        # Verificar unicidad (excluyendo la instancia actual en caso de actualización)
        queryset = Categoria.objects.filter(nombre__iexact=value.strip())
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        
        if queryset.exists():
            raise serializers.ValidationError('Ya existe una categoría con este nombre.')
        
        return value.strip()
    
    def validate_descripcion(self, value):
        if value and len(value.strip()) < 10:
            raise serializers.ValidationError('La descripción debe tener al menos 10 caracteres.')
        return value.strip() if value else ''


class DashboardUserCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear y actualizar usuarios en el dashboard
    """
    password = serializers.CharField(write_only=True, required=False, min_length=8)
    confirm_password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'first_name', 'last_name', 
            'is_active', 'is_staff', 'password', 'confirm_password'
        ]
    
    def validate_username(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError('El nombre de usuario debe tener al menos 3 caracteres.')
        
        # Verificar unicidad (excluyendo la instancia actual en caso de actualización)
        queryset = User.objects.filter(username__iexact=value.strip())
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        
        if queryset.exists():
            raise serializers.ValidationError('Ya existe un usuario con este nombre.')
        
        return value.strip()
    
    def validate_email(self, value):
        if not value:
            raise serializers.ValidationError('El email es requerido.')
        
        # Verificar unicidad (excluyendo la instancia actual en caso de actualización)
        queryset = User.objects.filter(email__iexact=value.strip())
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        
        if queryset.exists():
            raise serializers.ValidationError('Ya existe un usuario con este email.')
        
        return value.strip().lower()
    
    def validate(self, attrs):
        # Validar contraseñas solo si se proporcionan
        password = attrs.get('password')
        confirm_password = attrs.get('confirm_password')
        
        if password or confirm_password:
            if not password:
                raise serializers.ValidationError({'password': 'La contraseña es requerida.'})
            if not confirm_password:
                raise serializers.ValidationError({'confirm_password': 'La confirmación de contraseña es requerida.'})
            if password != confirm_password:
                raise serializers.ValidationError({'confirm_password': 'Las contraseñas no coinciden.'})
        
        # Remover confirm_password antes de guardar
        attrs.pop('confirm_password', None)
        return attrs
    
    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User.objects.create_user(**validated_data)
        
        if password:
            user.set_password(password)
            user.save()
        
        return user
    
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
        
        instance.save()
        return instance


class DashboardUserDetailSerializer(serializers.ModelSerializer):
    """
    Serializer detallado para usuarios en el dashboard
    """
    dashboard_permission = DashboardPermissionSerializer(read_only=True)
    posts_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    last_login_display = serializers.SerializerMethodField()
    date_joined_display = serializers.SerializerMethodField()
    recent_activity = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'is_active', 'is_staff', 'is_superuser', 'date_joined', 'last_login',
            'date_joined_display', 'last_login_display', 'dashboard_permission',
            'posts_count', 'comments_count', 'recent_activity'
        ]
    
    def get_posts_count(self, obj):
        return obj.post_set.count()
    
    def get_comments_count(self, obj):
        return obj.comentario_set.count()
    
    def get_last_login_display(self, obj):
        if obj.last_login:
            return obj.last_login.strftime('%d/%m/%Y %H:%M')
        return 'Nunca'
    
    def get_date_joined_display(self, obj):
        return obj.date_joined.strftime('%d/%m/%Y %H:%M')
    
    def get_recent_activity(self, obj):
        activities = ActivityLog.objects.filter(user=obj).order_by('-timestamp')[:5]
        return ActivityLogSerializer(activities, many=True).data


class BulkUserActionSerializer(serializers.Serializer):
    """
    Serializer para acciones en lote sobre usuarios
    """
    user_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1,
        help_text='Lista de IDs de usuarios'
    )
    action = serializers.ChoiceField(
        choices=['activate', 'deactivate', 'delete'],
        help_text='Acción a realizar'
    )
    
    def validate_user_ids(self, value):
        # Verificar que todos los IDs existan
        existing_ids = User.objects.filter(id__in=value).values_list('id', flat=True)
        missing_ids = set(value) - set(existing_ids)
        
        if missing_ids:
            raise serializers.ValidationError(
                f'Los siguientes IDs de usuarios no existen: {list(missing_ids)}'
            )
        
        return value


class UserPermissionsUpdateSerializer(serializers.Serializer):
    """
    Serializer para actualizar permisos de usuario
    """
    permissions = serializers.DictField(
        child=serializers.BooleanField(),
        help_text='Diccionario con permisos a actualizar'
    )
    
    def validate_permissions(self, value):
        valid_permissions = [
            'can_manage_posts', 'can_manage_users', 
            'can_manage_comments', 'can_view_stats'
        ]
        
        for key in value.keys():
            if key not in valid_permissions:
                raise serializers.ValidationError(
                    f'Permiso inválido: {key}. Permisos válidos: {valid_permissions}'
                )
        
        return value


class DashboardCommentCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear y actualizar comentarios en el dashboard
    """
    class Meta:
        model = Comentario
        fields = ['contenido', 'post', 'parent', 'approved']
    
    def validate_contenido(self, value):
        if len(value.strip()) < 5:
            raise serializers.ValidationError('El comentario debe tener al menos 5 caracteres.')
        return value.strip()
    
    def validate_post(self, value):
        if not value:
            raise serializers.ValidationError('El post es requerido.')
        return value
    
    def validate_parent(self, value):
        if value:
            # Verificar que el comentario padre existe y pertenece al mismo post
            if hasattr(self, 'initial_data') and 'post' in self.initial_data:
                post_id = self.initial_data['post']
                if value.post.id != int(post_id):
                    raise serializers.ValidationError('El comentario padre debe pertenecer al mismo post.')
        return value


class DashboardCommentDetailSerializer(serializers.ModelSerializer):
    """
    Serializer detallado para comentarios en el dashboard
    """
    usuario_username = serializers.CharField(source='usuario.username', read_only=True)
    usuario_email = serializers.CharField(source='usuario.email', read_only=True)
    post_titulo = serializers.CharField(source='post.titulo', read_only=True)
    post_autor = serializers.CharField(source='post.autor.username', read_only=True)
    parent_content = serializers.CharField(source='parent.contenido', read_only=True)
    replies_count = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()
    
    class Meta:
        model = Comentario
        fields = [
            'id', 'contenido', 'approved', 'usuario', 'usuario_username', 'usuario_email',
            'post', 'post_titulo', 'post_autor', 'parent', 'parent_content',
            'fecha_creacion', 'fecha_actualizacion', 'replies_count', 'replies'
        ]
    
    def get_replies_count(self, obj):
        return obj.replies.count()
    
    def get_replies(self, obj):
        replies = obj.replies.select_related('usuario').order_by('fecha_creacion')[:5]
        return DashboardCommentSerializer(replies, many=True).data


class BulkCommentActionSerializer(serializers.Serializer):
    """
    Serializer para acciones en lote sobre comentarios
    """
    comment_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1,
        help_text='Lista de IDs de comentarios'
    )
    action = serializers.ChoiceField(
        choices=['approve', 'reject', 'delete'],
        help_text='Acción a realizar'
    )
    
    def validate_comment_ids(self, value):
        # Verificar que todos los IDs existan
        existing_ids = Comentario.objects.filter(id__in=value).values_list('id', flat=True)
        missing_ids = set(value) - set(existing_ids)
        
        if missing_ids:
            raise serializers.ValidationError(
                f'Los siguientes IDs de comentarios no existen: {list(missing_ids)}'
            )
        
        return value


class CommentModerationSerializer(serializers.Serializer):
    """
    Serializer para moderación de comentarios
    """
    approved = serializers.BooleanField(help_text='Estado de aprobación del comentario')
    reason = serializers.CharField(
        max_length=200, 
        required=False, 
        help_text='Razón de la moderación (opcional)'
    )


class CommentFilterSerializer(serializers.Serializer):
    """
    Serializer para filtros de comentarios
    """
    approved = serializers.BooleanField(required=False)
    post_id = serializers.IntegerField(required=False)
    user_id = serializers.IntegerField(required=False)
    date_from = serializers.DateTimeField(required=False)
    date_to = serializers.DateTimeField(required=False)
    has_replies = serializers.BooleanField(required=False)
    
    def validate(self, attrs):
        date_from = attrs.get('date_from')
        date_to = attrs.get('date_to')
        
        if date_from and date_to and date_from > date_to:
            raise serializers.ValidationError('date_from debe ser anterior a date_to')
        
        return attrs