from rest_framework import permissions
from .models import DashboardPermission


class IsDashboardUser(permissions.BasePermission):
    """
    Permiso personalizado para verificar que el usuario tenga acceso al dashboard
    """
    message = 'No tienes permisos para acceder al dashboard.'
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Los superusuarios siempre tienen acceso
        if request.user.is_superuser:
            return True
        
        # Verificar si el usuario tiene permisos de dashboard
        try:
            dashboard_permission = request.user.dashboard_permission
            return (dashboard_permission.can_view_stats or 
                   dashboard_permission.can_manage_posts or
                   dashboard_permission.can_manage_users or
                   dashboard_permission.can_manage_comments)
        except DashboardPermission.DoesNotExist:
            return False


class CanManagePosts(permissions.BasePermission):
    """
    Permiso para gestionar posts
    """
    message = 'No tienes permisos para gestionar posts.'
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser:
            return True
        
        try:
            return request.user.dashboard_permission.can_manage_posts
        except DashboardPermission.DoesNotExist:
            return False


class CanManageUsers(permissions.BasePermission):
    """
    Permiso para gestionar usuarios
    """
    message = 'No tienes permisos para gestionar usuarios.'
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser:
            return True
        
        try:
            return request.user.dashboard_permission.can_manage_users
        except DashboardPermission.DoesNotExist:
            return False


class CanManageComments(permissions.BasePermission):
    """
    Permiso para gestionar comentarios
    """
    message = 'No tienes permisos para gestionar comentarios.'
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser:
            return True
        
        try:
            return request.user.dashboard_permission.can_manage_comments
        except DashboardPermission.DoesNotExist:
            return False


class CanViewStats(permissions.BasePermission):
    """
    Permiso para ver estadísticas
    """
    message = 'No tienes permisos para ver las estadísticas.'
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser:
            return True
        
        try:
            return request.user.dashboard_permission.can_view_stats
        except DashboardPermission.DoesNotExist:
            return False


class IsOwnerOrCanManage(permissions.BasePermission):
    """
    Permiso que permite al propietario o a usuarios con permisos de gestión
    """
    def has_object_permission(self, request, view, obj):
        # Los superusuarios siempre pueden
        if request.user.is_superuser:
            return True
        
        # El propietario puede editar su propio contenido
        if hasattr(obj, 'autor') and obj.autor == request.user:
            return True
        
        if hasattr(obj, 'usuario') and obj.usuario == request.user:
            return True
        
        # Verificar permisos específicos según el tipo de objeto
        try:
            dashboard_permission = request.user.dashboard_permission
            
            if obj.__class__.__name__ == 'Post':
                return dashboard_permission.can_manage_posts
            elif obj.__class__.__name__ == 'User':
                return dashboard_permission.can_manage_users
            elif obj.__class__.__name__ == 'Comentario':
                return dashboard_permission.can_manage_comments
                
        except DashboardPermission.DoesNotExist:
            pass
        
        return False