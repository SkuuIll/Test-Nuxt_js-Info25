"""
Signal handlers for automatic notification creation
"""
import logging
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.utils import timezone
from .services import NotificationService

# Import models from other apps
try:
    from posts.models import Post
    from comments.models import Comment
except ImportError:
    # Handle case where models might not be available during migrations
    Post = None
    Comment = None

User = get_user_model()
logger = logging.getLogger(__name__)


@receiver(post_save, sender=Comment)
def handle_new_comment(sender, instance, created, **kwargs):
    """
    Create notification when new comment is posted
    """
    if not created or not Comment:
        return
    
    try:
        comment = instance
        post = comment.post
        
        # Notify post author (if not commenting on their own post)
        if post.author != comment.author:
            NotificationService.create_notification(
                recipient=post.author,
                notification_type='comment',
                title=f'Nuevo comentario en "{post.title}"',
                message=f'{comment.author.username} comentó en tu post: "{comment.content[:100]}..."',
                sender=comment.author,
                priority='normal',
                data={
                    'post_id': post.id,
                    'post_title': post.title,
                    'comment_id': comment.id,
                    'comment_content': comment.content[:200]
                },
                action_url=f'/posts/{post.slug}/#comment-{comment.id}'
            )
        
        # Notify administrators about new comments for moderation
        if comment.requires_moderation:
            NotificationService.send_to_group(
                group_name='staff_users',
                notification_type='moderation_required',
                title='Comentario requiere moderación',
                message=f'Un nuevo comentario de {comment.author.username} requiere moderación',
                sender=comment.author,
                priority='normal',
                data={
                    'post_id': post.id,
                    'post_title': post.title,
                    'comment_id': comment.id,
                    'comment_content': comment.content[:200],
                    'comment_author': comment.author.username
                },
                action_url=f'/admin/comments/comment/{comment.id}/change/'
            )
        
        # Notify other commenters on the same post (excluding the new commenter and post author)
        other_commenters = User.objects.filter(
            comments__post=post
        ).exclude(
            id__in=[comment.author.id, post.author.id]
        ).distinct()
        
        for commenter in other_commenters:
            NotificationService.create_notification(
                recipient=commenter,
                notification_type='comment',
                title=f'Nuevo comentario en "{post.title}"',
                message=f'{comment.author.username} también comentó en un post donde participaste',
                sender=comment.author,
                priority='low',
                data={
                    'post_id': post.id,
                    'post_title': post.title,
                    'comment_id': comment.id
                },
                action_url=f'/posts/{post.slug}/#comment-{comment.id}'
            )
        
        logger.info(f"Created comment notifications for comment {comment.id}")
        
    except Exception as e:
        logger.error(f"Error creating comment notification: {str(e)}")


@receiver(post_save, sender=User)
def handle_user_registration(sender, instance, created, **kwargs):
    """
    Create notification when new user registers
    """
    if not created:
        return
    
    try:
        user = instance
        
        # Notify administrators about new user registration
        NotificationService.send_to_group(
            group_name='staff_users',
            notification_type='user_registration',
            title='Nuevo usuario registrado',
            message=f'Un nuevo usuario se ha registrado: {user.username} ({user.email})',
            sender=None,
            priority='low',
            data={
                'user_id': user.id,
                'username': user.username,
                'email': user.email,
                'date_joined': user.date_joined.isoformat(),
                'is_staff': user.is_staff,
                'is_active': user.is_active
            },
            action_url=f'/admin/accounts/user/{user.id}/change/'
        )
        
        # Send welcome notification to the new user
        NotificationService.create_notification(
            recipient=user,
            notification_type='system_announcement',
            title='¡Bienvenido al Blog de Noticias!',
            message='Gracias por registrarte. Explora nuestros artículos y únete a la conversación.',
            sender=None,
            priority='normal',
            data={
                'welcome_message': True,
                'registration_date': user.date_joined.isoformat()
            },
            action_url='/'
        )
        
        logger.info(f"Created registration notifications for user {user.username}")
        
    except Exception as e:
        logger.error(f"Error creating user registration notification: {str(e)}")


@receiver(post_save, sender=Post)
def handle_post_published(sender, instance, created, **kwargs):
    """
    Create notification when post is published
    """
    if not Post:
        return
    
    try:
        post = instance
        
        # Only notify when post is published (not draft)
        if post.status != 'published':
            return
        
        # If this is a new post being published
        if created:
            # Notify administrators about new published post
            NotificationService.send_to_group(
                group_name='staff_users',
                notification_type='post_published',
                title='Nuevo post publicado',
                message=f'{post.author.username} ha publicado un nuevo post: "{post.title}"',
                sender=post.author,
                priority='low',
                data={
                    'post_id': post.id,
                    'post_title': post.title,
                    'post_slug': post.slug,
                    'author': post.author.username,
                    'category': post.category.name if post.category else None,
                    'published_at': post.published_at.isoformat() if post.published_at else None
                },
                action_url=f'/posts/{post.slug}/'
            )
        
        # Check if post was just featured
        if hasattr(post, '_state') and post._state.adding is False:
            # This is an update, check if featured status changed
            try:
                old_post = Post.objects.get(id=post.id)
                if hasattr(post, 'is_featured') and hasattr(old_post, 'is_featured'):
                    if post.is_featured and not old_post.is_featured:
                        # Post was just featured
                        NotificationService.create_notification(
                            recipient=post.author,
                            notification_type='post_featured',
                            title='¡Tu post ha sido destacado!',
                            message=f'Tu post "{post.title}" ha sido destacado por los administradores',
                            sender=None,
                            priority='high',
                            data={
                                'post_id': post.id,
                                'post_title': post.title,
                                'post_slug': post.slug,
                                'featured_at': timezone.now().isoformat()
                            },
                            action_url=f'/posts/{post.slug}/'
                        )
            except Post.DoesNotExist:
                pass
        
        logger.info(f"Processed post publication notifications for post {post.id}")
        
    except Exception as e:
        logger.error(f"Error creating post publication notification: {str(e)}")


