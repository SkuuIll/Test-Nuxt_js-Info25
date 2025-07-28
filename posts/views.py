# Este archivo se mantiene para compatibilidad pero ya no se usa
# Todas las vistas ahora están en api_views.py

from django.http import JsonResponse

def deprecated_view(request):
    """Vista deprecada - usar API endpoints en su lugar"""
    return JsonResponse({
        'message': 'Esta vista ha sido deprecada. Usar endpoints API en /api/v1/',
        'api_endpoints': {
            'posts': '/api/v1/posts/',
            'categories': '/api/v1/categories/',
            'auth': '/api/v1/users/auth/'
        }
    })