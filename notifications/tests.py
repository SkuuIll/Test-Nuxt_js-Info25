"""
Tests for notifications app
"""
from django.test import TestCase
from channels.testing import WebsocketCommunicator
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from .consumers import NotificationConsumer

User = get_user_model()


class NotificationConsumerTest(TestCase):
    """Test WebSocket consumer functionality"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.token = str(AccessToken.for_user(self.user))
    
    async def test_websocket_connection_with_valid_token(self):
        """Test WebSocket connection with valid JWT token"""
        communicator = WebsocketCommunicator(
            NotificationConsumer.as_asgi(),
            f"/ws/notifications/?token={self.token}"
        )
        
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)
        
        # Should receive connection confirmation
        response = await communicator.receive_json_from()
        self.assertEqual(response['type'], 'connection_established')
        
        await communicator.disconnect()
    
    async def test_websocket_connection_without_token(self):
        """Test WebSocket connection without token should be rejected"""
        communicator = WebsocketCommunicator(
            NotificationConsumer.as_asgi(),
            "/ws/notifications/"
        )
        
        connected, subprotocol = await communicator.connect()
        self.assertFalse(connected)
    
    async def test_ping_pong(self):
        """Test ping/pong functionality"""
        communicator = WebsocketCommunicator(
            NotificationConsumer.as_asgi(),
            f"/ws/notifications/?token={self.token}"
        )
        
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)
        
        # Skip connection confirmation
        await communicator.receive_json_from()
        
        # Send ping
        await communicator.send_json_to({
            'type': 'ping',
            'timestamp': 1234567890
        })
        
        # Should receive pong
        response = await communicator.receive_json_from()
        self.assertEqual(response['type'], 'pong')
        self.assertEqual(response['timestamp'], 1234567890)
        
        await communicator.disconnect()