@receiver(post_save, sender=Comment)
def handle_comment_reply(sender, instance, created, **kwargs):
    """
    Create notification when someone replies to a comment
    """
    if not created or not Comment:
        return
    
    try:
        comment = instance
        
        # Check if this comment is a reply to another comment
        if hasattr(comment, 'parent') and comment.parent:
            parent_comment = comment.parent
            
            # Notify the parent comment author (if not replying to themselves)
            if parent_comment.author != comment.author:
                NotificationService.create_notification(
                    recipient=parent_comment.author,
                    notification_type='comment_reply',
                    title='Respuesta a tu comentario',
                    message=f'{comment.author.username} respondió a tu comentario: "{comment.content[:100]}..."',
                    sender=comment.author,
                    priority='normal',
                    data={
                        'post_id': comment.post.id,
                        'post_title': comment.post.title,
                        'parent_comment_id': parent_comment.id,
                        'reply_comment_id': comment.id,
                        'reply_content': comment.content[:200]
                    },
                    action_url=f'/posts/{comment.post.slug}/#comment-{comment.id}'
                )
        
        logger.info(f"Processed comment reply notifications for comment {comment.id}")
        
    except Exception as e:
        logger.error(f"Error creating comment reply notification: {str(e)}")


@receiver(post_save, sender=Comment)
def handle_comment_moderation(sender, instance, created, **kwargs):
    """
    Create notification when comment moderation status changes
    """
    if created or not Comment:
        return
    
    try:
        comment = instance
        
        # Check if comment was just approved or rejected
        if hasattr(comment, '_state') and comment._state.adding is False:
            try:
                # Get the previous state from database
                old_comment = Comment.objects.get(id=comment.id)
                
                # Check if moderation status changed
                if hasattr(comment, 'is_approved') and hasattr(old_comment, 'is_approved'):
                    if comment.is_approved and not old_comment.is_approved:
                        # Comment was approved
                        NotificationService.create_notification(
                            recipient=comment.author,
                            notification_type='content_approved',
                            title='Tu comentario fue aprobado',
                            message=f'Tu comentario en "{comment.post.title}" ha sido aprobado y ahora es visible',
                            sender=None,
                            priority='normal',
                            data={
                                'post_id': comment.post.id,
                                'post_title': comment.post.title,
                                'comment_id': comment.id,
                                'approved_at': timezone.now().isoformat()
                            },
                            action_url=f'/posts/{comment.post.slug}/#comment-{comment.id}'
                        )
                    elif hasattr(comment, 'is_rejected') and comment.is_rejected and not getattr(old_comment, 'is_rejected', False):
                        # Comment was rejected
                        NotificationService.create_notification(
                            recipient=comment.author,
                            notification_type='content_rejected',
                            title='Tu comentario fue rechazado',
                            message=f'Tu comentario en "{comment.post.title}" no cumple con nuestras normas de comunidad',
                            sender=None,
                            priority='normal',
                            data={
                                'post_id': comment.post.id,
                                'post_title': comment.post.title,
                                'comment_id': comment.id,
                                'rejected_at': timezone.now().isoformat(),
                                'reason': getattr(comment, 'rejection_reason', 'No especificado')
                            },
                            action_url=f'/posts/{comment.post.slug}/'
                        )
            except Comment.DoesNotExist:
                pass
        
        logger.info(f"Processed comment moderation notifications for comment {comment.id}")
        
    except Exception as e:
        logger.error(f"Error creating comment moderation notification: {str(e)}")


# Signal handler for user following (if implemented in the future)
def handle_user_follow(sender, instance, created, **kwargs):
    """
    Create notification when someone follows a user
    This is a placeholder for future user following functionality
    """
    if not created:
        return
    
    try:
        # This would be implemented when user following is added
        # follow_relationship = instance
        # NotificationService.create_notification(...)
        pass
        
    except Exception as e:
        logger.error(f"Error creating user follow notification: {str(e)}")


# Signal handler for post likes (if implemented in the future)
def handle_post_like(sender, instance, created, **kwargs):
    """
    Create notification when someone likes a post
    This is a placeholder for future post liking functionality
    """
    if not created:
        return
    
    try:
        # This would be implemented when post liking is added
        # like = instance
        # NotificationService.create_notification(...)
        pass
        
    except Exception as e:
        logger.error(f"Error creating post like notification: {str(e)}")


# Cleanup signal handlers
@receiver(post_delete, sender=Comment)
def handle_comment_deletion(sender, instance, **kwargs):
    """
    Handle cleanup when a comment is deleted
    """
    try:
        comment = instance
        
        # Optionally notify users that a comment they were notified about was deleted
        # This could be useful for transparency
        logger.info(f"Comment {comment.id} was deleted, related notifications may need cleanup")
        
    except Exception as e:
        logger.error(f"Error handling comment deletion: {str(e)}")


@receiver(post_delete, sender=Post)
def handle_post_deletion(sender, instance, **kwargs):
    """
    Handle cleanup when a post is deleted
    """
    try:
        post = instance
        
        # Optionally clean up related notifications
        logger.info(f"Post {post.id} was deleted, related notifications may need cleanup")
        
    except Exception as e:
        logger.error(f"Error handling post deletion: {str(e)}")