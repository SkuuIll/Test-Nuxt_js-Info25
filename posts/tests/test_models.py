from django.test import TestCase
from django.contrib.auth import get_user_model

User = get_user_model()
from django.utils import timezone
from posts.models import Categoria, Post, Comentario


class CategoriaModelTest(TestCase):
    def setUp(self):
        self.categoria = Categoria.objects.create(
            nombre="Tecnología",
            descripcion="Noticias sobre tecnología"
        )

    def test_categoria_creation(self):
        """Test que una categoría se crea correctamente"""
        self.assertEqual(self.categoria.nombre, "Tecnología")
        self.assertEqual(self.categoria.descripcion, "Noticias sobre tecnología")

    def test_categoria_str_method(self):
        """Test del método __str__ de Categoria"""
        self.assertEqual(str(self.categoria), "Tecnología")

    def test_categoria_unique_nombre(self):
        """Test que el nombre de categoría debe ser único"""
        with self.assertRaises(Exception):
            Categoria.objects.create(nombre="Tecnología")

    def test_categoria_verbose_name_plural(self):
        """Test del verbose_name_plural en Meta"""
        self.assertEqual(Categoria._meta.verbose_name_plural, "Categorías")


class PostModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.categoria = Categoria.objects.create(
            nombre="Deportes",
            descripcion="Noticias deportivas"
        )
        self.post = Post.objects.create(
            titulo="Test Post",
            contenido="Este es un post de prueba",
            autor=self.user,
            categoria=self.categoria
        )

    def test_post_creation(self):
        """Test que un post se crea correctamente"""
        self.assertEqual(self.post.titulo, "Test Post")
        self.assertEqual(self.post.contenido, "Este es un post de prueba")
        self.assertEqual(self.post.autor, self.user)
        self.assertEqual(self.post.categoria, self.categoria)

    def test_post_str_method(self):
        """Test del método __str__ de Post"""
        self.assertEqual(str(self.post), "Test Post")

    def test_post_fecha_publicacion_default(self):
        """Test que fecha_publicacion tiene un valor por defecto"""
        self.assertIsNotNone(self.post.fecha_publicacion)
        self.assertLessEqual(self.post.fecha_publicacion, timezone.now())

    def test_post_fecha_creacion_auto(self):
        """Test que fecha_creacion se establece automáticamente"""
        self.assertIsNotNone(self.post.fecha_creacion)

    def test_post_ordering(self):
        """Test que los posts se ordenan por fecha_publicacion descendente"""
        import time
        time.sleep(0.01)  # Pequeña pausa para asegurar diferencia de tiempo
        post2 = Post.objects.create(
            titulo="Post Más Nuevo",
            contenido="Contenido más nuevo",
            autor=self.user,
            categoria=self.categoria,
            fecha_publicacion=timezone.now()
        )
        posts = Post.objects.all()
        self.assertEqual(posts.first(), post2)

    def test_post_without_categoria(self):
        """Test que un post puede existir sin categoría"""
        post_sin_categoria = Post.objects.create(
            titulo="Post Sin Categoría",
            contenido="Contenido sin categoría",
            autor=self.user
        )
        self.assertIsNone(post_sin_categoria.categoria)

    def test_post_without_imagen(self):
        """Test que un post puede existir sin imagen"""
        self.assertFalse(self.post.imagen)


class ComentarioModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='commenter',
            email='commenter@example.com',
            password='testpass123'
        )
        self.autor_post = User.objects.create_user(
            username='author',
            email='author@example.com',
            password='testpass123'
        )
        self.post = Post.objects.create(
            titulo="Post para comentar",
            contenido="Contenido del post",
            autor=self.autor_post
        )
        self.comentario = Comentario.objects.create(
            post=self.post,
            usuario=self.user,
            contenido="Este es un comentario de prueba"
        )

    def test_comentario_creation(self):
        """Test que un comentario se crea correctamente"""
        self.assertEqual(self.comentario.post, self.post)
        self.assertEqual(self.comentario.usuario, self.user)
        self.assertEqual(self.comentario.contenido, "Este es un comentario de prueba")

    def test_comentario_str_method(self):
        """Test del método __str__ de Comentario"""
        expected_str = f'Comentario de {self.user.username} en {self.post.titulo}'
        self.assertEqual(str(self.comentario), expected_str)

    def test_comentario_fecha_creacion_auto(self):
        """Test que fecha_creacion se establece automáticamente"""
        self.assertIsNotNone(self.comentario.fecha_creacion)

    def test_comentario_related_name(self):
        """Test que el related_name 'comentarios' funciona"""
        comentarios = self.post.comentarios.all()
        self.assertIn(self.comentario, comentarios)

    def test_comentario_ordering(self):
        """Test que los comentarios se ordenan por fecha_creacion ascendente"""
        import time
        time.sleep(0.01)  # Pequeña pausa para asegurar diferencia de tiempo
        comentario2 = Comentario.objects.create(
            post=self.post,
            usuario=self.user,
            contenido="Segundo comentario"
        )
        comentarios = self.post.comentarios.all()
        self.assertEqual(comentarios.first(), self.comentario)
        self.assertEqual(comentarios.last(), comentario2)

    def test_comentario_cascade_delete_post(self):
        """Test que los comentarios se eliminan cuando se elimina el post"""
        comentario_id = self.comentario.id
        self.post.delete()
        with self.assertRaises(Comentario.DoesNotExist):
            Comentario.objects.get(id=comentario_id)

    def test_comentario_cascade_delete_user(self):
        """Test que los comentarios se eliminan cuando se elimina el usuario"""
        comentario_id = self.comentario.id
        self.user.delete()
        with self.assertRaises(Comentario.DoesNotExist):
            Comentario.objects.get(id=comentario_id)