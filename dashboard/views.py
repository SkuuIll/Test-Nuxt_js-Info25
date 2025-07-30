from rest_framework import status, permissions, viewsets, filters
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Q, Count
from django.core.exceptions import ValidationError
from posts.models import Post, Categoria, Comentario
from .models import DashboardPermission, ActivityLog
from .permissions import IsDashboardUser, CanViewStats, CanManagePosts, CanManageUsers, CanManageComments, IsOwnerOrCanManage
from .serializers import (
    DashboardPermissionSerializer, DashboardStatsSerializer, ActivityLogSerializer, 
    DashboardPostSerializer, DashboardCommentSerializer, CategorySerializer,
    DashboardUserSerializer, DashboardPostCreateUpdateSerializer
)
from .utils import log_activity, get_client_ip, get_dashboard_stats, get_top_performing_content
from .api_utils import DashboardResponse
from django_blog.api_utils import DashboardAPIResponse, BaseDashboardAPIView, HTTPStatus, ErrorMessages

User = get_user_model()


class DashboardTokenObtainPairView(TokenObtainPairView):
    """
    Vista personalizada para obtener tokens JWT específicamente para el dashboard
    """
    
    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return DashboardAPIResponse.error(
                'Username y password son requeridos',
                status_code=HTTPStatus.BAD_REQUEST
            )
        
        # Autenticar usuario
        user = authenticate(username=username, password=password)
        
        if not user:
            return DashboardAPIResponse.unauthorized('Credenciales inválidas')
        
        if not user.is_active:
            return DashboardAPIResponse.unauthorized('Usuario desactivado')
        
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
                return DashboardAPIResponse.permission_denied('No tienes permisos para acceder al dashboard')
                
        except DashboardPermission.DoesNotExist:
            return DashboardAPIResponse.permission_denied('No tienes permisos para acceder al dashboard')
        
        # Generar tokens
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token
        
        # Actualizar last_login
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])
        
        # Registrar actividad de login
        log_activity(
            user=user,
            action='login',
            description=f'Inicio de sesión en dashboard desde {get_client_ip(request)}',
            request=request
        )
        
        return DashboardAPIResponse.success({
            'access': str(access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_superuser': user.is_superuser,
                'permissions': DashboardPermissionSerializer(dashboard_permission).data
            }
        }, message='Login exitoso')


class DashboardTokenRefreshView(BaseDashboardAPIView):
    """
    Vista personalizada para refrescar tokens JWT del dashboard
    """
    
    def post(self, request, *args, **kwargs):
        refresh_token = request.data.get('refresh')
        
        if not refresh_token:
            return self.error_response(
                'Refresh token es requerido',
                status_code=HTTPStatus.BAD_REQUEST
            )
        
        try:
            # Validar y refrescar el token
            refresh = RefreshToken(refresh_token)
            user_id = refresh.payload.get('user_id')
            
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
                
            except User.DoesNotExist:
                return self.unauthorized_response('Usuario no encontrado')
            
            # Generar nuevo access token
            new_access_token = refresh.access_token
            
            # Registrar actividad de refresh
            log_activity(
                user=user,
                action='token_refresh',
                description='Token JWT refrescado exitosamente',
                request=request
            )
            
            return self.success_response({
                'access': str(new_access_token),
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'permissions': DashboardPermissionSerializer(dashboard_permission).data
                }
            }, message='Token refrescado exitosamente')
            
        except TokenError as e:
            return self.unauthorized_response('Token inválido o expirado')
        except Exception as e:
            return self.error_response(
                'Error al refrescar token',
                status_code=HTTPStatus.INTERNAL_SERVER_ERROR
            )


class DashboardLogoutView(BaseDashboardAPIView):
    """
    Vista para cerrar sesión en el dashboard
    """
    permission_classes = [permissions.IsAuthenticated, IsDashboardUser]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            
            # Intentar hacer blacklist del refresh token
            if refresh_token:
                try:
                    token = RefreshToken(refresh_token)
                    token.blacklist()
                except TokenError:
                    # Token ya está en blacklist o es inválido
                    pass
                except Exception as e:
                    # Log el error pero no fallar el logout
                    log_activity(
                        user=request.user,
                        action='logout_error',
                        description=f'Error al hacer blacklist del token: {str(e)}',
                        request=request
                    )
            
            # Registrar actividad de logout exitoso
            log_activity(
                user=request.user,
                action='logout',
                description='Cierre de sesión exitoso del dashboard',
                request=request
            )
            
            return self.success_response(message='Logout exitoso')
            
        except Exception as e:
            return self.error_response(
                f'Error al cerrar sesión: {str(e)}',
                status_code=HTTPStatus.INTERNAL_SERVER_ERROR
            )


class DashboardUserProfileView(BaseDashboardAPIView):
    """
    Vista para obtener el perfil del usuario actual del dashboard
    """
    permission_classes = [IsDashboardUser]
    
    def get(self, request):
        user = request.user
        
        try:
            dashboard_permission = user.dashboard_permission
        except DashboardPermission.DoesNotExist:
            return self.not_found_response('Permisos de dashboard no encontrados')
        
        # Obtener estadísticas del usuario
        posts_count = user.post_set.count() if hasattr(user, 'post_set') else 0
        comments_count = user.comentario_set.count() if hasattr(user, 'comentario_set') else 0
        
        # Actividad reciente del usuario
        recent_activity = ActivityLog.objects.filter(user=user).order_by('-timestamp')[:5]
        recent_activity_data = ActivityLogSerializer(recent_activity, many=True).data
        
        return self.success_response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_superuser': user.is_superuser,
            'is_staff': user.is_staff,
            'is_active': user.is_active,
            'last_login': user.last_login,
            'date_joined': user.date_joined,
            'permissions': DashboardPermissionSerializer(dashboard_permission).data,
            'stats': {
                'posts_count': posts_count,
                'comments_count': comments_count,
                'recent_activity': recent_activity_data
            }
        })
    
    def patch(self, request):
        """Actualizar perfil del usuario del dashboard"""
        user = request.user
        
        # Campos que se pueden actualizar
        allowed_fields = ['first_name', 'last_name', 'email']
        updated_fields = []
        
        for field in allowed_fields:
            if field in request.data:
                setattr(user, field, request.data[field])
                updated_fields.append(field)
        
        if updated_fields:
            try:
                user.save(update_fields=updated_fields)
                
                # Registrar actividad
                log_activity(
                    user=user,
                    action='updated_profile',
                    description=f'Perfil actualizado: {", ".join(updated_fields)}',
                    request=request
                )
                
                return self.success_response(
                    DashboardUserSerializer(user).data,
                    message='Perfil actualizado exitosamente'
                )
                
            except Exception as e:
                return self.error_response(
                    f'Error al actualizar perfil: {str(e)}',
                    status_code=HTTPStatus.INTERNAL_SERVER_ERROR
                )
        else:
            return self.error_response(
                'No se proporcionaron campos para actualizar',
                status_code=HTTPStatus.BAD_REQUEST
            )


@api_view(['POST', 'GET'])
@permission_classes([permissions.IsAuthenticated, IsDashboardUser])
def check_dashboard_permission(request):
    """
    Endpoint para verificar permisos específicos del dashboard
    Soporta tanto POST como GET para mayor flexibilidad
    """
    if request.method == 'POST':
        permission_type = request.data.get('permission')
    else:  # GET
        permission_type = request.query_params.get('permission')
    
    if not permission_type:
        return DashboardAPIResponse.error(
            'Tipo de permiso requerido',
            status_code=HTTPStatus.BAD_REQUEST
        )
    
    user = request.user
    
    # Validar que el tipo de permiso es válido
    valid_permissions = ['manage_posts', 'manage_users', 'manage_comments', 'view_stats']
    if permission_type not in valid_permissions:
        return DashboardAPIResponse.error(
            f'Tipo de permiso inválido. Debe ser uno de: {", ".join(valid_permissions)}',
            status_code=HTTPStatus.BAD_REQUEST
        )
    
    if user.is_superuser:
        return DashboardAPIResponse.success({
            'has_permission': True,
            'permission_type': permission_type,
            'user_type': 'superuser'
        }, message='Superusuario tiene todos los permisos')
    
    try:
        dashboard_permission = user.dashboard_permission
        
        permission_map = {
            'manage_posts': dashboard_permission.can_manage_posts,
            'manage_users': dashboard_permission.can_manage_users,
            'manage_comments': dashboard_permission.can_manage_comments,
            'view_stats': dashboard_permission.can_view_stats,
        }
        
        has_permission = permission_map.get(permission_type, False)
        
        # Registrar verificación de permisos para auditoría
        log_activity(
            user=user,
            action='permission_check',
            description=f'Verificación de permiso: {permission_type} - Resultado: {has_permission}',
            request=request
        )
        
        return DashboardAPIResponse.success({
                'data': {
            'has_permission': has_permission,
                'permission_type': permission_type,
            'user_type': 'regular',
            'all_permissions': {
                'manage_posts': dashboard_permission.can_manage_posts,
                'manage_users': dashboard_permission.can_manage_users,
                'manage_comments': dashboard_permission.can_manage_comments,
                'view_stats': dashboard_permission.can_view_stats,
            }
        }
            })
        
    except DashboardPermission.DoesNotExist:
        return DashboardAPIResponse.not_found('Permisos de dashboard no encontrados')


