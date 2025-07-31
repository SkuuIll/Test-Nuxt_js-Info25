import json
import logging
import traceback
from django.http import JsonResponse
from django.core.exceptions import ValidationError, PermissionDenied
from django.db import IntegrityError
from rest_framework import status
from rest_framework.views import exception_handler
from rest_framework.exceptions import (
    ValidationError as DRFValidationError,
    PermissionDenied as DRFPermissionDenied,
    NotAuthenticated,
    AuthenticationFailed,
    NotFound,
    MethodNotAllowed,
    Throttled,
    ParseError,
    UnsupportedMediaType
)
from .api_utils import StandardAPIResponse, HTTPStatus, ErrorMessages


logger = logging.getLogger(__name__)


class RequestLoggingMiddleware:
    """
    Middleware to log API requests and responses for debugging
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Log request
        if request.path.startswith('/api/'):
            logger.info(f"API Request: {request.method} {request.path}")
            if request.body and len(request.body) < 1000:  # Don't log large payloads
                try:
                    body = json.loads(request.body.decode('utf-8'))
                    # Remove sensitive data
                    if isinstance(body, dict):
                        sensitive_fields = ['password', 'token', 'secret']
                        for field in sensitive_fields:
                            if field in body:
                                body[field] = '***'
                    logger.debug(f"Request body: {body}")
                except (json.JSONDecodeError, UnicodeDecodeError):
                    pass
        
        response = self.get_response(request)
        
        # Log response
        if request.path.startswith('/api/'):
            logger.info(f"API Response: {request.method} {request.path} - {response.status_code}")
            if hasattr(response, 'data') and response.status_code >= 400:
                logger.warning(f"API Error Response: {response.data}")
        
        return response


class APIErrorHandlingMiddleware:
    """
    Middleware to handle uncaught exceptions in API views
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        try:
            response = self.get_response(request)
            return response
        except Exception as e:
            # Only handle API requests
            if request.path.startswith('/api/'):
                return self.handle_api_exception(request, e)
            raise
    
    def handle_api_exception(self, request, exception):
        """Handle exceptions for API requests"""
        logger.error(f"Unhandled API exception: {str(exception)}", exc_info=True)
        
        # Map common Django exceptions to API responses
        if isinstance(exception, ValidationError):
            return JsonResponse({
                'success': False,
                'error': ErrorMessages.VALIDATION_FAILED,
                'errors': exception.message_dict if hasattr(exception, 'message_dict') else [str(exception)]
            }, status=HTTPStatus.BAD_REQUEST)
        
        elif isinstance(exception, PermissionDenied):
            return JsonResponse({
                'success': False,
                'error': ErrorMessages.PERMISSION_DENIED
            }, status=HTTPStatus.FORBIDDEN)
        
        elif isinstance(exception, IntegrityError):
            return JsonResponse({
                'success': False,
                'error': 'Data integrity error',
                'message': 'The operation violates data constraints'
            }, status=HTTPStatus.CONFLICT)
        
        else:
            # Generic server error
            return JsonResponse({
                'success': False,
                'error': ErrorMessages.INTERNAL_SERVER_ERROR,
                'message': 'An unexpected error occurred'
            }, status=HTTPStatus.INTERNAL_SERVER_ERROR)


def custom_exception_handler(exc, context):
    """
    Custom exception handler for Django REST Framework
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)
    
    if response is not None:
        # Standardize the error response format
        custom_response_data = {
            'success': False,
            'error': 'API Error'
        }
        
        # Handle different types of DRF exceptions
        if isinstance(exc, DRFValidationError):
            custom_response_data['error'] = ErrorMessages.VALIDATION_FAILED
            custom_response_data['errors'] = response.data
        
        elif isinstance(exc, NotAuthenticated):
            custom_response_data['error'] = ErrorMessages.AUTHENTICATION_REQUIRED
        
        elif isinstance(exc, AuthenticationFailed):
            custom_response_data['error'] = ErrorMessages.INVALID_CREDENTIALS
        
        elif isinstance(exc, DRFPermissionDenied):
            custom_response_data['error'] = ErrorMessages.PERMISSION_DENIED
        
        elif isinstance(exc, NotFound):
            custom_response_data['error'] = ErrorMessages.RESOURCE_NOT_FOUND
        
        elif isinstance(exc, MethodNotAllowed):
            custom_response_data['error'] = ErrorMessages.METHOD_NOT_ALLOWED
            custom_response_data['allowed_methods'] = response.data.get('detail', '').split()[-1] if 'detail' in response.data else []
        
        elif isinstance(exc, Throttled):
            custom_response_data['error'] = ErrorMessages.RATE_LIMIT_EXCEEDED
            custom_response_data['retry_after'] = exc.wait
        
        elif isinstance(exc, ParseError):
            custom_response_data['error'] = 'Invalid request format'
            custom_response_data['message'] = str(exc)
        
        elif isinstance(exc, UnsupportedMediaType):
            custom_response_data['error'] = 'Unsupported media type'
            custom_response_data['message'] = str(exc)
        
        else:
            # Generic error
            custom_response_data['error'] = str(exc) if str(exc) else 'An error occurred'
            if hasattr(response, 'data') and isinstance(response.data, dict):
                if 'detail' in response.data:
                    custom_response_data['message'] = response.data['detail']
                elif 'non_field_errors' in response.data:
                    custom_response_data['errors'] = response.data['non_field_errors']
        
        # Log the error
        logger.error(f"API Exception: {exc.__class__.__name__}: {str(exc)}")
        
        response.data = custom_response_data
    
    return response


class CORSMiddleware:
    """
    Custom CORS middleware for additional control
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        # Add additional CORS headers for API endpoints
        if request.path.startswith('/api/'):
            response['Access-Control-Allow-Credentials'] = 'true'
            response['Access-Control-Expose-Headers'] = 'Content-Type, Authorization, X-Total-Count, X-Page-Count'
            
            # Handle preflight requests
            if request.method == 'OPTIONS':
                response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
                response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
                response['Access-Control-Max-Age'] = '86400'  # 24 hours
        
        return response


class SecurityHeadersMiddleware:
    """
    Add security headers to API responses
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        # Add security headers for API endpoints
        if request.path.startswith('/api/'):
            response['X-Content-Type-Options'] = 'nosniff'
            response['X-Frame-Options'] = 'DENY'
            response['X-XSS-Protection'] = '1; mode=block'
            response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
            
            # Add CSP for API endpoints
            response['Content-Security-Policy'] = "default-src 'none'; frame-ancestors 'none';"
        
        return response


class ResponseTimeMiddleware:
    """
    Add response time header for performance monitoring
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        import time
        start_time = time.time()
        
        response = self.get_response(request)
        
        # Add response time header for API endpoints
        if request.path.startswith('/api/'):
            response_time = time.time() - start_time
            response['X-Response-Time'] = f"{response_time:.3f}s"
            
            # Log slow requests
            if response_time > 1.0:  # Log requests taking more than 1 second
                logger.warning(f"Slow API request: {request.method} {request.path} took {response_time:.3f}s")
        
        return response


class APIVersionMiddleware:
    """
    Add API version information to responses
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        # Add API version header
        if request.path.startswith('/api/'):
            response['X-API-Version'] = 'v1'
            response['X-API-Build'] = '1.0.0'
        
        return response