from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model

User = get_user_model()
from django.core.exceptions import ValidationError
from tinymce.models import HTMLField
import os


def validate_image_size(image):
    """Validar que la imagen no sea mayor a 5MB"""
    file_size = image.file.size
    limit_mb = 5
    if file_size > limit_mb * 1024 * 1024:
        raise ValidationError(f'El archivo es demasiado grande. El tamaño máximo es {limit_mb}MB.')


def validate_image_extension(image):
    """Validar que la imagen tenga una extensión válida"""
    valid_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    ext = os.path.splitext(image.name)[1].lower()
    if ext not in valid_extensions:
        raise ValidationError(f'Extensión de archivo no válida. Extensiones permitidas: {", ".join(valid_extensions)}')


class Categoria(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.nombre
    
    @property
    def name(self):
        return self.nombre
    
    @property
    def slug(self):
        from django.utils.text import slugify
        return slugify(self.nombre)
    
    @property
    def created_at(self):
        return self.fecha_creacion
    
    class Meta:
        verbose_name_plural = "Categorías"

# Alias for API compatibility
Category = Categoria


class Post(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Borrador'),
        ('published', 'Publicado'),
        ('archived', 'Archivado'),
    ]
    
    titulo = models.CharField(max_length=200)
    contenido = HTMLField()
    fecha_publicacion = models.DateTimeField(default=timezone.now)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    imagen = models.ImageField(
        upload_to='posts/', 
        null=True, 
        blank=True,
        validators=[validate_image_size, validate_image_extension],
        help_text='Imagen opcional. Tamaño máximo: 5MB. Formatos: JPG, PNG, GIF, WebP'
    )
    categoria = models.ForeignKey(Categoria, on_delete=models.SET_NULL, null=True)
    autor = models.ForeignKey(User, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='published')
    featured = models.BooleanField(default=False, help_text='Marcar como artículo destacado')
    meta_title = models.CharField(max_length=200, blank=True, help_text='Título SEO')
    meta_description = models.TextField(max_length=300, blank=True, help_text='Descripción SEO')
    
    def __str__(self):
        return self.titulo
    
    @property
    def title(self):
        return self.titulo
    
    @property
    def content(self):
        return self.contenido
    
    @property
    def excerpt(self):
        # Generate excerpt from content (first 150 characters)
        from django.utils.html import strip_tags
        text = strip_tags(self.contenido)
        return text[:150] + '...' if len(text) > 150 else text
    
    @property
    def slug(self):
        from django.utils.text import slugify
        return f"{self.pk}-{slugify(self.titulo)}"
    
    @property
    def image(self):
        return self.imagen.url if self.imagen else None
    
    @property
    def author(self):
        return self.autor
    
    @property
    def category(self):
        return self.categoria
    
    @property
    def created_at(self):
        return self.fecha_creacion
    
    @property
    def updated_at(self):
        return self.fecha_actualizacion
    
    @property
    def published_at(self):
        return self.fecha_publicacion
    
    def get_absolute_url(self):
        from django.urls import reverse
        return reverse('posts:detail', kwargs={'pk': self.pk})
    
    def clean(self):
        """Validaciones adicionales del modelo"""
        super().clean()
        if len(self.titulo.strip()) < 5:
            raise ValidationError({'titulo': 'El título debe tener al menos 5 caracteres.'})
        if len(self.contenido.strip()) < 20:
            raise ValidationError({'contenido': 'El contenido debe tener al menos 20 caracteres.'})
    
    class Meta:
        ordering = ['-fecha_publicacion']


class Comentario(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comentarios')
    usuario = models.ForeignKey(User, on_delete=models.CASCADE)
    contenido = models.TextField()
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    approved = models.BooleanField(default=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    
    def __str__(self):
        return f'Comentario de {self.usuario.username} en {self.post.titulo}'
    
    @property
    def content(self):
        return self.contenido
    
    @property
    def author(self):
        return self.usuario
    
    @property
    def created_at(self):
        return self.fecha_creacion
    
    @property
    def updated_at(self):
        return self.fecha_actualizacion
    
    class Meta:
        ordering = ['fecha_creacion']

# Alias for API compatibility
Comment = Comentario
