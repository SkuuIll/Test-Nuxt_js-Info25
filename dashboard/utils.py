from django.contrib.auth import get_user_model

User = get_user_model()
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
        user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]  # Limitar longitud
    
    try:
        ActivityLog.objects.create(
            user=user,
            action=action,
            target_model=target_model or '',
            target_id=target_id,
            description=description[:1000],  # Limitar longitud de descripción
            ip_address=ip_address,
            user_agent=user_agent
        )
    except Exception as e:
        # Si falla el logging, no debe interrumpir la operación principal
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error logging activity: {str(e)}")


def validate_dashboard_access(user):
    """
    Validar que un usuario tenga acceso al dashboard
    """
    if not user or not user.is_authenticated:
        return False, "Usuario no autenticado"
    
    if not user.is_active:
        return False, "Usuario desactivado"
    
    if user.is_superuser:
        return True, "Superusuario"
    
    try:
        dashboard_permission = user.dashboard_permission
        has_access = (
            dashboard_permission.can_view_stats or
            dashboard_permission.can_manage_posts or
            dashboard_permission.can_manage_users or
            dashboard_permission.can_manage_comments
        )
        
        if has_access:
            return True, "Usuario con permisos de dashboard"
        else:
            return False, "Sin permisos de dashboard"
            
    except Exception:
        return False, "Permisos de dashboard no encontrados"


def check_specific_permission(user, permission_type):
    """
    Verificar un permiso específico del dashboard
    """
    if not user or not user.is_authenticated:
        return False
    
    if user.is_superuser:
        return True
    
    try:
        dashboard_permission = user.dashboard_permission
        permission_map = {
            'manage_posts': dashboard_permission.can_manage_posts,
            'manage_users': dashboard_permission.can_manage_users,
            'manage_comments': dashboard_permission.can_manage_comments,
            'view_stats': dashboard_permission.can_view_stats,
        }
        
        return permission_map.get(permission_type, False)
        
    except Exception:
        return False


def get_user_dashboard_permissions(user):
    """
    Obtener todos los permisos de dashboard de un usuario
    """
    if not user or not user.is_authenticated:
        return None
    
    if user.is_superuser:
        return {
            'manage_posts': True,
            'manage_users': True,
            'manage_comments': True,
            'view_stats': True,
            'is_superuser': True
        }
    
    try:
        dashboard_permission = user.dashboard_permission
        return {
            'manage_posts': dashboard_permission.can_manage_posts,
            'manage_users': dashboard_permission.can_manage_users,
            'manage_comments': dashboard_permission.can_manage_comments,
            'view_stats': dashboard_permission.can_view_stats,
            'is_superuser': False
        }
    except Exception:
        return None


def validate_password_strength(password):
    """
    Validar la fortaleza de una contraseña
    """
    errors = []
    
    if len(password) < 8:
        errors.append("La contraseña debe tener al menos 8 caracteres")
    
    if not any(c.isupper() for c in password):
        errors.append("La contraseña debe contener al menos una letra mayúscula")
    
    if not any(c.islower() for c in password):
        errors.append("La contraseña debe contener al menos una letra minúscula")
    
    if not any(c.isdigit() for c in password):
        errors.append("La contraseña debe contener al menos un número")
    
    # Verificar caracteres especiales
    special_chars = "!@#$%^&*()_+-=[]{}|;:,.<>?"
    if not any(c in special_chars for c in password):
        errors.append("La contraseña debe contener al menos un carácter especial")
    
    return len(errors) == 0, errors


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


