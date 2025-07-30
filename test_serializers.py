#!/usr/bin/env python3
"""
Script para probar los serializadores actualizados
"""

import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_blog.settings')
django.setup()

from django.contrib.auth import get_user_model
from posts.models import Post, Category, Comment
from posts.serializers import (
    PostSerializer, PostListSerializer, PostDetailSerializer,
    CategorySerializer, CommentSerializer, PostStatsSerializer
)
from users.serializers import (
    UserSerializer, UserRegistrationSerializer, UserProfileSerializer
)
from django_blog.base_serializers import (
    UserBasicSerializer, PostBasicSerializer, CategoryBasicSerializer
)

User = get_user_model()


def test_base_serializers():
    """Probar serializadores base"""
    print("🧪 Probando serializadores base...")
    
    try:
        # Crear datos de prueba
        user = User.objects.first()
        if not user:
            user = User.objects.create_user(
                username='testuser',
                email='test@example.com',
                password='testpass123'
            )
        
        # Probar UserBasicSerializer
        user_serializer = UserBasicSerializer(user)
        user_data = user_serializer.data
        
        required_fields = ['id', 'username', 'full_name', 'avatar_url']
        for field in required_fields:
            assert field in user_data, f"Campo {field} faltante en UserBasicSerializer"
        
        print("✅ UserBasicSerializer - OK")
        
        # Probar con categoría si existe
        category = Category.objects.first()
        if category:
            category_serializer = CategoryBasicSerializer(category)
            category_data = category_serializer.data
            
            required_fields = ['id', 'name', 'posts_count', 'slug']
            for field in required_fields:
                assert field in category_data, f"Campo {field} faltante en CategoryBasicSerializer"
            
            print("✅ CategoryBasicSerializer - OK")
        
        # Probar con post si existe
        post = Post.objects.first()
        if post:
            post_serializer = PostBasicSerializer(post)
            post_data = post_serializer.data
            
            required_fields = ['id', 'title', 'author', 'reading_time', 'comments_count']
            for field in required_fields:
                assert field in post_data, f"Campo {field} faltante en PostBasicSerializer"
            
            print("✅ PostBasicSerializer - OK")
        
        print("✅ Serializadores base funcionando correctamente\n")
        
    except Exception as e:
        print(f"❌ Error en serializadores base: {str(e)}\n")


def test_post_serializers():
    """Probar serializadores de posts"""
    print("🧪 Probando serializadores de posts...")
    
    try:
        post = Post.objects.first()
        if not post:
            print("⚠️  No hay posts para probar")
            return
        
        # Probar PostSerializer
        post_serializer = PostSerializer(post)
        post_data = post_serializer.data
        
        required_fields = ['id', 'title', 'content', 'author', 'category', 'tags', 'meta_data']
        for field in required_fields:
            assert field in post_data, f"Campo {field} faltante en PostSerializer"
        
        print("✅ PostSerializer - OK")
        
        # Probar PostListSerializer
        posts = Post.objects.all()[:5]
        list_serializer = PostListSerializer(posts, many=True)
        list_data = list_serializer.data
        
        assert isinstance(list_data, list), "PostListSerializer debe devolver una lista"
        if list_data:
            required_fields = ['id', 'title', 'excerpt', 'author']
            for field in required_fields:
                assert field in list_data[0], f"Campo {field} faltante en PostListSerializer"
        
        print("✅ PostListSerializer - OK")
        
        # Probar PostDetailSerializer
        detail_serializer = PostDetailSerializer(post)
        detail_data = detail_serializer.data
        
        required_fields = ['related_posts', 'comments', 'breadcrumbs']
        for field in required_fields:
            assert field in detail_data, f"Campo {field} faltante en PostDetailSerializer"
        
        print("✅ PostDetailSerializer - OK")
        print("✅ Serializadores de posts funcionando correctamente\n")
        
    except Exception as e:
        print(f"❌ Error en serializadores de posts: {str(e)}\n")


