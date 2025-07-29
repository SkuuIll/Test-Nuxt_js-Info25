from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from posts.models import Post, Comentario, Categoria
from dashboard.models import DashboardPermission, ActivityLog


class Command(BaseCommand):
    help = 'Configurar grupos de permisos para el dashboard'
    
    def handle(self, *args, **options):
        # Crear grupos
        groups_config = {
            'Dashboard Admin': {
                'description': 'Administradores completos del dashboard',
                'permissions': ['add', 'change', 'delete', 'view']
            },
            'Dashboard Editor': {
                'description': 'Editores de contenido',
                'permissions': ['add', 'change', 'view']
            },
            'Dashboard Moderator': {
                'description': 'Moderadores de comentarios',
                'permissions': ['change', 'view']
            },
            'Dashboard Viewer': {
                'description': 'Solo visualización de estadísticas',
                'permissions': ['view']
            }
        }
        
        # Modelos relevantes
        models = [Post, Comentario, Categoria, DashboardPermission, ActivityLog]
        
        for group_name, config in groups_config.items():
            group, created = Group.objects.get_or_create(name=group_name)
            
            if created:
                self.stdout.write(f'Grupo "{group_name}" creado')
            else:
                self.stdout.write(f'Grupo "{group_name}" ya existe')
            
            # Limpiar permisos existentes
            group.permissions.clear()
            
            # Agregar permisos según configuración
            for model in models:
                content_type = ContentType.objects.get_for_model(model)
                
                for perm_type in config['permissions']:
                    codename = f'{perm_type}_{model._meta.model_name}'
                    
                    try:
                        permission = Permission.objects.get(
                            codename=codename,
                            content_type=content_type
                        )
                        group.permissions.add(permission)
                        
                    except Permission.DoesNotExist:
                        self.stdout.write(
                            self.style.WARNING(
                                f'Permiso {codename} no encontrado para {model.__name__}'
                            )
                        )
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Permisos configurados para "{group_name}"'
                )
            )
        
        self.stdout.write(
            self.style.SUCCESS('Configuración de grupos completada')
        )