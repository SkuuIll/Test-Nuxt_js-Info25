#!/usr/bin/env python
"""
Script para crear un usuario de dashboard con permisos completos
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_blog.settings')
django.setup()

from django.contrib.auth.models import User
from dashboard.models import DashboardPermission

def create_dashboard_user():
    """Crear usuario de dashboard con permisos completos"""
    
    # Datos del usuario
    username = 'admin'
    email = 'admin@example.com'
    password = 'admin123'
    
    try:
        # Crear o obtener usuario
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': email,
                'first_name': 'Admin',
                'last_name': 'User',
                'is_staff': True,
                'is_superuser': True,
                'is_active': True
            }
        )
        
        if created:
            user.set_password(password)
            user.save()
            print(f"✅ Usuario '{username}' creado exitosamente")
        else:
            print(f"ℹ️  Usuario '{username}' ya existe")
        
        # Crear o actualizar permisos de dashboard
        dashboard_permission, perm_created = DashboardPermission.objects.get_or_create(
            user=user,
            defaults={
                'can_manage_posts': True,
                'can_manage_users': True,
                'can_manage_comments': True,
                'can_view_stats': True
            }
        )
        
        if not perm_created:
            # Actualizar permisos existentes
            dashboard_permission.can_manage_posts = True
            dashboard_permission.can_manage_users = True
            dashboard_permission.can_manage_comments = True
            dashboard_permission.can_view_stats = True
            dashboard_permission.save()
            print(f"✅ Permisos de dashboard actualizados para '{username}'")
        else:
            print(f"✅ Permisos de dashboard creados para '{username}'")
        
        print(f"\n🔑 Credenciales de acceso:")
        print(f"   Usuario: {username}")
        print(f"   Contraseña: {password}")
        print(f"   Email: {email}")
        print(f"\n🌐 Acceso al dashboard:")
        print(f"   URL: http://localhost:3000/dashboard/login")
        
        return True
        
    except Exception as e:
        print(f"❌ Error al crear usuario: {str(e)}")
        return False

if __name__ == '__main__':
    success = create_dashboard_user()
    sys.exit(0 if success else 1)