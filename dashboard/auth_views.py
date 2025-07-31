"""
Additional authentication views for dashboard
"""

from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken, UntypedToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from django.contrib.auth import get_user_model
from django.utils import timezone
from django_blog.api_utils import DashboardAPIResponse, BaseDashboardAPIView, HTTPStatus
from django_blog.decorators import api_error_handler, log_api_call, require_fields
from .models import DashboardPermission
from .permissions import IsDashboardUser
from .utils import log_activity
from .serializers import DashboardPermissionSerializer

User = get_user_model()


class DashboardTokenValidateView(BaseDashboardAPIView):
    """
    Vista para validar tokens JWT del dashboard
    """
    
    @api_error_handler
    @log_api_call
    @require_fields('token')
    def post(self, request):
        """Validar un token JWT"""
        token = request.data.get('token')
        
        try:
            # Validar el token
            validated_token = UntypedToken(token)
            user_id = validated_token.payload.get('user_id')
            
            # Verificar que el usuario existe y está activo
            try:
                user = User.objects.get(id=user_id)
                if not user.is_active:
                    return self.unauthorized_response('Usuario desactivado')
                
                # Verificar permisos de dashboard
                try:
                    dashboard_permission = user.dashboard_permission
                    has_dashboard_access = (
                        user.is_superuser or
                        dashboard_permission.can_view_stats or
                        dashboard_permission.can_manage_posts or
                        dashboard_permission.can_manage_users or
                        dashboard_permission.can_manage_comments
                    )
                    
                    if not has_dashboard_access:
                        return self.permission_denied_response('Sin permisos de dashboard')
                        
                except DashboardPermission.DoesNotExist:
                    return self.permission_denied_response('Permisos de dashboard no encontrados')
                
                return self.success_response({
                    'valid': True,
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'is_superuser': user.is_superuser,
                    },
                    'permissions': DashboardPermissionSerializer(dashboard_permission).data,
                    'token_info': {
                        'exp': validated_token.payload.get('exp'),
                        'iat': validated_token.payload.get('iat'),
                        'token_type': validated_token.payload.get('token_type', 'access')
                    }
                }, message='Token válido')
                
            except User.DoesNotExist:
                return self.unauthorized_response('Usuario no encontrado')
            
        except TokenError as e:
            return self.unauthorized_response('Token inválido o expirado')
        except Exception as e:
            return self.server_error_response(
                message='Error al validar token',
                exception=e
            )


class DashboardPermissionUpdateView(BaseDashboardAPIView):
    """
    Vista para actualizar permisos de dashboard (solo superusuarios)
    """
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    
    @api_error_handler
    @log_api_call
    @require_fields('user_id')
    def post(self, request):
        """Actualizar permisos de dashboard de un usuario"""
        user_id = request.data.get('user_id')
        permissions_data = request.data.get('permissions', {})
        
        try:
            # Verificar que el usuario existe
            target_user = User.objects.get(id=user_id)
            
            # Obtener o crear permisos de dashboard
            dashboard_permission, created = DashboardPermission.objects.get_or_create(
                user=target_user
            )
            
            # Actualizar permisos
            updated_fields = []
            permission_fields = ['can_view_stats', 'can_manage_posts', 'can_manage_users', 'can_manage_comments']
            
            for field in permission_fields:
                if field in permissions_data:
                    old_value = getattr(dashboard_permission, field)
                    new_value = permissions_data[field]
                    
                    if old_value != new_value:
                        setattr(dashboard_permission, field, new_value)
                        updated_fields.append(f"{field}: {old_value} -> {new_value}")
            
            if updated_fields:
                dashboard_permission.save()
                
                # Registrar actividad
                log_activity(
                    user=request.user,
                    action='updated_dashboard_permissions',
                    target_model='DashboardPermission',
                    target_id=dashboard_permission.id,
                    description=f'Permisos actualizados para {target_user.username}: {", ".join(updated_fields)}',
                    request=request
                )
                
                return self.success_response({
                    'user': {
                        'id': target_user.id,
                        'username': target_user.username,
                        'email': target_user.email,
                    },
                    'permissions': DashboardPermissionSerializer(dashboard_permission).data,
                    'updated_fields': updated_fields
                }, message='Permisos actualizados exitosamente')
            else:
                return self.success_response(
                    message='No se realizaron cambios en los permisos'
                )
                
        except User.DoesNotExist:
            return self.not_found_response('Usuario no encontrado')
        except Exception as e:
            return self.server_error_response(
                message='Error al actualizar permisos',
                exception=e
            )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, IsDashboardUser])
