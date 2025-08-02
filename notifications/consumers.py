"""
WebSocket consumers for real-time notifications
"""
import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth import get_user_model
from django.conf import settings

User = get_user_model()
logger = logging.getLogger(__name__)


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for handling real-time notifications
    """
    
    async def connect(self):
        """Handle WebSocket connection"""
        self.user = None
        self.user_group_name = None
        
        # Get user from token authentication
        user = await self.get_user_from_token()
        if user and user.is_authenticated:
            self.user = user
            self.user_group_name = f"user_{user.id}"
            
            # Join user-specific group
            await self.channel_layer.group_add(
                self.user_group_name,
                self.channel_name
            )
            
            # Join role-based groups
            if user.is_staff:
                await self.channel_layer.group_add(
                    "staff_users",
                    self.channel_name
                )
            
            if user.is_superuser:
                await self.channel_layer.group_add(
                    "admin_users",
                    self.channel_name
                )
            
            await self.accept()
            logger.info(f"WebSocket connected for user {user.username}")
            
            # Send connection confirmation
            await self.send(text_data=json.dumps({
                'type': 'connection_established',
                'message': 'Connected to notifications'
            }))
        else:
            logger.warning("WebSocket connection rejected: Invalid or missing token")
            await self.close()

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        if self.user and self.user_group_name:
            # Leave user-specific group
            await self.channel_layer.group_discard(
                self.user_group_name,
                self.channel_name
            )
            
            # Leave role-based groups
            if self.user.is_staff:
                await self.channel_layer.group_discard(
                    "staff_users",
                    self.channel_name
                )
            
            if self.user.is_superuser:
                await self.channel_layer.group_discard(
                    "admin_users",
                    self.channel_name
                )
            
            logger.info(f"WebSocket disconnected for user {self.user.username}")

    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type')
            
            if message_type == 'ping':
                # Respond to ping to keep connection alive
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': text_data_json.get('timestamp')
                }))
            elif message_type == 'mark_read':
                # Handle mark as read request
                notification_id = text_data_json.get('notification_id')
                if notification_id:
                    await self.mark_notification_read(notification_id)
            else:
                logger.warning(f"Unknown message type: {message_type}")
                
        except json.JSONDecodeError:
            logger.error("Invalid JSON received in WebSocket message")
        except Exception as e:
            logger.error(f"Error handling WebSocket message: {str(e)}")

    async def notification_message(self, event):
        """Send notification to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'notification': event['notification']
        }))

    async def notification_update(self, event):
        """Send notification update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'notification_update',
            'update': event['update']
        }))

    async def system_announcement(self, event):
        """Send system announcement to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'system_announcement',
            'announcement': event['announcement']
        }))

    @database_sync_to_async
    def get_user_from_token(self):
        """Extract user from JWT token in query string"""
        try:
            # Get token from query string
            query_string = self.scope.get('query_string', b'').decode()
            token = None
            
            for param in query_string.split('&'):
                if param.startswith('token='):
                    token = param.split('=', 1)[1]
                    break
            
            if not token:
                return AnonymousUser()
            
            # Validate token
            try:
                UntypedToken(token)
            except (InvalidToken, TokenError):
                return AnonymousUser()
            
            # Get user from token
            from rest_framework_simplejwt.authentication import JWTAuthentication
            jwt_auth = JWTAuthentication()
            validated_token = jwt_auth.get_validated_token(token)
            user = jwt_auth.get_user(validated_token)
            
            return user
            
        except Exception as e:
            logger.error(f"Error extracting user from token: {str(e)}")
            return AnonymousUser()

    @database_sync_to_async
    def mark_notification_read(self, notification_id):
        """Mark notification as read"""
        try:
            from .models import Notification
            notification = Notification.objects.get(
                id=notification_id,
                recipient=self.user
            )
            notification.mark_as_read()
            logger.info(f"Notification {notification_id} marked as read for user {self.user.username}")
        except Exception as e:
            logger.error(f"Error marking notification as read: {str(e)}")


class DashboardConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for dashboard real-time updates
    Extends existing dashboard functionality with notifications
    """
    
    async def connect(self):
        """Handle WebSocket connection for dashboard"""
        user = await self.get_user_from_token()
        if user and user.is_authenticated and user.is_staff:
            self.user = user
            
            # Join dashboard group
            await self.channel_layer.group_add(
                "dashboard_users",
                self.channel_name
            )
            
            await self.accept()
            logger.info(f"Dashboard WebSocket connected for user {user.username}")
        else:
            logger.warning("Dashboard WebSocket connection rejected: Unauthorized")
            await self.close()

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        if hasattr(self, 'user'):
            await self.channel_layer.group_discard(
                "dashboard_users",
                self.channel_name
            )
            logger.info(f"Dashboard WebSocket disconnected for user {self.user.username}")

    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type')
            
            if message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': text_data_json.get('timestamp')
                }))
        except Exception as e:
            logger.error(f"Error handling dashboard WebSocket message: {str(e)}")

    async def dashboard_update(self, event):
        """Send dashboard update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'dashboard_update',
            'data': event['data']
        }))

    @database_sync_to_async
    def get_user_from_token(self):
        """Extract user from JWT token - same as NotificationConsumer"""
        try:
            query_string = self.scope.get('query_string', b'').decode()
            token = None
            
            for param in query_string.split('&'):
                if param.startswith('token='):
                    token = param.split('=', 1)[1]
                    break
            
            if not token:
                return AnonymousUser()
            
            try:
                UntypedToken(token)
            except (InvalidToken, TokenError):
                return AnonymousUser()
            
            from rest_framework_simplejwt.authentication import JWTAuthentication
            jwt_auth = JWTAuthentication()
            validated_token = jwt_auth.get_validated_token(token)
            user = jwt_auth.get_user(validated_token)
            
            return user
            
        except Exception as e:
            logger.error(f"Error extracting user from token: {str(e)}")
            return AnonymousUser()