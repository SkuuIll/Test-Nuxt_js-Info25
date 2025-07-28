import json
import os
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.admin.views.decorators import staff_member_required
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings
import uuid


@csrf_exempt
@staff_member_required
def tinymce_upload(request):
    """Vista para manejar la subida de imágenes en TinyMCE"""
    
    if request.method == 'POST' and request.FILES.get('file'):
        uploaded_file = request.FILES['file']
        
        # Validar tipo de archivo
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        if uploaded_file.content_type not in allowed_types:
            return JsonResponse({
                'error': 'Tipo de archivo no permitido. Solo se permiten imágenes.'
            }, status=400)
        
        # Validar tamaño (máximo 5MB)
        if uploaded_file.size > 5 * 1024 * 1024:
            return JsonResponse({
                'error': 'El archivo es demasiado grande. Máximo 5MB.'
            }, status=400)
        
        try:
            # Generar nombre único para el archivo
            file_extension = os.path.splitext(uploaded_file.name)[1]
            unique_filename = f"tinymce/{uuid.uuid4()}{file_extension}"
            
            # Guardar el archivo
            file_path = default_storage.save(unique_filename, ContentFile(uploaded_file.read()))
            file_url = default_storage.url(file_path)
            
            return JsonResponse({
                'location': request.build_absolute_uri(file_url)
            })
            
        except Exception as e:
            return JsonResponse({
                'error': f'Error al subir el archivo: {str(e)}'
            }, status=500)
    
    return JsonResponse({'error': 'Método no permitido'}, status=405)