"""
API views for notifications
"""
import logging
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q
from .models import Notification, NotificationPreference, NotificationBatch
from .serializers import (
    NotificationSerializer, NotificationListSerializer, NotificationUpdateSerializer,
    NotificationPreferenceSerializer, BulkNotificationActionSerializer,
    SystemAnnouncementSerializer, NotificationStatsSerializer
)
from .services import NotificationService

logger = logging.getLogger(__name__)


class NotificationPagination(PageNumberPagination):
    """Custom pagination for notifications"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class NotificationListView(generics.ListAPIView):
    """
    List notifications for the authenticated user
    """
    serializer_class = NotificationListSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = NotificationPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['notification_type', 'priority', 'is_read', 'is_dismissed']
    search_fields = ['title', 'message']
    ordering_fields = ['created_at', 'priority', 'is_read']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Get notifications for the current user"""
        queryset = Notification.objects.filter(
            recipient=self.request.user
        ).select_related('sender')
        
        # Filter by read status
        include_read = self.request.query_params.get('include_read', 'true').lower()
        if include_read == 'false':
            queryset = queryset.filter(is_read=False)
        
        # Filter by dismissed status
        include_dismissed = self.request.query_params.get('include_dismissed', 'false').lower()
        if include_dismissed == 'false':
            queryset = queryset.filter(is_dismissed=False)
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        if date_from:
            try:
                date_from = timezone.datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                queryset = queryset.filter(created_at__gte=date_from)
            except ValueError:
                pass
        
        if date_to:
            try:
                date_to = timezone.datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                queryset = queryset.filter(created_at__lte=date_to)
            except ValueError:
                pass
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        """Custom list response with additional metadata"""
        response = super().list(request, *args, **kwargs)
        
        # Add unread count to response
        unread_count = NotificationService.get_unread_count(request.user)
        response.data['unread_count'] = unread_count
        
        return response


