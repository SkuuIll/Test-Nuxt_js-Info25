#!/usr/bin/env python
"""
Script para marcar algunos posts como destacados
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_blog.settings')
django.setup()

from posts.models import Post

def create_featured_posts():
    """Marcar algunos posts como destacados"""
    
    try:
        # Obtener los primeros 3 posts
        posts = Post.objects.filter(status='published')[:3]
        
        if not posts:
            print("❌ No hay posts publicados para marcar como destacados")
            return False
        
        featured_count = 0
        for post in posts:
            post.featured = True
            post.save()
            featured_count += 1
            print(f"✅ Post '{post.titulo}' marcado como destacado")
        
        print(f"\n🎉 {featured_count} posts marcados como destacados exitosamente!")
        
        # Mostrar estadísticas
        total_posts = Post.objects.count()
        featured_posts = Post.objects.filter(featured=True).count()
        published_posts = Post.objects.filter(status='published').count()
        
        print(f"\n📊 Estadísticas:")
        print(f"   - Total de posts: {total_posts}")
        print(f"   - Posts publicados: {published_posts}")
        print(f"   - Posts destacados: {featured_posts}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error al marcar posts como destacados: {str(e)}")
        return False

if __name__ == '__main__':
    success = create_featured_posts()
    sys.exit(0 if success else 1)