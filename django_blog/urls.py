"""
URL configuration for django_blog project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
import time

def cors_test_view(request):
    """Simple CORS test view"""
    return JsonResponse({
        'method': request.method,
        'origin': request.META.get('HTTP_ORIGIN', 'No origin'),
        'cors_enabled': True,
        'timestamp': int(time.time() * 1000),
        'message': 'CORS test successful'
    })

def api_root(request):
    return JsonResponse({
        'message': 'Django Blog API',
        'version': '1.0',
        'endpoints': {
            'admin': '/admin/',
            'api': '/api/v1/',
            'posts': '/api/v1/posts/',
            'categories': '/api/v1/categories/',
            'users': '/api/v1/users/',
            'dashboard': '/api/v1/dashboard/',
            'dashboard_auth': '/api/v1/dashboard/auth/',
            'media': '/api/v1/media/',
            'cors_test': '/api/v1/cors-test/',
        }
    })

urlpatterns = [
    path('', api_root, name='api_root'),  # API root endpoint
    path('admin/', admin.site.urls),  # Django admin principal
    path('tinymce/', include('tinymce.urls')),
    path('api/v1/', include('posts.urls')),  # API endpoints
    path('api/v1/users/', include('users.urls')),  # User API endpoints
    path('api/v1/dashboard/', include('dashboard.urls')),  # Dashboard API endpoints
    path('api/v1/media/', include('media_files.urls')),  # Media files API endpoints
    path('api/v1/cors-test/', cors_test_view, name='cors_test'),  # CORS testing endpoint
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
