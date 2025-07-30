from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination


class StandardResponse:
    """Utility class for standardized API responses"""
    
    @staticmethod
    def success(data=None, message=None, status_code=status.HTTP_200_OK):
        """Return a standardized success response"""
        response_data = {
            'success': True,
            'data': data,
        }
        if message:
            response_data['message'] = message
        return Response(response_data, status=status_code)
    
    @staticmethod
    def error(error_message, message=None, status_code=status.HTTP_400_BAD_REQUEST, errors=None):
        """Return a standardized error response"""
        response_data = {
            'success': False,
            'error': error_message,
        }
        if message:
            response_data['message'] = message
        if errors:
            response_data['errors'] = errors
        return Response(response_data, status=status_code)
    
    @staticmethod
    def not_found(message="Resource not found"):
        """Return a standardized 404 response"""
        return StandardResponse.error(
            error_message=message,
            status_code=status.HTTP_404_NOT_FOUND
        )
    
    @staticmethod
    def permission_denied(message="Permission denied"):
        """Return a standardized 403 response"""
        return StandardResponse.error(
            error_message=message,
            status_code=status.HTTP_403_FORBIDDEN
        )
    
    @staticmethod
    def validation_error(serializer_errors):
        """Return a standardized validation error response"""
        return StandardResponse.error(
            error_message="Validation failed",
            errors=serializer_errors,
            status_code=status.HTTP_400_BAD_REQUEST
        )


class StandardPagination(PageNumberPagination):
    """Standardized pagination class"""
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 100
    
    def get_paginated_response(self, data):
        """Return a standardized paginated response"""
        return Response({
            'success': True,
            'data': data,
            'count': self.page.paginator.count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'page_size': self.page_size,
            'current_page': self.page.number,
            'total_pages': self.page.paginator.num_pages
        })


class BaseAPIView:
    """Base mixin for API views with standardized responses"""
    
    def success_response(self, data=None, message=None, status_code=status.HTTP_200_OK):
        return StandardResponse.success(data, message, status_code)
    
    def error_response(self, error_message, message=None, status_code=status.HTTP_400_BAD_REQUEST, errors=None):
        return StandardResponse.error(error_message, message, status_code, errors)
    
    def not_found_response(self, message="Resource not found"):
        return StandardResponse.not_found(message)
    
    def permission_denied_response(self, message="Permission denied"):
        return StandardResponse.permission_denied(message)
    
    def validation_error_response(self, serializer_errors):
        return StandardResponse.validation_error(serializer_errors)