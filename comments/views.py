from django.shortcuts import render, get_object_or_404
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import json

from .models import Comment
from .serializers import CommentSerializer
from posts.models import Post

class CommentListAPIView(generics.ListCreateAPIView):
    """
    API view para listar y crear comentarios
    """
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        queryset = Comment.objects.all().order_by('-created_at')
        post_id = self.request.query_params.get('post', None)
        if post_id is not None:
            queryset = queryset.filter(post_id=post_id)
        return queryset
    
    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                serializer.save(author=request.user if request.user.is_authenticated else None)
                return Response({
                    'success': True,
                    'message': 'Comentario creado exitosamente',
                    'data': serializer.data
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'success': False,
                    'message': 'Error en los datos del comentario',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error interno del servidor: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CommentDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    API view para obtener, actualizar y eliminar un comentario específico
    """
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

class PostCommentsAPIView(generics.ListAPIView):
    """
    API view para obtener todos los comentarios de un post específico
    """
    serializer_class = CommentSerializer
    
    def get_queryset(self):
        post_id = self.kwargs['post_id']
        return Comment.objects.filter(post_id=post_id).order_by('-created_at')
    
    def list(self, request, *args, **kwargs):
        try:
            queryset = self.get_queryset()
            serializer = self.get_serializer(queryset, many=True)
            return Response({
                'success': True,
                'data': serializer.data,
                'count': queryset.count()
            })
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error al obtener comentarios: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Health check view for comments
@require_http_methods(["GET"])
def comments_health(request):
    """Simple health check for comments endpoint"""
    return JsonResponse({
        'status': 'ok',
        'service': 'comments',
        'message': 'Comments service is running'
    })