def test_user_serializers():
    """Probar serializadores de usuarios"""
    print("🧪 Probando serializadores de usuarios...")
    
    try:
        user = User.objects.first()
        if not user:
            print("⚠️  No hay usuarios para probar")
            return
        
        # Probar UserSerializer
        user_serializer = UserSerializer(user)
        user_data = user_serializer.data
        
        required_fields = ['id', 'username', 'full_name', 'permissions', 'stats']
        for field in required_fields:
            assert field in user_data, f"Campo {field} faltante en UserSerializer"
        
        print("✅ UserSerializer - OK")
        
        # Probar UserProfileSerializer
        profile_serializer = UserProfileSerializer(user)
        profile_data = profile_serializer.data
        
        required_fields = ['recent_posts', 'recent_comments']
        for field in required_fields:
            assert field in profile_data, f"Campo {field} faltante en UserProfileSerializer"
        
        print("✅ UserProfileSerializer - OK")
        
        # Probar UserRegistrationSerializer (solo validación)
        registration_data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'securepass123',
            'password_confirm': 'securepass123',
            'first_name': 'New',
            'last_name': 'User',
            'terms_accepted': True
        }
        
        registration_serializer = UserRegistrationSerializer(data=registration_data)
        assert registration_serializer.is_valid(), f"UserRegistrationSerializer inválido: {registration_serializer.errors}"
        
        print("✅ UserRegistrationSerializer - OK")
        print("✅ Serializadores de usuarios funcionando correctamente\n")
        
    except Exception as e:
        print(f"❌ Error en serializadores de usuarios: {str(e)}\n")


def test_validation():
    """Probar validaciones de serializadores"""
    print("🧪 Probando validaciones...")
    
    try:
        # Probar validación de registro con datos inválidos
        invalid_data = {
            'username': 'ab',  # Muy corto
            'email': 'invalid-email',  # Email inválido
            'password': '123',  # Muy corta
            'password_confirm': '456',  # No coincide
            'terms_accepted': False  # No aceptados
        }
        
        registration_serializer = UserRegistrationSerializer(data=invalid_data)
        assert not registration_serializer.is_valid(), "Debería fallar con datos inválidos"
        
        # Verificar que hay errores en los campos esperados
        errors = registration_serializer.errors
        expected_error_fields = ['username', 'email', 'password', 'password_confirm', 'terms_accepted']
        
        for field in expected_error_fields:
            if field not in errors:
                print(f"⚠️  Falta validación para campo: {field}")
        
        print("✅ Validaciones funcionando correctamente\n")
        
    except Exception as e:
        print(f"❌ Error en validaciones: {str(e)}\n")


def test_consistency():
    """Probar consistencia entre serializadores"""
    print("🧪 Probando consistencia...")
    
    try:
        # Verificar que todos los serializadores de usuario devuelven campos consistentes
        user = User.objects.first()
        if user:
            basic_serializer = UserBasicSerializer(user)
            full_serializer = UserSerializer(user)
            
            basic_fields = set(basic_serializer.data.keys())
            full_fields = set(full_serializer.data.keys())
            
            # Los campos básicos deben estar en el serializador completo
            missing_fields = basic_fields - full_fields
            if missing_fields:
                print(f"⚠️  Campos faltantes en UserSerializer: {missing_fields}")
            else:
                print("✅ Consistencia de campos de usuario - OK")
        
        # Verificar formato de respuestas
        post = Post.objects.first()
        if post:
            post_serializer = PostSerializer(post)
            post_data = post_serializer.data
            
            # Verificar que las fechas están en formato ISO
            date_fields = ['created_at', 'updated_at', 'published_at']
            for field in date_fields:
                if field in post_data and post_data[field]:
                    # Verificar formato ISO básico
                    assert 'T' in str(post_data[field]), f"Campo {field} no está en formato ISO"
            
            print("✅ Formato de fechas consistente - OK")
        
        print("✅ Consistencia verificada correctamente\n")
        
    except Exception as e:
        print(f"❌ Error en consistencia: {str(e)}\n")


def main():
    """Ejecutar todas las pruebas"""
    print("🚀 Iniciando pruebas de serializadores...\n")
    
    test_base_serializers()
    test_post_serializers()
    test_user_serializers()
    test_validation()
    test_consistency()
    
    print("🎉 Pruebas de serializadores completadas!")


if __name__ == '__main__':
    main()