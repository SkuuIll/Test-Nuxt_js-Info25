from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from django_blog.base_serializers import (
    BaseModelSerializer, UserBasicSerializer,
    SuccessResponseSerializer, ErrorResponseSerializer, ValidationErrorSerializer
)

User = get_user_model()


# UserBasicSerializer ahora se importa desde base_serializers

class UserSerializer(UserBasicSerializer):
    """Serializador completo de usuario"""
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'avatar_url', 'is_active', 'date_joined'
        ]
        read_only_fields = ['id', 'username', 'date_joined', 'is_active']

class UserRegistrationSerializer(BaseModelSerializer):
    """Serializador para registro de usuarios"""
    password = serializers.CharField(
        write_only=True, 
        min_length=8,
        validators=[validate_password],
        help_text='Contraseña (mínimo 8 caracteres)'
    )
    password_confirm = serializers.CharField(
        write_only=True,
        help_text='Confirmación de contraseña'
    )
    terms_accepted = serializers.BooleanField(
        write_only=True,
        help_text='Aceptación de términos y condiciones'
    )
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm', 
            'first_name', 'last_name', 'terms_accepted'
        ]
    
    def validate_username(self, value):
        """Validar nombre de usuario"""
        if not value or len(value.strip()) < 3:
            raise serializers.ValidationError('El nombre de usuario debe tener al menos 3 caracteres')
        
        if len(value.strip()) > 30:
            raise serializers.ValidationError('El nombre de usuario no puede exceder 30 caracteres')
        
        # Verificar caracteres permitidos
        import re
        if not re.match(r'^[a-zA-Z0-9_]+$', value.strip()):
            raise serializers.ValidationError('El nombre de usuario solo puede contener letras, números y guiones bajos')
        
        # Verificar unicidad
        if User.objects.filter(username__iexact=value.strip()).exists():
            raise serializers.ValidationError('Este nombre de usuario ya está en uso')
        
        return value.strip()
    
    def validate_email(self, value):
        """Validar email"""
        if not value:
            raise serializers.ValidationError('El email es requerido')
        
        # Verificar unicidad
        if User.objects.filter(email__iexact=value.strip()).exists():
            raise serializers.ValidationError('Este email ya está registrado')
        
        return value.strip().lower()
    
    def validate_terms_accepted(self, value):
        """Validar aceptación de términos"""
        if not value:
            raise serializers.ValidationError('Debe aceptar los términos y condiciones')
        return value
    
    def validate(self, attrs):
        """Validar datos completos"""
        # Validar coincidencia de contraseñas
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'Las contraseñas no coinciden'
            })
        
        # Validar que el email no sea idéntico al username
        username = attrs.get('username', '').lower()
        email = attrs.get('email', '').lower()
        email_local = email.split('@')[0] if '@' in email else email
        
        # Solo validar si son exactamente iguales
        if username == email_local:
            raise serializers.ValidationError({
                'email': 'El email no puede ser idéntico al nombre de usuario'
            })
        
        return attrs
    
    def create(self, validated_data):
        """Crear usuario"""
        # Remover campos que no van al modelo
        validated_data.pop('password_confirm')
        validated_data.pop('terms_accepted')
        
        # Crear usuario
        user = User.objects.create_user(**validated_data)
        
        return user


class UserUpdateSerializer(BaseModelSerializer):
    """Serializador para actualizar perfil de usuario"""
    
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email']
    
    def validate_email(self, value):
        """Validar email único"""
        if not value:
            raise serializers.ValidationError('El email es requerido')
        
        # Verificar unicidad excluyendo el usuario actual
        queryset = User.objects.filter(email__iexact=value.strip())
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        
        if queryset.exists():
            raise serializers.ValidationError('Este email ya está en uso')
        
        return value.strip().lower()


