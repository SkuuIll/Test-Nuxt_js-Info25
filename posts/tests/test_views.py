from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User
from posts.models import Categoria, Post, Comentario


class PostViewsTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.categoria = Categoria.objects.create(
            nombre="Tecnología",
            descripcion="Noticias de tecnología"
        )
        self.post = Post.objects.create(
            titulo="Test Post",
            contenido="Este es un post de prueba para testing",
            autor=self.user,
            categoria=self.categoria
        )

    def test_post_list_view(self):
        """Test de la vista de lista de posts"""
        url = reverse('posts:home')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, self.post.titulo)
        self.assertContains(response, self.post.autor.username)
        self.assertContains(response, self.categoria.nombre)

    def test_post_list_view_pagination(self):
        """Test de paginación en la lista de posts"""
        # Crear 15 posts para probar paginación (paginate_by = 10)
        for i in range(15):
            Post.objects.create(
                titulo=f"Post {i}",
                contenido=f"Contenido del post {i}",
                autor=self.user,
                categoria=self.categoria
            )
        
        url = reverse('posts:home')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.context['is_paginated'])
        self.assertEqual(len(response.context['posts']), 10)

    def test_post_detail_view(self):
        """Test de la vista de detalle de post"""
        url = reverse('posts:post_detail', kwargs={'pk': self.post.pk})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, self.post.titulo)
        self.assertContains(response, self.post.contenido)
        self.assertContains(response, self.post.autor.username)

    def test_post_detail_view_404(self):
        """Test que la vista de detalle devuelve 404 para post inexistente"""
        url = reverse('posts:post_detail', kwargs={'pk': 9999})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 404)

    def test_post_by_category_view(self):
        """Test de la vista de posts por categoría"""
        url = reverse('posts:posts_by_category', kwargs={'categoria_id': self.categoria.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, self.post.titulo)
        self.assertContains(response, self.categoria.nombre)
        self.assertEqual(response.context['categoria'], self.categoria)

    def test_post_by_category_view_404(self):
        """Test que la vista por categoría devuelve 404 para categoría inexistente"""
        url = reverse('posts:posts_by_category', kwargs={'categoria_id': 9999})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 404)

    def test_add_comment_authenticated_user(self):
        """Test de agregar comentario con usuario autenticado"""
        self.client.login(username='testuser', password='testpass123')
        
        url = reverse('posts:add_comment', kwargs={'pk': self.post.pk})
        response = self.client.post(url, {
            'contenido': 'Este es un comentario de prueba'
        })
        
        self.assertEqual(response.status_code, 302)  # Redirect después de POST exitoso
        
        # Verificar que el comentario se creó
        comentario = Comentario.objects.filter(post=self.post).first()
        self.assertIsNotNone(comentario)
        self.assertEqual(comentario.contenido, 'Este es un comentario de prueba')
        self.assertEqual(comentario.usuario, self.user)

    def test_add_comment_unauthenticated_user(self):
        """Test de agregar comentario sin autenticación"""
        url = reverse('posts:add_comment', kwargs={'pk': self.post.pk})
        response = self.client.post(url, {
            'contenido': 'Este comentario no debería crearse'
        })
        
        # Debería redirigir al login
        self.assertEqual(response.status_code, 302)
        self.assertIn('/users/login/', response.url)
        
        # Verificar que no se creó el comentario
        comentarios = Comentario.objects.filter(post=self.post)
        self.assertEqual(comentarios.count(), 0)

    def test_add_comment_empty_content(self):
        """Test de agregar comentario con contenido vacío"""
        self.client.login(username='testuser', password='testpass123')
        
        url = reverse('posts:add_comment', kwargs={'pk': self.post.pk})
        response = self.client.post(url, {
            'contenido': ''
        })
        
        # Debería redirigir pero no crear el comentario
        self.assertEqual(response.status_code, 302)
        comentarios = Comentario.objects.filter(post=self.post)
        self.assertEqual(comentarios.count(), 0)

    def test_add_comment_invalid_post(self):
        """Test de agregar comentario a post inexistente"""
        self.client.login(username='testuser', password='testpass123')
        
        url = reverse('posts:add_comment', kwargs={'pk': 9999})
        response = self.client.post(url, {
            'contenido': 'Comentario a post inexistente'
        })
        
        self.assertEqual(response.status_code, 404)


class PostViewsContextTest(TestCase):
    """Tests para verificar el contexto de las vistas"""
    
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.categoria = Categoria.objects.create(nombre="Test Category")
        self.post = Post.objects.create(
            titulo="Test Post",
            contenido="Test content",
            autor=self.user,
            categoria=self.categoria
        )

    def test_post_list_context(self):
        """Test del contexto en la vista de lista"""
        url = reverse('posts:home')
        response = self.client.get(url)
        
        self.assertIn('posts', response.context)
        self.assertEqual(response.context['posts'].count(), 1)

    def test_post_detail_context(self):
        """Test del contexto en la vista de detalle"""
        url = reverse('posts:post_detail', kwargs={'pk': self.post.pk})
        response = self.client.get(url)
        
        self.assertIn('post', response.context)
        self.assertEqual(response.context['post'], self.post)

    def test_post_by_category_context(self):
        """Test del contexto en la vista por categoría"""
        url = reverse('posts:posts_by_category', kwargs={'categoria_id': self.categoria.id})
        response = self.client.get(url)
        
        self.assertIn('posts', response.context)
        self.assertIn('categoria', response.context)
        self.assertEqual(response.context['categoria'], self.categoria)