def get_growth_stats():
    """
    Obtener estadísticas de crecimiento comparando períodos
    """
    now = timezone.now()
    thirty_days_ago = now - timedelta(days=30)
    sixty_days_ago = now - timedelta(days=60)
    
    # Posts - últimos 30 días vs 30 días anteriores
    posts_current = Post.objects.filter(fecha_creacion__gte=thirty_days_ago).count()
    posts_previous = Post.objects.filter(
        fecha_creacion__gte=sixty_days_ago,
        fecha_creacion__lt=thirty_days_ago
    ).count()
    
    posts_growth = calculate_growth_percentage(posts_current, posts_previous)
    
    # Usuarios - últimos 30 días vs 30 días anteriores
    users_current = User.objects.filter(date_joined__gte=thirty_days_ago).count()
    users_previous = User.objects.filter(
        date_joined__gte=sixty_days_ago,
        date_joined__lt=thirty_days_ago
    ).count()
    
    users_growth = calculate_growth_percentage(users_current, users_previous)
    
    # Comentarios - últimos 30 días vs 30 días anteriores
    comments_current = Comentario.objects.filter(fecha_creacion__gte=thirty_days_ago).count()
    comments_previous = Comentario.objects.filter(
        fecha_creacion__gte=sixty_days_ago,
        fecha_creacion__lt=thirty_days_ago
    ).count()
    
    comments_growth = calculate_growth_percentage(comments_current, comments_previous)
    
    return {
        'posts': {
            'current_period': posts_current,
            'previous_period': posts_previous,
            'growth_percentage': posts_growth
        },
        'users': {
            'current_period': users_current,
            'previous_period': users_previous,
            'growth_percentage': users_growth
        },
        'comments': {
            'current_period': comments_current,
            'previous_period': comments_previous,
            'growth_percentage': comments_growth
        }
    }


def calculate_growth_percentage(current, previous):
    """
    Calcular porcentaje de crecimiento
    """
    if previous == 0:
        return 100 if current > 0 else 0
    
    return round(((current - previous) / previous) * 100, 2)


