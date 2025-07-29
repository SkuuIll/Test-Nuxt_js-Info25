from django.test import TestCase
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from .models import DashboardPermission, ActivityLog


class DashboardAuthenticationTestCase(APITestCase):
    def setUp(self):
        # Usuario con permisos de dashboard
        self.dashboard_user = User.objects.create_user(
            username='dashuser',
            email='dash@example.com',
            password='testpass123'
        )
        self.dashboard_user.dashboard_permission.can_view_stats = True
        self.dashboard_user.dashboard_permission.save()
        
        # Usuario sin permisos de dashboard
        self.regular_user = User.objects.create_user(
            username='regular',
            email='regular@example.com',
            password='testpass123'
        )
        self.regular_user.dashboard_permission.can_view_stats = False
        self.regular_user.dashboard_permission.save()
        
        # Superusuario
        self.superuser = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='adminpass123'
        )
    
    def test_dashboard_login_success(self):
        """Test login exitoso con permisos de dashboard"""
        url = reverse('dashboard:login')
        data = {
            'username': 'dashuser',
            'password': 'testpass123'
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['error'])
        self.assertIn('access', response.data['data'])
        self.assertIn('refresh', response.data['data'])
        self.assertIn('user', response.data['data'])
        
        # Verificar que se registró la actividad
        self.assertTrue(
            ActivityLog.objects.filter(
                user=self.dashboard_user,
                action='login'
            ).exists()
        )
    
    def test_dashboard_login_no_permissions(self):
        """Test login fallido sin permisos de dashboard"""
        url = reverse('dashboard:login')
        data = {
            'username': 'regular',
            'password': 'testpass123'
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(response.data['error'])
        self.assertIn('permisos', response.data['message'])
    
    def test_dashboard_login_invalid_credentials(self):
        """Test login con credenciales inválidas"""
        url = reverse('dashboard:login')
        data = {
            'username': 'dashuser',
            'password': 'wrongpass'
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertTrue(response.data['error'])
        self.assertIn('inválidas', response.data['message'])
    
    def test_superuser_dashboard_access(self):
        """Test que superusuario siempre tiene acceso"""
        url = reverse('dashboard:login')
        data = {
            'username': 'admin',
            'password': 'adminpass123'
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['error'])
    
    def test_dashboard_logout(self):
        """Test logout del dashboard"""
        # Primero hacer login
        refresh = RefreshToken.for_user(self.dashboard_user)
        access_token = refresh.access_token
        
        # Configurar autenticación
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        # Hacer logout
        url = reverse('dashboard:logout')
        data = {'refresh': str(refresh)}
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['error'])
        
        # Verificar que se registró la actividad
        self.assertTrue(
            ActivityLog.objects.filter(
                user=self.dashboard_user,
                action='logout'
            ).exists()
        )
    
    def test_dashboard_profile(self):
        """Test obtener perfil de usuario del dashboard"""
        # Autenticar usuario
        refresh = RefreshToken.for_user(self.dashboard_user)
        access_token = refresh.access_token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        url = reverse('dashboard:profile')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['error'])
        self.assertEqual(response.data['data']['username'], 'dashuser')
        self.assertIn('permissions', response.data['data'])
    
    def test_check_permission_endpoint(self):
        """Test endpoint de verificación de permisos"""
        # Autenticar usuario
        refresh = RefreshToken.for_user(self.dashboard_user)
        access_token = refresh.access_token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        url = reverse('dashboard:check_permission')
        data = {'permission': 'view_stats'}
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['error'])
        self.assertTrue(response.data['has_permission'])
        
        # Test permiso que no tiene
        data = {'permission': 'manage_posts'}
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['has_permission'])
    
    def test_token_refresh(self):
        """Test refresh de token JWT"""
        refresh = RefreshToken.for_user(self.dashboard_user)
        
        url = reverse('dashboard:token_refresh')
        data = {'refresh': str(refresh)}
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)


class DashboardPermissionsTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_dashboard_permission_creation(self):
        """Test que se crean permisos automáticamente"""
        self.assertTrue(hasattr(self.user, 'dashboard_permission'))
        self.assertIsInstance(self.user.dashboard_permission, DashboardPermission)
    
    def test_default_permissions(self):
        """Test permisos por defecto"""
        perm = self.user.dashboard_permission
        self.assertFalse(perm.can_manage_posts)
        self.assertFalse(perm.can_manage_users)
        self.assertFalse(perm.can_manage_comments)
        self.assertTrue(perm.can_view_stats)
    
    def test_permission_update(self):
        """Test actualización de permisos"""
        perm = self.user.dashboard_permission
        perm.can_manage_posts = True
        perm.save()
        
        # Recargar desde DB
        perm.refresh_from_db()
        self.assertTrue(perm.can_manage_posts)