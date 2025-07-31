#!/usr/bin/env python3

"""
Test script for API error handling system
This script validates the error handling and response format system
"""

import os
import sys
import django
from pathlib import Path

# Add the project directory to Python path
project_dir = Path(__file__).parent
sys.path.insert(0, str(project_dir))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_blog.settings')
django.setup()

from django.test import RequestFactory, TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework import status
from django_blog.api_utils import StandardAPIResponse, HTTPStatus, ErrorMessages
from django_blog.middleware import custom_exception_handler
from django_blog.decorators import api_error_handler, require_fields, dashboard_permission_required
from rest_framework.exceptions import ValidationError, NotFound, PermissionDenied
import json

User = get_user_model()

def test_error_handling_system():
    """Test the complete error handling system"""
    
    print("🧪 Testing API Error Handling System")
    print("=" * 50)
    
    results = {
        'response_format_tests': [],
        'middleware_tests': [],
        'decorator_tests': [],
        'exception_handler_tests': [],
        'errors': []
    }
    
    try:
        # Test 1: StandardAPIResponse Format
        print("\n1. Testing StandardAPIResponse Format...")
        
        try:
            # Test success response
            success_response = StandardAPIResponse.success(
                data={'test': 'data'},
                message='Test successful'
            )
            
            success_data = success_response.data
            print(f"✅ Success response format: {success_data}")
            
            results['response_format_tests'].append({
                'test': 'success_response_format',
                'success': 'success' in success_data and success_data['success'] == True,
                'data': success_data
            })
            
            # Test error response
            error_response = StandardAPIResponse.error(
                error_message='Test error',
                status_code=HTTPStatus.BAD_REQUEST
            )
            
            error_data = error_response.data
            print(f"✅ Error response format: {error_data}")
            
            results['response_format_tests'].append({
                'test': 'error_response_format',
                'success': 'success' in error_data and error_data['success'] == False,
                'data': error_data
            })
            
            # Test validation error response
            validation_response = StandardAPIResponse.validation_error(
                serializer_errors={'field': ['This field is required']},
                message='Validation failed'
            )
            
            validation_data = validation_response.data
            print(f"✅ Validation error format: {validation_data}")
            
            results['response_format_tests'].append({
                'test': 'validation_error_format',
                'success': 'errors' in validation_data and 'success' in validation_data,
                'data': validation_data
            })
            
        except Exception as e:
            print(f"❌ Response format test error: {e}")
            results['errors'].append(f"Response format test error: {str(e)}")
        
        # Test 2: Exception Handler
        print("\n2. Testing Custom Exception Handler...")
        
        try:
            # Mock context for exception handler
            mock_context = {
                'view': None,
                'request': RequestFactory().get('/api/test/')
            }
            
            # Test ValidationError handling
            validation_exc = ValidationError({'field': ['Required field']})
            response = custom_exception_handler(validation_exc, mock_context)
            
            if response:
                print(f"✅ ValidationError handling: {response.data}")
                results['exception_handler_tests'].append({
                    'test': 'validation_error_handling',
                    'success': 'success' in response.data and response.data['success'] == False,
                    'data': response.data
                })
            
            # Test NotFound handling
            not_found_exc = NotFound('Resource not found')
            response = custom_exception_handler(not_found_exc, mock_context)
            
            if response:
                print(f"✅ NotFound handling: {response.data}")
                results['exception_handler_tests'].append({
                    'test': 'not_found_handling',
                    'success': response.status_code == 404,
                    'data': response.data
                })
            
        except Exception as e:
            print(f"❌ Exception handler test error: {e}")
            results['errors'].append(f"Exception handler test error: {str(e)}")
        
        # Test 3: Decorators
        print("\n3. Testing Error Handling Decorators...")
        
        try:
            # Test api_error_handler decorator
            @api_error_handler
            def test_view_with_error():
                raise ValueError("Test error")
            
            response = test_view_with_error()
            print(f"✅ api_error_handler decorator: Status {response.status_code}")
            
            results['decorator_tests'].append({
                'test': 'api_error_handler_decorator',
                'success': response.status_code == 500,
                'status_code': response.status_code
            })
            
            # Test require_fields decorator
            factory = RequestFactory()
            request = factory.post('/test/', data={'field1': 'value1'})
            
            @require_fields('field1', 'field2')
            def test_required_fields(request):
                return StandardAPIResponse.success(message='All fields present')
            
            response = test_required_fields(request)
            print(f"✅ require_fields decorator: Status {response.status_code}")
            
            results['decorator_tests'].append({
                'test': 'require_fields_decorator',
                'success': response.status_code == 400,  # Should fail due to missing field2
                'status_code': response.status_code
            })
            
        except Exception as e:
            print(f"❌ Decorator test error: {e}")
            results['errors'].append(f"Decorator test error: {str(e)}")
        
        # Test 4: HTTP Status Constants
        print("\n4. Testing HTTP Status Constants...")
        
        try:
            # Test status constants
            status_tests = [
                ('OK', HTTPStatus.OK, 200),
                ('CREATED', HTTPStatus.CREATED, 201),
                ('BAD_REQUEST', HTTPStatus.BAD_REQUEST, 400),
                ('UNAUTHORIZED', HTTPStatus.UNAUTHORIZED, 401),
                ('FORBIDDEN', HTTPStatus.FORBIDDEN, 403),
                ('NOT_FOUND', HTTPStatus.NOT_FOUND, 404),
                ('INTERNAL_SERVER_ERROR', HTTPStatus.INTERNAL_SERVER_ERROR, 500),
            ]
            
            for name, constant, expected in status_tests:
                success = constant == expected
                print(f"{'✅' if success else '❌'} {name}: {constant} == {expected}")
                
                results['response_format_tests'].append({
                    'test': f'status_constant_{name.lower()}',
                    'success': success,
                    'expected': expected,
                    'actual': constant
                })
            
        except Exception as e:
            print(f"❌ Status constants test error: {e}")
            results['errors'].append(f"Status constants test error: {str(e)}")
        
        # Test 5: Error Messages Constants
        print("\n5. Testing Error Message Constants...")
        
        try:
            # Test error message constants
            message_tests = [
                ('VALIDATION_FAILED', ErrorMessages.VALIDATION_FAILED),
                ('RESOURCE_NOT_FOUND', ErrorMessages.RESOURCE_NOT_FOUND),
                ('PERMISSION_DENIED', ErrorMessages.PERMISSION_DENIED),
                ('AUTHENTICATION_REQUIRED', ErrorMessages.AUTHENTICATION_REQUIRED),
                ('INTERNAL_SERVER_ERROR', ErrorMessages.INTERNAL_SERVER_ERROR),
            ]
            
            for name, message in message_tests:
                success = isinstance(message, str) and len(message) > 0
                print(f"{'✅' if success else '❌'} {name}: '{message}'")
                
                results['response_format_tests'].append({
                    'test': f'error_message_{name.lower()}',
                    'success': success,
                    'message': message
                })
            
        except Exception as e:
            print(f"❌ Error messages test error: {e}")
            results['errors'].append(f"Error messages test error: {str(e)}")
        
    except Exception as e:
        print(f"❌ Critical error during testing: {e}")
        results['errors'].append(f"Critical error: {str(e)}")
    
    # Print summary
    print("\n" + "=" * 50)
    print("📊 ERROR HANDLING TEST SUMMARY")
    print("=" * 50)
    
    total_tests = (
        len(results['response_format_tests']) + 
        len(results['middleware_tests']) + 
        len(results['decorator_tests']) + 
        len(results['exception_handler_tests'])
    )
    
    successful_tests = (
        sum(1 for t in results['response_format_tests'] if t['success']) +
        sum(1 for t in results['middleware_tests'] if t['success']) +
        sum(1 for t in results['decorator_tests'] if t['success']) +
        sum(1 for t in results['exception_handler_tests'] if t['success'])
    )
    
    print(f"Total Tests: {total_tests}")
    print(f"Successful: {successful_tests}")
    print(f"Failed: {total_tests - successful_tests}")
    print(f"Errors: {len(results['errors'])}")
    
    if results['errors']:
        print("\n🚨 ERRORS:")
        for error in results['errors']:
            print(f"  - {error}")
    
    success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
    print(f"\n✅ Success Rate: {success_rate:.1f}%")
    
    if success_rate >= 90:
        print("🎉 Error handling system is working excellently!")
    elif success_rate >= 80:
        print("✅ Error handling system is working well!")
    elif success_rate >= 60:
        print("⚠️ Error handling system has some issues but is functional")
    else:
        print("❌ Error handling system needs significant fixes")
    
    # Test specific response formats
    print("\n📋 RESPONSE FORMAT EXAMPLES:")
    print("-" * 30)
    
    # Success response example
    success_example = StandardAPIResponse.success(
        data={'posts': [], 'count': 0},
        message='Posts retrieved successfully'
    )
    print("Success Response:")
    print(json.dumps(success_example.data, indent=2))
    
    # Error response example
    error_example = StandardAPIResponse.validation_error(
        serializer_errors={'title': ['This field is required']},
        message='Post validation failed'
    )
    print("\nError Response:")
    print(json.dumps(error_example.data, indent=2))
    
    return results


if __name__ == "__main__":
    test_error_handling_system()