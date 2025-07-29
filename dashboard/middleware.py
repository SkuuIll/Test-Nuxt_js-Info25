from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from .models import DashboardPermission
from .utils import log_activity, get_client_ip
import json


class DashboardAuthMiddleware(MiddlewareMixin):
    """
    Middleware para manejar autenticación específica del dashboard
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.jwt_auth = JWTAuthentication()
        super().__init__(get_response)
    
    def process_request(self, request):
        # Solo aplicar a rutas del dashboard
        if not request.path.startswith('/api/v1/dashboard/'):
            return None
        
        # Permitir endpoints de autenticación sin token
        auth_endpoints = [
            '/api/v1/dashboard/auth/login/',
            '/api/v1/dashboard/auth/refresh/',
        ]
        
        if request.path in auth_endpoints:
            return None
        
        # Intentar autenticar con JWT
        try:
            auth_result = self.jwt_auth.authenticate(request)
            if auth_result:
                user, token = auth_result
                request.user = user
                request.auth = token
                
                # Verificar permisos de dashboard
                if not self._has_dashboard_access(user):
                    return JsonResponse({
                        'error': True,
                        'message': 'No tienes permisos para acceder al dashboard'
                    }, status=403)
                    
        except (InvalidToken, TokenError):
            return JsonResponse({
                'error': True,
                'message': 'Token inválido o expirado'
            }, status=401)
        except Exception:
            return JsonResponse({
                'error': True,
                'message': 'Error de autenticación'
            }, status=401)
        
        return None
    
    def _has_dashboard_access(self, user):
        """Verificar si el usuario tiene acceso al dashboard"""
        if user.is_superuser:
            return True
        
        try:
            dashboard_permission = user.dashboard_permission
            return (dashboard_permission.can_view_stats or
                   dashboard_permission.can_manage_posts or
                   dashboard_permission.can_manage_users or
                   dashboard_permission.can_manage_comments)
        except DashboardPermission.DoesNotExist:
            return False


class DashboardActivityLogMiddleware(MiddlewareMixin):
    """
    Middleware para registrar automáticamente actividades del dashboard
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        super().__init__(get_response)
    
    def process_response(self, request, response):
        # Solo aplicar a rutas del dashboard API (no auth)
        if (request.path.startswith('/api/v1/dashboard/api/') and 
            hasattr(request, 'user') and 
            not isinstance(request.user, AnonymousUser)):
            
            # Registrar actividades según el método HTTP
            if response.status_code < 400:  # Solo registrar operaciones exitosas
                self._log_dashboard_activity(request, response)
        
        return response
    
    def _log_dashboard_activity(self, request, response):
        """Registrar actividad basada en la ruta y método HTTP"""
        try:
            method = request.method
            path = request.path
            user = request.user
            
            # Mapear rutas a acciones
            if 'posts' in path:
                if method == 'POST':
                    log_activity(user, 'created_post', 'Post', 
                               description='Post creado desde dashboard', request=request)
                elif method == 'PUT' or method == 'PATCH':
                    log_activity(user, 'updated_post', 'Post',
                               description='Post actualizado desde dashboard', request=request)
                elif method == 'DELETE':
                    log_activity(user, 'deleted_post', 'Post',
                               description='Post eliminado desde dashboard', request=request)
            
            elif 'users' in path:
                if method == 'POST':
                    log_activity(user, 'created_user', 'User',
                               description='Usuario creado desde dashboard', request=request)
                elif method == 'PUT' or method == 'PATCH':
                    log_activity(user, 'updated_user', 'User',
                               description='Usuario actualizado desde dashboard', request=request)
            
            elif 'comments' in path:
                if method == 'PUT' or method == 'PATCH':
                    log_activity(user, 'updated_comment', 'Comentario',
                               description='Comentario moderado desde dashboard', request=request)
                elif method == 'DELETE':
                    log_activity(user, 'deleted_comment', 'Comentario',
                               description='Comentario eliminado desde dashboard', request=request)
                    
        except Exception:
            # No interrumpir la respuesta si hay error en el logging
            pass


class DashboardCORSMiddleware(MiddlewareMixin):
    """
    Middleware CORS específico para el dashboard
    """
    
    def process_response(self, request, response):
        if request.path.startswith('/api/v1/dashboard/'):
            response['Access-Control-Allow-Origin'] = 'http://localhost:3000'
            response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            response['Access-Control-Allow-Credentials'] = 'true'
        
        return response