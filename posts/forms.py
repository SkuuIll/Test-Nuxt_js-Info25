# Formularios mantenidos solo para el admin de Django
# La API usa serializers en su lugar

from django import forms
from .models import Comentario, Post, Categoria
from tinymce.widgets import TinyMCE


class PostForm(forms.ModelForm):
    """Formulario para el admin de Django"""
    class Meta:
        model = Post
        fields = ['titulo', 'contenido', 'categoria', 'imagen', 'status', 'featured', 'meta_title', 'meta_description']
        widgets = {
            'titulo': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Título del post'
            }),
            'contenido': TinyMCE(attrs={'cols': 80, 'rows': 30}),
            'categoria': forms.Select(attrs={
                'class': 'form-control'
            }),
            'imagen': forms.FileInput(attrs={
                'class': 'form-control',
                'accept': 'image/*'
            }),
            'meta_title': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Título SEO (opcional)'
            }),
            'meta_description': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 2,
                'placeholder': 'Descripción SEO (opcional)'
            })
        }


class CategoriaForm(forms.ModelForm):
    """Formulario para el admin de Django"""
    class Meta:
        model = Categoria
        fields = ['nombre', 'descripcion']
        widgets = {
            'nombre': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Nombre de la categoría'
            }),
            'descripcion': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'Descripción de la categoría (opcional)'
            })
        }