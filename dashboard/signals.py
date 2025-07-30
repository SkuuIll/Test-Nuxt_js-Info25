from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth import get_user_model

User = get_user_model()
from posts.models import Post, Comentario
from .models import DashboardPermission
from .utils import log_activity


@receiver(post_save, sender=User)
def create_dashboard_permission(sender, instance, created, **kwargs):
    """Crear permisos de dashboard automáticamente para nuevos usuarios"""
    if created:
        DashboardPermission.objects.get_or_create(user=instance)


@receiver(post_save, sender=Post)
def log_post_activity(sender, instance, created, **kwargs):
    """Registrar actividad cuando se crea o actualiza un post"""
    if created:
        log_activity(
            user=instance.autor,
            action='created_post',
            target_model='Post',
            target_id=instance.id,
            description=f'Post creado: {instance.titulo}'
        )
    else:
        log_activity(
            user=instance.autor,
            action='updated_post',
            target_model='Post',
            target_id=instance.id,
            description=f'Post actualizado: {instance.titulo}'
        )


@receiver(post_delete, sender=Post)
def log_post_deletion(sender, instance, **kwargs):
    """Registrar actividad cuando se elimina un post"""
    # Nota: No podemos obtener el usuario que eliminó el post desde aquí
    # Esto se manejará en las vistas del dashboard
    pass


@receiver(post_save, sender=Comentario)
def log_comment_activity(sender, instance, created, **kwargs):
    """Registrar actividad cuando se crea o actualiza un comentario"""
    if created:
        log_activity(
            user=instance.usuario,
            action='created_comment',
            target_model='Comentario',
            target_id=instance.id,
            description=f'Comentario creado en: {instance.post.titulo}'
        )


@receiver(post_delete, sender=Comentario)
def log_comment_deletion(sender, instance, **kwargs):
    """Registrar actividad cuando se elimina un comentario"""
    # Nota: Similar al post, esto se manejará en las vistas del dashboard
    pass