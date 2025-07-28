from rest_framework import permissions

class IsAuthorOrReadOnly(permissions.BasePermission):
    """
    Permiso personalizado que solo permite a los autores de un post editarlo.
    """
    
    def has_object_permission(self, request, view, obj):
        # Permisos de lectura para cualquier request,
        # así que siempre permitimos GET, HEAD o OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Permisos de escritura solo para el autor del post.
        return obj.autor == request.user

class IsStaffOrReadOnly(permissions.BasePermission):
    """
    Permiso personalizado que solo permite a los staff members crear/editar posts.
    """
    
    def has_permission(self, request, view):
        # Permisos de lectura para cualquier request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Permisos de escritura solo para staff members
        return request.user and request.user.is_staff

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Permiso personalizado que solo permite a los propietarios de un objeto editarlo.
    """
    
    def has_object_permission(self, request, view, obj):
        # Permisos de lectura para cualquier request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Permisos de escritura solo para el propietario del objeto
        if hasattr(obj, 'usuario'):
            return obj.usuario == request.user
        elif hasattr(obj, 'autor'):
            return obj.autor == request.user
        elif hasattr(obj, 'user'):
            return obj.user == request.user
        
        return False

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Permiso personalizado que solo permite a los administradores crear/editar.
    """
    
    def has_permission(self, request, view):
        # Permisos de lectura para cualquier request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Permisos de escritura solo para administradores
        return request.user and request.user.is_superuser