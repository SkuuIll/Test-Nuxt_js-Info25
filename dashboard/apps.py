from django.apps import AppConfig


class DashboardConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'dashboard'
    verbose_name = 'Dashboard Administrativo'
    
    def ready(self):
        # Importar señales
        import dashboard.signals