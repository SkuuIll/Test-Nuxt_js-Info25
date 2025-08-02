"""
Admin configuration for notifications app
"""
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import Notification, NotificationPreference, NotificationBatch


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """Admin interface for Notification model"""
    
    list_display = [
        'title', 'recipient', 'notification_type', 'priority', 
        'is_read', 'is_dismissed', 'created_at', 'expires_at'
    ]
    list_filter = [
        'notification_type', 'priority', 'is_read', 'is_dismissed', 
        'created_at', 'expires_at'
    ]
    search_fields = ['title', 'message', 'recipient__username', 'recipient__email']
    readonly_fields = ['created_at', 'updated_at', 'delivered_at', 'read_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('recipient', 'sender', 'notification_type', 'priority')
        }),
        ('Content', {
            'fields': ('title', 'message', 'action_url', 'data')
        }),
        ('Status', {
            'fields': ('is_read', 'is_dismissed', 'expires_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'delivered_at', 'read_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related('recipient', 'sender')
    
    actions = ['mark_as_read', 'mark_as_unread', 'dismiss_notifications']
    
    def mark_as_read(self, request, queryset):
        """Mark selected notifications as read"""
        count = 0
        for notification in queryset:
            if not notification.is_read:
                notification.mark_as_read()
                count += 1
        self.message_user(request, f'{count} notifications marked as read.')
    mark_as_read.short_description = "Mark selected notifications as read"
    
    def mark_as_unread(self, request, queryset):
        """Mark selected notifications as unread"""
        count = 0
        for notification in queryset:
            if notification.is_read:
                notification.mark_as_unread()
                count += 1
        self.message_user(request, f'{count} notifications marked as unread.')
    mark_as_unread.short_description = "Mark selected notifications as unread"
    
    def dismiss_notifications(self, request, queryset):
        """Dismiss selected notifications"""
        count = 0
        for notification in queryset:
            if not notification.is_dismissed:
                notification.dismiss()
                count += 1
        self.message_user(request, f'{count} notifications dismissed.')
    dismiss_notifications.short_description = "Dismiss selected notifications"


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    """Admin interface for NotificationPreference model"""
    
    list_display = [
        'user', 'email_notifications', 'push_notifications', 
        'in_app_notifications', 'quiet_hours_enabled', 'digest_frequency'
    ]
    list_filter = [
        'email_notifications', 'push_notifications', 'in_app_notifications',
        'quiet_hours_enabled', 'digest_frequency'
    ]
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('General Preferences', {
            'fields': ('email_notifications', 'push_notifications', 'in_app_notifications')
        }),
        ('Notification Types', {
            'fields': (
                'notify_comments', 'notify_comment_replies', 'notify_post_likes',
                'notify_user_follows', 'notify_post_featured', 'notify_content_moderation',
                'notify_system_announcements'
            )
        }),
        ('Admin Preferences', {
            'fields': (
                'notify_user_registrations', 'notify_moderation_required', 
                'notify_post_published'
            ),
            'description': 'These preferences only apply to staff users'
        }),
        ('Quiet Hours', {
            'fields': ('quiet_hours_enabled', 'quiet_hours_start', 'quiet_hours_end')
        }),
        ('Digest Settings', {
            'fields': ('digest_frequency',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related('user')


@admin.register(NotificationBatch)
class NotificationBatchAdmin(admin.ModelAdmin):
    """Admin interface for NotificationBatch model"""
    
    list_display = ['title', 'batch_type', 'is_sent', 'sent_at', 'created_at']
    list_filter = ['batch_type', 'is_sent', 'created_at', 'sent_at']
    search_fields = ['title', 'description', 'batch_type']
    readonly_fields = ['created_at', 'updated_at', 'sent_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'batch_type')
        }),
        ('Status', {
            'fields': ('is_sent', 'sent_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['send_batch']
    
    def send_batch(self, request, queryset):
        """Send selected notification batches"""
        count = 0
        for batch in queryset:
            if not batch.is_sent:
                batch.send_batch()
                count += 1
        self.message_user(request, f'{count} notification batches sent.')
    send_batch.short_description = "Send selected notification batches"