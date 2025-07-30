from functools import wraps
from django.http import Http404
from django.core.exceptions import ValidationError, PermissionDenied
from rest_framework import status
from rest_framework.response import Response
from django_blog.api_utils import StandardAPIResponse, DashboardAPIResponse, HTTPStatus
import logging


logger = logging.getLogger(__name__)


def handle_api_exceptions(response_class=StandardAPIResponse):
    """
    Decorator to handle common API exceptions and return standardized responses
    
    Args:
        response_class: The response class to use (StandardAPIResponse or DashboardAPIResponse)
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except Http404:
                logger.warning(f"404 error in {func.__name__}: Resource not found")
                return response_class.not_found()
            except PermissionDenied as e:
                logger.warning(f"Permission denied in {func.__name__}: {str(e)}")
                return response_class.permission_denied(str(e))
            except ValidationError as e:
                logger.warning(f"Validation error in {func.__name__}: {str(e)}")
                return response_class.validation_error({'detail': str(e)})
            except ValueError as e:
                logger.warning(f"Value error in {func.__name__}: {str(e)}")
                return response_class.error(
                    f"Invalid value: {str(e)}",
                    status_code=HTTPStatus.BAD_REQUEST
                )
            except Exception as e:
                logger.error(f"Unexpected error in {func.__name__}: {str(e)}", exc_info=True)
                return response_class.error(
                    "Internal server error",
                    status_code=HTTPStatus.INTERNAL_SERVER_ERROR
                )
        return wrapper
    return decorator


def handle_dashboard_exceptions(func):
    """
    Decorator specifically for dashboard API views
    """
    return handle_api_exceptions(DashboardAPIResponse)(func)


def handle_standard_exceptions(func):
    """
    Decorator specifically for standard API views
    """
    return handle_api_exceptions(StandardAPIResponse)(func)


def validate_required_fields(*required_fields):
    """
    Decorator to validate required fields in request data
    
    Args:
        *required_fields: List of required field names
    """
    def decorator(func):
        @wraps(func)
        def wrapper(self, request, *args, **kwargs):
            missing_fields = []
            
            for field in required_fields:
                if field not in request.data or not request.data.get(field):
                    missing_fields.append(field)
            
            if missing_fields:
                error_message = f"Required fields missing: {', '.join(missing_fields)}"
                
                # Determine response class based on view type
                if hasattr(self, 'success_response'):
                    if 'dashboard' in self.__class__.__module__.lower():
                        return DashboardAPIResponse.error(
                            error_message,
                            status_code=HTTPStatus.BAD_REQUEST
                        )
                    else:
                        return StandardAPIResponse.error(
                            error_message,
                            status_code=HTTPStatus.BAD_REQUEST
                        )
                else:
                    # Fallback for function-based views
                    return Response({
                        'success': False,
                        'error': error_message
                    }, status=HTTPStatus.BAD_REQUEST)
            
            return func(self, request, *args, **kwargs)
        return wrapper
    return decorator


def log_api_call(func):
    """
    Decorator to log API calls for debugging
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        # Extract request from args (usually second argument after self)
        request = None
        for arg in args:
            if hasattr(arg, 'method') and hasattr(arg, 'path'):
                request = arg
                break
        
        if request:
            logger.debug(
                f"API Call: {request.method} {request.path} - "
                f"User: {getattr(request, 'user', 'Anonymous')} - "
                f"Function: {func.__name__}"
            )
        
        result = func(*args, **kwargs)
        
        if request and hasattr(result, 'status_code'):
            logger.debug(
                f"API Response: {result.status_code} for {request.method} {request.path} - "
                f"Function: {func.__name__}"
            )
        
        return result
    return wrapper


def require_permissions(*permissions):
    """
    Decorator to check specific permissions for dashboard views
    
    Args:
        *permissions: List of permission names to check
    """
    def decorator(func):
        @wraps(func)
        def wrapper(self, request, *args, **kwargs):
            user = request.user
            
            if not user.is_authenticated:
                return DashboardAPIResponse.unauthorized("Authentication required")
            
            if user.is_superuser:
                return func(self, request, *args, **kwargs)
            
            try:
                dashboard_permission = user.dashboard_permission
                
                permission_map = {
                    'manage_posts': dashboard_permission.can_manage_posts,
                    'manage_users': dashboard_permission.can_manage_users,
                    'manage_comments': dashboard_permission.can_manage_comments,
                    'view_stats': dashboard_permission.can_view_stats,
                }
                
                for permission in permissions:
                    if not permission_map.get(permission, False):
                        return DashboardAPIResponse.permission_denied(
                            f"Permission required: {permission}"
                        )
                
                return func(self, request, *args, **kwargs)
                
            except Exception:
                return DashboardAPIResponse.permission_denied(
                    "Dashboard permissions not found"
                )
        
        return wrapper
    return decorator


def rate_limit(max_requests=100, window_seconds=3600):
    """
    Simple rate limiting decorator (basic implementation)
    
    Args:
        max_requests: Maximum number of requests allowed
        window_seconds: Time window in seconds
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # This is a basic implementation
            # In production, you'd want to use Redis or similar
            # For now, just log the rate limit check
            logger.debug(f"Rate limit check for {func.__name__}: {max_requests}/{window_seconds}s")
            return func(*args, **kwargs)
        return wrapper
    return decorator


def cache_response(timeout=300):
    """
    Decorator to cache API responses (basic implementation)
    
    Args:
        timeout: Cache timeout in seconds
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # This is a basic implementation
            # In production, you'd want to use Redis or Django cache framework
            logger.debug(f"Cache check for {func.__name__}: timeout={timeout}s")
            return func(*args, **kwargs)
        return wrapper
    return decorator