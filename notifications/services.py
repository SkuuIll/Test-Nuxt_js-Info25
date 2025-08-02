"""
Service layer for notification management
"""
import logging
from typing import List, Dict, Any, Optional, Union
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import transaction
from django.core.exceptions import ValidationError
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Notification, NotificationPreference, NotificationBatch

User = get_user_model()
logger = logging.getLogger(__name__)
channel_layer = get_channel_layer()


class NotificationService:
    """
    Service class for managing notifications
    """
    
    @staticmethod
    def create_notification(
        recipient: User,
        notification_type: str,
        title: str,
        message: str,
        sender: Optional[User] = None,
        priority: str = 'normal',
        data: Optional[Dict[str, Any]] = None,
        action_url: Optional[str] = None,
        expires_at: Optional[timezone.datetime] = None,
        send_immediately: bool = True
    ) -> Notification:
        """
        Create and optionally send a notification
        
        Args:
            recipient: User who will receive the notification
            notification_type: Type of notification (from NOTIFICATION_TYPES)
            title: Notification title
            message: Notification message
            sender: User who triggered the notification (optional)
            priority: Priority level (low, normal, high, urgent)
            data: Additional context data
            action_url: URL to navigate to when clicked
            expires_at: When the notification expires
            send_immediately: Whether to send via WebSocket immediately
            
        Returns:
            Created Notification instance
        """
        try:
            with transaction.atomic():
                # Check user preferences
                preferences = NotificationPreference.get_or_create_for_user(recipient)
                
                # Check if this notification type is enabled
                if not preferences.is_notification_enabled(notification_type):
                    logger.info(f"Notification type {notification_type} disabled for user {recipient.username}")
                    return None
                
                # Check quiet hours
                if preferences.is_in_quiet_hours() and priority != 'urgent':
                    logger.info(f"User {recipient.username} is in quiet hours, skipping notification")
                    return None
                
                # Create notification
                notification = Notification.objects.create(
                    recipient=recipient,
                    sender=sender,
                    notification_type=notification_type,
                    title=title,
                    message=message,
                    priority=priority,
                    data=data or {},
                    action_url=action_url or '',
                    expires_at=expires_at
                )
                
                logger.info(f"Created notification {notification.id} for user {recipient.username}")
                
                # Send immediately if requested
                if send_immediately:
                    NotificationService.send_to_user(notification)
                
                return notification
                
        except Exception as e:
            logger.error(f"Error creating notification: {str(e)}")
            raise
    
    @staticmethod
    def send_to_user(notification: Notification) -> bool:
        """
        Send notification to specific user via WebSocket
        
        Args:
            notification: Notification instance to send
            
        Returns:
            True if sent successfully, False otherwise
        """
        try:
            if not channel_layer:
                logger.warning("Channel layer not configured, cannot send WebSocket notification")
                return False
            
            # Prepare notification data
            notification_data = notification.to_dict()
            
            # Send to user-specific group
            group_name = f"user_{notification.recipient.id}"
            
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    'type': 'notification_message',
                    'notification': notification_data
                }
            )
            
            # Mark as delivered
            notification.mark_as_delivered()
            
            logger.info(f"Sent notification {notification.id} to user {notification.recipient.username}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending notification to user: {str(e)}")
            return False
    
    @staticmethod
    def send_to_group(
        group_name: str, 
        notification_type: str,
        title: str,
        message: str,
        sender: Optional[User] = None,
        priority: str = 'normal',
        data: Optional[Dict[str, Any]] = None,
        action_url: Optional[str] = None
    ) -> List[Notification]:
        """
        Send notification to a group of users
        
        Args:
            group_name: Name of the group (e.g., 'staff_users', 'admin_users')
            notification_type: Type of notification
            title: Notification title
            message: Notification message
            sender: User who triggered the notification
            priority: Priority level
            data: Additional context data
            action_url: URL to navigate to when clicked
            
        Returns:
            List of created Notification instances
        """
        try:
            notifications = []
            
            # Determine recipients based on group
            if group_name == 'staff_users':
                recipients = User.objects.filter(is_staff=True, is_active=True)
            elif group_name == 'admin_users':
                recipients = User.objects.filter(is_superuser=True, is_active=True)
            elif group_name == 'all_users':
                recipients = User.objects.filter(is_active=True)
            else:
                logger.warning(f"Unknown group name: {group_name}")
                return []
            
            # Create notifications for each recipient
            with transaction.atomic():
                for recipient in recipients:
                    notification = NotificationService.create_notification(
                        recipient=recipient,
                        notification_type=notification_type,
                        title=title,
                        message=message,
                        sender=sender,
                        priority=priority,
                        data=data,
                        action_url=action_url,
                        send_immediately=False  # We'll send in batch
                    )
                    if notification:
                        notifications.append(notification)
                
                # Send to WebSocket group
                if channel_layer and notifications:
                    notification_data = notifications[0].to_dict()  # Use first notification as template
                    
                    async_to_sync(channel_layer.group_send)(
                        group_name,
                        {
                            'type': 'notification_message',
                            'notification': notification_data
                        }
                    )
                    
                    # Mark all as delivered
                    for notification in notifications:
                        notification.mark_as_delivered()
            
            logger.info(f"Sent {len(notifications)} notifications to group {group_name}")
            return notifications
            
        except Exception as e:
            logger.error(f"Error sending notification to group: {str(e)}")
            return []
    
    @staticmethod
    def mark_as_read(notification_id: int, user: User) -> bool:
        """
        Mark notification as read
        
        Args:
            notification_id: ID of the notification
            user: User marking the notification as read
            
        Returns:
            True if marked successfully, False otherwise
        """
        try:
            notification = Notification.objects.get(
                id=notification_id,
                recipient=user
            )
            
            if not notification.is_read:
                notification.mark_as_read()
                
                # Send update via WebSocket
                NotificationService._send_notification_update(
                    user,
                    {
                        'type': 'marked_read',
                        'notification_id': notification_id,
                        'unread_count': NotificationService.get_unread_count(user)
                    }
                )
                
                logger.info(f"Marked notification {notification_id} as read for user {user.username}")
                return True
            
            return True  # Already read
            
        except Notification.DoesNotExist:
            logger.warning(f"Notification {notification_id} not found for user {user.username}")
            return False
        except Exception as e:
            logger.error(f"Error marking notification as read: {str(e)}")
            return False
    
    @staticmethod
    def mark_all_as_read(user: User) -> int:
        """
        Mark all notifications as read for a user
        
        Args:
            user: User whose notifications to mark as read
            
        Returns:
            Number of notifications marked as read
        """
        try:
            unread_notifications = Notification.objects.filter(
                recipient=user,
                is_read=False
            )
            
            count = unread_notifications.count()
            
            # Mark all as read
            unread_notifications.update(
                is_read=True,
                read_at=timezone.now()
            )
            
            # Send update via WebSocket
            NotificationService._send_notification_update(
                user,
                {
                    'type': 'marked_all_read',
                    'count': count,
                    'unread_count': 0
                }
            )
            
            logger.info(f"Marked {count} notifications as read for user {user.username}")
            return count
            
        except Exception as e:
            logger.error(f"Error marking all notifications as read: {str(e)}")
            return 0
    
    @staticmethod
    def dismiss_notification(notification_id: int, user: User) -> bool:
        """
        Dismiss a notification
        
        Args:
            notification_id: ID of the notification
            user: User dismissing the notification
            
        Returns:
            True if dismissed successfully, False otherwise
        """
        try:
            notification = Notification.objects.get(
                id=notification_id,
                recipient=user
            )
            
            if not notification.is_dismissed:
                notification.dismiss()
                
                # Send update via WebSocket
                NotificationService._send_notification_update(
                    user,
                    {
                        'type': 'dismissed',
                        'notification_id': notification_id
                    }
                )
                
                logger.info(f"Dismissed notification {notification_id} for user {user.username}")
                return True
            
            return True  # Already dismissed
            
        except Notification.DoesNotExist:
            logger.warning(f"Notification {notification_id} not found for user {user.username}")
            return False
        except Exception as e:
            logger.error(f"Error dismissing notification: {str(e)}")
            return False
    
    @staticmethod
    def get_unread_count(user: User) -> int:
        """
        Get count of unread notifications for a user
        
        Args:
            user: User to get count for
            
        Returns:
            Number of unread notifications
        """
        try:
            return Notification.objects.filter(
                recipient=user,
                is_read=False,
                is_dismissed=False
            ).count()
        except Exception as e:
            logger.error(f"Error getting unread count: {str(e)}")
            return 0
    
    @staticmethod
    def get_user_notifications(
        user: User,
        limit: int = 20,
        offset: int = 0,
        include_read: bool = True,
        notification_types: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Get notifications for a user with pagination
        
        Args:
            user: User to get notifications for
            limit: Maximum number of notifications to return
            offset: Number of notifications to skip
            include_read: Whether to include read notifications
            notification_types: Filter by notification types
            
        Returns:
            Dictionary with notifications and metadata
        """
        try:
            queryset = Notification.objects.filter(
                recipient=user,
                is_dismissed=False
            ).select_related('sender')
            
            if not include_read:
                queryset = queryset.filter(is_read=False)
            
            if notification_types:
                queryset = queryset.filter(notification_type__in=notification_types)
            
            total_count = queryset.count()
            notifications = list(queryset[offset:offset + limit])
            
            return {
                'notifications': [n.to_dict() for n in notifications],
                'total_count': total_count,
                'unread_count': NotificationService.get_unread_count(user),
                'has_more': offset + limit < total_count
            }
            
        except Exception as e:
            logger.error(f"Error getting user notifications: {str(e)}")
            return {
                'notifications': [],
                'total_count': 0,
                'unread_count': 0,
                'has_more': False
            }
    
    @staticmethod
    def cleanup_expired_notifications() -> int:
        """
        Remove expired notifications
        
        Returns:
            Number of notifications cleaned up
        """
        try:
            expired_notifications = Notification.objects.filter(
                expires_at__lt=timezone.now()
            )
            
            count = expired_notifications.count()
            expired_notifications.delete()
            
            logger.info(f"Cleaned up {count} expired notifications")
            return count
            
        except Exception as e:
            logger.error(f"Error cleaning up expired notifications: {str(e)}")
            return 0
    
    @staticmethod
    def cleanup_old_notifications(days: int = 30) -> int:
        """
        Remove old read notifications
        
        Args:
            days: Number of days to keep notifications
            
        Returns:
            Number of notifications cleaned up
        """
        try:
            cutoff_date = timezone.now() - timezone.timedelta(days=days)
            
            old_notifications = Notification.objects.filter(
                created_at__lt=cutoff_date,
                is_read=True
            )
            
            count = old_notifications.count()
            old_notifications.delete()
            
            logger.info(f"Cleaned up {count} old notifications (older than {days} days)")
            return count
            
        except Exception as e:
            logger.error(f"Error cleaning up old notifications: {str(e)}")
            return 0
    
    @staticmethod
    def send_batch(batch: NotificationBatch) -> bool:
        """
        Send all notifications in a batch
        
        Args:
            batch: NotificationBatch instance to send
            
        Returns:
            True if sent successfully, False otherwise
        """
        try:
            # This is a placeholder for batch sending logic
            # In a real implementation, you would iterate through
            # all notifications associated with this batch
            
            logger.info(f"Sending notification batch: {batch.title}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending notification batch: {str(e)}")
            return False
    
    @staticmethod
    def create_system_announcement(
        title: str,
        message: str,
        priority: str = 'normal',
        target_group: str = 'all_users',
        expires_at: Optional[timezone.datetime] = None,
        sender: Optional[User] = None
    ) -> List[Notification]:
        """
        Create a system-wide announcement
        
        Args:
            title: Announcement title
            message: Announcement message
            priority: Priority level
            target_group: Target group for the announcement
            expires_at: When the announcement expires
            sender: User creating the announcement
            
        Returns:
            List of created notifications
        """
        try:
            return NotificationService.send_to_group(
                group_name=target_group,
                notification_type='system_announcement',
                title=title,
                message=message,
                sender=sender,
                priority=priority,
                data={'expires_at': expires_at.isoformat() if expires_at else None}
            )
            
        except Exception as e:
            logger.error(f"Error creating system announcement: {str(e)}")
            return []
    
    @staticmethod
    def _send_notification_update(user: User, update_data: Dict[str, Any]) -> bool:
        """
        Send notification update via WebSocket
        
        Args:
            user: User to send update to
            update_data: Update data to send
            
        Returns:
            True if sent successfully, False otherwise
        """
        try:
            if not channel_layer:
                return False
            
            group_name = f"user_{user.id}"
            
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    'type': 'notification_update',
                    'update': update_data
                }
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Error sending notification update: {str(e)}")
            return False