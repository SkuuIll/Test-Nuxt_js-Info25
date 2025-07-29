from django.contrib import admin
from .models import DashboardPermission, ActivityLog


@admin.register(DashboardPermission)
class DashboardPermissionAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'can_manage_posts', 'can_manage_users', 
        'can_manage_comments', 'can_view_stats', 'created_at'
    ]
    list_filter = [
        'can_manage_posts', 'can_manage_users', 
        'can_manage_comments', 'can_view_stats', 'created_at'
    ]
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Usuario', {
            'fields': ('user',)
        }),
        ('Permisos', {
            'fields': (
                'can_manage_posts', 'can_manage_users',
                'can_manage_comments', 'can_view_stats'
            )
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'action', 'target_model', 'target_id', 
        'timestamp', 'ip_address'
    ]
    list_filter = ['action', 'target_model', 'timestamp']
    search_fields = ['user__username', 'description', 'ip_address']
    readonly_fields = [
        'user', 'action', 'target_model', 'target_id',
        'description', 'timestamp', 'ip_address', 'user_agent'
    ]
    date_hierarchy = 'timestamp'
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    fieldsets = (
        ('Información de la Actividad', {
            'fields': ('user', 'action', 'target_model', 'target_id', 'description')
        }),
        ('Información Técnica', {
            'fields': ('timestamp', 'ip_address', 'user_agent'),
            'classes': ('collapse',)
        })
    )