from django.test import TestCase
from django.contrib.auth.models import User
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from datetime import timedelta
from posts.models import Post, Categoria, Comentario
from .models import DashboardPermission, ActivityLog
from .utils import get_dashboard_stats, get_growth_stats, calculate_growth_percentage


class DashboardStatsTestCase(APITestCase):
    def setUp(self):
        # Usuario con permisos para ver estadísticas
        self.stats_user = User.objects.create_user(
            username='statsuser',
            email='stats@example.com',
            password='testpass123'
        )
        self.stats_user.dashboard_permission.can_view_stats = True
        self.stats_user.dashboard_permission.save()
        
        # Usuario sin permisos
        self.regular_user = User.objects.create_user(
            username='regular',
            email='regular@example.com',
            password='testpass123'
        )
        self.regular_user.dashboard_permission.can_view_stats = False
        self.regular_user.dashboard_permission.save()
        
        # Crear datos de prueba
        self.category = Categoria.objects.create(
            nombre='Test Category',
            descripcion='Test description'
        )
        
        self.post = Post.objects.create(
            titulo='Test Post',
            contenido='Test content',
            autor=self.stats_user,
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
    
    def test_dashboard_stats_view_success(self):
        """Test obtener estadísticas generales exitosamente"""
        self.authenticate_user(self.stats_user)
        
        url = reverse('dashboard:stats')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['error'])
        self.assertIn('data', response.data)
        
        data = response.data['data']
        self.assertIn('total_posts', data)
        self.assertIn('total_users', data)
        self.assertIn('total_comments', data)
    
    def test_dashboard_stats_view_no_permission(self):
        """Test acceso denegado sin permisos"""
        self.authenticate_user(self.regular_user)
        
        url = reverse('dashboard:stats')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_popular_posts_view(self):
        """Test obtener posts populares"""
        self.authenticate_user(self.stats_user)
        
        url = reverse('dashboard:popular_posts')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['error'])
        self.assertIsInstance(response.data['data'], list)
    
    def test_popular_posts_with_limit(self):
        """Test obtener posts populares con límite"""
        self.authenticate_user(self.stats_user)
        
        url = reverse('dashboard:popular_posts')
        response = self.client.get(url, {'limit': 5})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertLessEqual(len(response.data['data']), 5)
    
    def test_recent_activity_view(self):
        """Test obtener actividad reciente"""
        # Crear actividad de prueba
        ActivityLog.objects.create(
            user=self.stats_user,
            action='created_post',
            target_model='Post',
            target_id=self.post.id,
            description='Test activity'
        )
        
        self.authenticate_user(self.stats_user)
        
        url = reverse('dashboard:recent_activity')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['error'])
        self.assertIsInstance(response.data['data'], list)
        self.assertGreater(len(response.data['data']), 0)
    
    def test_monthly_stats_view(self):
        """Test obtener estadísticas mensuales"""
        self.authenticate_user(self.stats_user)
        
        url = reverse('dashboard:monthly_stats')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['error'])
        
        data = response.data['data']
        self.assertIn('posts_by_month', data)
        self.assertIn('users_by_month', data)
        self.assertIn('comments_by_month', data)
    
    def test_user_stats_view(self):
        """Test obtener estadísticas de usuarios"""
        self.authenticate_user(self.stats_user)
        
        url = reverse('dashboard:user_stats')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['error'])
        
        data = response.data['data']
        self.assertIn('total_users', data)
        self.assertIn('active_users', data)
        self.assertIn('top_authors', data)
        self.assertIn('top_commenters', data)
    
    def test_content_stats_view(self):
        """Test obtener estadísticas de contenido"""
        self.authenticate_user(self.stats_user)
        
        url = reverse('dashboard:content_stats')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['error'])
        
        data = response.data['data']
        self.assertIn('posts', data)
        self.assertIn('comments', data)
        self.assertIn('categories', data)
        self.assertIn('most_commented_posts', data)
    
    def test_dashboard_summary_view(self):
        """Test obtener resumen del dashboard"""
        self.authenticate_user(self.stats_user)
        
        url = reverse('dashboard:stats_summary')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['error'])
        
        data = response.data['data']
        self.assertIn('totals', data)
        self.assertIn('today', data)
        self.assertIn('week', data)
        self.assertIn('pending', data)
    
    def test_growth_stats_view(self):
        """Test obtener estadísticas de crecimiento"""
        self.authenticate_user(self.stats_user)
        
        url = reverse('dashboard:growth_stats')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['error'])
        
        data = response.data['data']
        self.assertIn('posts', data)
        self.assertIn('users', data)
        self.assertIn('comments', data)
        
        # Verificar estructura de datos de crecimiento
        for key in ['posts', 'users', 'comments']:
            self.assertIn('current_period', data[key])
            self.assertIn('previous_period', data[key])
            self.assertIn('growth_percentage', data[key])
    
    def test_top_performing_content_view(self):
        """Test obtener contenido destacado"""
        self.authenticate_user(self.stats_user)
        
        url = reverse('dashboard:top_content')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['error'])
        
        data = response.data['data']
        self.assertIn('top_posts_month', data)
        self.assertIn('active_categories', data)
        self.assertIn('active_authors', data)


class DashboardUtilsTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.category = Categoria.objects.create(
            nombre='Test Category',
            descripcion='Test description'
        )
        
        self.post = Post.objects.create(
            titulo='Test Post',
            contenido='Test content',
            autor=self.user,
            categoria=self.category,
            status='published'
        )
    
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
        
        # Verificar que los contadores son números
        self.assertIsInstance(stats['total_posts'], int)
        self.assertIsInstance(stats['total_users'], int)
        self.assertIsInstance(stats['total_comments'], int)
    
    def test_get_growth_stats(self):
        """Test obtener estadísticas de crecimiento"""
        growth_stats = get_growth_stats()
        
        self.assertIn('posts', growth_stats)
        self.assertIn('users', growth_stats)
        self.assertIn('comments', growth_stats)
        
        for key in ['posts', 'users', 'comments']:
            self.assertIn('current_period', growth_stats[key])
            self.assertIn('previous_period', growth_stats[key])
            self.assertIn('growth_percentage', growth_stats[key])
    
    def test_calculate_growth_percentage(self):
        """Test cálculo de porcentaje de crecimiento"""
        # Crecimiento positivo
        growth = calculate_growth_percentage(150, 100)
        self.assertEqual(growth, 50.0)
        
        # Crecimiento negativo
        growth = calculate_growth_percentage(75, 100)
        self.assertEqual(growth, -25.0)
        
        # Sin cambio
        growth = calculate_growth_percentage(100, 100)
        self.assertEqual(growth, 0.0)
        
        # Desde cero
        growth = calculate_growth_percentage(50, 0)
        self.assertEqual(growth, 100)
        
        # A cero
        growth = calculate_growth_percentage(0, 50)
        self.assertEqual(growth, -100.0)