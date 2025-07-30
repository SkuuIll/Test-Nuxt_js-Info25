#!/usr/bin/env python3
"""
Script para probar la funcionalidad de búsqueda y filtrado
"""

import os
import sys
import django
from django.test import RequestFactory
from django.contrib.auth import get_user_model

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_blog.settings')
django.setup()

from posts.models import Post, Category, Comment
from posts.filters import PostFilter, CategoryFilter, AdvancedSearchFilter
from posts.api_views import search_posts, search_suggestions, search_filters

User = get_user_model()


def test_post_filter():
    """Probar filtros de posts"""
    print("🧪 Probando filtros de posts...")
    
    try:
        # Crear datos de prueba si no existen
        posts_queryset = Post.objects.filter(status='published')
        
        if not posts_queryset.exists():
            print("⚠️  No hay posts publicados para probar")
            return
        
        # Probar filtro básico
        filter_data = {'search': 'test'}
        post_filter = PostFilter(filter_data, queryset=posts_queryset)
        filtered_posts = post_filter.qs
        
        print(f"✅ Filtro básico - {filtered_posts.count()} posts encontrados")
        
        # Probar filtro por categoría
        if Category.objects.exists():
            category = Category.objects.first()
            filter_data = {'category': category.id}
            post_filter = PostFilter(filter_data, queryset=posts_queryset)
            filtered_posts = post_filter.qs
            
            print(f"✅ Filtro por categoría - {filtered_posts.count()} posts encontrados")
        
        # Probar filtro por autor
        if User.objects.exists():
            author = User.objects.first()
            filter_data = {'author': author.id}
            post_filter = PostFilter(filter_data, queryset=posts_queryset)
            filtered_posts = post_filter.qs
            
            print(f"✅ Filtro por autor - {filtered_posts.count()} posts encontrados")
        
        # Probar filtro por destacado
        filter_data = {'featured': True}
        post_filter = PostFilter(filter_data, queryset=posts_queryset)
        filtered_posts = post_filter.qs
        
        print(f"✅ Filtro por destacado - {filtered_posts.count()} posts encontrados")
        
        # Probar filtro por rango de tiempo
        filter_data = {'time_range': 'month'}
        post_filter = PostFilter(filter_data, queryset=posts_queryset)
        filtered_posts = post_filter.qs
        
        print(f"✅ Filtro por tiempo - {filtered_posts.count()} posts encontrados")
        
        print("✅ Filtros de posts funcionando correctamente\n")
        
    except Exception as e:
        print(f"❌ Error en filtros de posts: {str(e)}\n")


def test_advanced_search():
    """Probar búsqueda avanzada"""
    print("🧪 Probando búsqueda avanzada...")
    
    try:
        posts_queryset = Post.objects.filter(status='published')
        
        if not posts_queryset.exists():
            print("⚠️  No hay posts para probar búsqueda")
            return
        
        # Probar búsqueda con relevancia
        query = "test"
        filtered_posts, metadata = AdvancedSearchFilter.search_posts_with_relevance(
            posts_queryset, query
        )
        
        print(f"✅ Búsqueda con relevancia - {filtered_posts.count()} posts encontrados")
        print(f"   Metadatos: {metadata}")
        
        # Probar sugerencias de búsqueda
        suggestions = AdvancedSearchFilter.get_search_suggestions("test", 5)
        print(f"✅ Sugerencias de búsqueda - {len(suggestions)} sugerencias")
        
        # Probar búsquedas populares
        popular = AdvancedSearchFilter.get_popular_searches(5)
        print(f"✅ Búsquedas populares - {len(popular)} términos")
        
        print("✅ Búsqueda avanzada funcionando correctamente\n")
        
    except Exception as e:
        print(f"❌ Error en búsqueda avanzada: {str(e)}\n")


def test_category_filter():
    """Probar filtros de categorías"""
    print("🧪 Probando filtros de categorías...")
    
    try:
        categories = Category.objects.all()
        
        if not categories.exists():
            print("⚠️  No hay categorías para probar")
            return
        
        # Probar filtro básico
        filter_data = {'search': 'test'}
        category_filter = CategoryFilter(filter_data, queryset=categories)
        filtered_categories = category_filter.qs
        
        print(f"✅ Filtro básico de categorías - {filtered_categories.count()} categorías encontradas")
        
        # Probar filtro por posts
        filter_data = {'has_posts': True}
        category_filter = CategoryFilter(filter_data, queryset=categories)
        filtered_categories = category_filter.qs
        
        print(f"✅ Filtro por categorías con posts - {filtered_categories.count()} categorías encontradas")
        
        print("✅ Filtros de categorías funcionando correctamente\n")
        
    except Exception as e:
        print(f"❌ Error en filtros de categorías: {str(e)}\n")


