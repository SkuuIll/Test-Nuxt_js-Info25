from django.apps import AppConfig


class MediaFilesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'media_files'
    verbose_name = 'Media Files'
    
    def ready(self):
        # Import signals if any
        try:
            from . import signals
        except ImportError:
            pass