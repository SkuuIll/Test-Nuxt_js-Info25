from django.shortcuts import get_object_or_404
from django.http import JsonResponse, HttpResponse, Http404
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.db.models import Q
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView
import mimetypes
import os
from .models import MediaFile
from .serializers import MediaFileSerializer, MediaUploadSerializer


class MediaFileUploadView(APIView):
    """
    Handle file uploads with proper validation and processing
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        try:
            # Validate upload data
            serializer = MediaUploadSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    'error': True,
                    'message': 'Invalid upload data',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            uploaded_file = serializer.validated_data['file']
            
            # Get MIME type
            mime_type, _ = mimetypes.guess_type(uploaded_file.name)
            if not mime_type:
                mime_type = 'application/octet-stream'
            
            # Create media file instance
            media_file = MediaFile(
                file=uploaded_file,
                original_filename=uploaded_file.name,
                file_size=uploaded_file.size,
                mime_type=mime_type,
                uploaded_by=request.user,
                alt_text=serializer.validated_data.get('alt_text', ''),
                caption=serializer.validated_data.get('caption', ''),
                description=serializer.validated_data.get('description', ''),
                tags=serializer.validated_data.get('tags', ''),
                is_public=serializer.validated_data.get('is_public', True)
            )
            
            # Save the file
            media_file.save()
            
            # Serialize and return
            response_serializer = MediaFileSerializer(media_file)
            
            return Response({
                'error': False,
                'message': 'File uploaded successfully',
                'data': response_serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'error': True,
                'message': f'Upload failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MediaFileListView(APIView):
    """
    List and filter media files
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Get query parameters
            file_type = request.GET.get('file_type')
            search = request.GET.get('search')
            is_public = request.GET.get('is_public')
            page = int(request.GET.get('page', 1))
            page_size = int(request.GET.get('page_size', 20))
            
            # Build query
            queryset = MediaFile.objects.all()
            
            # Apply filters
            if file_type:
                queryset = queryset.filter(file_type=file_type)
            
            if search:
                queryset = queryset.filter(
                    Q(original_filename__icontains=search) |
                    Q(alt_text__icontains=search) |
                    Q(caption__icontains=search) |
                    Q(description__icontains=search) |
                    Q(tags__icontains=search)
                )
            
            if is_public is not None:
                queryset = queryset.filter(is_public=is_public.lower() == 'true')
            
            # Order by upload date (newest first)
            queryset = queryset.order_by('-uploaded_at')
            
            # Paginate
            paginator = Paginator(queryset, page_size)
            page_obj = paginator.get_page(page)
            
            # Serialize
            serializer = MediaFileSerializer(page_obj.object_list, many=True)
            
            return Response({
                'error': False,
                'data': serializer.data,
                'pagination': {
                    'count': paginator.count,
                    'page': page,
                    'pages': paginator.num_pages,
                    'page_size': page_size,
                    'has_next': page_obj.has_next(),
                    'has_previous': page_obj.has_previous(),
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': True,
                'message': f'Failed to fetch media files: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MediaFileDetailView(APIView):
    """
    Get, update, or delete a specific media file
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        try:
            media_file = get_object_or_404(MediaFile, pk=pk)
            
            # Check permissions
            if not media_file.is_public and media_file.uploaded_by != request.user:
                if not request.user.is_staff:
                    return Response({
                        'error': True,
                        'message': 'Permission denied'
                    }, status=status.HTTP_403_FORBIDDEN)
            
            serializer = MediaFileSerializer(media_file)
            return Response({
                'error': False,
                'data': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': True,
                'message': f'Failed to fetch media file: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def patch(self, request, pk):
        try:
            media_file = get_object_or_404(MediaFile, pk=pk)
            
            # Check permissions
            if media_file.uploaded_by != request.user and not request.user.is_staff:
                return Response({
                    'error': True,
                    'message': 'Permission denied'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Update allowed fields
            allowed_fields = ['alt_text', 'caption', 'description', 'tags', 'is_public', 'is_featured']
            
            for field in allowed_fields:
                if field in request.data:
                    setattr(media_file, field, request.data[field])
            
            media_file.save()
            
            serializer = MediaFileSerializer(media_file)
            return Response({
                'error': False,
                'message': 'Media file updated successfully',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': True,
                'message': f'Failed to update media file: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def delete(self, request, pk):
        try:
            media_file = get_object_or_404(MediaFile, pk=pk)
            
            # Check permissions
            if media_file.uploaded_by != request.user and not request.user.is_staff:
                return Response({
                    'error': True,
                    'message': 'Permission denied'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Delete file from filesystem
            if media_file.file:
                try:
                    os.remove(media_file.file.path)
                except OSError:
                    pass
            
            media_file.delete()
            
            return Response({
                'error': False,
                'message': 'Media file deleted successfully'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': True,
                'message': f'Failed to delete media file: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def media_stats(request):
    """
    Get media statistics
    """
    try:
        stats = {
            'total_files': MediaFile.objects.count(),
            'total_size': sum(MediaFile.objects.values_list('file_size', flat=True)),
            'by_type': {},
            'public_files': MediaFile.objects.filter(is_public=True).count(),
            'featured_files': MediaFile.objects.filter(is_featured=True).count(),
        }
        
        # Count by file type
        for file_type, _ in MediaFile.FILE_TYPES:
            count = MediaFile.objects.filter(file_type=file_type).count()
            stats['by_type'][file_type] = count
        
        return Response({
            'error': False,
            'data': stats
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': True,
            'message': f'Failed to fetch media stats: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)