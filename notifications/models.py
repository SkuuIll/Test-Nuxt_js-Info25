"""
Models for the notifications system
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.urls import reverse
import json

User = get_user_model()


class Notification(models.Model):
    """
    Model for storing user notifications
    """
    
    NOTIFICATION_TYPES = [
        ('comment', 'New Comment'),
        ('user_registration', 'User Registration'),
        ('post_published', 'Post Published'),
        ('post_featured', 'Post Featured'),
        ('system_announcement', 'System Announcement'),
        ('moderation_required', 'Moderation Required'),
        ('post_liked', 'Post Liked'),
        ('comment_reply', 'Comment Reply'),
        ('user_followed', 'User Followed'),
        ('content_approved', 'Content Approved'),
        ('content_rejected', 'Content Rejected'),
    ]
    
    PRIORITY_LEVELS = [
        ('low', 'Low'),
        ('normal', 'Normal'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    # Core fields
    recipient = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='notifications',
        help_text="User who will receive this notification"
    )
    sender = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='sent_notifications',
        help_text="User who triggered this notification (optional)"
    )
    
    # Notification content
    notification_type = models.CharField(
        max_length=50, 
        choices=NOTIFICATION_TYPES,
        help_text="Type of notification"
    )
    title = models.CharField(
        max_length=255,
        help_text="Notification title"
    )
    message = models.TextField(
        help_text="Notification message content"
    )
    priority = models.CharField(
        max_length=10, 
        choices=PRIORITY_LEVELS, 
        default='normal',
        help_text="Priority level of the notification"
    )
    
    # Metadata and context
    data = models.JSONField(
        default=dict, 
        blank=True,
        help_text="Additional context data for the notification"
    )
    action_url = models.URLField(
        blank=True,
        help_text="URL to navigate to when notification is clicked"
    )
    
    # Status tracking
    is_read = models.BooleanField(
        default=False,
        help_text="Whether the notification has been read"
    )
    is_dismissed = models.BooleanField(
        default=False,
        help_text="Whether the notification has been dismissed"
    )
    delivered_at = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="When the notification was delivered via WebSocket"
    )
    read_at = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="When the notification was marked as read"
    )
    
    # Timestamps
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When the notification was created"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="When the notification was last updated"
    )
    expires_at = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="When the notification expires (optional)"
    )
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['recipient', 'created_at']),
            models.Index(fields=['notification_type', 'created_at']),
            models.Index(fields=['priority', 'created_at']),
            models.Index(fields=['is_read', 'created_at']),
            models.Index(fields=['expires_at']),
        ]
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
    
    def __str__(self):
        return f"{self.title} - {self.recipient.username}"
    
    def mark_as_read(self):
        """Mark notification as read"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])
    
    def mark_as_unread(self):
        """Mark notification as unread"""
        if self.is_read:
            self.is_read = False
            self.read_at = None
            self.save(update_fields=['is_read', 'read_at'])
    
    def dismiss(self):
        """Dismiss notification"""
        if not self.is_dismissed:
            self.is_dismissed = True
            self.save(update_fields=['is_dismissed'])
    
    def mark_as_delivered(self):
        """Mark notification as delivered via WebSocket"""
        if not self.delivered_at:
            self.delivered_at = timezone.now()
            self.save(update_fields=['delivered_at'])
    
    @property
    def is_expired(self):
        """Check if notification has expired"""
        if self.expires_at:
            return timezone.now() > self.expires_at
        return False
    
    @property
    def age_in_days(self):
        """Get age of notification in days"""
        return (timezone.now() - self.created_at).days
    
    def get_absolute_url(self):
        """Get URL for this notification"""
        if self.action_url:
            return self.action_url
        return reverse('notifications:detail', kwargs={'pk': self.pk})
    
    def to_dict(self):
        """Convert notification to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'recipient': {
                'id': self.recipient.id,
                'username': self.recipient.username,
                'email': self.recipient.email,
            },
            'sender': {
                'id': self.sender.id,
                'username': self.sender.username,
                'email': self.sender.email,
            } if self.sender else None,
            'notification_type': self.notification_type,
            'title': self.title,
            'message': self.message,
            'priority': self.priority,
            'data': self.data,
            'action_url': self.action_url,
            'is_read': self.is_read,
            'is_dismissed': self.is_dismissed,
            'delivered_at': self.delivered_at.isoformat() if self.delivered_at else None,
            'read_at': self.read_at.isoformat() if self.read_at else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'is_expired': self.is_expired,
            'age_in_days': self.age_in_days,
        }


class NotificationPreference(models.Model):
    """
    Model for storing user notification preferences
    """
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='notification_preferences',
        help_text="User these preferences belong to"
    )
    
    # General preferences
    email_notifications = models.BooleanField(
        default=True,
        help_text="Receive notifications via email"
    )
    push_notifications = models.BooleanField(
        default=True,
        help_text="Receive browser push notifications"
    )
    in_app_notifications = models.BooleanField(
        default=True,
        help_text="Receive in-app notifications"
    )
    
    # Notification type preferences
    notify_comments = models.BooleanField(
        default=True,
        help_text="Notify when someone comments on your posts"
    )
    notify_comment_replies = models.BooleanField(
        default=True,
        help_text="Notify when someone replies to your comments"
    )
    notify_post_likes = models.BooleanField(
        default=True,
        help_text="Notify when someone likes your posts"
    )
    notify_user_follows = models.BooleanField(
        default=True,
        help_text="Notify when someone follows you"
    )
    notify_post_featured = models.BooleanField(
        default=True,
        help_text="Notify when your posts are featured"
    )
    notify_content_moderation = models.BooleanField(
        default=True,
        help_text="Notify about content moderation actions"
    )
    notify_system_announcements = models.BooleanField(
        default=True,
        help_text="Receive system announcements"
    )
    
    # Admin-specific preferences (only for staff users)
    notify_user_registrations = models.BooleanField(
        default=False,
        help_text="Notify when new users register (admin only)"
    )
    notify_moderation_required = models.BooleanField(
        default=False,
        help_text="Notify when content requires moderation (admin only)"
    )
    notify_post_published = models.BooleanField(
        default=False,
        help_text="Notify when posts are published (admin only)"
    )
    
    # Quiet hours
    quiet_hours_enabled = models.BooleanField(
        default=False,
        help_text="Enable quiet hours (no notifications during specified time)"
    )
    quiet_hours_start = models.TimeField(
        null=True,
        blank=True,
        help_text="Start time for quiet hours"
    )
    quiet_hours_end = models.TimeField(
        null=True,
        blank=True,
        help_text="End time for quiet hours"
    )
    
    # Frequency settings
    digest_frequency = models.CharField(
        max_length=20,
        choices=[
            ('never', 'Never'),
            ('daily', 'Daily'),
            ('weekly', 'Weekly'),
            ('monthly', 'Monthly'),
        ],
        default='weekly',
        help_text="How often to receive notification digest emails"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Notification Preference'
        verbose_name_plural = 'Notification Preferences'
    
    def __str__(self):
        return f"Notification preferences for {self.user.username}"
    
    def is_notification_enabled(self, notification_type):
        """Check if a specific notification type is enabled for this user"""
        type_mapping = {
            'comment': self.notify_comments,
            'comment_reply': self.notify_comment_replies,
            'post_liked': self.notify_post_likes,
            'user_followed': self.notify_user_follows,
            'post_featured': self.notify_post_featured,
            'content_approved': self.notify_content_moderation,
            'content_rejected': self.notify_content_moderation,
            'system_announcement': self.notify_system_announcements,
            'user_registration': self.notify_user_registrations,
            'moderation_required': self.notify_moderation_required,
            'post_published': self.notify_post_published,
        }
        return type_mapping.get(notification_type, True)
    
    def is_in_quiet_hours(self):
        """Check if current time is within quiet hours"""
        if not self.quiet_hours_enabled or not self.quiet_hours_start or not self.quiet_hours_end:
            return False
        
        now = timezone.now().time()
        start = self.quiet_hours_start
        end = self.quiet_hours_end
        
        if start <= end:
            # Same day quiet hours (e.g., 22:00 to 08:00 next day)
            return start <= now <= end
        else:
            # Overnight quiet hours (e.g., 22:00 to 08:00 next day)
            return now >= start or now <= end
    
    @classmethod
    def get_or_create_for_user(cls, user):
        """Get or create notification preferences for a user"""
        preferences, created = cls.objects.get_or_create(
            user=user,
            defaults={
                'email_notifications': True,
                'push_notifications': True,
                'in_app_notifications': True,
                'notify_comments': True,
                'notify_comment_replies': True,
                'notify_post_likes': True,
                'notify_user_follows': True,
                'notify_post_featured': True,
                'notify_content_moderation': True,
                'notify_system_announcements': True,
                'notify_user_registrations': user.is_staff,
                'notify_moderation_required': user.is_staff,
                'notify_post_published': user.is_staff,
            }
        )
        return preferences


class NotificationBatch(models.Model):
    """
    Model for grouping related notifications together
    """
    
    title = models.CharField(
        max_length=255,
        help_text="Title for the notification batch"
    )
    description = models.TextField(
        blank=True,
        help_text="Description of the notification batch"
    )
    batch_type = models.CharField(
        max_length=50,
        help_text="Type of notification batch"
    )
    
    # Status
    is_sent = models.BooleanField(
        default=False,
        help_text="Whether this batch has been sent"
    )
    sent_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this batch was sent"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Notification Batch'
        verbose_name_plural = 'Notification Batches'
    
    def __str__(self):
        return f"Batch: {self.title}"
    
    def send_batch(self):
        """Send all notifications in this batch"""
        if not self.is_sent:
            # This will be implemented in the service layer
            from .services import NotificationService
            NotificationService.send_batch(self)
            
            self.is_sent = True
            self.sent_at = timezone.now()
            self.save(update_fields=['is_sent', 'sent_at'])