def get_top_performing_content():
    """
    Obtener contenido con mejor rendimiento
    """
    try:
        # Posts más comentados del mes
        thirty_days_ago = timezone.now() - timedelta(days=30)
        
        top_posts_month = Post.objects.filter(
            fecha_publicacion__gte=thirty_days_ago,
            status='published'
        ).annotate(
            comments_count=Count('comentarios')
        ).order_by('-comments_count')[:10]
        
        # Categorías más activas (simplificado)
        active_categories = Categoria.objects.annotate(
            posts_count=Count('post')
        ).filter(posts_count__gt=0).order_by('-posts_count')[:5]
        
        # Autores más activos del mes (simplificado)
        active_authors = User.objects.annotate(
            posts_count=Count('post')
        ).filter(posts_count__gt=0).order_by('-posts_count')[:10]
        
        return {
            'top_posts_month': [
                {
                    'id': post.id,
                    'title': post.titulo,
                    'comments_count': post.comments_count,
                    'author': post.autor.username,
                    'published_date': post.fecha_publicacion.strftime('%d/%m/%Y')
                }
                for post in top_posts_month
            ],
            'active_categories': [
                {
                    'id': cat.id,
                    'name': cat.nombre,
                    'posts_count': cat.posts_count,
                    'comments_count': 0  # Simplificado por ahora
                }
                for cat in active_categories
            ],
            'active_authors': [
                {
                    'id': author.id,
                    'username': author.username,
                    'posts_count': author.posts_count,
                    'comments_received': 0  # Simplificado por ahora
                }
                for author in active_authors
            ]
        }
    except Exception as e:
        # Retornar datos vacíos en caso de error
        return {
            'top_posts_month': [],
            'active_categories': [],
            'active_authors': []
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


# ============================================================================
# POSTS MANAGEMENT UTILITIES
# ============================================================================

def bulk_update_post_status(post_ids, new_status, user):
    """
    Actualizar el estado de múltiples posts
    """
    from posts.models import Post
    
    posts = Post.objects.filter(id__in=post_ids)
    updated_count = 0
    
    for post in posts:
        post.status = new_status
        post.save()
        updated_count += 1
        
        # Registrar actividad para cada post
        log_activity(
            user=user,
            action='updated_post',
            target_model='Post',
            target_id=post.id,
            description=f'Estado cambiado a {new_status}: {post.titulo}',
            request=None
        )
    
    return updated_count


def get_posts_statistics():
    """
    Obtener estadísticas detalladas de posts
    """
    from posts.models import Post
    from django.db.models import Count, Q
    from django.utils import timezone
    from datetime import timedelta
    
    now = timezone.now()
    thirty_days_ago = now - timedelta(days=30)
    
    stats = {
        'total_posts': Post.objects.count(),
        'published_posts': Post.objects.filter(status='published').count(),
        'draft_posts': Post.objects.filter(status='draft').count(),
        'archived_posts': Post.objects.filter(status='archived').count(),
        'featured_posts': Post.objects.filter(featured=True).count(),
        'posts_last_30_days': Post.objects.filter(
            fecha_creacion__gte=thirty_days_ago
        ).count(),
        'posts_by_status': {
            'published': Post.objects.filter(status='published').count(),
            'draft': Post.objects.filter(status='draft').count(),
            'archived': Post.objects.filter(status='archived').count(),
        },
        'posts_by_author': list(
            Post.objects.values('autor__username')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        ),
        'posts_by_category': list(
            Post.objects.filter(categoria__isnull=False)
            .values('categoria__nombre')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        )
    }
    
    return stats


def get_post_engagement_stats(post_id):
    """
    Obtener estadísticas de engagement de un post específico
    """
    from posts.models import Post
    from django.db.models import Count
    
    try:
        post = Post.objects.get(id=post_id)
        
        stats = {
            'comments_count': post.comentarios.count(),
            'approved_comments': post.comentarios.filter(approved=True).count(),
            'pending_comments': post.comentarios.filter(approved=False).count(),
            'unique_commenters': post.comentarios.values('usuario').distinct().count(),
            'reading_time': max(1, round(len(post.contenido.split()) / 200)),
            'word_count': len(post.contenido.split()),
            'character_count': len(post.contenido),
        }
        
        return stats
        
    except Post.DoesNotExist:
        return None


def duplicate_post(original_post_id, user):
    """
    Duplicar un post existente
    """
    from posts.models import Post
    
    try:
        original = Post.objects.get(id=original_post_id)
        
        # Crear copia
        duplicate = Post.objects.create(
            titulo=f"Copia de {original.titulo}",
            contenido=original.contenido,
            categoria=original.categoria,
            autor=user,
            status='draft',
            featured=False,
            meta_title=original.meta_title,
            meta_description=original.meta_description
        )
        
        # Registrar actividad
        log_activity(
            user=user,
            action='created_post',
            target_model='Post',
            target_id=duplicate.id,
            description=f'Post duplicado: {duplicate.titulo}',
            request=None
        )
        
        return duplicate
        
    except Post.DoesNotExist:
        return None


def get_post_performance_metrics():
    """
    Obtener métricas de rendimiento de posts
    """
    from posts.models import Post
    from django.db.models import Count, Avg
    
    # Posts más comentados
    most_commented = Post.objects.annotate(
        comments_count=Count('comentarios')
    ).filter(
        status='published',
        comments_count__gt=0
    ).order_by('-comments_count')[:10]
    
    # Posts sin comentarios
    no_comments = Post.objects.annotate(
        comments_count=Count('comentarios')
    ).filter(
        status='published',
        comments_count=0
    ).count()
    
    # Promedio de comentarios por post
    avg_comments = Post.objects.filter(
        status='published'
    ).annotate(
        comments_count=Count('comentarios')
    ).aggregate(
        avg_comments=Avg('comments_count')
    )['avg_comments'] or 0
    
    return {
        'most_commented_posts': [
            {
                'id': post.id,
                'title': post.titulo,
                'comments_count': post.comments_count,
                'author': post.autor.username,
                'published_date': post.fecha_publicacion.strftime('%d/%m/%Y')
            }
            for post in most_commented
        ],
        'posts_without_comments': no_comments,
        'average_comments_per_post': round(avg_comments, 2)
    }


# ============================================================================
# COMMENTS MANAGEMENT UTILITIES
# ============================================================================

def get_comments_statistics():
    """
    Obtener estadísticas detalladas de comentarios
    """
    from posts.models import Comentario
    from django.db.models import Count, Q
    from django.utils import timezone
    from datetime import timedelta
    
    now = timezone.now()
    thirty_days_ago = now - timedelta(days=30)
    seven_days_ago = now - timedelta(days=7)
    
    stats = {
        'total_comments': Comentario.objects.count(),
        'approved_comments': Comentario.objects.filter(approved=True).count(),
        'pending_comments': Comentario.objects.filter(approved=False).count(),
        'comments_last_30_days': Comentario.objects.filter(
            fecha_creacion__gte=thirty_days_ago
        ).count(),
        'comments_last_7_days': Comentario.objects.filter(
            fecha_creacion__gte=seven_days_ago
        ).count(),
        'comments_today': Comentario.objects.filter(
            fecha_creacion__date=now.date()
        ).count(),
        'comments_by_status': {
            'approved': Comentario.objects.filter(approved=True).count(),
            'pending': Comentario.objects.filter(approved=False).count(),
        },
        'top_commenters': list(
            Comentario.objects.values('usuario__username', 'usuario__email')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        ),
        'most_commented_posts': list(
            Comentario.objects.values('post__titulo', 'post__id')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        ),
        'comments_with_replies': Comentario.objects.filter(
            replies__isnull=False
        ).distinct().count(),
        'orphan_comments': Comentario.objects.filter(
            parent__isnull=True
        ).count()
    }
    
    return stats


def detect_spam_comments():
    """
    Detectar posibles comentarios spam usando heurísticas simples
    """
    from posts.models import Comentario
    from django.db.models import Q
    
    # Palabras clave comunes en spam
    spam_keywords = [
        'viagra', 'casino', 'lottery', 'winner', 'congratulations',
        'click here', 'free money', 'make money', 'work from home',
        'buy now', 'limited time', 'act now', 'guaranteed',
        'no risk', 'amazing deal', 'incredible offer'
    ]
    
    # Patrones sospechosos
    suspicious_patterns = [
        r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+',  # URLs
        r'[A-Z]{5,}',  # Texto en mayúsculas
        r'(.)\1{4,}',  # Caracteres repetidos
    ]
    
    spam_comments = []
    
    # Buscar por palabras clave
    for keyword in spam_keywords:
        comments = Comentario.objects.filter(
            contenido__icontains=keyword,
            approved=False
        )
        spam_comments.extend(comments)
    
    # Buscar comentarios muy cortos o muy largos
    short_comments = Comentario.objects.filter(
        Q(contenido__length__lt=10) | Q(contenido__length__gt=1000),
        approved=False
    )
    spam_comments.extend(short_comments)
    
    # Eliminar duplicados
    spam_comments = list(set(spam_comments))
    
    return spam_comments


def get_comment_moderation_queue():
    """
    Obtener cola de moderación de comentarios
    """
    from posts.models import Comentario
    from django.utils import timezone
    from datetime import timedelta
    
    now = timezone.now()
    
    # Comentarios pendientes ordenados por prioridad
    pending_comments = Comentario.objects.filter(approved=False).select_related(
        'usuario', 'post'
    ).order_by('-fecha_creacion')
    
    # Categorizar comentarios
    categorized = {
        'urgent': [],  # Comentarios de hace más de 24 horas
        'recent': [],  # Comentarios de las últimas 24 horas
        'spam_likely': []  # Posibles spam
    }
    
    twenty_four_hours_ago = now - timedelta(hours=24)
    
    for comment in pending_comments:
        if comment.fecha_creacion < twenty_four_hours_ago:
            categorized['urgent'].append(comment)
        else:
            categorized['recent'].append(comment)
    
    # Detectar spam
    spam_comments = detect_spam_comments()
    categorized['spam_likely'] = spam_comments
    
    return categorized


def bulk_moderate_comments(comment_ids, action, user):
    """
    Moderar múltiples comentarios de una vez
    """
    from posts.models import Comentario
    
    if action not in ['approve', 'reject', 'delete']:
        raise ValueError('Acción inválida. Debe ser: approve, reject, delete')
    
    comments = Comentario.objects.filter(id__in=comment_ids)
    processed_count = 0
    
    for comment in comments:
        if action == 'approve':
            comment.approved = True
            comment.save()
            action_text = 'aprobado'
        elif action == 'reject':
            comment.approved = False
            comment.save()
            action_text = 'rechazado'
        elif action == 'delete':
            comment.delete()
            action_text = 'eliminado'
        
        processed_count += 1
        
        # Registrar actividad
        if action != 'delete':
            log_activity(
                user=user,
                action=f'{action}d_comment',
                target_model='Comentario',
                target_id=comment.id,
                description=f'Comentario {action_text} (lote): {comment.contenido[:50]}...',
                request=None
            )
    
    return processed_count


def get_comment_engagement_metrics():
    """
    Obtener métricas de engagement de comentarios
    """
    from posts.models import Comentario, Post
    from django.db.models import Count, Avg
    from django.utils import timezone
    from datetime import timedelta
    
    now = timezone.now()
    thirty_days_ago = now - timedelta(days=30)
    
    # Métricas básicas
    total_comments = Comentario.objects.count()
    approved_comments = Comentario.objects.filter(approved=True).count()
    
    # Tasa de aprobación
    approval_rate = (approved_comments / total_comments * 100) if total_comments > 0 else 0
    
    # Comentarios por día (últimos 30 días)
    daily_comments = []
    for i in range(30):
        date = (now - timedelta(days=i)).date()
        count = Comentario.objects.filter(fecha_creacion__date=date).count()
        daily_comments.append({
            'date': date.strftime('%Y-%m-%d'),
            'count': count
        })
    
    # Posts con más comentarios
    top_posts = Post.objects.annotate(
        comments_count=Count('comentarios')
    ).filter(
        comments_count__gt=0
    ).order_by('-comments_count')[:10]
    
    # Usuarios más activos en comentarios
    top_commenters = Comentario.objects.values(
        'usuario__username', 'usuario__email'
    ).annotate(
        count=Count('id')
    ).order_by('-count')[:10]
    
    # Promedio de comentarios por post
    avg_comments_per_post = Post.objects.annotate(
        comments_count=Count('comentarios')
    ).aggregate(
        avg_comments=Avg('comments_count')
    )['avg_comments'] or 0
    
    return {
        'total_comments': total_comments,
        'approved_comments': approved_comments,
        'pending_comments': total_comments - approved_comments,
        'approval_rate': round(approval_rate, 2),
        'daily_comments': daily_comments,
        'top_commented_posts': [
            {
                'id': post.id,
                'title': post.titulo,
                'comments_count': post.comments_count
            }
            for post in top_posts
        ],
        'top_commenters': top_commenters,
        'average_comments_per_post': round(avg_comments_per_post, 2)
    }


def auto_moderate_comments():
    """
    Moderación automática de comentarios basada en reglas
    """
    from posts.models import Comentario
    
    # Reglas de auto-moderación
    auto_approved = 0
    auto_rejected = 0
    
    # Auto-aprobar comentarios de usuarios confiables
    trusted_users = Comentario.objects.filter(
        approved=True
    ).values('usuario').annotate(
        approved_count=Count('id')
    ).filter(approved_count__gte=5).values_list('usuario', flat=True)
    
    pending_from_trusted = Comentario.objects.filter(
        approved=False,
        usuario__in=trusted_users
    )
    
    for comment in pending_from_trusted:
        comment.approved = True
        comment.save()
        auto_approved += 1
    
    # Auto-rechazar comentarios con contenido sospechoso
    spam_comments = detect_spam_comments()
    for comment in spam_comments:
        if not comment.approved:
            comment.approved = False
            comment.save()
            auto_rejected += 1
    
    return {
        'auto_approved': auto_approved,
        'auto_rejected': auto_rejected
    }