class ChangePasswordSerializer(serializers.Serializer):
    """Serializador para cambio de contraseña"""
    current_password = serializers.CharField(
        write_only=True,
        help_text='Contraseña actual'
    )
    new_password = serializers.CharField(
        write_only=True,
        min_length=8,
        validators=[validate_password],
        help_text='Nueva contraseña'
    )
    confirm_password = serializers.CharField(
        write_only=True,
        help_text='Confirmación de nueva contraseña'
    )
    
    def validate_current_password(self, value):
        """Validar contraseña actual"""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('La contraseña actual es incorrecta')
        return value
    
    def validate(self, attrs):
        """Validar coincidencia de nuevas contraseñas"""
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': 'Las contraseñas no coinciden'
            })
        
        # Verificar que la nueva contraseña sea diferente a la actual
        if attrs['current_password'] == attrs['new_password']:
            raise serializers.ValidationError({
                'new_password': 'La nueva contraseña debe ser diferente a la actual'
            })
        
        return attrs
    
    def save(self):
        """Cambiar contraseña"""
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializador para solicitud de reset de contraseña"""
    email = serializers.EmailField(help_text='Email del usuario')
    
    def validate_email(self, value):
        """Validar que el email existe"""
        try:
            user = User.objects.get(email__iexact=value.strip())
            if not user.is_active:
                raise serializers.ValidationError('Esta cuenta está desactivada')
        except User.DoesNotExist:
            # Por seguridad, no revelar si el email existe o no
            pass
        
        return value.strip().lower()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializador para confirmación de reset de contraseña"""
    token = serializers.CharField(help_text='Token de reset')
    new_password = serializers.CharField(
        write_only=True,
        min_length=8,
        validators=[validate_password],
        help_text='Nueva contraseña'
    )
    confirm_password = serializers.CharField(
        write_only=True,
        help_text='Confirmación de nueva contraseña'
    )
    
    def validate(self, attrs):
        """Validar coincidencia de contraseñas"""
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': 'Las contraseñas no coinciden'
            })
        return attrs


class UserProfileSerializer(UserBasicSerializer):
    """Serializador para perfil público de usuario"""
    recent_posts = serializers.SerializerMethodField()
    recent_comments = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'full_name',
            'avatar_url', 'recent_posts', 'recent_comments',
            'date_joined'
        ]
    
    def get_recent_posts(self, obj):
        """Obtener posts recientes del usuario"""
        try:
            from posts.serializers import PostListSerializer
            recent_posts = obj.post_set.filter(status='published').order_by('-fecha_publicacion')[:5]
            return PostListSerializer(recent_posts, many=True, context=self.context).data
        except Exception:
            return []
    
    def get_recent_comments(self, obj):
        """Obtener comentarios recientes del usuario"""
        try:
            from posts.serializers import CommentSerializer
            recent_comments = obj.comentario_set.filter(approved=True).order_by('-fecha_creacion')[:5]
            return CommentSerializer(recent_comments, many=True, context=self.context).data
        except Exception:
            return []


class UserStatsSerializer(serializers.Serializer):
    """Serializador para estadísticas de usuario"""
    total_users = serializers.IntegerField()
    active_users = serializers.IntegerField()
    new_users_this_month = serializers.IntegerField()
    new_users_this_week = serializers.IntegerField()
    staff_users = serializers.IntegerField()
    most_active_users = serializers.ListField(child=serializers.DictField())
    user_growth = serializers.DictField()


class AuthResponseSerializer(SuccessResponseSerializer):
    """Serializador para respuestas de autenticación"""
    data = serializers.DictField()
    
    def to_representation(self, instance):
        """Personalizar respuesta de autenticación"""
        return {
            'success': True,
            'data': {
                'access': instance.get('access'),
                'refresh': instance.get('refresh'),
                'user': instance.get('user'),
                'expires_in': instance.get('expires_in', 3600),
                'token_type': 'Bearer'
            },
            'message': instance.get('message', 'Autenticación exitosa'),
            'timestamp': timezone.now().isoformat()
        }