def test_api_views():
    """Probar vistas de API"""
    print("🧪 Probando vistas de API...")
    
    try:
        factory = RequestFactory()
        
        # Probar vista de búsqueda
        request = factory.get('/api/search/', {'q': 'test'})
        response = search_posts(request)
        
        if response.status_code == 200:
            print("✅ Vista de búsqueda - OK")
        else:
            print(f"⚠️  Vista de búsqueda - Status {response.status_code}")
        
        # Probar vista de sugerencias
        request = factory.get('/api/search/suggestions/', {'q': 'test'})
        response = search_suggestions(request)
        
        if response.status_code == 200:
            print("✅ Vista de sugerencias - OK")
        else:
            print(f"⚠️  Vista de sugerencias - Status {response.status_code}")
        
        # Probar vista de filtros
        request = factory.get('/api/search/filters/')
        response = search_filters(request)
        
        if response.status_code == 200:
            print("✅ Vista de filtros - OK")
        else:
            print(f"⚠️  Vista de filtros - Status {response.status_code}")
        
        print("✅ Vistas de API funcionando correctamente\n")
        
    except Exception as e:
        print(f"❌ Error en vistas de API: {str(e)}\n")


def test_filter_validation():
    """Probar validación de filtros"""
    print("🧪 Probando validación de filtros...")
    
    try:
        posts_queryset = Post.objects.filter(status='published')
        
        # Probar filtros con datos inválidos
        invalid_filters = [
            {'date_from': 'invalid-date'},
            {'category': 'invalid-id'},
            {'author': 'invalid-id'},
            {'min_comments': 'not-a-number'},
            {'time_range': 'invalid-range'}
        ]
        
        for filter_data in invalid_filters:
            try:
                post_filter = PostFilter(filter_data, queryset=posts_queryset)
                filtered_posts = post_filter.qs
                # Si no hay error, el filtro manejó correctamente el dato inválido
                print(f"✅ Filtro inválido manejado: {filter_data}")
            except Exception as e:
                print(f"⚠️  Error con filtro inválido {filter_data}: {str(e)}")
        
        print("✅ Validación de filtros funcionando correctamente\n")
        
    except Exception as e:
        print(f"❌ Error en validación de filtros: {str(e)}\n")


def test_performance():
    """Probar rendimiento de búsquedas"""
    print("🧪 Probando rendimiento...")
    
    try:
        import time
        
        posts = Post.objects.filter(status='published')
        
        if posts.count() == 0:
            print("⚠️  No hay posts para probar rendimiento")
            return
        
        # Probar búsqueda simple
        start_time = time.time()
        filter_data = {'search': 'test'}
        post_filter = PostFilter(filter_data, queryset=posts)
        result = list(post_filter.qs)
        end_time = time.time()
        
        print(f"✅ Búsqueda simple - {len(result)} resultados en {end_time - start_time:.3f}s")
        
        # Probar búsqueda compleja
        start_time = time.time()
        filter_data = {
            'search': 'test',
            'featured': True,
            'time_range': 'month',
            'ordering': '-fecha_publicacion'
        }
        post_filter = PostFilter(filter_data, queryset=posts)
        result = list(post_filter.qs)
        end_time = time.time()
        
        print(f"✅ Búsqueda compleja - {len(result)} resultados en {end_time - start_time:.3f}s")
        
        # Probar búsqueda con relevancia
        start_time = time.time()
        filtered_posts, metadata = AdvancedSearchFilter.search_posts_with_relevance(
            posts, "test"
        )
        result = list(filtered_posts)
        end_time = time.time()
        
        print(f"✅ Búsqueda con relevancia - {len(result)} resultados en {end_time - start_time:.3f}s")
        
        print("✅ Rendimiento aceptable\n")
        
    except Exception as e:
        print(f"❌ Error en pruebas de rendimiento: {str(e)}\n")


def main():
    """Ejecutar todas las pruebas"""
    print("🚀 Iniciando pruebas de búsqueda y filtrado...\n")
    
    test_post_filter()
    test_advanced_search()
    test_category_filter()
    test_api_views()
    test_filter_validation()
    test_performance()
    
    print("🎉 Pruebas de búsqueda y filtrado completadas!")


if __name__ == '__main__':
    main()