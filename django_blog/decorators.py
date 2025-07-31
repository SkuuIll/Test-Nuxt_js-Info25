import functools
import logging
from django.core.exceptions import PermissionDenied
from django.http import JsonResponse
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .api_utils import StandardAPIResponse, HTTPStatus, ErrorMessages


logger = logging.getLogger(__name__)


def api_error_handler(func):
    """
    Decorator to handle common API errors and return standardized responses
    """
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except PermissionDenied:
            return StandardAPIResponse.permission_denied()
        except Exception as e:
            logger.error(f"Error in {func.__name__}: {str(e)}", exc_info=True)
            return StandardAPIResponse.server_error(exception=e)
    
    return wrapper


def dashboard_permission_required(permission_name):
    """
    Decorator to check dashboard permissions
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return JsonResponse({
                    'error': True,
                    'message': ErrorMessages.AUTHENTICATION_REQUIRED
                }, status=HTTPStatus.UNAUTHORIZED)
            
            # Check if user is superuser
            if request.user.is_superuser:
                return func(request, *args, **kwargs)
            
            # Check dashboard permissions
            try:
                dashboard_permission = request.user.dashboard_permission
                
                permission_map = {
                    'can_view_stats': dashboard_permission.can_view_stats,
                    'can_manage_posts': dashboard_permission.can_manage_posts,
                    'can_manage_users': dashboard_permission.can_manage_users,
                    'can_manage_comments': dashboard_permission.can_manage_comments,
                }
                
                if not permission_map.get(permission_name, False):
                    return JsonResponse({
                        'error': True,
                        'message': f'Permission required: {permission_name}'
                    }, status=HTTPStatus.FORBIDDEN)
                
                return func(request, *args, **kwargs)
                
            except AttributeError:
                return JsonResponse({
                    'error': True,
                    'message': 'Dashboard permissions not configured'
                }, status=HTTPStatus.FORBIDDEN)
        
        return wrapper
    return decorator


def require_fields(*required_fields):
    """
    Decorator to validate required fields in request data
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(request, *args, **kwargs):
            # Get request data based on method
            if request.method == 'GET':
                data = request.GET
            else:
                data = getattr(request, 'data', {})
            
            missing_fields = []
            for field in required_fields:
                if field not in data or not data[field]:
                    missing_fields.append(field)
            
            if missing_fields:
                return StandardAPIResponse.validation_error(
                    serializer_errors={'missing_fields': missing_fields},
                    message=f"Required fields missing: {', '.join(missing_fields)}"
                )
            
            return func(request, *args, **kwargs)
        
        return wrapper
    return decorator


def validate_json_content_type(func):
    """
    Decorator to validate that request has JSON content type
    """
    @functools.wraps(func)
    def wrapper(request, *args, **kwargs):
        if request.method in ['POST', 'PUT', 'PATCH']:
            content_type = request.content_type
            if not content_type.startswith('application/json') and not content_type.startswith('multipart/form-data'):
                return StandardAPIResponse.error(
                    error_message="Invalid content type",
                    message="Expected application/json or multipart/form-data",
                    status_code=HTTPStatus.BAD_REQUEST
                )
        
        return func(request, *args, **kwargs)
    
    return wrapper


