#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_blog.settings')
django.setup()

from accounts.models import User

def create_test_users():
    print("🔧 Creando usuario administrador...")
    
    # Crear solo el superusuario admin
    if not User.objects.filter(username='admin').exists():
        admin = User.objects.create_superuser(
            username='admin',
            email='admin@test.com',
            password='admin123',
            first_name='Admin',
            last_name='User'
        )
        print(f"✅ Superusuario creado: {admin.username} - {admin.email}")
    else:
        print("ℹ️ Usuario 'admin' ya existe")
    
    print("\n📋 Usuario disponible:")
    admin_user = User.objects.get(username='admin')
    print(f"  - {admin_user.username} ({admin_user.email}) - Superuser")

if __name__ == '__main__':
    create_test_users()