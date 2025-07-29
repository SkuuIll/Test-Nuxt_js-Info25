from django.contrib.auth.models import User
from django.db.models import Count, Q
from django.utils import timezone
from datetime import datetime, timedelta
from posts.models import Post, Comentario
from .models import ActivityLog


def get_client_ip(request):
    """Obtener la IP del cliente"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def log_activity(user, action, target_model=None, target_id=None, description='', request=None):
    """
    Registrar actividad en el dashboard
    """
    ip_address = None
    user_agent = None
    
    if request:
        ip_address = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
    
    ActivityLog.objects.create(
        user=user,
        action=action,
        target_model=target_model or '',
        target_id=target_id,
        description=description,
        ip_address=ip_address,
        user_agent=user_agent
    )


def get_dashboard_stats():
    """
    Obtener estadísticas generales del dashboard
    """
    now = timezone.now()
    thirty_days_ago = now - timedelta(days=30)
    
    # Estadísticas básicas
    total_posts = Post.objects.count()
    total_users = User.objects.count()
    total_comments = Comentario.objects.count()
    
    # Posts por estado
    published_posts = Post.objects.filter(status='published').count()
    draft_posts = Post.objects.filter(status='draft').count()
    
    # Comentarios pendientes (no aprobados)
    pending_comments = Comentario.objects.filter(approved=False).count()
    
    # Usuarios activos (que han iniciado sesión en los últimos 30 días)
    active_users = User.objects.filter(
        last_login__gte=thirty_days_ago
    ).count()
    
    # Posts más populares (basado en número de comentarios)
    popular_posts = Post.objects.annotate(
        comments_count=Count('comentarios')
    ).filter(
        status='published'
    ).order_by('-comments_count')[:5]
    
    popular_posts_data = [
        {
            'id': post.id,
            'title': post.titulo,
            'comments_count': post.comments_count,
            'author': post.autor.username,
            'published_date': post.fecha_publicacion.strftime('%d/%m/%Y')
        }
        for post in popular_posts
    ]
    
    # Actividad reciente
    recent_activity = ActivityLog.objects.select_related('user').order_by('-timestamp')[:10]
    
    # Estadísticas mensuales
    monthly_stats = get_monthly_stats()
    
    return {
        'total_posts': total_posts,
        'total_users': total_users,
        'total_comments': total_comments,
        'published_posts': published_posts,
        'draft_posts': draft_posts,
        'pending_comments': pending_comments,
        'active_users': active_users,
        'popular_posts': popular_posts_data,
        'recent_activity': recent_activity,
        'monthly_stats': monthly_stats
    }


def get_monthly_stats():
    """
    Obtener estadísticas de los últimos 12 meses
    """
    now = timezone.now()
    twelve_months_ago = now - timedelta(days=365)
    
    # Posts por mes
    posts_by_month = Post.objects.filter(
        fecha_creacion__gte=twelve_months_ago
    ).extra(
        select={'month': "strftime('%%Y-%%m', fecha_creacion)"}
    ).values('month').annotate(
        count=Count('id')
    ).order_by('month')
    
    # Usuarios registrados por mes
    users_by_month = User.objects.filter(
        date_joined__gte=twelve_months_ago
    ).extra(
        select={'month': "strftime('%%Y-%%m', date_joined)"}
    ).values('month').annotate(
        count=Count('id')
    ).order_by('month')
    
    # Comentarios por mes
    comments_by_month = Comentario.objects.filter(
        fecha_creacion__gte=twelve_months_ago
    ).extra(
        select={'month': "strftime('%%Y-%%m', fecha_creacion)"}
    ).values('month').annotate(
        count=Count('id')
    ).order_by('month')
    
    return {
        'posts_by_month': list(posts_by_month),
        'users_by_month': list(users_by_month),
        'comments_by_month': list(comments_by_month)
    }


def create_dashboard_admin_user(username, email, password):
    """
    Crear un usuario administrador del dashboard
    """
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        is_staff=True
    )
    
    # Configurar permisos completos del dashboard
    dashboard_permission = user.dashboard_permission
    dashboard_permission.can_manage_posts = True
    dashboard_permission.can_manage_users = True
    dashboard_permission.can_manage_comments = True
    dashboard_permission.can_view_stats = True
    dashboard_permission.save()
    
    return user


def bulk_update_post_status(post_ids, new_status, user):
    """
    Actualizar el estado de múltiples posts
    """
    posts = Post.objects.filter(id__in=post_ids)
    updated_count = posts.update(status=new_status)
    
    # Registrar la actividad
    log_activity(
        user=user,
        action='updated_post',
        description=f'Actualizado estado de {updated_count} posts a {new_status}'
    )
    
    return updated_count


def bulk_approve_comments(comment_ids, user):
    """
    Aprobar múltiples comentarios
    """
    comments = Comentario.objects.filter(id__in=comment_ids)
    updated_count = comments.update(approved=True)
    
    # Registrar la actividad
    log_activity(
        user=user,
        action='approved_comment',
        description=f'Aprobados {updated_count} comentarios'
    )
    
    return updated_count


def bulk_reject_comments(comment_ids, user):
    """
    Rechazar múltiples comentarios
    """
    comments = Comentario.objects.filter(id__in=comment_ids)
    updated_count = comments.update(approved=False)
    
    # Registrar la actividad
    log_activity(
        user=user,
        action='rejected_comment',
        description=f'Rechazados {updated_count} comentarios'
    )
    
    return updated_count