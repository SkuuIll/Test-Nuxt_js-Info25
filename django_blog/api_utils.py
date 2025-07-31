from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.views import APIView
from django.core.exceptions import ValidationError
from django.http import Http404
import logging


logger = logging.getLogger(__name__)


class StandardAPIResponse:
    """
    Centralized utility class for standardized API responses across all apps
    """
    
    @staticmethod
    def success(data=None, message=None, status_code=status.HTTP_200_OK, **kwargs):
        """Return a standardized success response"""
        response_data = {
            'success': True,
            'data': data,
        }
        if message:
            response_data['message'] = message
        
        # Add any additional fields
        response_data.update(kwargs)
        
        return Response(response_data, status=status_code)
    
    @staticmethod
    def error(error_message, message=None, status_code=status.HTTP_400_BAD_REQUEST, errors=None, **kwargs):
        """Return a standardized error response"""
        response_data = {
            'success': False,
            'error': error_message,
        }
        if message:
            response_data['message'] = message
        if errors:
            response_data['errors'] = errors
        
        # Add any additional fields
        response_data.update(kwargs)
        
        return Response(response_data, status=status_code)
    
    @staticmethod
    def not_found(message="Resource not found", resource_type=None):
        """Return a standardized 404 response"""
        error_message = message
        if resource_type:
            error_message = f"{resource_type} not found"
        
        return StandardAPIResponse.error(
            error_message=error_message,
            status_code=status.HTTP_404_NOT_FOUND
        )
    
    @staticmethod
    def permission_denied(message="Permission denied", required_permission=None):
        """Return a standardized 403 response"""
        error_message = message
        if required_permission:
            error_message = f"Permission required: {required_permission}"
        
        return StandardAPIResponse.error(
            error_message=error_message,
            status_code=status.HTTP_403_FORBIDDEN
        )
    
    @staticmethod
    def unauthorized(message="Authentication required"):
        """Return a standardized 401 response"""
        return StandardAPIResponse.error(
            error_message=message,
            status_code=status.HTTP_401_UNAUTHORIZED
        )
    
    @staticmethod
    def validation_error(serializer_errors, message="Validation failed"):
        """Return a standardized validation error response"""
        return StandardAPIResponse.error(
            error_message=message,
            errors=serializer_errors,
            status_code=status.HTTP_400_BAD_REQUEST
        )
    
    @staticmethod
    def server_error(message="Internal server error", exception=None):
        """Return a standardized 500 response"""
        if exception:
            logger.error(f"Server error: {str(exception)}", exc_info=True)
        
        return StandardAPIResponse.error(
            error_message=message,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    @staticmethod
    def method_not_allowed(message="Method not allowed"):
        """Return a standardized 405 response"""
        return StandardAPIResponse.error(
            error_message=message,
            status_code=status.HTTP_405_METHOD_NOT_ALLOWED
        )
    
    @staticmethod
    def conflict(message="Resource conflict", details=None):
        """Return a standardized 409 response"""
        return StandardAPIResponse.error(
            error_message=message,
            message=details,
            status_code=status.HTTP_409_CONFLICT
        )
    
    @staticmethod
    def rate_limited(message="Rate limit exceeded"):
        """Return a standardized 429 response"""
        return StandardAPIResponse.error(
            error_message=message,
            status_code=status.HTTP_429_TOO_MANY_REQUESTS
        )


class StandardPagination(PageNumberPagination):
    """Standardized pagination class with consistent response format"""
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 100
    
    def get_paginated_response(self, data):
        """Return a standardized paginated response"""
        return Response({
            'success': True,
            'data': data,
            'pagination': {
                'count': self.page.paginator.count,
                'next': self.get_next_link(),
                'previous': self.get_previous_link(),
                'page_size': self.page_size,
                'current_page': self.page.number,
                'total_pages': self.page.paginator.num_pages,
                'has_next': self.page.has_next(),
                'has_previous': self.page.has_previous()
            }
        })


class BaseAPIView(APIView):
    """
    Base API view class with standardized response methods and error handling
    """
    
    def success_response(self, data=None, message=None, status_code=status.HTTP_200_OK, **kwargs):
        """Return a standardized success response"""
        return StandardAPIResponse.success(data, message, status_code, **kwargs)
    
    def error_response(self, error_message, message=None, status_code=status.HTTP_400_BAD_REQUEST, errors=None, **kwargs):
        """Return a standardized error response"""
        return StandardAPIResponse.error(error_message, message, status_code, errors, **kwargs)
    
    def not_found_response(self, message="Resource not found", resource_type=None):
        """Return a standardized 404 response"""
        return StandardAPIResponse.not_found(message, resource_type)
    
    def permission_denied_response(self, message="Permission denied", required_permission=None):
        """Return a standardized 403 response"""
        return StandardAPIResponse.permission_denied(message, required_permission)
    
    def unauthorized_response(self, message="Authentication required"):
        """Return a standardized 401 response"""
        return StandardAPIResponse.unauthorized(message)
    
    def validation_error_response(self, serializer_errors, message="Validation failed"):
        """Return a standardized validation error response"""
        return StandardAPIResponse.validation_error(serializer_errors, message)
    
    def server_error_response(self, message="Internal server error", exception=None):
        """Return a standardized 500 response"""
        return StandardAPIResponse.server_error(message, exception)
    
    def handle_exceptions(self, func, *args, **kwargs):
        """
        Wrapper method to handle common exceptions in API views
        """
        try:
            return func(*args, **kwargs)
        except Http404:
            return self.not_found_response()
        except ValidationError as e:
            return self.validation_error_response(
                serializer_errors={'detail': str(e)},
                message="Validation error"
            )
        except PermissionError:
            return self.permission_denied_response()
        except Exception as e:
            logger.error(f"Unexpected error in {func.__name__}: {str(e)}", exc_info=True)
            return self.server_error_response(exception=e)


class DashboardAPIResponse:
    """
    Specialized response class for dashboard APIs with consistent format.
    Mirrors StandardAPIResponse for consistency.
    """
    
    @staticmethod
    def success(data=None, message=None, status_code=status.HTTP_200_OK, **kwargs):
        """Return a standardized dashboard success response"""
        response_data = {
            'success': True,
            'data': data,
        }
        if message:
            response_data['message'] = message
        
        response_data.update(kwargs)
        
        return Response(response_data, status=status_code)
    
    @staticmethod
    def error(error_message, message=None, status_code=status.HTTP_400_BAD_REQUEST, errors=None, **kwargs):
        """Return a standardized dashboard error response"""
        response_data = {
            'success': False,
            'error': error_message,
        }
        if message:
            response_data['message'] = message
        if errors:
            response_data['errors'] = errors
        
        response_data.update(kwargs)
        
        return Response(response_data, status=status_code)
    
    @staticmethod
    def not_found(message="Resource not found"):
        """Return a standardized dashboard 404 response"""
        return DashboardAPIResponse.error(
            error_message=message,
            status_code=status.HTTP_404_NOT_FOUND
        )
    
    @staticmethod
    def permission_denied(message="Permission denied"):
        """Return a standardized dashboard 403 response"""
        return DashboardAPIResponse.error(
            error_message=message,
            status_code=status.HTTP_403_FORBIDDEN
        )
    
    @staticmethod
    def unauthorized(message="Unauthorized"):
        """Return a standardized dashboard 401 response"""
        return DashboardAPIResponse.error(
            error_message=message,
            status_code=status.HTTP_401_UNAUTHORIZED
        )
    
    @staticmethod
    def validation_error(serializer_errors, message="Validation failed"):
        """Return a standardized dashboard validation error response"""
        return DashboardAPIResponse.error(
            error_message=message,
            errors=serializer_errors,
            status_code=status.HTTP_400_BAD_REQUEST
        )


class BaseDashboardAPIView(APIView):
    """
    Base dashboard API view class with standardized response methods
    """
    
    def success_response(self, data=None, message=None, status_code=status.HTTP_200_OK, **kwargs):
        """Return a standardized dashboard success response"""
        return DashboardAPIResponse.success(data, message, status_code, **kwargs)
    
    def error_response(self, error_message, message=None, status_code=status.HTTP_400_BAD_REQUEST, errors=None, **kwargs):
        """Return a standardized dashboard error response"""
        return DashboardAPIResponse.error(error_message, message, status_code, errors, **kwargs)
    
    def not_found_response(self, message="Resource not found"):
        """Return a standardized dashboard 404 response"""
        return DashboardAPIResponse.not_found(message)
    
    def permission_denied_response(self, message="Permission denied"):
        """Return a standardized dashboard 403 response"""
        return DashboardAPIResponse.permission_denied(message)
    
    def unauthorized_response(self, message="Unauthorized"):
        """Return a standardized dashboard 401 response"""
        return DashboardAPIResponse.unauthorized(message)
    
    def validation_error_response(self, serializer_errors, message="Validation failed"):
        """Return a standardized dashboard validation error response"""
        return DashboardAPIResponse.validation_error(serializer_errors, message)
    
    def handle_exceptions(self, func, *args, **kwargs):
        """
        Wrapper method to handle common exceptions in dashboard API views
        """
        try:
            return func(*args, **kwargs)
        except Http404:
            return self.not_found_response()
        except ValidationError as e:
            return self.validation_error_response(
                serializer_errors={'detail': str(e)},
                message="Validation error"
            )
        except PermissionError:
            return self.permission_denied_response()
        except Exception as e:
            logger.error(f"Unexpected error in dashboard {func.__name__}: {str(e)}", exc_info=True)
            return self.error_response(
                error_message="Internal server error",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# HTTP Status Code Constants for better readability
class HTTPStatus:
    """HTTP status code constants"""
    OK = status.HTTP_200_OK
    CREATED = status.HTTP_201_CREATED
    NO_CONTENT = status.HTTP_204_NO_CONTENT
    BAD_REQUEST = status.HTTP_400_BAD_REQUEST
    UNAUTHORIZED = status.HTTP_401_UNAUTHORIZED
    FORBIDDEN = status.HTTP_403_FORBIDDEN
    NOT_FOUND = status.HTTP_404_NOT_FOUND
    METHOD_NOT_ALLOWED = status.HTTP_405_METHOD_NOT_ALLOWED
    CONFLICT = status.HTTP_409_CONFLICT
    UNPROCESSABLE_ENTITY = status.HTTP_422_UNPROCESSABLE_ENTITY
    TOO_MANY_REQUESTS = status.HTTP_429_TOO_MANY_REQUESTS
    INTERNAL_SERVER_ERROR = status.HTTP_500_INTERNAL_SERVER_ERROR


# Error message constants
class ErrorMessages:
    """Common error messages"""
    VALIDATION_FAILED = "Validation failed"
    RESOURCE_NOT_FOUND = "Resource not found"
    PERMISSION_DENIED = "Permission denied"
    AUTHENTICATION_REQUIRED = "Authentication required"
    INTERNAL_SERVER_ERROR = "Internal server error"
    METHOD_NOT_ALLOWED = "Method not allowed"
    RATE_LIMIT_EXCEEDED = "Rate limit exceeded"
    INVALID_CREDENTIALS = "Invalid credentials"
    ACCOUNT_DISABLED = "Account is disabled"
    TOKEN_EXPIRED = "Token has expired"
    INVALID_TOKEN = "Invalid token"