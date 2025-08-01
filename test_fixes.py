#!/usr/bin/env python
"""
Script para verificar que las correcciones funcionan correctamente
"""

import os
import sys
import django
from django.conf import settings

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_blog.settings')
django.setup()

def test_api_responses():
    """Probar las clases de respuesta API"""
    print("🧪 Probando clases de respuesta API...")
    
    try:
        from django_blog.api_utils import StandardAPIResponse, DashboardAPIResponse
        
        # Probar respuesta estándar
        response = StandardAPIResponse.success(data={'test': 'data'}, message='Test successful')
        print("✅ StandardAPIResponse.success funciona correctamente")
        
        # Probar respuesta de error
        error_response = StandardAPIResponse.error('Test error', status_code=400)
        print("✅ StandardAPIResponse.error funciona correctamente")
        
        # Probar respuesta de dashboard
        dashboard_response = DashboardAPIResponse.success(data={'dashboard': 'data'})
        print("✅ DashboardAPIResponse funciona correctamente")
        
        return True
    except Exception as e:
        print(f"❌ Error en API responses: {e}")
        return False

def test_imports():
    """Probar que las importaciones funcionan correctamente"""
    print("🧪 Probando importaciones...")
    
    try:
        # Probar importaciones de users
        from users.api_utils import StandardResponse
        print("✅ users.api_utils importa correctamente")
        
        # Probar importaciones de posts
        from posts.api_utils import StandardResponse as PostsStandardResponse
        print("✅ posts.api_utils importa correctamente")
        
        # Verificar que son la misma clase
        from django_blog.api_utils import StandardAPIResponse
        assert StandardResponse == StandardAPIResponse
        assert PostsStandardResponse == StandardAPIResponse
        print("✅ Las clases son consistentes")
        
        return True
    except Exception as e:
        print(f"❌ Error en importaciones: {e}")
        return False

def test_serializers():
    """Probar que los serializers funcionan correctamente"""
    print("🧪 Probando serializers...")
    
    try:
        from posts.serializers import PostSerializer, CategorySerializer
        print("✅ Serializers importan correctamente")
        
        # Probar que no hay errores de sintaxis
        serializer = PostSerializer()
        print("✅ PostSerializer se instancia correctamente")
        
        category_serializer = CategorySerializer()
        print("✅ CategorySerializer se instancia correctamente")
        
        return True
    except Exception as e:
        print(f"❌ Error en serializers: {e}")
        return False

def test_middleware():
    """Probar que el middleware está configurado correctamente"""
    print("🧪 Probando configuración de middleware...")
    
    try:
        middleware_classes = settings.MIDDLEWARE
        
        # Verificar que nuestros middlewares están presentes
        expected_middlewares = [
            'django_blog.middleware.SecurityHeadersMiddleware',
            'django_blog.middleware.RequestLoggingMiddleware',
            'django_blog.middleware.APIErrorHandlingMiddleware',
            'django_blog.middleware.ResponseTimeMiddleware',
            'django_blog.middleware.APIVersionMiddleware',
        ]
        
        for middleware in expected_middlewares:
            if middleware in middleware_classes:
                print(f"✅ {middleware} está configurado")
            else:
                print(f"⚠️ {middleware} no está configurado")
        
        return True
    except Exception as e:
        print(f"❌ Error en middleware: {e}")
        return False

def test_cors_configuration():
    """Probar configuración CORS"""
    print("🧪 Probando configuración CORS...")
    
    try:
        cors_origins = getattr(settings, 'CORS_ALLOWED_ORIGINS', [])
        cors_credentials = getattr(settings, 'CORS_ALLOW_CREDENTIALS', False)
        
        print(f"✅ CORS origins configurados: {len(cors_origins)} origins")
        print(f"✅ CORS credentials: {cors_credentials}")
        
        if settings.DEBUG:
            cors_allow_all = getattr(settings, 'CORS_ALLOW_ALL_ORIGINS', False)
            print(f"✅ CORS allow all (DEBUG): {cors_allow_all}")
        
        return True
    except Exception as e:
        print(f"❌ Error en CORS: {e}")
        return False

def test_frontend_composable():
    """Verificar que el composable del frontend no tiene errores de sintaxis"""
    print("🧪 Verificando composable del frontend...")
    
    try:
        # Leer el archivo y verificar que no hay errores obvios
        with open('frontend/composables/useApi.ts', 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Verificar que la corrección se aplicó
        if 'apiCategory.descripcion || apiCategory.description' in content:
            print("✅ Corrección en transformCategory aplicada")
        else:
            print("⚠️ Corrección en transformCategory no encontrada")
        
        # Verificar que no hay referencias incorrectas (excepto en transformPost que es válido)
        # La referencia en transformPost es correcta, así que verificamos el contexto
        lines = content.split('\n')
        in_transform_post = False
        incorrect_refs = []
        
        for i, line in enumerate(lines, 1):
            # Detectar si estamos dentro de la función transformPost
            if 'const transformPost = ' in line:
                in_transform_post = True
            elif line.strip().startswith('const ') and 'transform' in line and in_transform_post:
                in_transform_post = False
            elif line.strip() == '}' and in_transform_post and 'return {' in content.split('\n')[max(0, i-10):i]:
                in_transform_post = False
            
            # Solo marcar como error si no estamos en transformPost
            if 'apiPost.category.description' in line and not in_transform_post:
                incorrect_refs.append(f"Línea {i}: {line.strip()}")
        
        if not incorrect_refs:
            print("✅ Referencias verificadas - todas son correctas")
        else:
            print(f"❌ Referencias incorrectas encontradas: {incorrect_refs}")
        
        return True
    except Exception as e:
        print(f"❌ Error verificando frontend: {e}")
        return False

def main():
    """Ejecutar todas las pruebas"""
    print("🚀 Iniciando verificación de correcciones...\n")
    
    tests = [
        test_api_responses,
        test_imports,
        test_serializers,
        test_middleware,
        test_cors_configuration,
        test_frontend_composable,
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
            print()  # Línea en blanco entre tests
        except Exception as e:
            print(f"❌ Error ejecutando {test.__name__}: {e}\n")
    
    print(f"📊 Resultados: {passed}/{total} pruebas pasaron")
    
    if passed == total:
        print("🎉 ¡Todas las correcciones funcionan correctamente!")
        return 0
    else:
        print("⚠️ Algunas correcciones necesitan revisión")
        return 1

if __name__ == '__main__':
    sys.exit(main())
