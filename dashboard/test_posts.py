from django.test import TestCase
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from posts.models import Post, Categoria, Comentario
from .models import DashboardPermission, ActivityLog


class DashboardPostsTestCase(APITestCase):
    def setUp(self):
        # Usuario con permisos para gestionar posts
        self.posts_manager = User.objects.create_user(
            username='postmanager',
            email='posts@example.com',
            password='testpass123'
        )
        self.posts_manager.dashboard_permission.can_manage_posts = True
        self.posts_manager.dashboard_permission.save()
        
        # Usuario sin permisos
        self.regular_user = User.objects.create_user(
            username='regular',
            email='regular@example.com',
            password='testpass123'
        )
        self.regular_user.dashboard_permission.can_manage_posts = False
        self.regular_user.dashboard_permission.save()
        
        # Crear datos de prueba
        self.category = Categoria.objects.create(
            nombre='Test Category',
            descripcion='Test description'
        )
        
        self.post = Post.objects.create(
            titulo='Test Post',
            contenido='Test content for the post',
            autor=self.posts_manager,
            categoria=self.category,
            status='published'
        )
        
        self.comment = Comentario.objects.create(
            post=self.post,
            usuario=self.regular_user,
            contenido='Test comment',
            approved=True
        )
    
    def authenticate_user(self, user):
        """Helper para autenticar usuario"""
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
    
    def test_list_posts_success(self):
        """Test listar posts exitosamente"""
        self.authenticate_user(self.posts_manager)
        
        url = reverse('dashboard:posts-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data['results']), 0)
    
    def test_list_posts_no_permission(self):
        """Test acceso denegado sin permisos"""
        self.authenticate_user(self.regular_user)
        
        url = reverse('dashboard:posts-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_create_post_success(self):
        """Test crear post exitosamente"""
        self.authenticate_user(self.posts_manager)
        
        url = reverse('dashboard:posts-list')
        data = {
            'titulo': 'New Test Post',
            'contenido': 'This is a new test post content',
            'status': 'draft',
            'categoria': self.category.id,
            'featured': False
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['titulo'], 'New Test Post')
        
        # Verificar que el post se creó en la base de datos
        created_post = Post.objects.get(titulo='New Test Post')
        self.assertEqual(created_post.autor, self.posts_manager)
        
        # Verificar que se registró la actividad
        self.assertTrue(
            ActivityLog.objects.filter(
                user=self.posts_manager,
                action='created_post'
            ).exists()
        )
    
    def test_create_post_validation_error(self):
        """Test error de validación al crear post"""
        self.authenticate_user(self.posts_manager)
        
        url = reverse('dashboard:posts-list')
        data = {
            'titulo': 'Ab',  # Muy corto
            'contenido': 'Short',  # Muy corto
            'status': 'invalid_status'  # Estado inválido
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_update_post_success(self):
        """Test actualizar post exitosamente"""
        self.authenticate_user(self.posts_manager)
        
        url = reverse('dashboard:posts-detail', kwargs={'pk': self.post.pk})
        data = {
            'titulo': 'Updated Test Post',
            'contenido': 'Updated content for the test post',
            'status': 'published',
            'categoria': self.category.id
        }
        
        response = self.client.put(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['titulo'], 'Updated Test Post')
        
        # Verificar que se registró la actividad
        self.assertTrue(
            ActivityLog.objects.filter(
                user=self.posts_manager,
                action='updated_post'
            ).exists()
        )
    
    def test_delete_post_success(self):
        """Test eliminar post exitosamente"""
        self.authenticate_user(self.posts_manager)
        
        url = reverse('dashboard:posts-detail', kwargs={'pk': self.post.pk})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Post.objects.filter(pk=self.post.pk).exists())
        
        # Verificar que se registró la actividad
        self.assertTrue(
            ActivityLog.objects.filter(
                user=self.posts_manager,
                action='deleted_post'
            ).exists()
        )
    
    def test_bulk_update_status_success(self):
        """Test actualización masiva de estado"""
        # Crear posts adicionales
        post2 = Post.objects.create(
            titulo='Test Post 2',
            contenido='Test content 2',
            autor=self.posts_manager,
            categoria=self.category,
            status='draft'
        )
        
        self.authenticate_user(self.posts_manager)
        
        url = reverse('dashboard:posts-bulk-update-status')
        data = {
            'post_ids': [self.post.id, post2.id],
            'status': 'published'
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(response.data['updated_count'], 0)
        
        # Verificar que los posts se actualizaron
        self.post.refresh_from_db()
        post2.refresh_from_db()
        self.assertEqual(self.post.status, 'published')
        self.assertEqual(post2.status, 'published')
    
    def test_bulk_delete_success(self):
        """Test eliminación masiva de posts"""
        # Crear posts adicionales
        post2 = Post.objects.create(
            titulo='Test Post 2',
            contenido='Test content 2',
            autor=self.posts_manager,
            categoria=self.category,
            status='draft'
        )
        
        self.authenticate_user(self.posts_manager)
        
        url = reverse('dashboard:posts-bulk-delete')
        data = {
            'post_ids': [self.post.id, post2.id]
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(response.data['deleted_count'], 0)
        
        # Verificar que al menos algunos posts se eliminaron
        remaining_posts = Post.objects.filter(id__in=[self.post.id, post2.id]).count()
        self.assertLess(remaining_posts, 2)
    
    def test_toggle_featured_success(self):
        """Test alternar estado destacado"""
        self.authenticate_user(self.posts_manager)
        
        url = reverse('dashboard:posts-toggle-featured', kwargs={'pk': self.post.pk})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['featured'])
        
        # Verificar que el post se actualizó
        self.post.refresh_from_db()
        self.assertTrue(self.post.featured)
    
    def test_get_post_comments(self):
        """Test obtener comentarios de un post"""
        self.authenticate_user(self.posts_manager)
        
        url = reverse('dashboard:posts-comments', kwargs={'pk': self.post.pk})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 1)
        self.assertEqual(response.data['data'][0]['contenido'], 'Test comment')
    
    def test_filter_posts_by_status(self):
        """Test filtrar posts por estado"""
        self.authenticate_user(self.posts_manager)
        
        url = reverse('dashboard:posts-list')
        response = self.client.get(url, {'status': 'published'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for post in response.data['results']:
            self.assertEqual(post['status'], 'published')
    
    def test_search_posts(self):
        """Test buscar posts por título"""
        self.authenticate_user(self.posts_manager)
        
        url = reverse('dashboard:posts-list')
        response = self.client.get(url, {'search': 'Test'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data['results']), 0)


class DashboardCategoriesTestCase(APITestCase):
    def setUp(self):
        # Usuario con permisos para gestionar posts
        self.posts_manager = User.objects.create_user(
            username='postmanager',
            email='posts@example.com',
            password='testpass123'
        )
        self.posts_manager.dashboard_permission.can_manage_posts = True
        self.posts_manager.dashboard_permission.save()
        
        # Crear categoría de prueba
        self.category = Categoria.objects.create(
            nombre='Test Category',
            descripcion='Test description'
        )
    
    def authenticate_user(self, user):
        """Helper para autenticar usuario"""
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
    
    def test_list_categories_success(self):
        """Test listar categorías exitosamente"""
        self.authenticate_user(self.posts_manager)
        
        url = reverse('dashboard:categories-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data['results']), 0)
    
    def test_create_category_success(self):
        """Test crear categoría exitosamente"""
        self.authenticate_user(self.posts_manager)
        
        url = reverse('dashboard:categories-list')
        data = {
            'nombre': 'New Category',
            'descripcion': 'New category description'
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['nombre'], 'New Category')
        
        # Verificar que se registró la actividad
        self.assertTrue(
            ActivityLog.objects.filter(
                user=self.posts_manager,
                action='created_category'
            ).exists()
        )
    
    def test_update_category_success(self):
        """Test actualizar categoría exitosamente"""
        self.authenticate_user(self.posts_manager)
        
        url = reverse('dashboard:categories-detail', kwargs={'pk': self.category.pk})
        data = {
            'nombre': 'Updated Category',
            'descripcion': 'Updated description'
        }
        
        response = self.client.put(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['nombre'], 'Updated Category')
    
    def test_delete_category_success(self):
        """Test eliminar categoría exitosamente"""
        self.authenticate_user(self.posts_manager)
        
        url = reverse('dashboard:categories-detail', kwargs={'pk': self.category.pk})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Categoria.objects.filter(pk=self.category.pk).exists())
    
    def test_search_categories(self):
        """Test buscar categorías por nombre"""
        self.authenticate_user(self.posts_manager)
        
        url = reverse('dashboard:categories-list')
        response = self.client.get(url, {'search': 'Test'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data['results']), 0)