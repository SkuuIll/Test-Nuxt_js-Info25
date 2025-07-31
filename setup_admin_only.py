#!/usr/bin/env python
"""
Script para configurar el proyecto con solo el usuario administrador
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_blog.settings')
django.setup()

from accounts.models import User
from posts.models import Post, Categoria
from django.utils import timezone

def setup_admin_only():
    print("🔧 Configurando proyecto con usuario administrador único...")
    
    # Limpiar usuarios existentes (excepto admin si ya existe)
    existing_admin = None
    try:
        existing_admin = User.objects.get(username='admin')
        print("ℹ️ Usuario admin existente encontrado")
    except User.DoesNotExist:
        pass
    
    # Eliminar otros usuarios
    other_users = User.objects.exclude(username='admin')
    if other_users.exists():
        count = other_users.count()
        other_users.delete()
        print(f"🗑️ Eliminados {count} usuarios adicionales")
    
    # Crear o verificar usuario admin
    if not existing_admin:
        admin = User.objects.create_superuser(
            username='admin',
            email='admin@test.com',
            password='admin123',
            first_name='Admin',
            last_name='User'
        )
        print(f"✅ Superusuario creado: {admin.username} - {admin.email}")
    else:
        print(f"✅ Usuario admin verificado: {existing_admin.username} - {existing_admin.email}")
    
    # Obtener usuario admin
    admin = User.objects.get(username='admin')
    
    # Crear categorías
    categorias = [
        {'nombre': 'Tecnología', 'descripcion': 'Posts sobre tecnología y programación'},
        {'nombre': 'Noticias', 'descripcion': 'Últimas noticias y actualidades'},
        {'nombre': 'Tutorial', 'descripcion': 'Tutoriales y guías paso a paso'},
        {'nombre': 'Opinión', 'descripcion': 'Artículos de opinión y análisis'},
    ]
    
    for cat_data in categorias:
        categoria, created = Categoria.objects.get_or_create(
            nombre=cat_data['nombre'],
            defaults={'descripcion': cat_data['descripcion']}
        )
        if created:
            print(f"✅ Categoría creada: {categoria.nombre}")
    
    # Actualizar posts existentes para que tengan admin como autor
    posts_updated = Post.objects.exclude(autor=admin).update(autor=admin)
    if posts_updated > 0:
        print(f"🔄 Actualizados {posts_updated} posts para usar admin como autor")
    
    # Crear posts de ejemplo si no existen
    posts_data = [
        {
            'titulo': 'Introducción a Django REST Framework',
            'contenido': '''Django REST Framework es una potente biblioteca para construir APIs web. 
            
En este post exploraremos las características principales:

## Características principales
- Serialización automática
- Autenticación y permisos
- Navegación web de la API
- Documentación automática

## Ejemplo básico
```python
from rest_framework import serializers

class PostSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = '__all__'
```

¡Es muy fácil de usar!''',
            'categoria': 'Tecnología',
            'status': 'published'
        },
        {
            'titulo': 'Guía completa de Vue.js 3',
            'contenido': '''Vue.js 3 trae muchas mejoras y nuevas características.

## Novedades en Vue 3
- Composition API
- Mejor rendimiento
- TypeScript nativo
- Fragments

## Composition API
La nueva Composition API permite organizar mejor el código:

```javascript
import { ref, computed } from 'vue'

export default {
  setup() {
    const count = ref(0)
    const doubled = computed(() => count.value * 2)
    
    return { count, doubled }
  }
}
```''',
            'categoria': 'Tutorial',
            'status': 'published'
        },
        {
            'titulo': 'El futuro del desarrollo web',
            'contenido': '''El desarrollo web está evolucionando rápidamente.

## Tendencias actuales
- JAMstack
- Serverless
- Progressive Web Apps
- WebAssembly

## Mi opinión
Creo que el futuro está en aplicaciones más rápidas y eficientes. 
Las herramientas modernas nos permiten crear experiencias increíbles.

¿Qué opinas tú?''',
            'categoria': 'Opinión',
            'status': 'published'
        }
    ]
    
    posts_created = 0
    for post_data in posts_data:
        categoria = Categoria.objects.get(nombre=post_data['categoria'])
        
        post, created = Post.objects.get_or_create(
            titulo=post_data['titulo'],
            defaults={
                'contenido': post_data['contenido'],
                'autor': admin,
                'categoria': categoria,
                'status': post_data['status'],
                'fecha_publicacion': timezone.now()
            }
        )
        
        if created:
            posts_created += 1
            print(f"✅ Post creado: {post.titulo}")
    
    if posts_created > 0:
        print(f"📝 Se crearon {posts_created} posts nuevos")
    
    print(f"\n📊 Resumen final:")
    print(f"  - Usuario: admin (admin@test.com)")
    print(f"  - Contraseña: admin123")
    print(f"  - Categorías: {Categoria.objects.count()}")
    print(f"  - Posts totales: {Post.objects.count()}")
    print(f"  - Posts publicados: {Post.objects.filter(status='published').count()}")
    print(f"  - Todos los posts son del usuario admin")

if __name__ == '__main__':
    setup_admin_only()