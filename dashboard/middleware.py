import logging
from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from django.urls import resolve
from rest_framework import status
from .utils import log_activity, get_client_ip, validate_dashboard_access


logger = logging.getLogger(__name__)


class DashboardSecurityMiddleware(MiddlewareMixin):
    """
    Middleware de seguridad específico para el dashboard
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        super().__init__(get_response)
    
    def process_request(self, request):
        """
        Procesar peticiones al dashboard
        """
        # Solo aplicar a rutas del dashboard
        if not request.path.startswith('/dashboard/'):
            return None
        
        # Logging de acceso al dashboard
        if hasattr(request, 'user') and request.user.is_authenticated:
            logger.info(
                f"Dashboard access: {request.user.username} - "
                f"{request.method} {request.path} - "
                f"IP: {get_client_ip(request)}"
            )
        
        return None
    
    def process_response(self, request, response):
        """
        Procesar respuestas del dashboard
        """
        # Solo aplicar a rutas del dashboard
        if not request.path.startswith('/dashboard/'):
            return response
        
        # Logging de respuestas de error
        if response.status_code >= 400:
            logger.warning(
                f"Dashboard error response: {response.status_code} - "
                f"{request.method} {request.path} - "
                f"User: {getattr(request, 'user', 'Anonymous')} - "
                f"IP: {get_client_ip(request)}"
            )
        
        return response
    
    def process_exception(self, request, exception):
        """
        Manejar excepciones en el dashboard
        """
        # Solo aplicar a rutas del dashboard
        if not request.path.startswith('/dashboard/'):
            return None
        
        # Log de la excepción
        logger.error(
            f"Dashboard exception: {str(exception)} - "
            f"{request.method} {request.path} - "
            f"User: {getattr(request, 'user', 'Anonymous')} - "
            f"IP: {get_client_ip(request)}",
            exc_info=True
        )
        
        # Registrar actividad si hay usuario autenticado
        if hasattr(request, 'user') and request.user.is_authenticated:
            try:
                log_activity(
                    user=request.user,
                    action='dashboard_error',
                    description=f'Error en dashboard: {str(exception)}',
                    request=request
                )
            except:
                pass  # No fallar si no se puede registrar la actividad
        
        # Retornar respuesta de error estandarizada para APIs del dashboard
        if request.path.startswith('/dashboard/api/') or request.path.startswith('/dashboard/auth/'):
            return JsonResponse({
                'error': True,
                'success': False,
                'message': 'Error interno del servidor'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return None


class DashboardAuthenticationMiddleware(MiddlewareMixin):
    """
    Middleware para validar autenticación específica del dashboard
    """
    
    # Rutas que no requieren autenticación del dashboard
    EXEMPT_PATHS = [
        '/dashboard/auth/login/',
    ]
    
    def __init__(self, get_response):
        self.get_response = get_response
        super().__init__(get_response)
    
    def process_request(self, request):
        """
        Validar autenticación para rutas del dashboard
        """
        # Solo aplicar a rutas del dashboard (excepto login)
        if not request.path.startswith('/dashboard/'):
            return None
        
        # Permitir rutas exentas
        if any(request.path.startswith(path) for path in self.EXEMPT_PATHS):
            return None
        
        # Validar acceso al dashboard
        if hasattr(request, 'user'):
            has_access, reason = validate_dashboard_access(request.user)
            
            if not has_access:
                # Log del intento de acceso no autorizado
                logger.warning(
                    f"Unauthorized dashboard access attempt: "
                    f"User: {getattr(request, 'user', 'Anonymous')} - "
                    f"Reason: {reason} - "
                    f"Path: {request.path} - "
                    f"IP: {get_client_ip(request)}"
                )
                
                # Retornar error para APIs
                if (request.path.startswith('/dashboard/api/') or 
                    request.path.startswith('/dashboard/auth/') or
                    request.path.startswith('/dashboard/stats/')):
                    
                    return JsonResponse({
                        'error': True,
                        'success': False,
                        'message': 'Sin permisos para acceder al dashboard'
                    }, status=status.HTTP_403_FORBIDDEN)
        
        return None


class DashboardRateLimitMiddleware(MiddlewareMixin):
    """
    Middleware básico de rate limiting para el dashboard
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.request_counts = {}  # En producción usar Redis
        super().__init__(get_response)
    
    def process_request(self, request):
        """
        Aplicar rate limiting básico
        """
        # Solo aplicar a rutas del dashboard
        if not request.path.startswith('/dashboard/'):
            return None
        
        # Rate limiting básico por IP
        client_ip = get_client_ip(request)
        current_time = timezone.now()
        
        # Limpiar contadores antiguos (implementación básica)
        # En producción usar Redis con TTL
        
        # Por ahora solo logear para monitoreo
        logger.debug(f"Dashboard request from IP: {client_ip} - Path: {request.path}")
        
        return None


# Importar timezone para el rate limiting
from django.utils import timezone