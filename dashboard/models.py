from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class DashboardPermission(models.Model):
    """Permisos específicos del dashboard"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='dashboard_permission')
    can_manage_posts = models.BooleanField(default=False, help_text='Puede crear, editar y eliminar posts')
    can_manage_users = models.BooleanField(default=False, help_text='Puede gestionar usuarios y permisos')
    can_manage_comments = models.BooleanField(default=False, help_text='Puede moderar comentarios')
    can_view_stats = models.BooleanField(default=True, help_text='Puede ver estadísticas del dashboard')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f'Permisos de {self.user.username}'
    
    class Meta:
        verbose_name = 'Permiso de Dashboard'
        verbose_name_plural = 'Permisos de Dashboard'


class ActivityLog(models.Model):
    """Log de actividades del dashboard"""
    ACTION_CHOICES = [
        ('created_post', 'Post creado'),
        ('updated_post', 'Post actualizado'),
        ('deleted_post', 'Post eliminado'),
        ('created_user', 'Usuario creado'),
        ('updated_user', 'Usuario actualizado'),
        ('deleted_user', 'Usuario eliminado'),
        ('approved_comment', 'Comentario aprobado'),
        ('rejected_comment', 'Comentario rechazado'),
        ('deleted_comment', 'Comentario eliminado'),
        ('login', 'Inicio de sesión'),
        ('logout', 'Cierre de sesión'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activity_logs')
    action = models.CharField(max_length=100, choices=ACTION_CHOICES)
    target_model = models.CharField(max_length=50, help_text='Modelo afectado (Post, User, etc.)')
    target_id = models.IntegerField(null=True, blank=True, help_text='ID del objeto afectado')
    description = models.TextField(help_text='Descripción detallada de la acción')
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    
    def __str__(self):
        return f'{self.user.username} - {self.get_action_display()} - {self.timestamp}'
    
    class Meta:
        verbose_name = 'Log de Actividad'
        verbose_name_plural = 'Logs de Actividad'
        ordering = ['-timestamp']


def create_dashboard_permission(sender, instance, created, **kwargs):
    """Crear permisos de dashboard automáticamente para nuevos usuarios"""
    if created:
        DashboardPermission.objects.create(user=instance)


# Conectar la señal para crear permisos automáticamente
from django.db.models.signals import post_save
post_save.connect(create_dashboard_permission, sender=User)