class NotificationDetailView(generics.RetrieveUpdateAPIView):
    """
    Retrieve and update a specific notification
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get notifications for the current user"""
        return Notification.objects.filter(
            recipient=self.request.user
        ).select_related('sender')
    
    def get_serializer_class(self):
        """Use different serializer for updates"""
        if self.request.method in ['PUT', 'PATCH']:
            return NotificationUpdateSerializer
        return NotificationSerializer
    
    def retrieve(self, request, *args, **kwargs):
        """Mark notification as read when retrieved"""
        instance = self.get_object()
        
        # Automatically mark as read when viewed
        if not instance.is_read:
            instance.mark_as_read()
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_notification_read(request, pk):
    """Mark a specific notification as read"""
    try:
        success = NotificationService.mark_as_read(pk, request.user)
        
        if success:
            unread_count = NotificationService.get_unread_count(request.user)
            return Response({
                'success': True,
                'message': 'Notification marked as read',
                'unread_count': unread_count
            })
        else:
            return Response({
                'success': False,
                'message': 'Notification not found or already read'
            }, status=status.HTTP_404_NOT_FOUND)
    
    except Exception as e:
        logger.error(f"Error marking notification as read: {str(e)}")
        return Response({
            'success': False,
            'message': 'Error marking notification as read'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_all_notifications_read(request):
    """Mark all notifications as read for the current user"""
    try:
        count = NotificationService.mark_all_as_read(request.user)
        
        return Response({
            'success': True,
            'message': f'{count} notifications marked as read',
            'count': count,
            'unread_count': 0
        })
    
    except Exception as e:
        logger.error(f"Error marking all notifications as read: {str(e)}")
        return Response({
            'success': False,
            'message': 'Error marking notifications as read'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def dismiss_notification(request, pk):
    """Dismiss a specific notification"""
    try:
        success = NotificationService.dismiss_notification(pk, request.user)
        
        if success:
            return Response({
                'success': True,
                'message': 'Notification dismissed'
            })
        else:
            return Response({
                'success': False,
                'message': 'Notification not found or already dismissed'
            }, status=status.HTTP_404_NOT_FOUND)
    
    except Exception as e:
        logger.error(f"Error dismissing notification: {str(e)}")
        return Response({
            'success': False,
            'message': 'Error dismissing notification'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def bulk_notification_action(request):
    """Perform bulk actions on notifications"""
    serializer = BulkNotificationActionSerializer(
        data=request.data,
        context={'request': request}
    )
    
    if serializer.is_valid():
        notification_ids = serializer.validated_data['notification_ids']
        action = serializer.validated_data['action']
        
        try:
            notifications = Notification.objects.filter(
                id__in=notification_ids,
                recipient=request.user
            )
            
            count = 0
            
            if action == 'mark_read':
                for notification in notifications:
                    if not notification.is_read:
                        notification.mark_as_read()
                        count += 1
            elif action == 'mark_unread':
                for notification in notifications:
                    if notification.is_read:
                        notification.mark_as_unread()
                        count += 1
            elif action == 'dismiss':
                for notification in notifications:
                    if not notification.is_dismissed:
                        notification.dismiss()
                        count += 1
            
            unread_count = NotificationService.get_unread_count(request.user)
            
            return Response({
                'success': True,
                'message': f'{count} notifications updated',
                'count': count,
                'unread_count': unread_count
            })
        
        except Exception as e:
            logger.error(f"Error performing bulk action: {str(e)}")
            return Response({
                'success': False,
                'message': 'Error performing bulk action'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def notification_stats(request):
    """Get notification statistics for the current user"""
    try:
        serializer = NotificationStatsSerializer(request.user)
        return Response(serializer.data)
    
    except Exception as e:
        logger.error(f"Error getting notification stats: {str(e)}")
        return Response({
            'error': 'Error retrieving notification statistics'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def unread_count(request):
    """Get unread notification count for the current user"""
    try:
        count = NotificationService.get_unread_count(request.user)
        return Response({
            'unread_count': count
        })
    
    except Exception as e:
        logger.error(f"Error getting unread count: {str(e)}")
        return Response({
            'error': 'Error retrieving unread count'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class NotificationPreferenceView(generics.RetrieveUpdateAPIView):
    """
    Retrieve and update notification preferences for the current user
    """
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        """Get or create notification preferences for the current user"""
        preferences, created = NotificationPreference.objects.get_or_create(
            user=self.request.user
        )
        return preferences
    
    def update(self, request, *args, **kwargs):
        """Custom update with logging"""
        response = super().update(request, *args, **kwargs)
        
        if response.status_code == 200:
            logger.info(f"Updated notification preferences for user {request.user.username}")
        
        return response


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def create_system_announcement(request):
    """Create a system-wide announcement (admin only)"""
    serializer = SystemAnnouncementSerializer(
        data=request.data,
        context={'request': request}
    )
    
    if serializer.is_valid():
        try:
            notifications = NotificationService.create_system_announcement(
                title=serializer.validated_data['title'],
                message=serializer.validated_data['message'],
                priority=serializer.validated_data['priority'],
                target_group=serializer.validated_data['target_group'],
                expires_at=serializer.validated_data.get('expires_at'),
                sender=request.user
            )
            
            return Response({
                'success': True,
                'message': f'System announcement sent to {len(notifications)} users',
                'notification_count': len(notifications)
            })
        
        except Exception as e:
            logger.error(f"Error creating system announcement: {str(e)}")
            return Response({
                'success': False,
                'message': 'Error creating system announcement'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def cleanup_notifications(request):
    """Cleanup old and expired notifications (admin only)"""
    try:
        expired_count = NotificationService.cleanup_expired_notifications()
        
        # Get days parameter for old notifications cleanup
        days = request.data.get('days', 30)
        try:
            days = int(days)
        except (ValueError, TypeError):
            days = 30
        
        old_count = NotificationService.cleanup_old_notifications(days)
        
        return Response({
            'success': True,
            'message': 'Notification cleanup completed',
            'expired_notifications_removed': expired_count,
            'old_notifications_removed': old_count,
            'total_removed': expired_count + old_count
        })
    
    except Exception as e:
        logger.error(f"Error cleaning up notifications: {str(e)}")
        return Response({
            'success': False,
            'message': 'Error cleaning up notifications'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Admin views for notification management
class AdminNotificationListView(generics.ListAPIView):
    """
    Admin view to list all notifications (admin only)
    """
    serializer_class = NotificationListSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = NotificationPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['notification_type', 'priority', 'is_read', 'is_dismissed', 'recipient']
    search_fields = ['title', 'message', 'recipient__username', 'recipient__email']
    ordering_fields = ['created_at', 'priority', 'is_read']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Get all notifications for admin view"""
        return Notification.objects.all().select_related('sender', 'recipient')


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def admin_notification_stats(request):
    """Get system-wide notification statistics (admin only)"""
    try:
        from django.db.models import Count
        from datetime import timedelta
        
        # Total notifications
        total_notifications = Notification.objects.count()
        
        # Unread notifications
        unread_notifications = Notification.objects.filter(is_read=False).count()
        
        # Notifications by type
        notifications_by_type = dict(
            Notification.objects.values('notification_type')
            .annotate(count=Count('id'))
            .values_list('notification_type', 'count')
        )
        
        # Notifications by priority
        notifications_by_priority = dict(
            Notification.objects.values('priority')
            .annotate(count=Count('id'))
            .values_list('priority', 'count')
        )
        
        # Recent notifications (last 7 days)
        recent_date = timezone.now() - timedelta(days=7)
        recent_notifications = Notification.objects.filter(
            created_at__gte=recent_date
        ).count()
        
        # Active users with notifications
        active_users = Notification.objects.values('recipient').distinct().count()
        
        return Response({
            'total_notifications': total_notifications,
            'unread_notifications': unread_notifications,
            'notifications_by_type': notifications_by_type,
            'notifications_by_priority': notifications_by_priority,
            'recent_notifications': recent_notifications,
            'active_users_with_notifications': active_users
        })
    
    except Exception as e:
        logger.error(f"Error getting admin notification stats: {str(e)}")
        return Response({
            'error': 'Error retrieving notification statistics'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)