@api_error_handler
@log_api_call
def dashboard_user_list(request):
    """
    Obtener lista de usuarios con permisos de dashboard
    """
    try:
        # Solo superusuarios pueden ver la lista completa
        if not request.user.is_superuser:
            return DashboardAPIResponse.permission_denied(
                'Solo superusuarios pueden ver la lista de usuarios del dashboard'
            )
        
        # Obtener usuarios con permisos de dashboard
        dashboard_users = User.objects.filter(
            dashboard_permission__isnull=False
        ).select_related('dashboard_permission').order_by('username')
        
        users_data = []
        for user in dashboard_users:
            try:
                permission = user.dashboard_permission
                users_data.append({
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'is_active': user.is_active,
                    'is_superuser': user.is_superuser,
                    'last_login': user.last_login,
                    'permissions': DashboardPermissionSerializer(permission).data
                })
            except DashboardPermission.DoesNotExist:
                continue
        
        return DashboardAPIResponse.success({
            'users': users_data,
            'count': len(users_data)
        }, message='Lista de usuarios del dashboard obtenida exitosamente')
        
    except Exception as e:
        return DashboardAPIResponse.error(
            f'Error al obtener lista de usuarios: {str(e)}',
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsDashboardUser])
@api_error_handler
@log_api_call
def revoke_dashboard_access(request):
    """
    Revocar acceso al dashboard de un usuario
    """
    try:
        # Solo superusuarios pueden revocar acceso
        if not request.user.is_superuser:
            return DashboardAPIResponse.permission_denied(
                'Solo superusuarios pueden revocar acceso al dashboard'
            )
        
        user_id = request.data.get('user_id')
        if not user_id:
            return DashboardAPIResponse.error(
                'user_id es requerido',
                status_code=HTTPStatus.BAD_REQUEST
            )
        
        # Verificar que el usuario existe
        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return DashboardAPIResponse.not_found('Usuario no encontrado')
        
        # No permitir revocar acceso a superusuarios
        if target_user.is_superuser:
            return DashboardAPIResponse.error(
                'No se puede revocar acceso a superusuarios',
                status_code=HTTPStatus.BAD_REQUEST
            )
        
        # No permitir auto-revocación
        if target_user == request.user:
            return DashboardAPIResponse.error(
                'No puedes revocar tu propio acceso',
                status_code=HTTPStatus.BAD_REQUEST
            )
        
        # Revocar permisos
        try:
            dashboard_permission = target_user.dashboard_permission
            dashboard_permission.can_view_stats = False
            dashboard_permission.can_manage_posts = False
            dashboard_permission.can_manage_users = False
            dashboard_permission.can_manage_comments = False
            dashboard_permission.save()
            
            # Registrar actividad
            log_activity(
                user=request.user,
                action='revoked_dashboard_access',
                target_model='DashboardPermission',
                target_id=dashboard_permission.id,
                description=f'Acceso al dashboard revocado para {target_user.username}',
                request=request
            )
            
            return DashboardAPIResponse.success(
                message=f'Acceso al dashboard revocado para {target_user.username}'
            )
            
        except DashboardPermission.DoesNotExist:
            return DashboardAPIResponse.success(
                message='El usuario ya no tenía acceso al dashboard'
            )
        
    except Exception as e:
        return DashboardAPIResponse.error(
            f'Error al revocar acceso: {str(e)}',
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR
        )


class DashboardHealthCheckView(APIView):
    """
    Vista para verificar el estado del sistema de autenticación del dashboard
    """
    
    def get(self, request):
        """Verificar estado del sistema"""
        try:
            health_data = {
                'status': 'healthy',
                'timestamp': timezone.now(),
                'checks': {
                    'database': self._check_database(),
                    'permissions': self._check_permissions(),
                    'authentication': self._check_authentication(),
                }
            }
            
            # Determinar estado general
            all_healthy = all(check['status'] == 'ok' for check in health_data['checks'].values())
            health_data['status'] = 'healthy' if all_healthy else 'degraded'
            
            status_code = HTTPStatus.OK if all_healthy else HTTPStatus.SERVICE_UNAVAILABLE
            
            return DashboardAPIResponse.success(
                data=health_data,
                status_code=status_code
            )
            
        except Exception as e:
            return DashboardAPIResponse.error(
                f'Health check failed: {str(e)}',
                status_code=HTTPStatus.INTERNAL_SERVER_ERROR
            )
    
    def _check_database(self):
        """Verificar conexión a la base de datos"""
        try:
            User.objects.count()
            DashboardPermission.objects.count()
            return {'status': 'ok', 'message': 'Database connection successful'}
        except Exception as e:
            return {'status': 'error', 'message': f'Database error: {str(e)}'}
    
    def _check_permissions(self):
        """Verificar sistema de permisos"""
        try:
            # Contar usuarios con permisos de dashboard
            dashboard_users_count = DashboardPermission.objects.count()
            return {
                'status': 'ok', 
                'message': f'{dashboard_users_count} users with dashboard permissions'
            }
        except Exception as e:
            return {'status': 'error', 'message': f'Permissions error: {str(e)}'}
    
    def _check_authentication(self):
        """Verificar sistema de autenticación"""
        try:
            # Verificar que se pueden crear tokens
            test_token = RefreshToken()
            return {'status': 'ok', 'message': 'JWT token system operational'}
        except Exception as e:
            return {'status': 'error', 'message': f'Authentication error: {str(e)}'}