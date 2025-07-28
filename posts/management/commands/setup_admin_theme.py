from django.core.management.base import BaseCommand
from admin_interface.models import Theme


class Command(BaseCommand):
    help = 'Configura el tema personalizado para el admin'

    def handle(self, *args, **options):
        # Eliminar tema existente si existe
        Theme.objects.all().delete()
        
        # Crear nuevo tema personalizado
        theme = Theme.objects.create(
            name='Blog de Noticias - Tema Oscuro',
            active=True,
            
            # Configuraciones básicas
            title='🚀 Blog de Noticias Admin',
            logo_visible=True,
            related_modal_active=True,
            related_modal_background_opacity=0.3,
            env_name='DESARROLLO',
            env_visible_in_header=True,
            env_color='#059669',
            
            # Configuraciones de interfaz
            recent_actions_visible=True,
            list_filter_dropdown=True,
            list_filter_sticky=True,
            list_filter_highlight=True,
            foldable_apps=True,
            language_chooser_active=False,
        )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Tema "{theme.name}" creado exitosamente!\n'
                f'- Título: {theme.title}\n'
                f'- Características: Filtros sticky, apps plegables, modales\n'
                f'- Entorno: {theme.env_name}\n'
                f'- Estado: Activo'
            )
        )