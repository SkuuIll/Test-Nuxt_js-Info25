# Este archivo se mantiene para compatibilidad pero ya no se usa
# Todas las vistas de autenticación ahora están en api_views.py

from django.http import JsonResponse

def deprecated_view(request):
    """Vista deprecada - usar API endpoints en su lugar"""
    return JsonResponse({
        'message': 'Esta vista ha sido deprecada. Usar endpoints API en su lugar',
        'api_endpoints': {
            'login': '/api/v1/users/auth/login/',
            'register': '/api/v1/users/auth/register/',
            'profile': '/api/v1/users/auth/profile/'
        }
    })