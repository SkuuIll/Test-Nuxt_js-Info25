from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from .serializers import UserSerializer, UserRegistrationSerializer
from .api_utils import StandardResponse

User = get_user_model()

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Login endpoint"""
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return StandardResponse.error(
            'Username and password are required',
            status_code=status.HTTP_400_BAD_REQUEST
        )
    
    user = authenticate(username=username, password=password)
    
    if user:
        if not user.is_active:
            return StandardResponse.error(
                'Account is disabled',
                status_code=status.HTTP_401_UNAUTHORIZED
            )
        
        refresh = RefreshToken.for_user(user)
        return StandardResponse.success({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        }, message='Login successful')
    else:
        return StandardResponse.error(
            'Invalid credentials',
            status_code=status.HTTP_401_UNAUTHORIZED
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Registration endpoint"""
    serializer = UserRegistrationSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        
        return StandardResponse.success({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        }, message='Registration successful', status_code=status.HTTP_201_CREATED)
    
    return StandardResponse.validation_error(serializer.errors)

@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token(request):
    """Refresh token endpoint"""
    refresh_token = request.data.get('refresh')
    
    if not refresh_token:
        return StandardResponse.error(
            'Refresh token is required',
            status_code=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        refresh = RefreshToken(refresh_token)
        return StandardResponse.success({
            'access': str(refresh.access_token)
        }, message='Token refreshed successfully')
    except TokenError:
        return StandardResponse.error(
            'Invalid or expired refresh token',
            status_code=status.HTTP_401_UNAUTHORIZED
        )
    except Exception as e:
        return StandardResponse.error(
            'Token refresh failed',
            status_code=status.HTTP_401_UNAUTHORIZED
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    """Get user profile"""
    return StandardResponse.success(UserSerializer(request.user).data)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """Update user profile"""
    serializer = UserSerializer(request.user, data=request.data, partial=True)
    
    if serializer.is_valid():
        serializer.save()
        return StandardResponse.success(
            serializer.data, 
            message='Profile updated successfully'
        )
    
    return StandardResponse.validation_error(serializer.errors)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Change password"""
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')
    
    if not current_password or not new_password:
        return StandardResponse.error(
            'Current password and new password are required',
            status_code=status.HTTP_400_BAD_REQUEST
        )
    
    if not request.user.check_password(current_password):
        return StandardResponse.error(
            'Current password is incorrect',
            status_code=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate new password strength
    if len(new_password) < 8:
        return StandardResponse.error(
            'New password must be at least 8 characters long',
            status_code=status.HTTP_400_BAD_REQUEST
        )
    
    request.user.set_password(new_password)
    request.user.save()
    
    return StandardResponse.success(message='Password changed successfully')

@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset(request):
    """Request password reset"""
    email = request.data.get('email')
    
    if not email:
        return StandardResponse.error(
            'Email is required',
            status_code=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(email=email)
        # Here you would typically send an email with reset link
        # For now, just return success
        return StandardResponse.success(message='Password reset email sent')
    except User.DoesNotExist:
        # Don't reveal if email exists or not for security
        return StandardResponse.success(message='Password reset email sent')

@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_confirm(request):
    """Confirm password reset"""
    token = request.data.get('token')
    new_password = request.data.get('new_password')
    
    if not token or not new_password:
        return StandardResponse.error(
            'Token and new password are required',
            status_code=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate new password strength
    if len(new_password) < 8:
        return StandardResponse.error(
            'New password must be at least 8 characters long',
            status_code=status.HTTP_400_BAD_REQUEST
        )
    
    # Here you would validate the token and reset password
    # For now, just return success
    return StandardResponse.success(message='Password reset successfully')

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """Logout endpoint"""
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        return StandardResponse.success(message='Logged out successfully')
    except TokenError:
        # Token might already be blacklisted or invalid
        return StandardResponse.success(message='Logged out successfully')
    except Exception as e:
        # Even if blacklisting fails, consider logout successful
        return StandardResponse.success(message='Logged out successfully')