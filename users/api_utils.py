from rest_framework.response import Response
from rest_framework import status


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
    def validation_error(serializer_errors):
        """Return a standardized validation error response"""
        return StandardResponse.error(
            error_message="Validation failed",
            errors=serializer_errors,
            status_code=status.HTTP_400_BAD_REQUEST
        )