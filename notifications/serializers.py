"""
Serializers for notifications API
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Notification, NotificationPreference, NotificationBatch

User = get_user_model()


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user serializer for notification context"""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id', 'username', 'email', 'first_name', 'last_name']


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification model"""
    
    sender = UserBasicSerializer(read_only=True)
    recipient = UserBasicSerializer(read_only=True)
    age_in_days = serializers.ReadOnlyField()
    is_expired = serializers.ReadOnlyField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'recipient', 'sender', 'notification_type', 'title', 'message',
            'priority', 'data', 'action_url', 'is_read', 'is_dismissed',
            'delivered_at', 'read_at', 'created_at', 'updated_at', 'expires_at',
            'age_in_days', 'is_expired'
        ]
        read_only_fields = [
            'id', 'recipient', 'sender', 'delivered_at', 'read_at', 
            'created_at', 'updated_at', 'age_in_days', 'is_expired'
        ]
    
    def to_representation(self, instance):
        """Custom representation to include computed fields"""
        data = super().to_representation(instance)
        
        # Add formatted timestamps
        if instance.created_at:
            data['created_at_formatted'] = instance.created_at.strftime('%Y-%m-%d %H:%M:%S')
        
        if instance.read_at:
            data['read_at_formatted'] = instance.read_at.strftime('%Y-%m-%d %H:%M:%S')
        
        # Add notification type display name
        data['notification_type_display'] = instance.get_notification_type_display()
        data['priority_display'] = instance.get_priority_display()
        
        return data


class NotificationListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for notification lists"""
    
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    notification_type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    age_in_days = serializers.ReadOnlyField()
    is_expired = serializers.ReadOnlyField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'notification_type_display', 'title', 'message',
            'priority', 'priority_display', 'sender_username', 'action_url',
            'is_read', 'is_dismissed', 'created_at', 'expires_at',
            'age_in_days', 'is_expired'
        ]
        read_only_fields = [
            'id', 'notification_type', 'notification_type_display', 'title', 'message',
            'priority', 'priority_display', 'sender_username', 'action_url',
            'created_at', 'expires_at', 'age_in_days', 'is_expired'
        ]


class NotificationUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating notification status"""
    
    class Meta:
        model = Notification
        fields = ['is_read', 'is_dismissed']
    
    def update(self, instance, validated_data):
        """Custom update logic for notification status"""
        if 'is_read' in validated_data:
            if validated_data['is_read']:
                instance.mark_as_read()
            else:
                instance.mark_as_unread()
        
        if 'is_dismissed' in validated_data and validated_data['is_dismissed']:
            instance.dismiss()
        
        return instance


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """Serializer for NotificationPreference model"""
    
    user = UserBasicSerializer(read_only=True)
    
    class Meta:
        model = NotificationPreference
        fields = [
            'id', 'user', 'email_notifications', 'push_notifications', 'in_app_notifications',
            'notify_comments', 'notify_comment_replies', 'notify_post_likes',
            'notify_user_follows', 'notify_post_featured', 'notify_content_moderation',
            'notify_system_announcements', 'notify_user_registrations',
            'notify_moderation_required', 'notify_post_published',
            'quiet_hours_enabled', 'quiet_hours_start', 'quiet_hours_end',
            'digest_frequency', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Validate notification preferences"""
        # Validate quiet hours
        if data.get('quiet_hours_enabled'):
            if not data.get('quiet_hours_start') or not data.get('quiet_hours_end'):
                raise serializers.ValidationError(
                    "Quiet hours start and end times are required when quiet hours are enabled."
                )
        
        return data


class NotificationBatchSerializer(serializers.ModelSerializer):
    """Serializer for NotificationBatch model"""
    
    class Meta:
        model = NotificationBatch
        fields = [
            'id', 'title', 'description', 'batch_type', 'is_sent', 'sent_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'is_sent', 'sent_at', 'created_at', 'updated_at']


class BulkNotificationActionSerializer(serializers.Serializer):
    """Serializer for bulk notification actions"""
    
    notification_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1,
        help_text="List of notification IDs to perform action on"
    )
    action = serializers.ChoiceField(
        choices=['mark_read', 'mark_unread', 'dismiss'],
        help_text="Action to perform on the notifications"
    )
    
    def validate_notification_ids(self, value):
        """Validate that notification IDs exist and belong to the user"""
        user = self.context['request'].user
        
        existing_ids = set(
            Notification.objects.filter(
                id__in=value,
                recipient=user
            ).values_list('id', flat=True)
        )
        
        invalid_ids = set(value) - existing_ids
        if invalid_ids:
            raise serializers.ValidationError(
                f"Invalid notification IDs: {list(invalid_ids)}"
            )
        
        return value


class SystemAnnouncementSerializer(serializers.Serializer):
    """Serializer for creating system announcements"""
    
    title = serializers.CharField(max_length=255)
    message = serializers.CharField()
    priority = serializers.ChoiceField(
        choices=Notification.PRIORITY_LEVELS,
        default='normal'
    )
    target_group = serializers.ChoiceField(
        choices=[
            ('all_users', 'All Users'),
            ('staff_users', 'Staff Users'),
            ('admin_users', 'Admin Users'),
        ],
        default='all_users'
    )
    expires_at = serializers.DateTimeField(required=False, allow_null=True)
    
    def validate(self, data):
        """Validate system announcement data"""
        # Check if user has permission to create announcements
        user = self.context['request'].user
        if not user.is_staff:
            raise serializers.ValidationError(
                "Only staff users can create system announcements."
            )
        
        # Validate expiration date
        if data.get('expires_at'):
            from django.utils import timezone
            if data['expires_at'] <= timezone.now():
                raise serializers.ValidationError(
                    "Expiration date must be in the future."
                )
        
        return data


class NotificationStatsSerializer(serializers.Serializer):
    """Serializer for notification statistics"""
    
    total_notifications = serializers.IntegerField(read_only=True)
    unread_notifications = serializers.IntegerField(read_only=True)
    notifications_by_type = serializers.DictField(read_only=True)
    notifications_by_priority = serializers.DictField(read_only=True)
    recent_notifications_count = serializers.IntegerField(read_only=True)
    
    def to_representation(self, instance):
        """Generate notification statistics"""
        user = instance  # instance is the user object
        
        from django.db.models import Count
        from django.utils import timezone
        from datetime import timedelta
        
        # Get base queryset
        notifications = Notification.objects.filter(recipient=user)
        
        # Calculate statistics
        total_notifications = notifications.count()
        unread_notifications = notifications.filter(is_read=False, is_dismissed=False).count()
        
        # Notifications by type
        notifications_by_type = dict(
            notifications.values('notification_type')
            .annotate(count=Count('id'))
            .values_list('notification_type', 'count')
        )
        
        # Notifications by priority
        notifications_by_priority = dict(
            notifications.values('priority')
            .annotate(count=Count('id'))
            .values_list('priority', 'count')
        )
        
        # Recent notifications (last 7 days)
        recent_date = timezone.now() - timedelta(days=7)
        recent_notifications_count = notifications.filter(
            created_at__gte=recent_date
        ).count()
        
        return {
            'total_notifications': total_notifications,
            'unread_notifications': unread_notifications,
            'notifications_by_type': notifications_by_type,
            'notifications_by_priority': notifications_by_priority,
            'recent_notifications_count': recent_notifications_count,
        }