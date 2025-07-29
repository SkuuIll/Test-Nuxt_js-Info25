#!/usr/bin/env python
import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_blog.settings')
django.setup()

from django.contrib.auth.models import User
from dashboard.models import DashboardPermission

print("🔍 Checking users and permissions...")

# Listar todos los usuarios
users = User.objects.all()
print(f"Total users: {users.count()}")

for user in users:
    print(f"- {user.username} (active: {user.is_active}, staff: {user.is_staff}, superuser: {user.is_superuser})")
    
    # Verificar permisos de dashboard
    try:
        perm = user.dashboard_permission
        print(f"  Dashboard perms: posts={perm.can_manage_posts}, users={perm.can_manage_users}, comments={perm.can_manage_comments}, stats={perm.can_view_stats}")
    except DashboardPermission.DoesNotExist:
        print("  No dashboard permissions")

# Verificar si admin existe
admin = User.objects.filter(username='admin').first()
if admin:
    print(f"\n✅ Admin user exists: {admin.username}")
    print(f"   Active: {admin.is_active}")
    print(f"   Staff: {admin.is_staff}")
    print(f"   Superuser: {admin.is_superuser}")
    
    # Verificar contraseña
    if admin.check_password('admin123'):
        print("   ✅ Password 'admin123' is correct")
    else:
        print("   ❌ Password 'admin123' is incorrect")
        # Intentar resetear la contraseña
        admin.set_password('admin123')
        admin.save()
        print("   🔧 Password reset to 'admin123'")
else:
    print("❌ Admin user does not exist")
    # Crear usuario admin
    from dashboard.utils import create_dashboard_admin_user
    admin = create_dashboard_admin_user('admin', 'admin@blog.com', 'admin123')
    print("✅ Admin user created")