class DashboardChangePasswordView(BaseDashboardAPIView):
    """
    Vista para cambiar contraseña de usuarios del dashboard
    """
    permission_classes = [permissions.IsAuthenticated, IsDashboardUser]
    
    def post(self, request):
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')
        
        # Validaciones
        if not all([current_password, new_password, confirm_password]):
            return self.error_response(
                'Todos los campos son requeridos: current_password, new_password, confirm_password',
                status_code=HTTPStatus.BAD_REQUEST
            )
        
        if new_password != confirm_password:
            return self.error_response(
                'La nueva contraseña y la confirmación no coinciden',
                status_code=HTTPStatus.BAD_REQUEST
            )
        
        # Verificar contraseña actual
        if not request.user.check_password(current_password):
            return self.error_response(
                'La contraseña actual es incorrecta',
                status_code=HTTPStatus.BAD_REQUEST
            )
        
        # Validar fortaleza de la nueva contraseña
        if len(new_password) < 8:
            return self.error_response(
                'La nueva contraseña debe tener al menos 8 caracteres',
                status_code=HTTPStatus.BAD_REQUEST
            )
        
        try:
            # Cambiar contraseña
            request.user.set_password(new_password)
            request.user.save()
            
            # Registrar actividad
            log_activity(
                user=request.user,
                action='password_changed',
                description='Contraseña cambiada exitosamente desde el dashboard',
                request=request
            )
            
            return self.success_response(message='Contraseña cambiada exitosamente')
            
        except Exception as e:
            return self.error_response(
                f'Error al cambiar contraseña: {str(e)}',
                status_code=HTTPStatus.INTERNAL_SERVER_ERROR
            )


class DashboardSessionInfoView(BaseDashboardAPIView):
    """
    Vista para obtener información de la sesión actual del dashboard
    """
    permission_classes = [permissions.IsAuthenticated, IsDashboardUser]
    
    def get(self, request):
        user = request.user
        
        try:
            dashboard_permission = user.dashboard_permission
            
            # Obtener información de la sesión
            session_info = {
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'full_name': f"{user.first_name} {user.last_name}".strip(),
                    'is_superuser': user.is_superuser,
                    'last_login': user.last_login,
                },
                'permissions': DashboardPermissionSerializer(dashboard_permission).data,
                'session': {
                    'ip_address': get_client_ip(request),
                    'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                    'login_time': user.last_login,
                },
                'dashboard_access': {
                    'can_manage_posts': dashboard_permission.can_manage_posts,
                    'can_manage_users': dashboard_permission.can_manage_users,
                    'can_manage_comments': dashboard_permission.can_manage_comments,
                    'can_view_stats': dashboard_permission.can_view_stats,
                }
            }
            
            return self.success_response(session_info)
            
        except DashboardPermission.DoesNotExist:
            return self.not_found_response('Permisos de dashboard no encontrados')

class DashboardStatsView(BaseDashboardAPIView):
    """
    Vista para obtener estadísticas generales del dashboard
    """
    permission_classes = [CanViewStats]
    
    def get(self, request):
        def get_stats():
            stats = get_dashboard_stats()
            return self.success_response(DashboardStatsSerializer(stats).data)
        
        return self.handle_exceptions(get_stats)


class PopularPostsView(BaseDashboardAPIView):
    """
    Vista para obtener los posts más populares
    """
    permission_classes = [CanViewStats]
    
    def get(self, request):
        def get_popular_posts():
            limit = int(request.query_params.get('limit', 10))
            
            from django.db.models import Count
            from posts.models import Post
            
            popular_posts = Post.objects.annotate(
                comments_count=Count('comentarios')
            ).filter(
                status='published'
            ).order_by('-comments_count', '-fecha_publicacion')[:limit]
            
            serializer = DashboardPostSerializer(popular_posts, many=True)
            return self.success_response(serializer.data)
        
        return self.handle_exceptions(get_popular_posts)


class RecentActivityView(BaseDashboardAPIView):
    """
    Vista para obtener actividad reciente del dashboard
    """
    permission_classes = [CanViewStats]
    
    def get(self, request):
        def get_recent_activity():
            limit = int(request.query_params.get('limit', 20))
            
            recent_activity = ActivityLog.objects.select_related('user').order_by('-timestamp')[:limit]
            serializer = ActivityLogSerializer(recent_activity, many=True)
            
            return self.success_response(serializer.data)
        
        return self.handle_exceptions(get_recent_activity)


class MonthlyStatsView(APIView):
    """
    Vista para obtener estadísticas mensuales
    """
    permission_classes = [CanViewStats]
    
    def get(self, request):
        try:
            from .utils import get_monthly_stats
            monthly_stats = get_monthly_stats()
            
            return DashboardAPIResponse.success(monthly_stats
            )
            
        except Exception as e:
            return DashboardAPIResponse.error(
                f'Error al obtener estadísticas mensuales: {str(e)}',
                status_code=HTTPStatus.INTERNAL_SERVER_ERROR
            )


