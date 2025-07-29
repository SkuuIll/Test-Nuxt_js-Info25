#!/usr/bin/env python
import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_blog.settings')
django.setup()

from posts.models import Post
from posts.serializers import PostSerializer

print("🔍 Debugging posts API...")

# Verificar que hay posts
posts = Post.objects.filter(status='published')
print(f"Posts published: {posts.count()}")

if posts.exists():
    first_post = posts.first()
    print(f"First post: {first_post.titulo}")
    
    # Intentar serializar
    try:
        serializer = PostSerializer(first_post)
        print("✅ Serialization successful")
        print(f"Serialized data keys: {list(serializer.data.keys())}")
    except Exception as e:
        print(f"❌ Serialization error: {e}")
        import traceback
        traceback.print_exc()
else:
    print("❌ No published posts found")