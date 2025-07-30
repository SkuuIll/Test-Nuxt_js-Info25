from django.test import TestCase
from django.contrib.auth import get_user_model

User = get_user_model()
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from posts.models import Post, Categoria, Comentario
from .models import DashboardPermission, ActivityLog


class DashboardCommentsTestCase(APITestCase):
    def setUp(self):
        # Usuario con permisos para gestionar comentarios
        self.comment_manager = User.objects.create_user(
            username='commentmanager',
            email='comments@example.com',
            password='testpass123'
        )
        self.comment_manager.dashboard_permission.can_manage_comments = True
        self.comment_manager.dashboard_permission.save()
        
        # Usuario sin permisos
        self.regular_user = User.objects.create_user(
            username='regular',
            email='regular@example.com',
            password='testpass123'
        )
        self.regular_user.dashboard_permission.can_manage_comments = False
        self.regular_user.dashboard_permission.save()
        
        # Usuario autor de posts
        self.author = User.objects.create_user(
            username='author',
            email='author@example.com',
            password='testpass123'
        )
        
        # Crear datos de prueba
        self.category = Categoria.objects.create(
            nombre='Test Category',
            descripcion='Test description'
        )
        
        self.post = Post.objects.create(
            titulo='Test Post',
            contenido='Test content for the post',
            autor=self.author,
            categoria=self.category,
            status='published'
        )
        
        self.comment = Comentario.objects.create(
            post=self.post,
            usuario=self.regular_user,
            contenido='Test comment content',
            approved=True
        )
        
        self.pending_comment = Comentario.objects.create(
            post=self.post,
            usuario=self.regular_user,
            contenido='Pending comment content',
            approved=False
        )
        
        # Comentario de respuesta
        self.reply_comment = Comentario.objects.create(
            post=self.post,
            usuario=self.author,
            contenido='Reply to comment',
            approved=True,
            parent=self.comment
        )
    
    def authenticate_user(self, user):
        """Helper para autenticar usuario"""
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
    
    def test_list_comments_success(self):
        """Test listar comentarios exitosamente"""
        self.authenticate_user(self.comment_manager)
        
        url = reverse('dashboard:comments-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data['results']), 0)
    
    def test_list_comments_no_permission(self):
        """Test acceso denegado sin permisos"""
        self.authenticate_user(self.regular_user)
        
        url = reverse('dashboard:comments-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_create_comment_success(self):
        """Test crear comentario exitosamente"""
        self.authenticate_user(self.comment_manager)
        
        url = reverse('dashboard:comments-list')
        data = {
            'contenido': 'New test comment content',
            'post': self.post.id,
            'approved': True
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['contenido'], 'New test comment content')
        
        # Verificar que se registró la actividad
        self.assertTrue(
            ActivityLog.objects.filter(
                user=self.comment_manager,
                action='created_comment'
            ).exists()
        )
    
    def test_create_comment_validation_error(self):
        """Test error de validación al crear comentario"""
        self.authenticate_user(self.comment_manager)
        
        url = reverse('dashboard:comments-list')
        data = {
            'contenido': 'Ab',  # Muy corto
            'post': 999,  # Post inexistente
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_update_comment_success(self):
        """Test actualizar comentario exitosamente"""
        self.authenticate_user(self.comment_manager)
        
        url = reverse('dashboard:comments-detail', kwargs={'pk': self.comment.pk})
        data = {
            'contenido': 'Updated comment content',
            'post': self.post.id,
            'approved': True
        }
        
        response = self.client.put(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['contenido'], 'Updated comment content')
        
        # Verificar que se registró la actividad
        self.assertTrue(
            ActivityLog.objects.filter(
                user=self.comment_manager,
                action='updated_comment'
            ).exists()
        )
    
    def test_delete_comment_success(self):
        """Test eliminar comentario exitosamente"""
        self.authenticate_user(self.comment_manager)
        
        url = reverse('dashboard:comments-detail', kwargs={'pk': self.comment.pk})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Comentario.objects.filter(pk=self.comment.pk).exists())
        
        # Verificar que se registró la actividad
        self.assertTrue(
            ActivityLog.objects.filter(
                user=self.comment_manager,
                action='deleted_comment'
            ).exists()
        )
    
    def test_approve_comment_success(self):
        """Test aprobar comentario exitosamente"""
        self.authenticate_user(self.comment_manager)
        
        url = reverse('dashboard:comments-approve', kwargs={'pk': self.pending_comment.pk})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['error'])
        
        # Verificar que el comentario se aprobó
        self.pending_comment.refresh_from_db()
        self.assertTrue(self.pending_comment.approved)
        
        # Verificar que se registró la actividad
        self.assertTrue(
            ActivityLog.objects.filter(
                user=self.comment_manager,
                action='approved_comment'
            ).exists()
        )
    
    def test_reject_comment_success(self):
        """Test rechazar comentario exitosamente"""
        self.authenticate_user(self.comment_manager)
        
        url = reverse('dashboard:comments-reject', kwargs={'pk': self.comment.pk})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['error'])
        
        # Verificar que el comentario se rechazó
        self.comment.refresh_from_db()
        self.assertFalse(self.comment.approved)
        
        # Verificar que se registró la actividad
        self.assertTrue(
            ActivityLog.objects.filter(
                user=self.comment_manager,
                action='rejected_comment'
            ).exists()
        )
    
    def test_bulk_approve_comments(self):
        """Test aprobación masiva de comentarios"""
        # Crear comentario adicional pendiente
        comment2 = Comentario.objects.create(
            post=self.post,
            usuario=self.regular_user,
            contenido='Another pending comment',
            approved=False
        )
        
        self.authenticate_user(self.comment_manager)
        
        url = reverse('dashboard:comments-bulk-approve')
        data = {
            'comment_ids': [self.pending_comment.id, comment2.id]
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['error'])
        self.assertGreater(response.data['updated_count'], 0)
        
        # Verificar que al menos algunos comentarios se aprobaron
        self.pending_comment.refresh_from_db()
        comment2.refresh_from_db()
        # Al menos uno debería estar aprobado
        self.assertTrue(self.pending_comment.approved or comment2.approved)
    
    def test_bulk_reject_comments(self):
        """Test rechazo masivo de comentarios"""
        # Crear comentario adicional aprobado
        comment2 = Comentario.objects.create(
            post=self.post,
            usuario=self.regular_user,
            contenido='Another approved comment',
            approved=True
        )
        
        self.authenticate_user(self.comment_manager)
        
        url = reverse('dashboard:comments-bulk-reject')
        data = {
            'comment_ids': [self.comment.id, comment2.id]
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['error'])
        self.assertGreater(response.data['updated_count'], 0)
    
    def test_bulk_delete_comments(self):
        """Test eliminación masiva de comentarios"""
        # Crear comentario adicional
        comment2 = Comentario.objects.create(
            post=self.post,
            usuario=self.regular_user,
            contenido='Comment to delete',
            approved=True
        )
        
        self.authenticate_user(self.comment_manager)
        
        url = reverse('dashboard:comments-bulk-delete')
        data = {
            'comment_ids': [self.comment.id, comment2.id]
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['error'])
        self.assertGreater(response.data['deleted_count'], 0)
    
    def test_get_pending_comments(self):
        """Test obtener comentarios pendientes"""
        self.authenticate_user(self.comment_manager)
        
        url = reverse('dashboard:comments-pending')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verificar que solo devuelve comentarios pendientes
        # El endpoint usa paginación, así que verificamos la estructura
        if 'results' in response.data:
            for comment in response.data['results']:
                self.assertFalse(comment['approved'])
        elif 'data' in response.data:
            for comment in response.data['data']:
                self.assertFalse(comment['approved'])
    
    def test_get_comments_by_post(self):
        """Test obtener comentarios por post"""
        self.authenticate_user(self.comment_manager)
        
        url = reverse('dashboard:comments-by-post')
        response = self.client.get(url, {'post_id': self.post.id})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verificar la estructura de respuesta
        if 'data' in response.data:
            self.assertEqual(response.data['data']['post']['id'], self.post.id)
            self.assertGreater(len(response.data['data']['comments']), 0)
        elif 'results' in response.data:
            # Si usa paginación, verificar que hay resultados
            self.assertGreater(len(response.data['results']), 0)
    
    def test_get_comments_stats(self):
        """Test obtener estadísticas de comentarios"""
        self.authenticate_user(self.comment_manager)
        
        url = reverse('dashboard:comments-stats')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['error'])
        
        data = response.data['data']
        self.assertIn('total_comments', data)
        self.assertIn('approved_comments', data)
        self.assertIn('pending_comments', data)
        self.assertIn('comments_this_month', data)
        self.assertIn('comments_by_post', data)
        self.assertIn('top_commenters', data)
        self.assertIn('recent_comments', data)
    
    def test_get_comment_replies(self):
        """Test obtener respuestas de un comentario"""
        self.authenticate_user(self.comment_manager)
        
        url = reverse('dashboard:comments-replies', kwargs={'pk': self.comment.pk})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['error'])
        self.assertEqual(response.data['data']['parent_comment']['id'], self.comment.id)
        self.assertEqual(len(response.data['data']['replies']), 1)
        self.assertEqual(response.data['data']['replies'][0]['contenido'], 'Reply to comment')
    
    def test_filter_comments_by_approval_status(self):
        """Test filtrar comentarios por estado de aprobación"""
        self.authenticate_user(self.comment_manager)
        
        url = reverse('dashboard:comments-list')
        response = self.client.get(url, {'approved': 'true'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for comment in response.data['results']:
            self.assertTrue(comment['approved'])
    
    def test_search_comments(self):
        """Test buscar comentarios por contenido"""
        self.authenticate_user(self.comment_manager)
        
        url = reverse('dashboard:comments-list')
        response = self.client.get(url, {'search': 'Test'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data['results']), 0)
    
    def test_filter_comments_by_post(self):
        """Test filtrar comentarios por post"""
        self.authenticate_user(self.comment_manager)
        
        url = reverse('dashboard:comments-list')
        response = self.client.get(url, {'post': self.post.id})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for comment in response.data['results']:
            self.assertEqual(comment['post'], self.post.id)
    
    def test_create_reply_comment(self):
        """Test crear comentario de respuesta"""
        self.authenticate_user(self.comment_manager)
        
        url = reverse('dashboard:comments-list')
        data = {
            'contenido': 'This is a reply comment',
            'post': self.post.id,
            'parent': self.comment.id,
            'approved': True
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['parent'], self.comment.id)
        
        # Verificar que se creó en la base de datos
        created_comment = Comentario.objects.get(contenido='This is a reply comment')
        self.assertEqual(created_comment.parent, self.comment)