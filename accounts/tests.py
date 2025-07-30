from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from .models import (
    UserProfile, Role, Permission, RolePermission, 
    UserRole, SecurityAuditLog, PasswordResetToken
)

User = get_user_model()


class UserModelTest(TestCase):
    """Test the extended User model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_user_creation(self):
        """Test user creation with extended fields"""
        self.assertEqual(self.user.username, 'testuser')
        self.assertEqual(self.user.email, 'test@example.com')
        self.assertFalse(self.user.is_email_verified)
        self.assertEqual(self.user.failed_login_attempts, 0)
        self.assertIsNone(self.user.locked_until)
    
    def test_email_verification_token_generation(self):
        """Test email verification token generation"""
        token = self.user.generate_verification_token()
        self.assertIsNotNone(token)
        self.assertEqual(self.user.email_verification_token, token)
        self.assertIsNotNone(self.user.email_verification_sent_at)
    
    def test_verification_token_validity(self):
        """Test verification token validity check"""
        # Generate token
        self.user.generate_verification_token()
        self.assertTrue(self.user.is_verification_token_valid())
        
        # Make token expired
        self.user.email_verification_sent_at = timezone.now() - timedelta(hours=25)
        self.user.save()
        self.assertFalse(self.user.is_verification_token_valid())
    
    def test_account_locking(self):
        """Test account locking functionality"""
        self.assertFalse(self.user.is_account_locked())
        
        # Lock account
        self.user.lock_account(duration_minutes=30)
        self.assertTrue(self.user.is_account_locked())
        
        # Unlock account
        self.user.unlock_account()
        self.assertFalse(self.user.is_account_locked())
        self.assertEqual(self.user.failed_login_attempts, 0)
    
    def test_failed_login_attempts(self):
        """Test failed login attempts tracking"""
        # Increment failed attempts
        for i in range(4):
            self.user.increment_failed_attempts()
            self.assertEqual(self.user.failed_login_attempts, i + 1)
            self.assertFalse(self.user.is_account_locked())
        
        # Fifth attempt should lock account
        self.user.increment_failed_attempts()
        self.assertEqual(self.user.failed_login_attempts, 5)
        self.assertTrue(self.user.is_account_locked())


class UserProfileTest(TestCase):
    """Test UserProfile model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_profile_creation(self):
        """Test that profile is created automatically"""
        self.assertTrue(hasattr(self.user, 'profile'))
        self.assertIsInstance(self.user.profile, UserProfile)
    
    def test_profile_privacy_settings(self):
        """Test profile privacy settings"""
        profile = self.user.profile
        profile.show_email = True
        profile.show_location = False
        profile.location = 'Test City'
        profile.save()
        
        public_data = profile.get_public_data()
        self.assertIn('email', public_data)
        self.assertNotIn('location', public_data)
    
    def test_avatar_url(self):
        """Test avatar URL generation"""
        profile = self.user.profile
        avatar_url = profile.get_avatar_url()
        self.assertEqual(avatar_url, '/static/images/default-avatar.png')


class RolePermissionTest(TestCase):
    """Test Role and Permission models"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.permission = Permission.objects.create(
            codename='test.permission',
            name='Test Permission',
            category='test',
            description='A test permission'
        )
        
        self.role = Role.objects.create(
            name='Test Role',
            description='A test role'
        )
    
    def test_role_creation(self):
        """Test role creation"""
        self.assertEqual(self.role.name, 'Test Role')
        self.assertTrue(self.role.is_active)
    
    def test_permission_creation(self):
        """Test permission creation"""
        self.assertEqual(self.permission.codename, 'test.permission')
        self.assertEqual(self.permission.category, 'test')
    
    def test_role_permission_assignment(self):
        """Test assigning permissions to roles"""
        role_permission = RolePermission.objects.create(
            role=self.role,
            permission=self.permission,
            granted=True
        )
        
        self.assertTrue(role_permission.granted)
        self.assertEqual(role_permission.role, self.role)
        self.assertEqual(role_permission.permission, self.permission)
    
    def test_user_role_assignment(self):
        """Test assigning roles to users"""
        user_role = UserRole.objects.create(
            user=self.user,
            role=self.role
        )
        
        self.assertEqual(user_role.user, self.user)
        self.assertEqual(user_role.role, self.role)
        self.assertTrue(user_role.is_active)


class SecurityAuditLogTest(TestCase):
    """Test SecurityAuditLog model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_audit_log_creation(self):
        """Test security audit log creation"""
        log = SecurityAuditLog.objects.create(
            user=self.user,
            action='login',
            ip_address='127.0.0.1',
            user_agent='Test Browser',
            success=True,
            details={'test': 'data'}
        )
        
        self.assertEqual(log.user, self.user)
        self.assertEqual(log.action, 'login')
        self.assertTrue(log.success)
        self.assertEqual(log.details['test'], 'data')


class PasswordResetTokenTest(TestCase):
    """Test PasswordResetToken model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_token_generation(self):
        """Test password reset token generation"""
        token = PasswordResetToken.generate_token(self.user)
        
        self.assertEqual(token.user, self.user)
        self.assertFalse(token.is_used)
        self.assertTrue(token.is_valid())
    
    def test_token_expiration(self):
        """Test token expiration"""
        token = PasswordResetToken.generate_token(self.user)
        
        # Make token expired
        token.created_at = timezone.now() - timedelta(hours=2)
        token.save()
        
        self.assertFalse(token.is_valid())
    
    def test_token_usage(self):
        """Test marking token as used"""
        token = PasswordResetToken.generate_token(self.user)
        
        self.assertTrue(token.is_valid())
        token.mark_as_used()
        self.assertFalse(token.is_valid())
        self.assertTrue(token.is_used)
    
    def test_multiple_tokens_invalidation(self):
        """Test that generating new token invalidates old ones"""
        token1 = PasswordResetToken.generate_token(self.user)
        token2 = PasswordResetToken.generate_token(self.user)
        
        # Refresh from database
        token1.refresh_from_db()
        
        self.assertTrue(token1.is_used)
        self.assertFalse(token2.is_used)
        self.assertTrue(token2.is_valid())