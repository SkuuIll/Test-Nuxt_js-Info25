import logging
import traceback
from django.http import JsonResponse
from django.conf import settings
from rest_framework import status
from rest_framework.views import exception_handler
from rest_framework.response import Response


logger = logging.getLogger(__name__)


class APIErrorHandlingMiddleware:
    """
    Middleware to handle uncaught exceptions in API views
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        return response
    
    def process_exception(self, request, exception):
        """
        Handle uncaught exceptions in API views
        """
        # Only handle API requests
        if not request.path.startswith('/api/'):
            return None
        
        # Log the exception
        logger.error(
            f"Unhandled API exception: {str(exception)}\n"
            f"Path: {request.path}\n"
            f"Method: {request.method}\n"
            f"User: {getattr(request, 'user', 'Anonymous')}\n"
            f"Traceback: {traceback.format_exc()}"
        )
        
        # Return standardized error response
        error_data = {
            'success': False,
            'error': 'Internal server error',
            'message': 'An unexpected error occurred'
        }
        
        # Include exception details in debug mode
        if settings.DEBUG:
            error_data['debug'] = {
                'exception': str(exception),
                'type': type(exception).__name__,
                'traceback': traceback.format_exc().split('\n')
            }
        
        return JsonResponse(
            error_data,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def custom_exception_handler(exc, context):
    """
    Custom exception handler for DRF views
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)
    
    if response is not None:
        # Standardize the error response format
        custom_response_data = {
            'success': False,
            'error': 'Request failed',
            'message': 'An error occurred while processing your request'
        }
        
        # Handle different types of exceptions
        if hasattr(exc, 'detail'):
            if isinstance(exc.detail, dict):
                custom_response_data['errors'] = exc.detail
                custom_response_data['error'] = 'Validation failed'
            elif isinstance(exc.detail, list):
                custom_response_data['errors'] = exc.detail
                custom_response_data['error'] = 'Validation failed'
            else:
                custom_response_data['error'] = str(exc.detail)
                custom_response_data['message'] = str(exc.detail)
        
        # Add specific error messages for common exceptions
        if response.status_code == 401:
            custom_response_data['error'] = 'Authentication required'
            custom_response_data['message'] = 'You must be authenticated to access this resource'
        elif response.status_code == 403:
            custom_response_data['error'] = 'Permission denied'
            custom_response_data['message'] = 'You do not have permission to access this resource'
        elif response.status_code == 404:
            custom_response_data['error'] = 'Resource not found'
            custom_response_data['message'] = 'The requested resource was not found'
        elif response.status_code == 405:
            custom_response_data['error'] = 'Method not allowed'
            custom_response_data['message'] = 'This HTTP method is not allowed for this endpoint'
        elif response.status_code == 429:
            custom_response_data['error'] = 'Rate limit exceeded'
            custom_response_data['message'] = 'Too many requests. Please try again later'
        
        # Include debug information in development
        if settings.DEBUG:
            custom_response_data['debug'] = {
                'exception': str(exc),
                'type': type(exc).__name__,
                'status_code': response.status_code
            }
        
        response.data = custom_response_data
    
    return response


class RequestLoggingMiddleware:
    """
    Middleware to log API requests for debugging
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Log request if it's an API call and in debug mode
        if settings.DEBUG and request.path.startswith('/api/'):
            logger.debug(
                f"API Request: {request.method} {request.path}\n"
                f"User: {getattr(request, 'user', 'Anonymous')}\n"
                f"Headers: {dict(request.headers)}\n"
                f"Query Params: {dict(request.GET)}"
            )
        
        response = self.get_response(request)
        
        # Log response if it's an API call and in debug mode
        if settings.DEBUG and request.path.startswith('/api/'):
            logger.debug(
                f"API Response: {response.status_code} for {request.method} {request.path}\n"
                f"Content-Type: {response.get('Content-Type', 'Unknown')}"
            )
        
        return response