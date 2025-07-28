from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User
from posts.models import Categoria, Post, Comentario


class UserWorkflowIntegrationTest(TestCase):
    """Tests de integración para flujos completos de usuario"""
    
    def setUp(self):
        self.client = Client()
        self.categoria = Categoria.objects.create(
            nombre="Tecnología",
            descripcion="Noticias de tecnología"
        )
        self.author = User.objects.create_user(
            username='author',
            email='author@example.com',
            password='authorpass123'
        )
        self.post = Post.objects.create(
            titulo="Post de Prueba",
            contenido="Este es un post para probar el flujo completo",
            autor=self.author,
            categoria=self.categoria
        )

    def test_complete_user_registration_to_comment_flow(self):
        """Test del flujo completo: registro → login → comentar → logout"""
        
        # 1. Registro de usuario
        register_url = reverse('users:register')
        register_response = self.client.post(register_url, {
            'username': 'newuser',
            'password1': 'complexpass123',
            'password2': 'complexpass123'
        })
        self.assertEqual(register_response.status_code, 302)
        
        # Verificar que el usuario se creó
        user = User.objects.get(username='newuser')
        self.assertIsNotNone(user)
        
        # 2. Login del usuario
        login_url = reverse('users:login')
        login_response = self.client.post(login_url, {
            'username': 'newuser',
            'password': 'complexpass123'
        })
        self.assertEqual(login_response.status_code, 302)
        
        # 3. Ver el post
        post_detail_url = reverse('posts:post_detail', kwargs={'pk': self.post.pk})
        post_response = self.client.get(post_detail_url)
        self.assertEqual(post_response.status_code, 200)
        self.assertContains(post_response, self.post.titulo)
        
        # 4. Agregar comentario
        comment_url = reverse('posts:add_comment', kwargs={'pk': self.post.pk})
        comment_response = self.client.post(comment_url, {
            'contenido': 'Este es mi primer comentario'
        })
        self.assertEqual(comment_response.status_code, 302)
        
        # Verificar que el comentario se creó
        comentario = Comentario.objects.filter(post=self.post, usuario=user).first()
        self.assertIsNotNone(comentario)
        self.assertEqual(comentario.contenido, 'Este es mi primer comentario')
        
        # 5. Verificar que el comentario aparece en el post
        post_response_after_comment = self.client.get(post_detail_url)
        self.assertContains(post_response_after_comment, 'Este es mi primer comentario')
        self.assertContains(post_response_after_comment, 'newuser')
        
        # 6. Logout
        logout_url = reverse('users:logout')
        logout_response = self.client.get(logout_url)
        self.assertEqual(logout_response.status_code, 302)

    def test_anonymous_user_cannot_comment(self):
        """Test que usuario anónimo no puede comentar"""
        
        # Intentar comentar sin estar autenticado
        comment_url = reverse('posts:add_comment', kwargs={'pk': self.post.pk})
        comment_response = self.client.post(comment_url, {
            'contenido': 'Comentario anónimo'
        })
        
        # Debería redirigir al login
        self.assertEqual(comment_response.status_code, 302)
        self.assertIn('/users/login/', comment_response.url)
        
        # Verificar que no se creó el comentario
        comentarios = Comentario.objects.filter(post=self.post)
        self.assertEqual(comentarios.count(), 0)

    def test_category_filtering_workflow(self):
        """Test del flujo de filtrado por categorías"""
        
        # Crear otra categoría y post
        categoria2 = Categoria.objects.create(
            nombre="Deportes",
            descripcion="Noticias deportivas"
        )
        post2 = Post.objects.create(
            titulo="Post de Deportes",
            contenido="Contenido deportivo",
            autor=self.author,
            categoria=categoria2
        )
        
        # 1. Ver todos los posts
        home_url = reverse('posts:home')
        home_response = self.client.get(home_url)
        self.assertEqual(home_response.status_code, 200)
        self.assertContains(home_response, self.post.titulo)
        self.assertContains(home_response, post2.titulo)
        
        # 2. Filtrar por categoría Tecnología
        tech_category_url = reverse('posts:posts_by_category', 
                                  kwargs={'categoria_id': self.categoria.id})
        tech_response = self.client.get(tech_category_url)
        self.assertEqual(tech_response.status_code, 200)
        self.assertContains(tech_response, self.post.titulo)
        self.assertNotContains(tech_response, post2.titulo)
        
        # 3. Filtrar por categoría Deportes
        sports_category_url = reverse('posts:posts_by_category', 
                                    kwargs={'categoria_id': categoria2.id})
        sports_response = self.client.get(sports_category_url)
        self.assertEqual(sports_response.status_code, 200)
        self.assertContains(sports_response, post2.titulo)
        self.assertNotContains(sports_response, self.post.titulo)

    def test_password_reset_workflow(self):
        """Test del flujo completo de password reset"""
        
        # Crear usuario
        user = User.objects.create_user(
            username='resetuser',
            email='reset@example.com',
            password='oldpass123'
        )
        
        # 1. Solicitar password reset
        reset_url = reverse('users:password_reset')
        reset_response = self.client.post(reset_url, {
            'email': 'reset@example.com'
        })
        self.assertEqual(reset_response.status_code, 302)
        
        # 2. Verificar redirección a página de confirmación
        done_url = reverse('users:password_reset_done')
        self.assertRedirects(reset_response, done_url)
        
        # 3. Verificar página de confirmación
        done_response = self.client.get(done_url)
        self.assertEqual(done_response.status_code, 200)
        self.assertContains(done_response, 'Correo enviado')

    def test_multiple_comments_on_post(self):
        """Test de múltiples comentarios en un post"""
        
        # Crear usuarios
        user1 = User.objects.create_user(
            username='user1',
            password='pass123'
        )
        user2 = User.objects.create_user(
            username='user2',
            password='pass123'
        )
        
        # Usuario 1 comenta
        self.client.login(username='user1', password='pass123')
        comment_url = reverse('posts:add_comment', kwargs={'pk': self.post.pk})
        self.client.post(comment_url, {
            'contenido': 'Primer comentario'
        })
        
        # Usuario 2 comenta
        self.client.login(username='user2', password='pass123')
        self.client.post(comment_url, {
            'contenido': 'Segundo comentario'
        })
        
        # Verificar que ambos comentarios aparecen
        post_detail_url = reverse('posts:post_detail', kwargs={'pk': self.post.pk})
        response = self.client.get(post_detail_url)
        
        self.assertContains(response, 'Primer comentario')
        self.assertContains(response, 'Segundo comentario')
        self.assertContains(response, 'user1')
        self.assertContains(response, 'user2')
        
        # Verificar el conteo de comentarios
        comentarios_count = Comentario.objects.filter(post=self.post).count()
        self.assertEqual(comentarios_count, 2)


class AdminIntegrationTest(TestCase):
    """Tests de integración para funcionalidad de admin"""
    
    def setUp(self):
        self.admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='adminpass123'
        )
        self.client = Client()

    def test_admin_can_create_category_and_post(self):
        """Test que admin puede crear categoría y post desde admin"""
        
        # Login como admin
        self.client.login(username='admin', password='adminpass123')
        
        # Acceder al admin
        admin_url = '/admin/'
        admin_response = self.client.get(admin_url)
        self.assertEqual(admin_response.status_code, 200)
        
        # Verificar que los modelos están registrados
        self.assertContains(admin_response, 'Categorias')
        self.assertContains(admin_response, 'Posts')
        self.assertContains(admin_response, 'Comentarios')