#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_blog.settings')
django.setup()

from accounts.models import User
from posts.models import Post, Categoria
from django.utils import timezone

def create_test_data():
    print("🔧 Creando datos de prueba...")
    
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
        else:
            print(f"ℹ️ Categoría '{categoria.nombre}' ya existe")
    
    # Obtener usuario admin
    admin = User.objects.get(username='admin')
    
    # Crear posts de prueba
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
            'autor': admin,
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
            'autor': admin,
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
            'autor': admin,
            'categoria': 'Opinión',
            'status': 'published'
        },
        {
            'titulo': 'Configurando un proyecto con Nuxt.js',
            'contenido': '''Nuxt.js es un framework increíble para Vue.js.

## Instalación
```bash
npx nuxi@latest init mi-proyecto
cd mi-proyecto
npm install
npm run dev
```

## Estructura del proyecto
- `pages/` - Rutas automáticas
- `components/` - Componentes reutilizables
- `layouts/` - Plantillas de página
- `middleware/` - Lógica de middleware

¡Muy fácil de usar!''',
            'autor': admin,
            'categoria': 'Tutorial',
            'status': 'draft'
        },
        {
            'titulo': 'Últimas noticias en tecnología',
            'contenido': '''Resumen de las noticias más importantes de esta semana.

## Destacados
- Nueva versión de Python
- Actualizaciones en frameworks JavaScript
- Avances en IA y Machine Learning

## Python 3.12
La nueva versión incluye mejoras de rendimiento significativas.

## JavaScript
Los frameworks siguen evolucionando con nuevas características.''',
            'autor': admin,
            'categoria': 'Noticias',
            'status': 'published'
        }
    ]
    
    for post_data in posts_data:
        categoria = Categoria.objects.get(nombre=post_data['categoria'])
        
        post, created = Post.objects.get_or_create(
            titulo=post_data['titulo'],
            defaults={
                'contenido': post_data['contenido'],
                'autor': post_data['autor'],
                'categoria': categoria,
                'status': post_data['status'],
                'fecha_publicacion': timezone.now()
            }
        )
        
        if created:
            print(f"✅ Post creado: {post.titulo} (por {post.autor.username})")
        else:
            print(f"ℹ️ Post '{post.titulo}' ya existe")
    
    print(f"\n📊 Resumen:")
    print(f"  - Categorías: {Categoria.objects.count()}")
    print(f"  - Posts totales: {Post.objects.count()}")
    print(f"  - Posts publicados: {Post.objects.filter(status='published').count()}")
    print(f"  - Posts en borrador: {Post.objects.filter(status='draft').count()}")

if __name__ == '__main__':
    create_test_data()