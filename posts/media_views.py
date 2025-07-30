import json
import os
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings
from django.utils.decorators import method_decorator
from django.views import View
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import uuid
from PIL import Image
import io


class MediaUploadView(View):
    """Vista mejorada para manejo de archivos multimedia"""
    
    @method_decorator(csrf_exempt)
    @method_decorator(login_required)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def post(self, request):
        if not request.FILES.get('file'):
            return JsonResponse({
                'success': False,
                'error': 'No se proporcionó ningún archivo'
            }, status=400)
        
        uploaded_file = request.FILES['file']
        
        # Validar archivo
        validation_result = self.validate_file(uploaded_file)
        if not validation_result['valid']:
            return JsonResponse({
                'success': False,
                'error': validation_result['error']
            }, status=400)
        
        try:
            # Procesar y guardar archivo
            file_info = self.process_and_save_file(uploaded_file, request.user)
            
            return JsonResponse({
                'success': True,
                'data': file_info,
                'location': file_info['url']  # Para compatibilidad con TinyMCE
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': f'Error al procesar el archivo: {str(e)}'
            }, status=500)
    
    def validate_file(self, uploaded_file):
        """Validar archivo subido"""
        # Validar tipo de archivo
        allowed_types = {
            'image/jpeg': '.jpg',
            'image/jpg': '.jpg', 
            'image/png': '.png',
            'image/gif': '.gif',
            'image/webp': '.webp',
            'image/svg+xml': '.svg'
        }
        
        if uploaded_file.content_type not in allowed_types:
            return {
                'valid': False,
                'error': f'Tipo de archivo no permitido: {uploaded_file.content_type}. Tipos permitidos: {", ".join(allowed_types.keys())}'
            }
        
        # Validar tamaño (máximo 10MB)
        max_size = getattr(settings, 'FILE_UPLOAD_MAX_MEMORY_SIZE', 10 * 1024 * 1024)
        if uploaded_file.size > max_size:
            return {
                'valid': False,
                'error': f'El archivo es demasiado grande. Máximo {max_size // (1024*1024)}MB.'
            }
        
        # Validar extensión
        file_extension = os.path.splitext(uploaded_file.name)[1].lower()
        allowed_extensions = getattr(settings, 'ALLOWED_IMAGE_EXTENSIONS', ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'])
        
        if file_extension not in allowed_extensions:
            return {
                'valid': False,
                'error': f'Extensión no permitida: {file_extension}. Extensiones permitidas: {", ".join(allowed_extensions)}'
            }
        
        return {'valid': True}
    
    def process_and_save_file(self, uploaded_file, user):
        """Procesar y guardar archivo"""
        # Generar nombre único
        file_extension = os.path.splitext(uploaded_file.name)[1].lower()
        unique_filename = f"uploads/{user.id}/{uuid.uuid4()}{file_extension}"
        
        # Optimizar imagen si es necesario
        if uploaded_file.content_type.startswith('image/') and uploaded_file.content_type != 'image/svg+xml':
            processed_file = self.optimize_image(uploaded_file)
        else:
            processed_file = ContentFile(uploaded_file.read())
        
        # Guardar archivo
        file_path = default_storage.save(unique_filename, processed_file)
        file_url = default_storage.url(file_path)
        
        return {
            'filename': uploaded_file.name,
            'path': file_path,
            'url': file_url,
            'size': uploaded_file.size,
            'content_type': uploaded_file.content_type,
            'uploaded_by': user.username
        }
    
    def optimize_image(self, uploaded_file):
        """Optimizar imagen para web"""
        try:
            # Abrir imagen con PIL
            image = Image.open(uploaded_file)
            
            # Convertir a RGB si es necesario
            if image.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', image.size, (255, 255, 255))
                if image.mode == 'P':
                    image = image.convert('RGBA')
                background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
                image = background
            
            # Redimensionar si es muy grande
            max_width = 1920
            max_height = 1080
            
            if image.width > max_width or image.height > max_height:
                image.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
            
            # Guardar imagen optimizada
            output = io.BytesIO()
            image.save(output, format='JPEG', quality=85, optimize=True)
            output.seek(0)
            
            return ContentFile(output.read())
            
        except Exception as e:
            # Si falla la optimización, usar archivo original
            uploaded_file.seek(0)
            return ContentFile(uploaded_file.read())


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_upload_media(request):
    """API endpoint para subida de archivos multimedia"""
    if not request.FILES.get('file'):
        return Response({
            'success': False,
            'error': 'No se proporcionó ningún archivo'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Usar la misma lógica de MediaUploadView
    view = MediaUploadView()
    uploaded_file = request.FILES['file']
    
    # Validar archivo
    validation_result = view.validate_file(uploaded_file)
    if not validation_result['valid']:
        return Response({
            'success': False,
            'error': validation_result['error']
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Procesar y guardar archivo
        file_info = view.process_and_save_file(uploaded_file, request.user)
        
        return Response({
            'success': True,
            'data': file_info
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al procesar el archivo: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@csrf_exempt
@login_required
def tinymce_upload_improved(request):
    """Vista mejorada para TinyMCE con mejor manejo de errores"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    
    # Usar MediaUploadView para consistencia
    view = MediaUploadView()
    response = view.post(request)
    
    # Convertir respuesta para compatibilidad con TinyMCE
    if response.status_code == 200:
        data = json.loads(response.content)
        if data.get('success'):
            return JsonResponse({
                'location': data['data']['url']
            })
    
    # Manejar errores
    try:
        error_data = json.loads(response.content)
        return JsonResponse({
            'error': error_data.get('error', 'Error desconocido')
        }, status=response.status_code)
    except:
        return JsonResponse({
            'error': 'Error al procesar el archivo'
        }, status=500)