def rate_limit_by_user(max_requests=100, time_window=3600):
    """
    Simple rate limiting decorator by user
    """
    from django.core.cache import cache
    
    def decorator(func):
        @functools.wraps(func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return func(request, *args, **kwargs)
            
            # Create cache key
            cache_key = f"rate_limit_{request.user.id}_{func.__name__}"
            
            # Get current count
            current_count = cache.get(cache_key, 0)
            
            if current_count >= max_requests:
                return StandardAPIResponse.rate_limited(
                    message=f"Rate limit exceeded. Max {max_requests} requests per {time_window} seconds"
                )
            
            # Increment counter
            cache.set(cache_key, current_count + 1, time_window)
            
            return func(request, *args, **kwargs)
        
        return wrapper
    return decorator


def log_api_call(func):
    """
    Decorator to log API calls for monitoring
    """
    @functools.wraps(func)
    def wrapper(request, *args, **kwargs):
        user_info = f"User: {request.user.username}" if request.user.is_authenticated else "Anonymous"
        logger.info(f"API Call: {request.method} {request.path} - {user_info}")
        
        try:
            response = func(request, *args, **kwargs)
            logger.info(f"API Response: {request.method} {request.path} - Status: {response.status_code}")
            return response
        except Exception as e:
            logger.error(f"API Error: {request.method} {request.path} - Error: {str(e)}")
            raise
    
    return wrapper


def cache_response(timeout=300):
    """
    Decorator to cache API responses
    """
    from django.core.cache import cache
    from django.utils.cache import get_cache_key
    
    def decorator(func):
        @functools.wraps(func)
        def wrapper(request, *args, **kwargs):
            # Only cache GET requests
            if request.method != 'GET':
                return func(request, *args, **kwargs)
            
            # Create cache key
            cache_key = f"api_cache_{request.path}_{request.GET.urlencode()}"
            
            # Try to get from cache
            cached_response = cache.get(cache_key)
            if cached_response:
                logger.debug(f"Cache hit for {request.path}")
                return cached_response
            
            # Get fresh response
            response = func(request, *args, **kwargs)
            
            # Cache successful responses
            if response.status_code == 200:
                cache.set(cache_key, response, timeout)
                logger.debug(f"Cached response for {request.path}")
            
            return response
        
        return wrapper
    return decorator


def require_staff(func):
    """
    Decorator to require staff status
    """
    @functools.wraps(func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return StandardAPIResponse.unauthorized()
        
        if not request.user.is_staff:
            return StandardAPIResponse.permission_denied(
                message="Staff privileges required"
            )
        
        return func(request, *args, **kwargs)
    
    return wrapper


def require_superuser(func):
    """
    Decorator to require superuser status
    """
    @functools.wraps(func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return StandardAPIResponse.unauthorized()
        
        if not request.user.is_superuser:
            return StandardAPIResponse.permission_denied(
                message="Superuser privileges required"
            )
        
        return func(request, *args, **kwargs)
    
    return wrapper


def handle_file_upload_errors(func):
    """
    Decorator to handle file upload specific errors
    """
    @functools.wraps(func)
    def wrapper(request, *args, **kwargs):
        try:
            return func(request, *args, **kwargs)
        except Exception as e:
            error_message = str(e)
            
            # Handle specific file upload errors
            if "file size" in error_message.lower():
                return StandardAPIResponse.error(
                    error_message="File too large",
                    message="The uploaded file exceeds the maximum allowed size",
                    status_code=HTTPStatus.BAD_REQUEST
                )
            elif "file type" in error_message.lower() or "extension" in error_message.lower():
                return StandardAPIResponse.error(
                    error_message="Invalid file type",
                    message="The uploaded file type is not allowed",
                    status_code=HTTPStatus.BAD_REQUEST
                )
            else:
                logger.error(f"File upload error in {func.__name__}: {str(e)}", exc_info=True)
                return StandardAPIResponse.server_error(
                    message="File upload failed",
                    exception=e
                )
    
    return wrapper


def validate_pagination_params(func):
    """
    Decorator to validate pagination parameters
    """
    @functools.wraps(func)
    def wrapper(request, *args, **kwargs):
        try:
            page = int(request.GET.get('page', 1))
            page_size = int(request.GET.get('page_size', 12))
            
            if page < 1:
                return StandardAPIResponse.validation_error(
                    serializer_errors={'page': ['Page number must be positive']},
                    message="Invalid pagination parameters"
                )
            
            if page_size < 1 or page_size > 100:
                return StandardAPIResponse.validation_error(
                    serializer_errors={'page_size': ['Page size must be between 1 and 100']},
                    message="Invalid pagination parameters"
                )
            
            return func(request, *args, **kwargs)
            
        except ValueError:
            return StandardAPIResponse.validation_error(
                serializer_errors={'pagination': ['Page and page_size must be integers']},
                message="Invalid pagination parameters"
            )
    
    return wrapper