class UserStatsView(APIView):
    """
    Vista para obtener estadísticas de usuarios
    """
    permission_classes = [CanViewStats]
    
    def get(self, request):
        try:
            from django.db.models import Count, Q
            from django.utils import timezone
            from datetime import timedelta
            
            now = timezone.now()
            thirty_days_ago = now - timedelta(days=30)
            
            # Estadísticas básicas de usuarios
            total_users = User.objects.count()
            active_users = User.objects.filter(last_login__gte=thirty_days_ago).count()
            new_users_month = User.objects.filter(date_joined__gte=thirty_days_ago).count()
            staff_users = User.objects.filter(is_staff=True).count()
            
            # Usuarios más activos (por posts)
            top_authors = User.objects.annotate(
                posts_count=Count('post')
            ).filter(posts_count__gt=0).order_by('-posts_count')[:10]
            
            top_authors_data = [
                {
                    'id': user.id,
                    'username': user.username,
                    'posts_count': user.posts_count,
                    'email': user.email
                }
                for user in top_authors
            ]
            
            # Usuarios más activos (por comentarios)
            top_commenters = User.objects.annotate(
                comments_count=Count('comentario')
            ).filter(comments_count__gt=0).order_by('-comments_count')[:10]
            
            top_commenters_data = [
                {
                    'id': user.id,
                    'username': user.username,
                    'comments_count': user.comments_count,
                    'email': user.email
                }
                for user in top_commenters
            ]
            
            return DashboardAPIResponse.success({
                'data': {
                'total_users': total_users,
                'active_users': active_users,
                'new_users_month': new_users_month,
                'staff_users': staff_users,
                'top_authors': top_authors_data,
                'top_commenters': top_commenters_data
            }
            })
            
        except Exception as e:
            return Response({
                'error': True,
                'message': f'Error al obtener estadísticas de usuarios: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ContentStatsView(APIView):
    """
    Vista para obtener estadísticas de contenido
    """
    permission_classes = [CanViewStats]
    
    def get(self, request):
        try:
            from django.db.models import Count, Q
            from posts.models import Post, Categoria, Comentario
            
            # Estadísticas de posts
            total_posts = Post.objects.count()
            published_posts = Post.objects.filter(status='published').count()
            draft_posts = Post.objects.filter(status='draft').count()
            archived_posts = Post.objects.filter(status='archived').count()
            featured_posts = Post.objects.filter(featured=True).count()
            
            # Estadísticas de comentarios
            total_comments = Comentario.objects.count()
            approved_comments = Comentario.objects.filter(approved=True).count()
            pending_comments = Comentario.objects.filter(approved=False).count()
            
            # Posts por categoría
            categories_stats = Categoria.objects.annotate(
                posts_count=Count('post')
            ).order_by('-posts_count')
            
            categories_data = [
                {
                    'id': cat.id,
                    'name': cat.nombre,
                    'posts_count': cat.posts_count,
                    'description': cat.descripcion
                }
                for cat in categories_stats
            ]
            
            # Posts más comentados
            most_commented = Post.objects.annotate(
                comments_count=Count('comentarios')
            ).filter(
                status='published',
                comments_count__gt=0
            ).order_by('-comments_count')[:10]
            
            most_commented_data = [
                {
                    'id': post.id,
                    'title': post.titulo,
                    'comments_count': post.comments_count,
                    'author': post.autor.username,
                    'published_date': post.fecha_publicacion.strftime('%d/%m/%Y')
                }
                for post in most_commented
            ]
            
            return DashboardAPIResponse.success({
                'data': {
                'posts': {
                    'total': total_posts,
                'published': published_posts,
                    'draft': draft_posts,
                    'archived': archived_posts,
                    'featured': featured_posts
                },
                'comments': {
                    'total': total_comments,
                    'approved': approved_comments,
                    'pending': pending_comments
                },
                'categories': categories_data,
                'most_commented_posts': most_commented_data
            }
            })
            
        except Exception as e:
            return Response({
                'error': True,
                'message': f'Error al obtener estadísticas de contenido: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([CanViewStats])
def dashboard_summary(request):
    """
    Endpoint para obtener un resumen rápido del dashboard
    """
    try:
        from django.db.models import Count
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        today = now.date()
        week_ago = now - timedelta(days=7)
        
        # Contadores básicos
        total_posts = Post.objects.count()
        total_users = User.objects.count()
        total_comments = Comentario.objects.count()
        total_categories = Categoria.objects.count()
        
        # Actividad de hoy
        posts_today = Post.objects.filter(fecha_creacion__date=today).count()
        comments_today = Comentario.objects.filter(fecha_creacion__date=today).count()
        users_today = User.objects.filter(date_joined__date=today).count()
        
        # Actividad de la semana
        posts_week = Post.objects.filter(fecha_creacion__gte=week_ago).count()
        comments_week = Comentario.objects.filter(fecha_creacion__gte=week_ago).count()
        users_week = User.objects.filter(date_joined__gte=week_ago).count()
        
        # Posts pendientes de revisión
        draft_posts = Post.objects.filter(status='draft').count()
        pending_comments = Comentario.objects.filter(approved=False).count()
        
        return DashboardAPIResponse.success({
                'data': {
            'totals': {
                'posts': total_posts,
                'users': total_users,
                'comments': total_comments,
                'categories': total_categories
            },
            'today': {
                'posts': posts_today,
                'comments': comments_today,
                'users': users_today
            },
            'week': {
                'posts': posts_week,
                'comments': comments_week,
                'users': users_week
            },
            'pending': {
                'draft_posts': draft_posts,
                'pending_comments': pending_comments
            }
        }
            })
        
    except Exception as e:
        return DashboardAPIResponse.error(
            f'Error al obtener resumen del dashboard: {str(e)}',
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR
        )

class GrowthStatsView(APIView):
    """
    Vista para obtener estadísticas de crecimiento
    """
    permission_classes = [CanViewStats]
    
    def get(self, request):
        try:
            from .utils import get_growth_stats
            growth_stats = get_growth_stats()
            
            return DashboardAPIResponse.success(growth_stats)
            
        except Exception as e:
            return Response({
                'error': True,
                'message': f'Error al obtener estadísticas de crecimiento: {str(e
            })}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TopPerformingContentView(APIView):
    """
    Vista para obtener contenido con mejor rendimiento
    """
    permission_classes = [CanViewStats]
    
    def get(self, request):
        try:
            from .utils import get_top_performing_content
            top_content = get_top_performing_content()
            
            return DashboardAPIResponse.success({
                'data': top_content
            )
            
        except Exception as e:
            return Response({
                'error': True,
                'message': f'Error al obtener contenido destacado: {str(e
            })}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DashboardPostViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión completa de posts en el dashboard
    """
    queryset = Post.objects.all().select_related('autor', 'categoria').prefetch_related('comentarios')
    serializer_class = DashboardPostSerializer
    permission_classes = [CanManagePosts]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'categoria', 'featured', 'autor']
    search_fields = ['titulo', 'contenido', 'autor__username']
    ordering_fields = ['fecha_creacion', 'fecha_publicacion', 'fecha_actualizacion', 'titulo']
    ordering = ['-fecha_creacion']
    
    def get_serializer_class(self):
        """
        Usar diferentes serializers según la acción
        """
        if self.action in ['create', 'update', 'partial_update']:
            from .serializers import DashboardPostCreateUpdateSerializer
            return DashboardPostCreateUpdateSerializer
        return DashboardPostSerializer
    
    def get_permissions(self):
        """
        Permisos específicos por acción
        """
        if self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsOwnerOrCanManage]
        else:
            permission_classes = [CanManagePosts]
        
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        """
        Crear post asignando el autor actual
        """
        post = serializer.save(autor=self.request.user)
        
        # Registrar actividad
        log_activity(
            user=self.request.user,
            action='created_post',
            target_model='Post',
            target_id=post.id,
            description=f'Post creado: {post.titulo}',
            request=self.request
        )
    
    def perform_update(self, serializer):
        """
        Actualizar post con logging
        """
        post = serializer.save()
        
        # Registrar actividad
        log_activity(
            user=self.request.user,
            action='updated_post',
            target_model='Post',
            target_id=post.id,
            description=f'Post actualizado: {post.titulo}',
            request=self.request
        )
    
    def perform_destroy(self, instance):
        """
        Eliminar post con logging
        """
        post_title = instance.titulo
        post_id = instance.id
        
        # Eliminar post
        instance.delete()
        
        # Registrar actividad
        log_activity(
            user=self.request.user,
            action='deleted_post',
            target_model='Post',
            target_id=post_id,
            description=f'Post eliminado: {post_title}',
            request=self.request
        )
    
    @action(detail=False, methods=['post'])
    def bulk_update_status(self, request):
        """
        Actualizar estado de múltiples posts
        """
        post_ids = request.data.get('post_ids', [])
        new_status = request.data.get('status')
        
        if not post_ids or not new_status:
            return DashboardAPIResponse.error(
                'post_ids y status son requeridos',
                status_code=HTTPStatus.BAD_REQUEST
            )
        
        if new_status not in ['draft', 'published', 'archived']:
            return DashboardAPIResponse.error(
                'Estado inválido. Debe ser: draft, published, archived',
                status_code=HTTPStatus.BAD_REQUEST
            )
        
        try:
            from .utils import bulk_update_post_status
            updated_count = bulk_update_post_status(post_ids, new_status, request.user)
            
            return DashboardAPIResponse.success({
                'updated_count': updated_count
            }, message=f'{updated_count} posts actualizados exitosamente')
            
        except Exception as e:
            return Response({
                'error': True,
                'message': f'Error al actualizar posts: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        """
        Eliminar múltiples posts
        """
        post_ids = request.data.get('post_ids', [])
        
        if not post_ids:
            return DashboardAPIResponse.error(
                'post_ids es requerido',
                status_code=HTTPStatus.BAD_REQUEST
            )
        
        try:
            posts = Post.objects.filter(id__in=post_ids)
            deleted_count = posts.count()
            post_titles = [post.titulo for post in posts]
            
            # Eliminar posts
            posts.delete()
            
            # Registrar actividad
            log_activity(
                user=request.user,
                action='deleted_post',
                description=f'Eliminados {deleted_count} posts: {", ".join(post_titles[:5])}{"..." if len(post_titles) > 5 else ""}',
                request=request
            )
            
            return DashboardAPIResponse.success({
                'deleted_count': deleted_count
            }, message=f'{deleted_count} posts eliminados exitosamente')
            
        except Exception as e:
            return Response({
                'error': True,
                'message': f'Error al eliminar posts: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def toggle_featured(self, request, pk=None):
        """
        Alternar estado destacado de un post
        """
        try:
            post = self.get_object()
            post.featured = not post.featured
            post.save()
            
            # Registrar actividad
            action_desc = 'destacado' if post.featured else 'no destacado'
            log_activity(
                user=request.user,
                action='updated_post',
                target_model='Post',
                target_id=post.id,
                description=f'Post marcado como {action_desc}: {post.titulo}',
                request=request
            )
            
            return DashboardAPIResponse.success({
                'featured': post.featured
            }, message=f'Post marcado como {action_desc}')
            
        except Exception as e:
            return Response({
                'error': True,
                'message': f'Error al actualizar post: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'])
    def comments(self, request, pk=None):
        """
        Obtener comentarios de un post específico
        """
        try:
            post = self.get_object()
            comments = post.comentarios.select_related('usuario').order_by('-fecha_creacion')
            
            from .serializers import DashboardCommentSerializer
            serializer = DashboardCommentSerializer(comments, many=True)
            
            return DashboardAPIResponse.success({
                'data': serializer.data
            )
            
        except Exception as e:
            return Response({
                'error': True,
                'message': f'Error al obtener comentarios: {str(e
            })}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """
        Obtener posts agrupados por categoría
        """
        try:
            from django.db.models import Count
            
            categories_with_posts = Categoria.objects.annotate(
                posts_count=Count('post')
            ).prefetch_related('post_set__autor').order_by('nombre')
            
            result = []
            for category in categories_with_posts:
                posts = category.post_set.all()[:10]  # Limitar a 10 posts por categoría
                posts_data = DashboardPostSerializer(posts, many=True).data
                
                result.append({
                    'category': {
                        'id': category.id,
                        'name': category.nombre,
                        'posts_count': category.posts_count
                    },
                    'posts': posts_data
                })
            
            return DashboardAPIResponse.success({
                'data': result
            )
            
        except Exception as e:
            return Response({
                'error': True,
                'message': f'Error al obtener posts por categoría: {str(e
            })}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DashboardCategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de categorías en el dashboard
    """
    queryset = Categoria.objects.all().annotate(posts_count=Count('post'))
    serializer_class = CategorySerializer
    permission_classes = [CanManagePosts]
    
    def get_serializer_class(self):
        """
        Usar diferentes serializers según la acción
        """
        if self.action in ['create', 'update', 'partial_update']:
            from .serializers import CategoryCreateUpdateSerializer
            return CategoryCreateUpdateSerializer
        return CategorySerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['nombre', 'fecha_creacion', 'posts_count']
    ordering = ['nombre']
    
    def perform_create(self, serializer):
        """
        Crear categoría con logging
        """
        category = serializer.save()
        
        # Registrar actividad
        log_activity(
            user=self.request.user,
            action='created_category',
            target_model='Categoria',
            target_id=category.id,
            description=f'Categoría creada: {category.nombre}',
            request=self.request
        )
    
    def perform_update(self, serializer):
        """
        Actualizar categoría con logging
        """
        category = serializer.save()
        
        # Registrar actividad
        log_activity(
            user=self.request.user,
            action='updated_category',
            target_model='Categoria',
            target_id=category.id,
            description=f'Categoría actualizada: {category.nombre}',
            request=self.request
        )
    
    def perform_destroy(self, instance):
        """
        Eliminar categoría con logging
        """
        category_name = instance.nombre
        category_id = instance.id
        
        # Verificar si tiene posts asociados
        if instance.post_set.exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError('No se puede eliminar una categoría que tiene posts asociados')
        
        # Eliminar categoría
        instance.delete()
        
        # Registrar actividad
        log_activity(
            user=self.request.user,
            action='deleted_category',
            target_model='Categoria',
            target_id=category_id,
            description=f'Categoría eliminada: {category_name}',
            request=self.request
        )
    
    @action(detail=True, methods=['get'])
    def posts(self, request, pk=None):
        """
        Obtener posts de una categoría específica
        """
        try:
            category = self.get_object()
            posts = category.post_set.select_related('autor').order_by('-fecha_creacion')
            
            # Paginación manual
            page_size = int(request.query_params.get('page_size', 10))
            page = int(request.query_params.get('page', 1))
            start = (page - 1) * page_size
            end = start + page_size
            
            paginated_posts = posts[start:end]
            serializer = DashboardPostSerializer(paginated_posts, many=True)
            
            return Response({
                'error': False,
                'data': {
                    'category': {
                        'id': category.id,
                        'name': category.nombre,
                        'description': category.descripcion
                    },
                    'posts': serializer.data,
                    'pagination': {
                        'page': page,
                        'page_size': page_size,
                        'total': posts.count(),
                        'has_next': end < posts.count()
                    }
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': True,
                'message': f'Error al obtener posts de la categoría: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
class DashboardUserViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de usuarios en el dashboard
    """
    queryset = User.objects.all().select_related('dashboard_permission').prefetch_related('post_set', 'comentario_set')
    serializer_class = DashboardUserSerializer
    permission_classes = [CanManageUsers]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'is_staff', 'is_superuser']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['username', 'email', 'date_joined', 'last_login']
    ordering = ['-date_joined']
    
    def get_serializer_class(self):
        """
        Usar diferentes serializers según la acción
        """
        if self.action in ['create', 'update', 'partial_update']:
            from .serializers import DashboardUserCreateUpdateSerializer
            return DashboardUserCreateUpdateSerializer
        elif self.action == 'retrieve':
            from .serializers import DashboardUserDetailSerializer
            return DashboardUserDetailSerializer
        return DashboardUserSerializer
    
    def perform_create(self, serializer):
        """
        Crear usuario con logging
        """
        user = serializer.save()
        
        # Registrar actividad
        log_activity(
            user=self.request.user,
            action='created_user',
            target_model='User',
            target_id=user.id,
            description=f'Usuario creado: {user.username}',
            request=self.request
        )
    
    def perform_update(self, serializer):
        """
        Actualizar usuario con logging
        """
        user = serializer.save()
        
        # Registrar actividad
        log_activity(
            user=self.request.user,
            action='updated_user',
            target_model='User',
            target_id=user.id,
            description=f'Usuario actualizado: {user.username}',
            request=self.request
        )
    
    def perform_destroy(self, instance):
        """
        Desactivar usuario en lugar de eliminarlo
        """
        username = instance.username
        user_id = instance.id
        
        # Desactivar en lugar de eliminar
        instance.is_active = False
        instance.save()
        
        # Registrar actividad
        log_activity(
            user=self.request.user,
            action='deactivated_user',
            target_model='User',
            target_id=user_id,
            description=f'Usuario desactivado: {username}',
            request=self.request
        )
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """
        Activar usuario
        """
        try:
            user = self.get_object()
            user.is_active = True
            user.save()
            
            # Registrar actividad
            log_activity(
                user=request.user,
                action='activated_user',
                target_model='User',
                target_id=user.id,
                description=f'Usuario activado: {user.username}',
                request=request
            )
            
            return DashboardAPIResponse.success({
                'data': message=f'Usuario {user.username} activado exitosamente')
            
        except Exception as e:
            return Response({
                'error': True,
                'message': f'Error al activar usuario: {str(e
            })}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """
        Desactivar usuario
        """
        try:
            user = self.get_object()
            
            # No permitir desactivar superusuarios
            if user.is_superuser:
                return DashboardAPIResponse.error(
                'No se puede desactivar un superusuario',
                status_code=HTTPStatus.BAD_REQUEST
            )
            
            # No permitir auto-desactivación
            if user == request.user:
                return DashboardAPIResponse.error(
                'No puedes desactivar tu propia cuenta',
                status_code=HTTPStatus.BAD_REQUEST
            )
            
            user.is_active = False
            user.save()
            
            # Registrar actividad
            log_activity(
                user=request.user,
                action='deactivated_user',
                target_model='User',
                target_id=user.id,
                description=f'Usuario desactivado: {user.username}',
                request=request
            )
            
            return DashboardAPIResponse.success({
                'data': message=f'Usuario {user.username} desactivado exitosamente')
            
        except Exception as e:
            return Response({
                'error': True,
                'message': f'Error al desactivar usuario: {str(e
            })}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def update_permissions(self, request, pk=None):
        """
        Actualizar permisos de dashboard de un usuario
        """
        try:
            user = self.get_object()
            permissions_data = request.data.get('permissions', {})
            
            # Obtener o crear permisos de dashboard
            dashboard_permission, created = DashboardPermission.objects.get_or_create(user=user)
            
            # Actualizar permisos
            dashboard_permission.can_manage_posts = permissions_data.get('can_manage_posts', dashboard_permission.can_manage_posts)
            dashboard_permission.can_manage_users = permissions_data.get('can_manage_users', dashboard_permission.can_manage_users)
            dashboard_permission.can_manage_comments = permissions_data.get('can_manage_comments', dashboard_permission.can_manage_comments)
            dashboard_permission.can_view_stats = permissions_data.get('can_view_stats', dashboard_permission.can_view_stats)
            dashboard_permission.save()
            
            # Registrar actividad
            log_activity(
                user=request.user,
                action='updated_user_permissions',
                target_model='User',
                target_id=user.id,
                description=f'Permisos actualizados para: {user.username}',
                request=request
            )
            
            from .serializers import DashboardPermissionSerializer
            return DashboardAPIResponse.success({
                'permissions': DashboardPermissionSerializer(dashboard_permission).data
            }, message='Permisos actualizados exitosamente')
            
        except Exception as e:
            return Response({
                'error': True,
                'message': f'Error al actualizar permisos: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'])
    def activity(self, request, pk=None):
        """
        Obtener actividad reciente de un usuario
        """
        try:
            user = self.get_object()
            limit = int(request.query_params.get('limit', 20))
            
            activities = ActivityLog.objects.filter(user=user).order_by('-timestamp')[:limit]
            serializer = ActivityLogSerializer(activities, many=True)
            
            return DashboardAPIResponse.success({
                'data': serializer.data
            )
            
        except Exception as e:
            return Response({
                'error': True,
                'message': f'Error al obtener actividad: {str(e
            })}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'])
    def posts(self, request, pk=None):
        """
        Obtener posts de un usuario específico
        """
        try:
            user = self.get_object()
            posts = user.post_set.select_related('categoria').order_by('-fecha_creacion')
            
            # Paginación manual
            page_size = int(request.query_params.get('page_size', 10))
            page = int(request.query_params.get('page', 1))
            start = (page - 1) * page_size
            end = start + page_size
            
            paginated_posts = posts[start:end]
            serializer = DashboardPostSerializer(paginated_posts, many=True)
            
            return Response({
                'error': False,
                'data': {
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email
                    },
                    'posts': serializer.data,
                    'pagination': {
                        'page': page,
                        'page_size': page_size,
                        'total': posts.count(),
                        'has_next': end < posts.count()
                    }
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': True,
                'message': f'Error al obtener posts del usuario: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def bulk_activate(self, request):
        """
        Activar múltiples usuarios
        """
        user_ids = request.data.get('user_ids', [])
        
        if not user_ids:
            return DashboardAPIResponse.error(
                'user_ids es requerido',
                status_code=HTTPStatus.BAD_REQUEST
            )
        
        try:
            users = User.objects.filter(id__in=user_ids)
            updated_count = users.update(is_active=True)
            usernames = [user.username for user in users]
            
            # Registrar actividad
            log_activity(
                user=request.user,
                action='activated_users',
                description=f'Activados {updated_count} usuarios: {", ".join(usernames[:5])}{"..." if len(usernames) > 5 else ""}',
                request=request
            )
            
            return Response({
                'error': False,
                'message': f'{updated_count} usuarios activados exitosamente',
                'updated_count': updated_count
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': True,
                'message': f'Error al activar usuarios: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def bulk_deactivate(self, request):
        """
        Desactivar múltiples usuarios
        """
        user_ids = request.data.get('user_ids', [])
        
        if not user_ids:
            return DashboardAPIResponse.error(
                'user_ids es requerido',
                status_code=HTTPStatus.BAD_REQUEST
            )
        
        try:
            # Excluir superusuarios y el usuario actual
            users = User.objects.filter(
                id__in=user_ids
            ).exclude(
                Q(is_superuser=True) | Q(id=request.user.id)
            )
            
            updated_count = users.update(is_active=False)
            usernames = [user.username for user in users]
            
            # Registrar actividad
            log_activity(
                user=request.user,
                action='deactivated_users',
                description=f'Desactivados {updated_count} usuarios: {", ".join(usernames[:5])}{"..." if len(usernames) > 5 else ""}',
                request=request
            )
            
            return Response({
                'error': False,
                'message': f'{updated_count} usuarios desactivados exitosamente',
                'updated_count': updated_count
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': True,
                'message': f'Error al desactivar usuarios: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Obtener estadísticas de usuarios
        """
        try:
            from django.utils import timezone
            from datetime import timedelta
            
            now = timezone.now()
            thirty_days_ago = now - timedelta(days=30)
            
            stats = {
                'total_users': User.objects.count(),
                'active_users': User.objects.filter(is_active=True).count(),
                'inactive_users': User.objects.filter(is_active=False).count(),
                'staff_users': User.objects.filter(is_staff=True).count(),
                'superusers': User.objects.filter(is_superuser=True).count(),
                'new_users_month': User.objects.filter(date_joined__gte=thirty_days_ago).count(),
                'recent_logins': User.objects.filter(last_login__gte=thirty_days_ago).count(),
                'users_with_posts': User.objects.annotate(posts_count=Count('post')).filter(posts_count__gt=0).count(),
                'users_with_comments': User.objects.annotate(comments_count=Count('comentario')).filter(comments_count__gt=0).count(),
            }
            
            return DashboardAPIResponse.success({
                'data': stats
            )
            
        except Exception as e:
            return Response({
                'error': True,
                'message': f'Error al obtener estadísticas: {str(e
            })}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class DashboardCommentViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de comentarios en el dashboard
    """
    queryset = Comentario.objects.all().select_related('usuario', 'post', 'parent').prefetch_related('replies')
    serializer_class = DashboardCommentSerializer
    permission_classes = [CanManageComments]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['approved', 'post', 'usuario', 'parent']
    search_fields = ['contenido', 'usuario__username', 'post__titulo']
    ordering_fields = ['fecha_creacion', 'fecha_actualizacion']
    ordering = ['-fecha_creacion']
    
    def get_serializer_class(self):
        """
        Usar diferentes serializers según la acción
        """
        if self.action in ['create', 'update', 'partial_update']:
            from .serializers import DashboardCommentCreateUpdateSerializer
            return DashboardCommentCreateUpdateSerializer
        elif self.action == 'retrieve':
            from .serializers import DashboardCommentDetailSerializer
            return DashboardCommentDetailSerializer
        return DashboardCommentSerializer
    
    def perform_create(self, serializer):
        """
        Crear comentario con logging
        """
        comment = serializer.save(usuario=self.request.user)
        
        # Registrar actividad
        log_activity(
            user=self.request.user,
            action='created_comment',
            target_model='Comentario',
            target_id=comment.id,
            description=f'Comentario creado en: {comment.post.titulo}',
            request=self.request
        )
    
    def perform_update(self, serializer):
        """
        Actualizar comentario con logging
        """
        comment = serializer.save()
        
        # Registrar actividad
        log_activity(
            user=self.request.user,
            action='updated_comment',
            target_model='Comentario',
            target_id=comment.id,
            description=f'Comentario actualizado en: {comment.post.titulo}',
            request=self.request
        )
    
    def perform_destroy(self, instance):
        """
        Eliminar comentario con logging
        """
        post_title = instance.post.titulo
        comment_id = instance.id
        
        # Eliminar comentario
        instance.delete()
        
        # Registrar actividad
        log_activity(
            user=self.request.user,
            action='deleted_comment',
            target_model='Comentario',
            target_id=comment_id,
            description=f'Comentario eliminado de: {post_title}',
            request=self.request
        )
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """
        Aprobar comentario
        """
        try:
            comment = self.get_object()
            comment.approved = True
            comment.save()
            
            # Registrar actividad
            log_activity(
                user=request.user,
                action='approved_comment',
                target_model='Comentario',
                target_id=comment.id,
                description=f'Comentario aprobado en: {comment.post.titulo}',
                request=request
            )
            
            return DashboardAPIResponse.success({
                'data': message='Comentario aprobado exitosamente'
            )
            
        except Exception as e:
            return Response({
                'error': True,
                'message': f'Error al aprobar comentario: {str(e
            })}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """
        Rechazar comentario
        """
        try:
            comment = self.get_object()
            comment.approved = False
            comment.save()
            
            # Registrar actividad
            log_activity(
                user=request.user,
                action='rejected_comment',
                target_model='Comentario',
                target_id=comment.id,
                description=f'Comentario rechazado en: {comment.post.titulo}',
                request=request
            )
            
            return DashboardAPIResponse.success({
                'data': message='Comentario rechazado exitosamente'
            )
            
        except Exception as e:
            return Response({
                'error': True,
                'message': f'Error al rechazar comentario: {str(e
            })}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def bulk_approve(self, request):
        """
        Aprobar múltiples comentarios
        """
        comment_ids = request.data.get('comment_ids', [])
        
        if not comment_ids:
            return DashboardAPIResponse.error(
                'comment_ids es requerido',
                status_code=HTTPStatus.BAD_REQUEST
            )
        
        try:
            from .utils import bulk_approve_comments
            updated_count = bulk_approve_comments(comment_ids, request.user)
            
            return Response({
                'error': False,
                'message': f'{updated_count} comentarios aprobados exitosamente',
                'updated_count': updated_count
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': True,
                'message': f'Error al aprobar comentarios: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def bulk_reject(self, request):
        """
        Rechazar múltiples comentarios
        """
        comment_ids = request.data.get('comment_ids', [])
        
        if not comment_ids:
            return DashboardAPIResponse.error(
                'comment_ids es requerido',
                status_code=HTTPStatus.BAD_REQUEST
            )
        
        try:
            from .utils import bulk_reject_comments
            updated_count = bulk_reject_comments(comment_ids, request.user)
            
            return Response({
                'error': False,
                'message': f'{updated_count} comentarios rechazados exitosamente',
                'updated_count': updated_count
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': True,
                'message': f'Error al rechazar comentarios: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        """
        Eliminar múltiples comentarios
        """
        comment_ids = request.data.get('comment_ids', [])
        
        if not comment_ids:
            return DashboardAPIResponse.error(
                'comment_ids es requerido',
                status_code=HTTPStatus.BAD_REQUEST
            )
        
        try:
            comments = Comentario.objects.filter(id__in=comment_ids)
            deleted_count = comments.count()
            post_titles = [f"{comment.post.titulo}" for comment in comments[:5]]
            
            # Eliminar comentarios
            comments.delete()
            
            # Registrar actividad
            log_activity(
                user=request.user,
                action='deleted_comments',
                description=f'Eliminados {deleted_count} comentarios de posts: {", ".join(post_titles)}{"..." if deleted_count > 5 else ""}',
                request=request
            )
            
            return Response({
                'error': False,
                'message': f'{deleted_count} comentarios eliminados exitosamente',
                'deleted_count': deleted_count
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': True,
                'message': f'Error al eliminar comentarios: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """
        Obtener comentarios pendientes de aprobación
        """
        try:
            pending_comments = self.get_queryset().filter(approved=False)
            
            # Aplicar paginación
            page = self.paginate_queryset(pending_comments)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            
            serializer = self.get_serializer(pending_comments, many=True)
            return DashboardAPIResponse.success({
                'data': serializer.data
            )
            
        except Exception as e:
            return Response({
                'error': True,
                'message': f'Error al obtener comentarios pendientes: {str(e
            })}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def by_post(self, request):
        """
        Obtener comentarios agrupados por post
        """
        try:
            post_id = request.query_params.get('post_id')
            if not post_id:
                return DashboardAPIResponse.error(
                'post_id es requerido',
                status_code=HTTPStatus.BAD_REQUEST
            )
            
            try:
                post = Post.objects.get(id=post_id)
            except Post.DoesNotExist:
                return DashboardAPIResponse.error(
                'Post no encontrado',
                status_code=HTTPStatus.NOT_FOUND
            )
            
            comments = self.get_queryset().filter(post=post).order_by('-fecha_creacion')
            
            # Aplicar paginación
            page = self.paginate_queryset(comments)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response({
                    'post': {
                        'id': post.id,
                        'title': post.titulo,
                        'author': post.autor.username
                    },
                    'comments': serializer.data
                })
            
            serializer = self.get_serializer(comments, many=True)
            return Response({
                'error': False,
                'data': {
                    'post': {
                        'id': post.id,
                        'title': post.titulo,
                        'author': post.autor.username
                    },
                    'comments': serializer.data
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': True,
                'message': f'Error al obtener comentarios del post: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Obtener estadísticas de comentarios
        """
        try:
            from django.utils import timezone
            from datetime import timedelta
            
            now = timezone.now()
            thirty_days_ago = now - timedelta(days=30)
            
            stats = {
                'total_comments': Comentario.objects.count(),
                'approved_comments': Comentario.objects.filter(approved=True).count(),
                'pending_comments': Comentario.objects.filter(approved=False).count(),
                'comments_this_month': Comentario.objects.filter(fecha_creacion__gte=thirty_days_ago).count(),
                'comments_by_post': list(
                    Post.objects.annotate(
                        comments_count=Count('comentarios')
                    ).filter(
                        comments_count__gt=0
                    ).order_by('-comments_count')[:10].values(
                        'id', 'titulo', 'comments_count'
                    )
                ),
                'top_commenters': list(
                    User.objects.annotate(
                        comments_count=Count('comentario')
                    ).filter(
                        comments_count__gt=0
                    ).order_by('-comments_count')[:10].values(
                        'id', 'username', 'comments_count'
                    )
                ),
                'recent_comments': DashboardCommentSerializer(
                    Comentario.objects.select_related('usuario', 'post').order_by('-fecha_creacion')[:5],
                    many=True
                ).data
            }
            
            return DashboardAPIResponse.success({
                'data': stats
            )
            
        except Exception as e:
            return Response({
                'error': True,
                'message': f'Error al obtener estadísticas: {str(e
            })}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'])
    def replies(self, request, pk=None):
        """
        Obtener respuestas de un comentario
        """
        try:
            comment = self.get_object()
            replies = comment.replies.select_related('usuario').order_by('fecha_creacion')
            
            serializer = self.get_serializer(replies, many=True)
            
            return Response({
                'error': False,
                'data': {
                    'parent_comment': {
                        'id': comment.id,
                        'content': comment.contenido,
                        'author': comment.usuario.username
                    },
                    'replies': serializer.data
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': True,
                'message': f'Error al obtener respuestas: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# POSTS MANAGEMENT VIEWS
# ============================================================================

class DashboardPostViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión completa de posts en el dashboard
    """
    queryset = Post.objects.all().select_related('autor', 'categoria').prefetch_related('comentarios')
    serializer_class = DashboardPostSerializer
    permission_classes = [CanManagePosts]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'categoria', 'featured', 'autor']
    search_fields = ['titulo', 'contenido', 'autor__username']
    ordering_fields = ['fecha_creacion', 'fecha_publicacion', 'fecha_actualizacion', 'titulo']
    ordering = ['-fecha_creacion']
    
    def get_serializer_class(self):
        """
        Usar diferentes serializers según la acción
        """
        if self.action in ['create', 'update', 'partial_update']:
            from .serializers import DashboardPostCreateUpdateSerializer
            return DashboardPostCreateUpdateSerializer
        return DashboardPostSerializer
    
    def get_permissions(self):
        """
        Permisos específicos por acción
        """
        if self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsOwnerOrCanManage]
        else:
            permission_classes = [CanManagePosts]
        
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        """
        Crear post asignando el autor actual
        """
        post = serializer.save(autor=self.request.user)
        
        # Registrar actividad
        log_activity(
            user=self.request.user,
            action='created_post',
            target_model='Post',
            target_id=post.id,
            description=f'Post creado: {post.titulo}',
            request=self.request
        )
    
    def perform_update(self, serializer):
        """
        Actualizar post con logging
        """
        post = serializer.save()
        
        # Registrar actividad
        log_activity(
            user=self.request.user,
            action='updated_post',
            target_model='Post',
            target_id=post.id,
            description=f'Post actualizado: {post.titulo}',
            request=self.request
        )
    
    def perform_destroy(self, instance):
        """
        Eliminar post con logging
        """
        post_title = instance.titulo
        post_id = instance.id
        
        # Eliminar post
        instance.delete()
        
        # Registrar actividad
        log_activity(
            user=self.request.user,
            action='deleted_post',
            target_model='Post',
            target_id=post_id,
            description=f'Post eliminado: {post_title}',
            request=self.request
        )
    
    @action(detail=False, methods=['post'])
    def bulk_update_status(self, request):
        """
        Actualizar estado de múltiples posts
        """
        post_ids = request.data.get('post_ids', [])
        new_status = request.data.get('status')
        
        if not post_ids or not new_status:
            return DashboardAPIResponse.error(
                'post_ids y status son requeridos',
                status_code=HTTPStatus.BAD_REQUEST
            )
        
        if new_status not in ['draft', 'published', 'archived']:
            return DashboardAPIResponse.error(
                'Estado inválido. Debe ser: draft, published, archived',
                status_code=HTTPStatus.BAD_REQUEST
            )
        
        try:
            from .utils import bulk_update_post_status
            updated_count = bulk_update_post_status(post_ids, new_status, request.user)
            
            return DashboardAPIResponse.success({
                'updated_count': updated_count
            }, message=f'{updated_count} posts actualizados exitosamente')
            
        except Exception as e:
            return Response({
                'error': True,
                'message': f'Error al actualizar posts: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        """
        Eliminar múltiples posts
        """
        post_ids = request.data.get('post_ids', [])
        
        if not post_ids:
            return DashboardAPIResponse.error(
                'post_ids es requerido',
                status_code=HTTPStatus.BAD_REQUEST
            )
        
        try:
            posts = Post.objects.filter(id__in=post_ids)
            deleted_count = posts.count()
            post_titles = [post.titulo for post in posts]
            
            # Eliminar posts
            posts.delete()
            
            # Registrar actividad
            log_activity(
                user=request.user,
                action='deleted_post',
                description=f'Eliminados {deleted_count} posts: {", ".join(post_titles[:5])}{"..." if len(post_titles) > 5 else ""}',
                request=request
            )
            
            return DashboardAPIResponse.success({
                'deleted_count': deleted_count
            }, message=f'{deleted_count} posts eliminados exitosamente')
            
        except Exception as e:
            return Response({
                'error': True,
                'message': f'Error al eliminar posts: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def toggle_featured(self, request, pk=None):
        """
        Alternar estado destacado de un post
        """
        try:
            post = self.get_object()
            post.featured = not post.featured
            post.save()
            
            # Registrar actividad
            action_desc = 'destacado' if post.featured else 'no destacado'
            log_activity(
                user=request.user,
                action='updated_post',
                target_model='Post',
                target_id=post.id,
                description=f'Post marcado como {action_desc}: {post.titulo}',
                request=request
            )
            
            return DashboardAPIResponse.success({
                'featured': post.featured
            }, message=f'Post marcado como {action_desc}')
            
        except Exception as e:
            return Response({
                'error': True,
                'message': f'Error al actualizar post: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'])
    def comments(self, request, pk=None):
        """
        Obtener comentarios de un post específico
        """
        try:
            post = self.get_object()
            comments = post.comentarios.select_related('usuario').order_by('-fecha_creacion')
            
            from .serializers import DashboardCommentSerializer
            serializer = DashboardCommentSerializer(comments, many=True)
            
            return DashboardAPIResponse.success({
                'data': serializer.data
            )
            
        except Exception as e:
            return Response({
                'error': True,
                'message': f'Error al obtener comentarios: {str(e
            })}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """
        Duplicar un post
        """
        try:
            original_post = self.get_object()
            
            # Crear copia del post
            new_post = Post.objects.create(
                titulo=f"Copia de {original_post.titulo}",
                contenido=original_post.contenido,
                categoria=original_post.categoria,
                autor=request.user,
                status='draft',
                featured=False,
                meta_title=original_post.meta_title,
                meta_description=original_post.meta_description
            )
            
            # Registrar actividad
            log_activity(
                user=request.user,
                action='created_post',
                target_model='Post',
                target_id=new_post.id,
                description=f'Post duplicado: {new_post.titulo}',
                request=request
            )
            
            serializer = self.get_serializer(new_post)
            return Response({
                'error': False,
                'message': 'Post duplicado exitosamente',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'error': True,
                'message': f'Error al duplicar post: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# CATEGORIES MANAGEMENT VIEWS
# ============================================================================

class DashboardCategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de categorías en el dashboard
    """
    queryset = Categoria.objects.all().annotate(
        posts_count=Count('post')
    ).order_by('nombre')
    serializer_class = CategorySerializer
    permission_classes = [CanManagePosts]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['nombre', 'fecha_creacion', 'posts_count']
    ordering = ['nombre']
    
    def perform_create(self, serializer):
        """
        Crear categoría con logging
        """
        category = serializer.save()
        
        # Registrar actividad
        log_activity(
            user=self.request.user,
            action='created_category',
            target_model='Categoria',
            target_id=category.id,
            description=f'Categoría creada: {category.nombre}',
            request=self.request
        )
    
    def perform_update(self, serializer):
        """
        Actualizar categoría con logging
        """
        category = serializer.save()
        
        # Registrar actividad
        log_activity(
            user=self.request.user,
            action='updated_category',
            target_model='Categoria',
            target_id=category.id,
            description=f'Categoría actualizada: {category.nombre}',
            request=self.request
        )
    
    def perform_destroy(self, instance):
        """
        Eliminar categoría con validación
        """
        if instance.post_set.exists():
            raise ValidationError('No se puede eliminar una categoría que tiene posts asociados')
        
        category_name = instance.nombre
        category_id = instance.id
        
        # Eliminar categoría
        instance.delete()
        
        # Registrar actividad
        log_activity(
            user=self.request.user,
            action='deleted_category',
            target_model='Categoria',
            target_id=category_id,
            description=f'Categoría eliminada: {category_name}',
            request=self.request
        )


# ============================================================================
# POSTS STATISTICS FUNCTION VIEWS
# ============================================================================

@api_view(['GET'])
@permission_classes([CanViewStats])
def get_posts_statistics(request):
    """
    Obtener estadísticas detalladas de posts
    """
    try:
        from .utils import get_posts_statistics
        stats = get_posts_statistics()
        
        return DashboardAPIResponse.success({
                'data': stats
        )
        
    except Exception as e:
        return Response({
            'error': True,
                'message': f'Error al obtener estadísticas de posts: {str(e
            })}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([CanViewStats])
def get_post_engagement_stats(request, post_id):
    """
    Obtener estadísticas de engagement de un post específico
    """
    try:
        from .utils import get_post_engagement_stats
        stats = get_post_engagement_stats(post_id)
        
        if stats is None:
            return DashboardAPIResponse.error(
                'Post no encontrado',
                status_code=HTTPStatus.NOT_FOUND
            )
        
        return DashboardAPIResponse.success({
                'data': stats
        )
        
    except Exception as e:
        return Response({
            'error': True,
                'message': f'Error al obtener estadísticas del post: {str(e
            })}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([CanManagePosts])
def duplicate_post(request, post_id):
    """
    Duplicar un post existente
    """
    try:
        from .utils import duplicate_post as duplicate_post_util
        duplicate = duplicate_post_util(post_id, request.user)
        
        if duplicate is None:
            return DashboardAPIResponse.error(
                'Post no encontrado',
                status_code=HTTPStatus.NOT_FOUND
            )
        
        serializer = DashboardPostSerializer(duplicate)
        return Response({
            'error': False,
            'message': 'Post duplicado exitosamente',
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'error': True,
            'message': f'Error al duplicar post: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([CanViewStats])
def get_post_performance_metrics(request):
    """
    Obtener métricas de rendimiento de posts
    """
    try:
        from .utils import get_post_performance_metrics
        metrics = get_post_performance_metrics()
        
        return DashboardAPIResponse.success({
                'data': metrics
        )
        
    except Exception as e:
        return Response({
            'error': True,
                'message': f'Error al obtener métricas de posts: {str(e
            })}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# COMMENTS MANAGEMENT VIEWS
# ============================================================================

class DashboardCommentViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión completa de comentarios en el dashboard
    """
    queryset = Comentario.objects.all().select_related('usuario', 'post').prefetch_related('replies')
    serializer_class = DashboardCommentSerializer
    permission_classes = [CanManageComments]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['approved', 'post', 'usuario']
    search_fields = ['contenido', 'usuario__username', 'post__titulo']
    ordering_fields = ['fecha_creacion', 'fecha_actualizacion', 'approved']
    ordering = ['-fecha_creacion']
    
    def get_queryset(self):
        """
        Personalizar queryset con filtros adicionales
        """
        queryset = super().get_queryset()
        
        # Filtro por estado de aprobación
        approved = self.request.query_params.get('approved')
        if approved is not None:
            if approved.lower() in ['true', '1']:
                queryset = queryset.filter(approved=True)
            elif approved.lower() in ['false', '0']:
                queryset = queryset.filter(approved=False)
        
        # Filtro por post específico
        post_id = self.request.query_params.get('post')
        if post_id:
            try:
                queryset = queryset.filter(post_id=int(post_id))
            except ValueError:
                pass
        
        # Filtro por comentarios padre (sin respuestas)
        only_parents = self.request.query_params.get('only_parents')
        if only_parents and only_parents.lower() in ['true', '1']:
            queryset = queryset.filter(parent__isnull=True)
        
        return queryset
    
    def perform_update(self, serializer):
        """
        Actualizar comentario con logging
        """
        comment = serializer.save()
        
        # Registrar actividad
        action = 'approved_comment' if comment.approved else 'rejected_comment'
        log_activity(
            user=self.request.user,
            action=action,
            target_model='Comentario',
            target_id=comment.id,
            description=f'Comentario {"aprobado" if comment.approved else "rechazado"}: {comment.contenido[:50]}...',
            request=self.request
        )
    
    def perform_destroy(self, instance):
        """
        Eliminar comentario con logging
        """
        comment_content = instance.contenido[:50]
        comment_id = instance.id
        
        # Eliminar comentario
        instance.delete()
        
        # Registrar actividad
        log_activity(
            user=self.request.user,
            action='deleted_comment',
            target_model='Comentario',
            target_id=comment_id,
            description=f'Comentario eliminado: {comment_content}...',
            request=self.request
        )
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """
        Aprobar un comentario específico
        """
        try:
            comment = self.get_object()
            comment.approved = True
            comment.save()
            
            # Registrar actividad
            log_activity(
                user=request.user,
                action='approved_comment',
                target_model='Comentario',
                target_id=comment.id,
                description=f'Comentario aprobado: {comment.contenido[:50]}...',
                request=request
            )
            
            return DashboardAPIResponse.success({
                'approved': True
            }, message='Comentario aprobado exitosamente')
            
        except Exception as e:
            return Response({
                'error': True,
                'message': f'Error al aprobar comentario: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """
        Rechazar un comentario específico
        """
        try:
            comment = self.get_object()
            comment.approved = False
            comment.save()
            
            # Registrar actividad
            log_activity(
                user=request.user,
                action='rejected_comment',
                target_model='Comentario',
                target_id=comment.id,
                description=f'Comentario rechazado: {comment.contenido[:50]}...',
                request=request
            )
            
            return DashboardAPIResponse.success({
                'approved': False
            }, message='Comentario rechazado exitosamente')
            
        except Exception as e:
            return Response({
                'error': True,
                'message': f'Error al rechazar comentario: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def bulk_approve(self, request):
        """
        Aprobar múltiples comentarios
        """
        comment_ids = request.data.get('comment_ids', [])
        
        if not comment_ids:
            return DashboardAPIResponse.error(
                'comment_ids es requerido',
                status_code=HTTPStatus.BAD_REQUEST
            )
        
        try:
            comments = Comentario.objects.filter(id__in=comment_ids)
            approved_count = 0
            
            for comment in comments:
                comment.approved = True
                comment.save()
                approved_count += 1
                
                # Registrar actividad individual
                log_activity(
                    user=request.user,
                    action='approved_comment',
                    target_model='Comentario',
                    target_id=comment.id,
                    description=f'Comentario aprobado (lote): {comment.contenido[:50]}...',
                    request=request
                )
            
            return Response({
                'error': False,
                'message': f'{approved_count} comentarios aprobados exitosamente',
                'approved_count': approved_count
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': True,
                'message': f'Error al aprobar comentarios: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def bulk_reject(self, request):
        """
        Rechazar múltiples comentarios
        """
        comment_ids = request.data.get('comment_ids', [])
        
        if not comment_ids:
            return DashboardAPIResponse.error(
                'comment_ids es requerido',
                status_code=HTTPStatus.BAD_REQUEST
            )
        
        try:
            comments = Comentario.objects.filter(id__in=comment_ids)
            rejected_count = 0
            
            for comment in comments:
                comment.approved = False
                comment.save()
                rejected_count += 1
                
                # Registrar actividad individual
                log_activity(
                    user=request.user,
                    action='rejected_comment',
                    target_model='Comentario',
                    target_id=comment.id,
                    description=f'Comentario rechazado (lote): {comment.contenido[:50]}...',
                    request=request
                )
            
            return Response({
                'error': False,
                'message': f'{rejected_count} comentarios rechazados exitosamente',
                'rejected_count': rejected_count
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': True,
                'message': f'Error al rechazar comentarios: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        """
        Eliminar múltiples comentarios
        """
        comment_ids = request.data.get('comment_ids', [])
        
        if not comment_ids:
            return DashboardAPIResponse.error(
                'comment_ids es requerido',
                status_code=HTTPStatus.BAD_REQUEST
            )
        
        try:
            comments = Comentario.objects.filter(id__in=comment_ids)
            deleted_count = comments.count()
            comment_contents = [comment.contenido[:30] for comment in comments[:5]]
            
            # Eliminar comentarios
            comments.delete()
            
            # Registrar actividad
            log_activity(
                user=request.user,
                action='deleted_comment',
                description=f'Eliminados {deleted_count} comentarios: {", ".join(comment_contents)}{"..." if deleted_count > 5 else ""}',
                request=request
            )
            
            return Response({
                'error': False,
                'message': f'{deleted_count} comentarios eliminados exitosamente',
                'deleted_count': deleted_count
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': True,
                'message': f'Error al eliminar comentarios: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'])
    def replies(self, request, pk=None):
        """
        Obtener respuestas de un comentario específico
        """
        try:
            comment = self.get_object()
            replies = comment.replies.select_related('usuario').order_by('fecha_creacion')
            
            serializer = DashboardCommentSerializer(replies, many=True)
            
            return DashboardAPIResponse.success({
                'data': serializer.data
            )
            
        except Exception as e:
            return Response({
                'error': True,
                'message': f'Error al obtener respuestas: {str(e
            })}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """
        Obtener comentarios pendientes de moderación
        """
        try:
            pending_comments = self.get_queryset().filter(approved=False)
            
            # Aplicar paginación
            page = self.paginate_queryset(pending_comments)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            
            serializer = self.get_serializer(pending_comments, many=True)
            return DashboardAPIResponse.success({
                'data': serializer.data
            )
            
        except Exception as e:
            return Response({
                'error': True,
                'message': f'Error al obtener comentarios pendientes: {str(e
            })}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def spam_detection(self, request):
        """
        Detectar posibles comentarios spam
        """
        try:
            from .utils import detect_spam_comments
            spam_comments = detect_spam_comments()
            
            serializer = self.get_serializer(spam_comments, many=True)
            
            return DashboardAPIResponse.success({
                'comments': serializer.data,
                'count': len(spam_comments)
            })
            
        except Exception as e:
            return Response({
                'error': True,
                'message': f'Error en detección de spam: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# COMMENTS STATISTICS FUNCTION VIEWS
# ============================================================================

@api_view(['GET'])
@permission_classes([CanViewStats])
def get_comments_statistics(request):
    """
    Obtener estadísticas detalladas de comentarios
    """
    try:
        from .utils import get_comments_statistics
        stats = get_comments_statistics()
        
        return DashboardAPIResponse.success({
                'data': stats
        )
        
    except Exception as e:
        return Response({
            'error': True,
                'message': f'Error al obtener estadísticas de comentarios: {str(e
            })}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([CanManageComments])
def get_moderation_queue(request):
    """
    Obtener cola de moderación de comentarios
    """
    try:
        from .utils import get_comment_moderation_queue
        queue = get_comment_moderation_queue()
        
        # Serializar los comentarios
        serialized_queue = {}
        for category, comments in queue.items():
            serialized_queue[category] = DashboardCommentSerializer(
                comments, many=True
            ).data
        
        return DashboardAPIResponse.success({
                'data': serialized_queue
        )
        
    except Exception as e:
        return Response({
            'error': True,
                'message': f'Error al obtener cola de moderación: {str(e
            })}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([CanViewStats])
def get_comment_engagement_metrics(request):
    """
    Obtener métricas de engagement de comentarios
    """
    try:
        from .utils import get_comment_engagement_metrics
        metrics = get_comment_engagement_metrics()
        
        return DashboardAPIResponse.success({
                'data': metrics
        )
        
    except Exception as e:
        return Response({
            'error': True,
                'message': f'Error al obtener métricas de comentarios: {str(e
            })}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([CanManageComments])
def auto_moderate_comments(request):
    """
    Ejecutar moderación automática de comentarios
    """
    try:
        from .utils import auto_moderate_comments
        results = auto_moderate_comments()
        
        # Registrar actividad
        log_activity(
            user=request.user,
            action='auto_moderated_comments',
            description=f'Moderación automática: {results["auto_approved"]} aprobados, {results["auto_rejected"]} rechazados',
            request=request
        )
        
        return DashboardAPIResponse.success(
            results,
            message='Moderación automática completada'
        )
        
    except Exception as e:
        return Response({
            'error': True,
            'message': f'Error en moderación automática: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([CanManageComments])
def bulk_moderate_comments(request):
    """
    Moderar múltiples comentarios
    """
    comment_ids = request.data.get('comment_ids', [])
    action = request.data.get('action')
    
    if not comment_ids or not action:
        return DashboardAPIResponse.error(
                'comment_ids y action son requeridos',
                status_code=HTTPStatus.BAD_REQUEST
            )
    
    if action not in ['approve', 'reject', 'delete']:
        return DashboardAPIResponse.error(
                'Acción inválida. Debe ser: approve, reject, delete',
                status_code=HTTPStatus.BAD_REQUEST
            )
    
    try:
        from .utils import bulk_moderate_comments as bulk_moderate
        processed_count = bulk_moderate(comment_ids, action, request.user)
        
        action_text = {
            'approve': 'aprobados',
            'reject': 'rechazados',
            'delete': 'eliminados'
        }[action]
        
        return Response({
            'error': False,
            'message': f'{processed_count} comentarios {action_text} exitosamente',
            'processed_count': processed_count
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': True,
            'message': f'Error al moderar comentarios: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([CanManageComments])
def detect_spam_comments(request):
    """
    Detectar comentarios spam
    """
    try:
        from .utils import detect_spam_comments
        spam_comments = detect_spam_comments()
        
        serializer = DashboardCommentSerializer(spam_comments, many=True)
        
        return DashboardAPIResponse.success({
            'comments': serializer.data,
            'count': len(spam_comments)
        })
        
    except Exception as e:
        return Response({
            'error': True,
            'message': f'Error en detección de spam: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)