"""
Tests para la autenticación del dashboard
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from dashboard.models import DashboardPermission, ActivityLog
from dashboard.utils import validate_dashboard_access, check_specific_permission


User = get_user_model()


class DashboardAuthenticationTestCase(APITestCase):
    """Test cases para autenticación del dashboard"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Crear usuarios de prueba
        self.superuser = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass123',
            is_superuser=True
        )
        
        self.staff_user = User.objects.create_user(
            username='staff',
            email='staff@test.com',
            password='testpass123'
        )
        
        self.regular_user = User.objects.create_user(
            username='user',
            email='user@test.com',
            password='testpass123'
        )
        
        # Configurar permisos de dashboard
        self.staff_permission = DashboardPermission.objects.get(user=self.staff_user)
        self.staff_permission.can_manage_posts = True
        self.staff_permission.can_view_stats = True
        self.staff_permission.save()
        
        # URLs
        self.login_url = reverse('dashboard:login')
        self.refresh_url = reverse('dashboard:token_refresh')
        self.logout_url = reverse('dashboard:logout')
        self.profile_url = reverse('dashboard:profile')
        self.check_permission_url = reverse('dashboard:check_permission')
    
    def test_dashboard_login_success(self):
        """Test login exitoso al dashboard"""
        data = {
            'username': 'admin',
            'password': 'testpass123'
        }
        
        response = self.client.post(self.login_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('access', response.data['data'])
        self.assertIn('refresh', response.data['data'])
        self.assertIn('user', response.data['data'])
        self.assertEqual(response.data['data']['user']['username'], 'admin')
    
    def test_dashboard_login_invalid_credentials(self):
        """Test login con credenciales inválidas"""
        data = {
            'username': 'admin',
            'password': 'wrongpassword'
        }
        
        response = self.client.post(self.login_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response.data['success'])
        self.assertEqual(response.data['message'], 'Credenciales inválidas')
    
    def test_dashboard_login_no_permissions(self):
        """Test login de usuario sin permisos de dashboard"""
        # Remover todos los permisos del usuario regular
        regular_permission = DashboardPermission.objects.get(user=self.regular_user)
        regular_permission.can_view_stats = False
        regular_permission.save()
        
        data = {
            'username': 'user',
            'password': 'testpass123'
        }
        
        response = self.client.post(self.login_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(response.data['success'])
        self.assertIn('permisos', response.data['message'].lower())
    
    def test_dashboard_login_inactive_user(self):
        """Test login de usuario inactivo"""
        self.staff_user.is_active = False
        self.staff_user.save()
        
        data = {
            'username': 'staff',
            'password': 'testpass123'
        }
        
        response = self.client.post(self.login_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response.data['success'])
        self.assertEqual(response.data['message'], 'Usuario desactivado')
    
    def test_token_refresh_success(self):
        """Test refresh de token exitoso"""
        # Primero hacer login
        refresh = RefreshToken.for_user(self.superuser)
        
        data = {'refresh': str(refresh)}
        response = self.client.post(self.refresh_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('access', response.data['data'])
    
    def test_token_refresh_invalid_token(self):
        """Test refresh con token inválido"""
        data = {'refresh': 'invalid_token'}
        response = self.client.post(self.refresh_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response.data['success'])
    
    def test_token_refresh_missing_token(self):
        """Test refresh sin token"""
        response = self.client.post(self.refresh_url, {})
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
    
    def test_logout_success(self):
        """Test logout exitoso"""
        # Autenticar usuario
        refresh = RefreshToken.for_user(self.superuser)
        self.client.force_authenticate(user=self.superuser)
        
        data = {'refresh': str(refresh)}
        response = self.client.post(self.logout_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['message'], 'Logout exitoso')
    
    def test_logout_without_authentication(self):
        """Test logout sin autenticación"""
        response = self.client.post(self.logout_url, {})
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_get_profile_success(self):
        """Test obtener perfil exitoso"""
        self.client.force_authenticate(user=self.staff_user)
        
        response = self.client.get(self.profile_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['username'], 'staff')
        self.assertIn('permissions', response.data['data'])
        self.assertIn('stats', response.data['data'])
    
    def test_update_profile_success(self):
        """Test actualizar perfil exitoso"""
        self.client.force_authenticate(user=self.staff_user)
        
        data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'email': 'john.doe@test.com'
        }
        
        response = self.client.patch(self.profile_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        # Verificar que se actualizó
        self.staff_user.refresh_from_db()
        self.assertEqual(self.staff_user.first_name, 'John')
        self.assertEqual(self.staff_user.last_name, 'Doe')
        self.assertEqual(self.staff_user.email, 'john.doe@test.com')
    
    def test_check_permission_success(self):
        """Test verificación de permisos exitosa"""
        self.client.force_authenticate(user=self.staff_user)
        
        data = {'permission': 'manage_posts'}
        response = self.client.post(self.check_permission_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertTrue(response.data['data']['has_permission'])
        self.assertEqual(response.data['data']['permission_type'], 'manage_posts')
    
    def test_check_permission_invalid_type(self):
        """Test verificación de permiso inválido"""
        self.client.force_authenticate(user=self.staff_user)
        
        data = {'permission': 'invalid_permission'}
        response = self.client.post(self.check_permission_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
    
    def test_activity_logging(self):
        """Test que las actividades se registren correctamente"""
        initial_count = ActivityLog.objects.count()
        
        # Hacer login
        data = {
            'username': 'admin',
            'password': 'testpass123'
        }
        self.client.post(self.login_url, data)
        
        # Verificar que se registró la actividad
        self.assertEqual(ActivityLog.objects.count(), initial_count + 1)
        
        latest_log = ActivityLog.objects.latest('timestamp')
        self.assertEqual(latest_log.user, self.superuser)
        self.assertEqual(latest_log.action, 'login')


class DashboardUtilsTestCase(TestCase):
    """Test cases para utilidades del dashboard"""
    
    def setUp(self):
        self.superuser = User.objects.create_user(
            username='admin',
            password='testpass123',
            is_superuser=True
        )
        
        self.staff_user = User.objects.create_user(
            username='staff',
            password='testpass123'
        )
        
        self.regular_user = User.objects.create_user(
            username='user',
            password='testpass123'
        )
        
        # Configurar permisos
        staff_permission = DashboardPermission.objects.get(user=self.staff_user)
        staff_permission.can_manage_posts = True
        staff_permission.save()
    
    def test_validate_dashboard_access_superuser(self):
        """Test validación de acceso para superusuario"""
        has_access, reason = validate_dashboard_access(self.superuser)
        
        self.assertTrue(has_access)
        self.assertEqual(reason, "Superusuario")
    
    def test_validate_dashboard_access_staff(self):
        """Test validación de acceso para usuario con permisos"""
        has_access, reason = validate_dashboard_access(self.staff_user)
        
        self.assertTrue(has_access)
        self.assertEqual(reason, "Usuario con permisos de dashboard")
    
    def test_validate_dashboard_access_no_permissions(self):
        """Test validación de acceso para usuario sin permisos"""
        # Remover permisos
        regular_permission = DashboardPermission.objects.get(user=self.regular_user)
        regular_permission.can_view_stats = False
        regular_permission.save()
        
        has_access, reason = validate_dashboard_access(self.regular_user)
        
        self.assertFalse(has_access)
        self.assertEqual(reason, "Sin permisos de dashboard")
    
    def test_check_specific_permission(self):
        """Test verificación de permiso específico"""
        # Superusuario debe tener todos los permisos
        self.assertTrue(check_specific_permission(self.superuser, 'manage_posts'))
        self.assertTrue(check_specific_permission(self.superuser, 'manage_users'))
        
        # Usuario con permisos específicos
        self.assertTrue(check_specific_permission(self.staff_user, 'manage_posts'))
        self.assertFalse(check_specific_permission(self.staff_user, 'manage_users'))
        
        # Usuario sin permisos
        regular_permission = DashboardPermission.objects.get(user=self.regular_user)
        regular_permission.can_view_stats = False
        regular_permission.save()
        
        self.assertFalse(check_specific_permission(self.regular_user, 'manage_posts'))


if __name__ == '__main__':
    import django
    from django.conf import settings
    from django.test.utils import get_runner
    
    django.setup()
    TestRunner = get_runner(settings)
    test_runner = TestRunner()
    failures = test_runner.run_tests(["dashboard.test_authentication"])