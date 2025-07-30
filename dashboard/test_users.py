from django.test import TestCase
from django.contrib.auth import get_user_model

User = get_user_model()
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from posts.models import Post, Categoria
from .models import DashboardPermission, ActivityLog


class DashboardUsersTestCase(APITestCase):
    def setUp(self):
        # Usuario con permisos para gestionar usuarios
        self.user_manager = User.objects.create_user(
            username='usermanager',
            email='users@example.com',
            password='testpass123'
        )
        self.user_manager.dashboard_permission.can_manage_users = True
        self.user_manager.dashboard_permission.save()
        
        # Usuario sin permisos
        self.regular_user = User.objects.create_user(
            username='regular',
            email='regular@example.com',
            password='testpass123'
        )
        self.regular_user.dashboard_permission.can_manage_users = False
        self.regular_user.dashboard_permission.save()
        
        # Usuario de prueba para gestionar
        self.test_user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        
        # Crear algunos datos adicionales
        self.category = Categoria.objects.create(
            nombre='Test Category',
            descripcion='Test description'
        )
        
        self.post = Post.objects.create(
            titulo='Test Post',
            contenido='Test content',
            autor=self.test_user,
            categoria=self.category,
            status='published'
        )
    
    def authenticate_user(self, user):
        """Helper para autenticar usuario"""
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
    
    def test_list_users_success(self):
        """Test listar usuarios exitosamente"""
        self.authenticate_user(self.user_manager)
        
        url = reverse('dashboard:users-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data['results']), 0)
    
    def test_list_users_no_permission(self):
        """Test acceso denegado sin permisos"""
        self.authenticate_user(self.regular_user)
        
        url = reverse('dashboard:users-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_create_user_success(self):
        """Test crear usuario exitosamente"""
        self.authenticate_user(self.user_manager)
        
        url = reverse('dashboard:users-list')
        data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'first_name': 'New',
            'last_name': 'User',
            'password': 'newpass123',
            'confirm_password': 'newpass123',
            'is_active': True
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['username'], 'newuser')
        
        # Verificar que el usuario se creó en la base de datos
        created_user = User.objects.get(username='newuser')
        self.assertEqual(created_user.email, 'newuser@example.com')
        
        # Verificar que se registró la actividad
        self.assertTrue(
            ActivityLog.objects.filter(
                user=self.user_manager,
                action='created_user'
            ).exists()
        )
    
    def test_create_user_validation_error(self):
        """Test error de validación al crear usuario"""
        self.authenticate_user(self.user_manager)
        
        url = reverse('dashboard:users-list')
        data = {
            'username': 'ab',  # Muy corto
            'email': 'invalid-email',  # Email inválido
            'password': '123',  # Muy corta
            'confirm_password': '456'  # No coincide
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_update_user_success(self):
        """Test actualizar usuario exitosamente"""
        self.authenticate_user(self.user_manager)
        
        url = reverse('dashboard:users-detail', kwargs={'pk': self.test_user.pk})
        data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'first_name': 'Updated',
            'last_name': 'Name',
            'is_active': True
        }
        
        response = self.client.put(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['first_name'], 'Updated')
        
        # Verificar que se registró la actividad
        self.assertTrue(
            ActivityLog.objects.filter(
                user=self.user_manager,
                action='updated_user'
            ).exists()
        )
    
    def test_deactivate_user_success(self):
        """Test desactivar usuario exitosamente"""
        self.authenticate_user(self.user_manager)
        
        url = reverse('dashboard:users-deactivate', kwargs={'pk': self.test_user.pk})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['error'])
        
        # Verificar que el usuario se desactivó
        self.test_user.refresh_from_db()
        self.assertFalse(self.test_user.is_active)
        
        # Verificar que se registró la actividad
        self.assertTrue(
            ActivityLog.objects.filter(
                user=self.user_manager,
                action='deactivated_user'
            ).exists()
        )
    
    def test_activate_user_success(self):
        """Test activar usuario exitosamente"""
        # Primero desactivar el usuario
        self.test_user.is_active = False
        self.test_user.save()
        
        self.authenticate_user(self.user_manager)
        
        url = reverse('dashboard:users-activate', kwargs={'pk': self.test_user.pk})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['error'])
        
        # Verificar que el usuario se activó
        self.test_user.refresh_from_db()
        self.assertTrue(self.test_user.is_active)
    
    def test_update_permissions_success(self):
        """Test actualizar permisos de usuario"""
        self.authenticate_user(self.user_manager)
        
        url = reverse('dashboard:users-update-permissions', kwargs={'pk': self.test_user.pk})
        data = {
            'permissions': {
                'can_manage_posts': True,
                'can_view_stats': True,
                'can_manage_comments': False,
                'can_manage_users': False
            }
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['error'])
        
        # Verificar que los permisos se actualizaron
        self.test_user.refresh_from_db()
        permission = self.test_user.dashboard_permission
        self.assertTrue(permission.can_manage_posts)
        self.assertTrue(permission.can_view_stats)
        self.assertFalse(permission.can_manage_comments)
        self.assertFalse(permission.can_manage_users)
    
    def test_get_user_activity(self):
        """Test obtener actividad de usuario"""
        # Crear actividad de prueba
        ActivityLog.objects.create(
            user=self.test_user,
            action='created_post',
            target_model='Post',
            target_id=self.post.id,
            description='Test activity'
        )
        
        self.authenticate_user(self.user_manager)
        
        url = reverse('dashboard:users-activity', kwargs={'pk': self.test_user.pk})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['error'])
        self.assertGreater(len(response.data['data']), 0)
    
    def test_get_user_posts(self):
        """Test obtener posts de usuario"""
        self.authenticate_user(self.user_manager)
        
        url = reverse('dashboard:users-posts', kwargs={'pk': self.test_user.pk})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['error'])
        self.assertEqual(len(response.data['data']['posts']), 1)
        self.assertEqual(response.data['data']['posts'][0]['titulo'], 'Test Post')
    
    def test_bulk_activate_users(self):
        """Test activación masiva de usuarios"""
        # Crear usuario adicional desactivado
        user2 = User.objects.create_user(
            username='user2',
            email='user2@example.com',
            password='testpass123',
            is_active=False
        )
        
        self.test_user.is_active = False
        self.test_user.save()
        
        self.authenticate_user(self.user_manager)
        
        url = reverse('dashboard:users-bulk-activate')
        data = {
            'user_ids': [self.test_user.id, user2.id]
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['error'])
        self.assertGreater(response.data['updated_count'], 0)
        
        # Verificar que al menos algunos usuarios se activaron
        self.test_user.refresh_from_db()
        user2.refresh_from_db()
        # Al menos uno debería estar activo
        self.assertTrue(self.test_user.is_active or user2.is_active)
    
    def test_bulk_deactivate_users(self):
        """Test desactivación masiva de usuarios"""
        # Crear usuario adicional
        user2 = User.objects.create_user(
            username='user2',
            email='user2@example.com',
            password='testpass123'
        )
        
        self.authenticate_user(self.user_manager)
        
        url = reverse('dashboard:users-bulk-deactivate')
        data = {
            'user_ids': [self.test_user.id, user2.id]
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['error'])
        self.assertGreater(response.data['updated_count'], 0)
    
    def test_get_users_stats(self):
        """Test obtener estadísticas de usuarios"""
        self.authenticate_user(self.user_manager)
        
        url = reverse('dashboard:users-stats')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['error'])
        
        data = response.data['data']
        self.assertIn('total_users', data)
        self.assertIn('active_users', data)
        self.assertIn('inactive_users', data)
        self.assertIn('staff_users', data)
        self.assertIn('superusers', data)
    
    def test_search_users(self):
        """Test buscar usuarios por nombre"""
        self.authenticate_user(self.user_manager)
        
        url = reverse('dashboard:users-list')
        response = self.client.get(url, {'search': 'test'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data['results']), 0)
    
    def test_filter_users_by_status(self):
        """Test filtrar usuarios por estado activo"""
        self.authenticate_user(self.user_manager)
        
        url = reverse('dashboard:users-list')
        response = self.client.get(url, {'is_active': 'true'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for user in response.data['results']:
            self.assertTrue(user['is_active'])
    
    def test_cannot_deactivate_superuser(self):
        """Test que no se puede desactivar un superusuario"""
        # Crear superusuario
        superuser = User.objects.create_superuser(
            username='superuser',
            email='super@example.com',
            password='superpass123'
        )
        
        self.authenticate_user(self.user_manager)
        
        url = reverse('dashboard:users-deactivate', kwargs={'pk': superuser.pk})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(response.data['error'])
    
    def test_cannot_self_deactivate(self):
        """Test que no se puede auto-desactivar"""
        self.authenticate_user(self.user_manager)
        
        url = reverse('dashboard:users-deactivate', kwargs={'pk': self.user_manager.pk})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(response.data['error'])