"""
URL configuration for notifications app
"""
from django.urls import path
from . import api_views

app_name = 'notifications'

urlpatterns = [
    # User notification endpoints
    path('', api_views.NotificationListView.as_view(), name='notification-list'),
    path('<int:pk>/', api_views.NotificationDetailView.as_view(), name='notification-detail'),
    path('<int:pk>/read/', api_views.mark_notification_read, name='mark-read'),
    path('<int:pk>/dismiss/', api_views.dismiss_notification, name='dismiss'),
    path('mark-all-read/', api_views.mark_all_notifications_read, name='mark-all-read'),
    path('bulk-action/', api_views.bulk_notification_action, name='bulk-action'),
    path('stats/', api_views.notification_stats, name='stats'),
    path('unread-count/', api_views.unread_count, name='unread-count'),
    
    # User preferences
    path('preferences/', api_views.NotificationPreferenceView.as_view(), name='preferences'),
    
    # System announcements (admin only)
    path('announcements/create/', api_views.create_system_announcement, name='create-announcement'),
    path('cleanup/', api_views.cleanup_notifications, name='cleanup'),
    
    # Admin endpoints
    path('admin/all/', api_views.AdminNotificationListView.as_view(), name='admin-list'),
    path('admin/stats/', api_views.admin_notification_stats, name='admin-stats'),
]