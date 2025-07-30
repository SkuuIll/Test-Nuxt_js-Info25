from rest_framework.response import Response
from rest_framework import status


class DashboardResponse:
    """Utility class for standardized dashboard API responses"""
    
    @staticmethod
    def success(data=None, message=None, status_code=status.HTTP_200_OK):
        """Return a standardized success response"""
        response_data = {
            'error': False,
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
            'error': True,
            'success': False,
            'message': error_message,
        }
        if message and message != error_message:
            response_data['details'] = message
        if errors:
            response_data['errors'] = errors
        return Response(response_data, status=status_code)
    
    @staticmethod
    def not_found(message="Resource not found"):
        """Return a standardized 404 response"""
        return DashboardResponse.error(
            error_message=message,
            status_code=status.HTTP_404_NOT_FOUND
        )
    
    @staticmethod
    def permission_denied(message="Permission denied"):
        """Return a standardized 403 response"""
        return DashboardResponse.error(
            error_message=message,
            status_code=status.HTTP_403_FORBIDDEN
        )
    
    @staticmethod
    def validation_error(serializer_errors):
        """Return a standardized validation error response"""
        return DashboardResponse.error(
            error_message="Validation failed",
            errors=serializer_errors,
            status_code=status.HTTP_400_BAD_REQUEST
        )
    
    @staticmethod
    def unauthorized(message="Unauthorized"):
        """Return a standardized 401 response"""
        return DashboardResponse.error(
            error_message=message,
            status_code=status.HTTP_401_UNAUTHORIZED
        )