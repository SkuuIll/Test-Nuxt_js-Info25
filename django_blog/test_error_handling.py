"""
Test script to validate error handling implementation
"""

from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from django_blog.api_utils import StandardAPIResponse, DashboardAPIResponse, HTTPStatus
from django_blog.decorators import handle_api_exceptions, validate_required_fields
from django_blog.middleware import custom_exception_handler
import json


User = get_user_model()


class ErrorHandlingTestCase(APITestCase):
    """Test cases for error handling functionality"""
    
    def setUp(self):
        self.factory = RequestFactory()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_standard_api_response_success(self):
        """Test StandardAPIResponse success method"""
        response = StandardAPIResponse.success(
            data={'message': 'test'},
            message='Success message'
        )
        
        self.assertEqual(response.status_code, HTTPStatus.OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['message'], 'test')
        self.assertEqual(response.data['message'], 'Success message')
    
    def test_standard_api_response_error(self):
        """Test StandardAPIResponse error method"""
        response = StandardAPIResponse.error(
            error_message='Test error',
            message='Error details',
            status_code=HTTPStatus.BAD_REQUEST
        )
        
        self.assertEqual(response.status_code, HTTPStatus.BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertEqual(response.data['error'], 'Test error')
        self.assertEqual(response.data['message'], 'Error details')
    
    def test_standard_api_response_not_found(self):
        """Test StandardAPIResponse not_found method"""
        response = StandardAPIResponse.not_found(
            message='Resource not found',
            resource_type='Post'
        )
        
        self.assertEqual(response.status_code, HTTPStatus.NOT_FOUND)
        self.assertFalse(response.data['success'])
        self.assertEqual(response.data['error'], 'Post not found')
    
    def test_standard_api_response_validation_error(self):
        """Test StandardAPIResponse validation_error method"""
        errors = {'field1': ['This field is required']}
        response = StandardAPIResponse.validation_error(errors)
        
        self.assertEqual(response.status_code, HTTPStatus.BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertEqual(response.data['error'], 'Validation failed')
        self.assertEqual(response.data['errors'], errors)
    
    def test_dashboard_api_response_success(self):
        """Test DashboardAPIResponse success method"""
        response = DashboardAPIResponse.success(
            data={'stats': 'data'},
            message='Dashboard success'
        )
        
        self.assertEqual(response.status_code, HTTPStatus.OK)
        self.assertFalse(response.data['error'])
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['stats'], 'data')
        self.assertEqual(response.data['message'], 'Dashboard success')
    
    def test_dashboard_api_response_error(self):
        """Test DashboardAPIResponse error method"""
        response = DashboardAPIResponse.error(
            error_message='Dashboard error',
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR
        )
        
        self.assertEqual(response.status_code, HTTPStatus.INTERNAL_SERVER_ERROR)
        self.assertTrue(response.data['error'])
        self.assertFalse(response.data['success'])
        self.assertEqual(response.data['message'], 'Dashboard error')
    
    def test_dashboard_api_response_unauthorized(self):
        """Test DashboardAPIResponse unauthorized method"""
        response = DashboardAPIResponse.unauthorized('Login required')
        
        self.assertEqual(response.status_code, HTTPStatus.UNAUTHORIZED)
        self.assertTrue(response.data['error'])
        self.assertEqual(response.data['message'], 'Login required')
    
    def test_exception_decorator(self):
        """Test the exception handling decorator"""
        
        @handle_api_exceptions(StandardAPIResponse)
        def test_view_with_exception():
            raise ValueError("Test error")
        
        response = test_view_with_exception()
        
        self.assertEqual(response.status_code, HTTPStatus.INTERNAL_SERVER_ERROR)
        self.assertFalse(response.data['success'])
        self.assertEqual(response.data['error'], 'Internal server error')
    
    def test_validation_decorator(self):
        """Test the validation decorator"""
        
        class MockView:
            @validate_required_fields('field1', 'field2')
            def test_method(self, request):
                return StandardAPIResponse.success({'message': 'validated'})
        
        view = MockView()
        
        # Test with missing fields
        request = self.factory.post('/test/', {'field1': 'value1'})
        response = view.test_method(request)
        
        self.assertEqual(response.status_code, HTTPStatus.BAD_REQUEST)
        self.assertIn('field2', response.data['error'])
        
        # Test with all fields present
        request = self.factory.post('/test/', {
            'field1': 'value1',
            'field2': 'value2'
        })
        response = view.test_method(request)
        
        self.assertEqual(response.status_code, HTTPStatus.OK)
        self.assertTrue(response.data['success'])


class MiddlewareTestCase(TestCase):
    """Test cases for middleware functionality"""
    
    def setUp(self):
        self.factory = RequestFactory()
    
    def test_custom_exception_handler(self):
        """Test the custom DRF exception handler"""
        from rest_framework.exceptions import ValidationError
        
        # Create a mock exception
        exc = ValidationError({'field': ['This field is required']})
        context = {'request': self.factory.get('/api/test/')}
        
        response = custom_exception_handler(exc, context)
        
        self.assertIsNotNone(response)
        self.assertFalse(response.data['success'])
        self.assertEqual(response.data['error'], 'Validation failed')
        self.assertIn('errors', response.data)


def run_error_handling_tests():
    """
    Function to run error handling tests manually
    """
    print("Running Error Handling Tests...")
    
    # Test StandardAPIResponse
    print("\n1. Testing StandardAPIResponse...")
    
    success_response = StandardAPIResponse.success({'test': 'data'}, 'Success')
    print(f"Success Response: {success_response.status_code} - {success_response.data}")
    
    error_response = StandardAPIResponse.error('Test error', status_code=400)
    print(f"Error Response: {error_response.status_code} - {error_response.data}")
    
    not_found_response = StandardAPIResponse.not_found('Resource not found')
    print(f"Not Found Response: {not_found_response.status_code} - {not_found_response.data}")
    
    # Test DashboardAPIResponse
    print("\n2. Testing DashboardAPIResponse...")
    
    dashboard_success = DashboardAPIResponse.success({'dashboard': 'data'}, 'Dashboard success')
    print(f"Dashboard Success: {dashboard_success.status_code} - {dashboard_success.data}")
    
    dashboard_error = DashboardAPIResponse.error('Dashboard error')
    print(f"Dashboard Error: {dashboard_error.status_code} - {dashboard_error.data}")
    
    # Test HTTP Status constants
    print("\n3. Testing HTTP Status constants...")
    print(f"OK: {HTTPStatus.OK}")
    print(f"BAD_REQUEST: {HTTPStatus.BAD_REQUEST}")
    print(f"NOT_FOUND: {HTTPStatus.NOT_FOUND}")
    print(f"INTERNAL_SERVER_ERROR: {HTTPStatus.INTERNAL_SERVER_ERROR}")
    
    print("\nError handling tests completed successfully!")


if __name__ == '__main__':
    run_error_handling_tests()