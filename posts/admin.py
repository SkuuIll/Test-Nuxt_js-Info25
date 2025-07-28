from django.contrib import admin
from django.utils.html import format_html
from .models import Post, Categoria, Comentario

@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'descripcion', 'fecha_creacion']
    search_fields = ['nombre', 'descripcion']
    list_filter = ['fecha_creacion']
    ordering = ['nombre']

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'autor', 'categoria', 'status', 'featured', 'fecha_publicacion']
    list_filter = ['status', 'featured', 'categoria', 'fecha_publicacion', 'autor']
    search_fields = ['titulo', 'contenido']
    prepopulated_fields = {'meta_title': ('titulo',)}
    date_hierarchy = 'fecha_publicacion'
    ordering = ['-fecha_publicacion']
    
    fieldsets = (
        ('Información Principal', {
            'fields': ('titulo', 'contenido', 'categoria', 'imagen', 'featured')
        }),
        ('SEO', {
            'fields': ('meta_title', 'meta_description'),
            'classes': ('collapse',)
        }),
        ('Estado', {
            'fields': ('status', 'fecha_publicacion')
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:  # Si es un nuevo post
            obj.autor = request.user
        super().save_model(request, obj, form, change)
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(autor=request.user)
    
    def has_change_permission(self, request, obj=None):
        if obj is None:
            return True
        if request.user.is_superuser:
            return True
        return obj.autor == request.user
    
    def has_delete_permission(self, request, obj=None):
        if obj is None:
            return True
        if request.user.is_superuser:
            return True
        return obj.autor == request.user

@admin.register(Comentario)
class ComentarioAdmin(admin.ModelAdmin):
    list_display = ['post', 'usuario', 'contenido_truncado', 'approved', 'fecha_creacion']
    list_filter = ['approved', 'fecha_creacion', 'post']
    search_fields = ['contenido', 'usuario__username', 'post__titulo']
    actions = ['aprobar_comentarios', 'rechazar_comentarios']
    
    def contenido_truncado(self, obj):
        return obj.contenido[:50] + '...' if len(obj.contenido) > 50 else obj.contenido
    contenido_truncado.short_description = 'Contenido'
    
    def aprobar_comentarios(self, request, queryset):
        queryset.update(approved=True)
        self.message_user(request, f'{queryset.count()} comentarios aprobados.')
    aprobar_comentarios.short_description = 'Aprobar comentarios seleccionados'
    
    def rechazar_comentarios(self, request, queryset):
        queryset.update(approved=False)
        self.message_user(request, f'{queryset.count()} comentarios rechazados.')
    rechazar_comentarios.short_description = 'Rechazar comentarios seleccionados'

# Personalizar el admin site
admin.site.site_header = 'Blog de Noticias - Administración'
admin.site.site_title = 'Blog Admin'
admin.site.index_title = 'Panel de Administración'