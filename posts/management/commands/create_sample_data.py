from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()
from posts.models import Categoria, Post, Comentario
from django.utils import timezone
import random


class Command(BaseCommand):
    help = 'Crea datos de ejemplo para el blog'

    def add_arguments(self, parser):
        parser.add_argument(
            '--posts',
            type=int,
            default=20,
            help='Número de posts a crear (default: 20)'
        )
        parser.add_argument(
            '--comments',
            type=int,
            default=50,
            help='Número de comentarios a crear (default: 50)'
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Creando datos de ejemplo...'))

        # Crear usuarios de ejemplo
        users_data = [
            {'username': 'editor1', 'email': 'editor1@blog.com', 'first_name': 'Ana', 'last_name': 'García'},
            {'username': 'editor2', 'email': 'editor2@blog.com', 'first_name': 'Carlos', 'last_name': 'López'},
            {'username': 'editor3', 'email': 'editor3@blog.com', 'first_name': 'María', 'last_name': 'Rodríguez'},
            {'username': 'comentarista1', 'email': 'user1@blog.com', 'first_name': 'Juan', 'last_name': 'Pérez'},
            {'username': 'comentarista2', 'email': 'user2@blog.com', 'first_name': 'Laura', 'last_name': 'Martín'},
        ]

        users = []
        for user_data in users_data:
            user, created = User.objects.get_or_create(
                username=user_data['username'],
                defaults={
                    'email': user_data['email'],
                    'first_name': user_data['first_name'],
                    'last_name': user_data['last_name'],
                    'password': 'pbkdf2_sha256$600000$dummy$dummy'  # Password dummy
                }
            )
            users.append(user)
            if created:
                self.stdout.write(f'Usuario creado: {user.username}')

        # Crear categorías
        categorias_data = [
            {'nombre': 'Tecnología', 'descripcion': 'Noticias sobre tecnología, innovación y gadgets'},
            {'nombre': 'Deportes', 'descripcion': 'Noticias deportivas y resultados'},
            {'nombre': 'Política', 'descripcion': 'Noticias políticas y análisis'},
            {'nombre': 'Entretenimiento', 'descripcion': 'Noticias de entretenimiento, cine y música'},
            {'nombre': 'Ciencia', 'descripcion': 'Descubrimientos científicos y avances'},
            {'nombre': 'Salud', 'descripcion': 'Noticias sobre salud y bienestar'},
        ]

        categorias = []
        for cat_data in categorias_data:
            categoria, created = Categoria.objects.get_or_create(
                nombre=cat_data['nombre'],
                defaults={'descripcion': cat_data['descripcion']}
            )
            categorias.append(categoria)
            if created:
                self.stdout.write(f'Categoría creada: {categoria.nombre}')

        # Crear posts de ejemplo
        posts_data = [
            {
                'titulo': 'Inteligencia Artificial revoluciona la medicina',
                'contenido': 'La inteligencia artificial está transformando el diagnóstico médico con nuevas herramientas que pueden detectar enfermedades con mayor precisión que los métodos tradicionales. Los algoritmos de machine learning están siendo entrenados con millones de imágenes médicas para identificar patrones que podrían pasar desapercibidos para el ojo humano.',
                'categoria': 'Tecnología'
            },
            {
                'titulo': 'Mundial de Fútbol: Resultados de la jornada',
                'contenido': 'Los partidos de ayer dejaron resultados sorprendentes en el mundial de fútbol. El equipo favorito cayó ante el menos esperado en un partido lleno de emociones. Los fanáticos no podían creer lo que veían en el estadio.',
                'categoria': 'Deportes'
            },
            {
                'titulo': 'Nuevas políticas ambientales aprobadas',
                'contenido': 'El congreso aprobó nuevas medidas para combatir el cambio climático. Las políticas incluyen incentivos para energías renovables y regulaciones más estrictas para las industrias contaminantes. Los expertos consideran que es un paso importante hacia la sostenibilidad.',
                'categoria': 'Política'
            },
            {
                'titulo': 'Estreno cinematográfico rompe récords',
                'contenido': 'La nueva película de superhéroes ha batido todos los récords de taquilla en su primer fin de semana. Los fanáticos hicieron largas colas para ver la esperada secuela que promete revolucionar el género.',
                'categoria': 'Entretenimiento'
            },
            {
                'titulo': 'Descubrimiento de nueva especie marina',
                'contenido': 'Científicos marinos han descubierto una nueva especie de pez en las profundidades del océano Pacífico. Esta especie presenta características únicas que podrían ayudar a entender mejor la evolución marina.',
                'categoria': 'Ciencia'
            },
        ]

        # Crear posts adicionales con contenido generado
        posts_created = 0
        for i in range(options['posts']):
            if i < len(posts_data):
                post_info = posts_data[i]
                categoria = next((c for c in categorias if c.nombre == post_info['categoria']), random.choice(categorias))
            else:
                categoria = random.choice(categorias)
                post_info = {
                    'titulo': f'Noticia importante #{i+1} en {categoria.nombre}',
                    'contenido': f'Este es el contenido de la noticia #{i+1} sobre {categoria.nombre.lower()}. ' * 10
                }

            post, created = Post.objects.get_or_create(
                titulo=post_info['titulo'],
                defaults={
                    'contenido': post_info['contenido'],
                    'autor': random.choice(users[:3]),  # Solo editores como autores
                    'categoria': categoria,
                    'fecha_publicacion': timezone.now() - timezone.timedelta(days=random.randint(0, 30))
                }
            )
            
            if created:
                posts_created += 1

        self.stdout.write(f'Posts creados: {posts_created}')

        # Crear comentarios
        posts = Post.objects.all()
        comentarios_data = [
            'Excelente artículo, muy informativo.',
            'No estoy de acuerdo con algunos puntos.',
            'Gracias por compartir esta información.',
            'Muy interesante, espero más contenido así.',
            '¿Podrías profundizar más en este tema?',
            'Completamente de acuerdo con el autor.',
            'Información muy útil, la compartiré.',
            'Me gustaría ver más ejemplos.',
            'Artículo muy bien estructurado.',
            'Esperaba más detalles técnicos.',
        ]

        comentarios_created = 0
        for i in range(options['comments']):
            post = random.choice(posts)
            usuario = random.choice(users)
            contenido = random.choice(comentarios_data)
            
            comentario = Comentario.objects.create(
                post=post,
                usuario=usuario,
                contenido=contenido,
                fecha_creacion=timezone.now() - timezone.timedelta(days=random.randint(0, 15))
            )
            comentarios_created += 1

        self.stdout.write(f'Comentarios creados: {comentarios_created}')

        self.stdout.write(
            self.style.SUCCESS(
                f'Datos de ejemplo creados exitosamente:\n'
                f'- {len(users)} usuarios\n'
                f'- {len(categorias)} categorías\n'
                f'- {posts_created} posts\n'
                f'- {comentarios_created} comentarios'
            )
        )