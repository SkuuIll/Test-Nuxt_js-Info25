from django.test import TestCase
from django.contrib.auth import get_user_model

User = get_user_model()
from .models import DashboardPermission, ActivityLog
from .utils import log_activity, get_dashboard_stats, create_dashboard_admin_user


class DashboardPermissionTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_dashboard_permission_created_automatically(self):
        """Test que se crea automáticamente un DashboardPermission para nuevos usuarios"""
        self.assertTrue(hasattr(self.user, 'dashboard_permission'))
        self.assertIsInstance(self.user.dashboard_permission, DashboardPermission)
    
    def test_default_permissions(self):
        """Test que los permisos por defecto son correctos"""
        permission = self.user.dashboard_permission
        self.assertFalse(permission.can_manage_posts)
        self.assertFalse(permission.can_manage_users)
        self.assertFalse(permission.can_manage_comments)
        self.assertTrue(permission.can_view_stats)


class ActivityLogTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_log_activity(self):
        """Test que se puede registrar actividad correctamente"""
        log_activity(
            user=self.user,
            action='created_post',
            target_model='Post',
            target_id=1,
            description='Test post created'
        )
        
        log = ActivityLog.objects.get(user=self.user)
        self.assertEqual(log.action, 'created_post')
        self.assertEqual(log.target_model, 'Post')
        self.assertEqual(log.target_id, 1)
        self.assertEqual(log.description, 'Test post created')


class DashboardUtilsTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_create_dashboard_admin_user(self):
        """Test crear usuario administrador del dashboard"""
        admin_user = create_dashboard_admin_user(
            username='admin',
            email='admin@example.com',
            password='adminpass123'
        )
        
        self.assertTrue(admin_user.is_staff)
        permission = admin_user.dashboard_permission
        self.assertTrue(permission.can_manage_posts)
        self.assertTrue(permission.can_manage_users)
        self.assertTrue(permission.can_manage_comments)
        self.assertTrue(permission.can_view_stats)
    
    def test_get_dashboard_stats(self):
        """Test obtener estadísticas del dashboard"""
        stats = get_dashboard_stats()
        
        required_keys = [
            'total_posts', 'total_users', 'total_comments',
            'published_posts', 'draft_posts', 'pending_comments',
            'active_users', 'popular_posts', 'recent_activity',
            'monthly_stats'
        ]
        
        for key in required_keys:
            self.assertIn(key, stats)