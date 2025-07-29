from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from dashboard.utils import create_dashboard_admin_user


class Command(BaseCommand):
    help = 'Crear un usuario administrador del dashboard'
    
    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Nombre de usuario')
        parser.add_argument('email', type=str, help='Email del usuario')
        parser.add_argument('password', type=str, help='Contraseña del usuario')
    
    def handle(self, *args, **options):
        username = options['username']
        email = options['email']
        password = options['password']
        
        # Verificar si el usuario ya existe
        if User.objects.filter(username=username).exists():
            self.stdout.write(
                self.style.ERROR(f'El usuario "{username}" ya existe.')
            )
            return
        
        if User.objects.filter(email=email).exists():
            self.stdout.write(
                self.style.ERROR(f'Ya existe un usuario con el email "{email}".')
            )
            return
        
        try:
            user = create_dashboard_admin_user(username, email, password)
            self.stdout.write(
                self.style.SUCCESS(
                    f'Usuario administrador "{username}" creado exitosamente.'
                )
            )
            self.stdout.write(
                f'El usuario tiene permisos completos del dashboard.'
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error al crear el usuario: {str(e)}')
            )