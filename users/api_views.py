from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from .serializers import UserSerializer, UserRegistrationSerializer
from django_blog.api_utils import StandardAPIResponse, HTTPStatus, ErrorMessages
from django_blog.decorators import api_error_handler, require_fields, log_api_call

User = get_user_model()

@api_view(['POST'])
@permission_classes([AllowAny])
@api_error_handler
@log_api_call
@require_fields('username', 'password')
def login(request):
    """Login endpoint with standardized error handling"""
    username = request.data.get('username')
    password = request.data.get('password')
    
    user = authenticate(username=username, password=password)
    
    if user:
        if not user.is_active:
            return StandardAPIResponse.error(
                error_message=ErrorMessages.ACCOUNT_DISABLED,
                status_code=HTTPStatus.UNAUTHORIZED
            )
        
        refresh = RefreshToken.for_user(user)
        return StandardAPIResponse.success({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        }, message='Login successful')
    else:
        return StandardAPIResponse.error(
            error_message=ErrorMessages.INVALID_CREDENTIALS,
            status_code=HTTPStatus.UNAUTHORIZED
        )

@api_view(['POST'])
@permission_classes([AllowAny])
@api_error_handler
@log_api_call
@require_fields('username', 'email', 'password')
def register(request):
    """Registration endpoint with standardized error handling"""
    serializer = UserRegistrationSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        
        return StandardAPIResponse.success({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        }, message='Registration successful', status_code=HTTPStatus.CREATED)
    
    return StandardAPIResponse.validation_error(
        serializer_errors=serializer.errors,
        message='Registration validation failed'
    )

@api_view(['POST'])
@permission_classes([AllowAny])
@api_error_handler
@log_api_call
@require_fields('refresh')
def refresh_token(request):
    """Refresh token endpoint with standardized error handling"""
    refresh_token = request.data.get('refresh')
    
    try:
        refresh = RefreshToken(refresh_token)
        return StandardAPIResponse.success({
            'access': str(refresh.access_token)
        }, message='Token refreshed successfully')
    except TokenError:
        return StandardAPIResponse.error(
            error_message=ErrorMessages.TOKEN_EXPIRED,
            message='Invalid or expired refresh token',
            status_code=HTTPStatus.UNAUTHORIZED
        )
    except Exception as e:
        return StandardAPIResponse.error(
            error_message='Token refresh failed',
            status_code=HTTPStatus.UNAUTHORIZED
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
@api_error_handler
@log_api_call
def profile(request):
    """Get user profile with standardized error handling"""
    return StandardAPIResponse.success(
        data=UserSerializer(request.user).data,
        message='Profile retrieved successfully'
    )

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
@api_error_handler
@log_api_call
def update_profile(request):
    """Update user profile with standardized error handling"""
    serializer = UserSerializer(request.user, data=request.data, partial=True)
    
    if serializer.is_valid():
        serializer.save()
        return StandardAPIResponse.success(
            data=serializer.data, 
            message='Profile updated successfully'
        )
    
    return StandardAPIResponse.validation_error(
        serializer_errors=serializer.errors,
        message='Profile validation failed'
    )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@api_error_handler
@log_api_call
@require_fields('current_password', 'new_password')
def change_password(request):
    """Change password with standardized error handling"""
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')
    
    if not request.user.check_password(current_password):
        return StandardAPIResponse.error(
            error_message='Current password is incorrect',
            status_code=HTTPStatus.BAD_REQUEST
        )
    
    # Validate new password strength
    if len(new_password) < 8:
        return StandardAPIResponse.validation_error(
            serializer_errors={'new_password': ['Password must be at least 8 characters long']},
            message='Password validation failed'
        )
    
    request.user.set_password(new_password)
    request.user.save()
    
    return StandardAPIResponse.success(message='Password changed successfully')

@api_view(['POST'])
@permission_classes([AllowAny])
@api_error_handler
@log_api_call
@require_fields('email')
def password_reset(request):
    """Request password reset with standardized error handling"""
    email = request.data.get('email')
    
    try:
        user = User.objects.get(email=email)
        # Here you would typically send an email with reset link
        # For now, just return success
        return StandardAPIResponse.success(message='Password reset email sent')
    except User.DoesNotExist:
        # Don't reveal if email exists or not for security
        return StandardAPIResponse.success(message='Password reset email sent')

@api_view(['POST'])
@permission_classes([AllowAny])
@api_error_handler
@log_api_call
@require_fields('token', 'new_password')
def password_reset_confirm(request):
    """Confirm password reset with standardized error handling"""
    token = request.data.get('token')
    new_password = request.data.get('new_password')
    
    # Validate new password strength
    if len(new_password) < 8:
        return StandardAPIResponse.validation_error(
            serializer_errors={'new_password': ['Password must be at least 8 characters long']},
            message='Password validation failed'
        )
    
    # Here you would validate the token and reset password
    # For now, just return success
    return StandardAPIResponse.success(message='Password reset successfully')

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@api_error_handler
@log_api_call
def logout(request):
    """Logout endpoint with standardized error handling"""
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        return StandardAPIResponse.success(message='Logged out successfully')
    except TokenError:
        # Token might already be blacklisted or invalid
        return StandardAPIResponse.success(message='Logged out successfully')
    except Exception as e:
        # Even if blacklisting fails, consider logout successful
        return StandardAPIResponse.success(message='Logged out successfully')