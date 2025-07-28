from django.urls import path
from . import api_views

app_name = 'users'

urlpatterns = [
    # Authentication endpoints
    path('auth/login/', api_views.login, name='login'),
    path('auth/register/', api_views.register, name='register'),
    path('auth/refresh/', api_views.refresh_token, name='refresh_token'),
    path('auth/logout/', api_views.logout, name='logout'),
    
    # Profile endpoints
    path('auth/profile/', api_views.profile, name='profile'),
    path('auth/profile/update/', api_views.update_profile, name='update_profile'),
    path('auth/change-password/', api_views.change_password, name='change_password'),
    
    # Password reset endpoints
    path('auth/password-reset/', api_views.password_reset, name='password_reset'),
    path('auth/password-reset/confirm/', api_views.password_reset_confirm, name='password_reset_confirm'),
]