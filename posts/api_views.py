from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from django.utils import timezone
from .models import Post, Category, Comment
from .serializers import (
    PostSerializer, PostListSerializer, PostDetailSerializer,
    CategorySerializer, CommentSerializer, PostSearchSerializer
)
from .permissions import IsStaffOrReadOnly, IsAuthorOrReadOnly
from django_blog.api_utils import StandardAPIResponse, StandardPagination, BaseAPIView
from django_blog.decorators import api_error_handler, validate_pagination_params, log_api_call
from .filters import PostFilter, CategoryFilter, CommentFilter, AdvancedSearchFilter

# Use the standardized pagination class
PostPagination = StandardPagination

class PostListAPIView(BaseAPIView, generics.ListCreateAPIView):
    queryset = Post.objects.filter(status='published').select_related('autor', 'categoria').order_by('-fecha_publicacion')
    serializer_class = PostListSerializer
    pagination_class = StandardPagination
    permission_classes = [IsStaffOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_class = PostFilter
    
    @api_error_handler
    @log_api_call
    def list(self, request, *args, **kwargs):
        """List posts with standardized response format"""
        return self.handle_exceptions(self._list_posts, request)
    
    def _list_posts(self, request):
        """Internal method to list posts"""
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return self.success_response(data=serializer.data)
    
    @api_error_handler
    @log_api_call
    def create(self, request, *args, **kwargs):
        """Create post with standardized response format"""
        return self.handle_exceptions(self._create_post, request)
    
    def _create_post(self, request):
        """Internal method to create post"""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save(autor=request.user)
            return self.success_response(
                data=serializer.data,
                message="Post created successfully",
                status_code=status.HTTP_201_CREATED
            )
        return self.validation_error_response(serializer.errors)
    
    def get_serializer_class(self):
        """Use different serializers based on action"""
        if self.request.method == 'GET':
            return PostListSerializer
        return PostSerializer
    
    def list(self, request, *args, **kwargs):
        """Lista de posts con metadatos adicionales"""
        try:
            queryset = self.filter_queryset(self.get_queryset())
            
            # Agregar metadatos de filtros aplicados
            filter_params = {
                key: value for key, value in request.query_params.items()
                if value and key not in ['page', 'page_size']
            }
            
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                response = self.get_paginated_response(serializer.data)
                
                # Agregar metadatos
                response.data['filters'] = filter_params
                response.data['total_results'] = queryset.count()
                
                return response
            
            serializer = self.get_serializer(queryset, many=True)
            return self.success_response({
                'results': serializer.data,
                'filters': filter_params,
                'total_results': queryset.count()
            })
            
        except Exception as e:
            return self.error_response(f"Error al obtener posts: {str(e)}")

class PostDetailAPIView(BaseAPIView, generics.RetrieveUpdateDestroyAPIView):
    queryset = Post.objects.filter(status='published').select_related('autor', 'categoria').prefetch_related('comentarios')
    serializer_class = PostDetailSerializer
    lookup_field = 'pk'
    permission_classes = [IsAuthorOrReadOnly]
    
    def retrieve(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return self.success_response(serializer.data)
        except Post.DoesNotExist:
            return self.not_found_response("Post not found")
    
    def update(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return self.success_response(
                    data=serializer.data,
                    message="Post updated successfully"
                )
            return self.validation_error_response(serializer.errors)
        except Post.DoesNotExist:
            return self.not_found_response("Post not found")
    
    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            instance.delete()
            return self.success_response(message="Post deleted successfully")
        except Post.DoesNotExist:
            return self.not_found_response("Post not found")

class CategoryListAPIView(BaseAPIView, generics.ListAPIView):
    queryset = Category.objects.all().order_by('nombre')
    serializer_class = CategorySerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = CategoryFilter
    
    def list(self, request, *args, **kwargs):
        try:
            queryset = self.get_queryset()
            serializer = self.get_serializer(queryset, many=True)
            return self.success_response(serializer.data)
        except Exception as e:
            return self.error_response(f"Error fetching categories: {str(e)}")

class CategoryDetailAPIView(BaseAPIView, generics.RetrieveAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = 'pk'  # Use primary key instead of slug
    
    def retrieve(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return self.success_response(serializer.data)
        except Category.DoesNotExist:
            return self.not_found_response("Category not found")

class CategoryPostsAPIView(BaseAPIView, generics.ListAPIView):
    serializer_class = PostSerializer
    pagination_class = PostPagination
    
    def get_queryset(self):
        category_id = self.kwargs['pk']
        try:
            # Verify category exists
            Category.objects.get(pk=category_id)
            return Post.objects.filter(
                categoria_id=category_id, 
                status='published'
            ).order_by('-fecha_publicacion')
        except Category.DoesNotExist:
            return Post.objects.none()
    
    def list(self, request, *args, **kwargs):
        try:
            # Check if category exists
            category_id = self.kwargs['pk']
            Category.objects.get(pk=category_id)
            
            queryset = self.get_queryset()
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            
            serializer = self.get_serializer(queryset, many=True)
            return self.success_response(serializer.data)
        except Category.DoesNotExist:
            return self.not_found_response("Category not found")

class CommentDetailAPIView(BaseAPIView, generics.RetrieveUpdateDestroyAPIView):
    queryset = Comment.objects.filter(approved=True)
    serializer_class = CommentSerializer
    permission_classes = [IsAuthorOrReadOnly]
    
    def retrieve(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return self.success_response(serializer.data)
        except Comment.DoesNotExist:
            return self.not_found_response("Comment not found")
    
    def update(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return self.success_response(
                    data=serializer.data,
                    message="Comment updated successfully"
                )
            return self.validation_error_response(serializer.errors)
        except Comment.DoesNotExist:
            return self.not_found_response("Comment not found")
    
    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            instance.delete()
            return self.success_response(message="Comment deleted successfully")
        except Comment.DoesNotExist:
            return self.not_found_response("Comment not found")

@api_view(['GET'])
def featured_posts(request):
    """Get featured posts"""
    try:
        posts = Post.objects.filter(status='published', featured=True)[:6]
        serializer = PostSerializer(posts, many=True, context={'request': request})
        return StandardResponse.success(serializer.data)
    except Exception as e:
        return StandardResponse.error(f"Error fetching featured posts: {str(e)}")

@api_view(['GET'])
def search_posts(request):
    """Búsqueda avanzada de posts con scoring de relevancia"""
    try:
        query = request.GET.get('q', '').strip()
        
        if not query:
            return StandardResponse.error('Parámetro de búsqueda "q" es requerido')
        
        # Obtener filtros adicionales
        filters = {
            key: value for key, value in request.GET.items()
            if key not in ['q', 'page', 'page_size'] and value
        }
        
        # Realizar búsqueda con relevancia
        base_queryset = Post.objects.filter(status='published').select_related('autor', 'categoria')
        posts, metadata = AdvancedSearchFilter.search_posts_with_relevance(
            base_queryset, query, filters
        )
        
        # Paginación
        paginator = StandardPagination()
        page = paginator.paginate_queryset(posts, request)
        
        if page is not None:
            serializer = PostListSerializer(page, many=True, context={'request': request})
            response = paginator.get_paginated_response(serializer.data)
            response.data['search_metadata'] = metadata
            return response
        
        serializer = PostListSerializer(posts, many=True, context={'request': request})
        return StandardResponse.success({
            'results': serializer.data,
            'search_metadata': metadata
        })
        
    except Exception as e:
        return StandardResponse.error(f"Error en búsqueda: {str(e)}")


@api_view(['GET'])
def search_suggestions(request):
    """Obtener sugerencias de búsqueda"""
    try:
        query = request.GET.get('q', '').strip()
        limit = int(request.GET.get('limit', 10))
        
        suggestions = AdvancedSearchFilter.get_search_suggestions(query, limit)
        
        return StandardResponse.success({
            'suggestions': suggestions,
            'query': query
        })
        
    except Exception as e:
        return StandardResponse.error(f"Error obteniendo sugerencias: {str(e)}")


@api_view(['GET'])
def popular_searches(request):
    """Obtener búsquedas populares"""
    try:
        limit = int(request.GET.get('limit', 10))
        popular = AdvancedSearchFilter.get_popular_searches(limit)
        
        return StandardResponse.success({
            'popular_searches': popular
        })
        
    except Exception as e:
        return StandardResponse.error(f"Error obteniendo búsquedas populares: {str(e)}")


@api_view(['GET'])
def search_filters(request):
    """Obtener opciones disponibles para filtros"""
    try:
        # Obtener categorías disponibles
        categories = Category.objects.annotate(
            posts_count=Count('post', filter=Q(post__status='published'))
        ).filter(posts_count__gt=0).order_by('nombre')
        
        # Obtener autores con posts publicados
        authors = User.objects.annotate(
            posts_count=Count('post_set', filter=Q(post_set__status='published'))
        ).filter(posts_count__gt=0).order_by('username')
        
        # Obtener años disponibles
        years = Post.objects.filter(
            status='published',
            fecha_publicacion__isnull=False
        ).dates('fecha_publicacion', 'year', order='DESC')
        
        filter_options = {
            'categories': [
                {
                    'id': cat.id,
                    'name': cat.nombre,
                    'posts_count': cat.posts_count
                }
                for cat in categories
            ],
            'authors': [
                {
                    'id': author.id,
                    'username': author.username,
                    'full_name': f"{author.first_name} {author.last_name}".strip() or author.username,
                    'posts_count': author.posts_count
                }
                for author in authors
            ],
            'years': [year.year for year in years],
            'status_options': [
                {'value': 'published', 'label': 'Publicado'},
                {'value': 'draft', 'label': 'Borrador'},
                {'value': 'archived', 'label': 'Archivado'}
            ],
            'time_ranges': [
                {'value': 'today', 'label': 'Hoy'},
                {'value': 'week', 'label': 'Esta semana'},
                {'value': 'month', 'label': 'Este mes'},
                {'value': 'year', 'label': 'Este año'},
                {'value': 'last_week', 'label': 'Semana pasada'},
                {'value': 'last_month', 'label': 'Mes pasado'}
            ],
            'ordering_options': [
                {'value': '-fecha_publicacion', 'label': 'Más recientes'},
                {'value': 'fecha_publicacion', 'label': 'Más antiguos'},
                {'value': '-titulo', 'label': 'Título (Z-A)'},
                {'value': 'titulo', 'label': 'Título (A-Z)'},
                {'value': '-autor__username', 'label': 'Autor (Z-A)'},
                {'value': 'autor__username', 'label': 'Autor (A-Z)'},
                {'value': '-categoria__nombre', 'label': 'Categoría (Z-A)'},
                {'value': 'categoria__nombre', 'label': 'Categoría (A-Z)'}
            ]
        }
        
        return StandardResponse.success(filter_options)
        
    except Exception as e:
        return StandardResponse.error(f"Error obteniendo filtros: {str(e)}")


@api_view(['GET'])
def search_stats(request):
    """Obtener estadísticas de búsqueda y contenido"""
    try:
        # Estadísticas generales
        total_posts = Post.objects.filter(status='published').count()
        total_categories = Category.objects.count()
        total_authors = User.objects.annotate(
            posts_count=Count('post_set', filter=Q(post_set__status='published'))
        ).filter(posts_count__gt=0).count()
        
        # Posts más comentados
        most_commented = Post.objects.filter(status='published').annotate(
            comments_count=Count('comentarios', filter=Q(comentarios__approved=True))
        ).order_by('-comments_count')[:5]
        
        # Categorías más populares
        popular_categories = Category.objects.annotate(
            posts_count=Count('post', filter=Q(post__status='published'))
        ).filter(posts_count__gt=0).order_by('-posts_count')[:5]
        
        # Autores más activos
        active_authors = User.objects.annotate(
            posts_count=Count('post_set', filter=Q(post_set__status='published'))
        ).filter(posts_count__gt=0).order_by('-posts_count')[:5]
        
        stats = {
            'totals': {
                'posts': total_posts,
                'categories': total_categories,
                'authors': total_authors
            },
            'most_commented_posts': [
                {
                    'id': post.id,
                    'title': post.titulo,
                    'comments_count': post.comments_count,
                    'author': post.autor.username
                }
                for post in most_commented
            ],
            'popular_categories': [
                {
                    'id': cat.id,
                    'name': cat.nombre,
                    'posts_count': cat.posts_count
                }
                for cat in popular_categories
            ],
            'active_authors': [
                {
                    'id': author.id,
                    'username': author.username,
                    'full_name': f"{author.first_name} {author.last_name}".strip() or author.username,
                    'posts_count': author.posts_count
                }
                for author in active_authors
            ]
        }
        
        return StandardResponse.success(stats)
        
    except Exception as e:
        return StandardResponse.error(f"Error obteniendo estadísticas: {str(e)}")


class AdvancedSearchAPIView(BaseAPIView, generics.ListAPIView):
    """
    Vista avanzada de búsqueda con filtros completos
    """
    serializer_class = PostListSerializer
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend]
    filterset_class = PostFilter
    
    def get_queryset(self):
        """Obtener queryset base para búsqueda"""
        return Post.objects.filter(status='published').select_related('autor', 'categoria')
    
    def list(self, request, *args, **kwargs):
        """Lista con metadatos de búsqueda mejorados"""
        try:
            # Obtener parámetros de búsqueda
            search_query = request.query_params.get('search') or request.query_params.get('q')
            
            # Si hay query de búsqueda, usar búsqueda con relevancia
            if search_query:
                filters = {
                    key: value for key, value in request.query_params.items()
                    if key not in ['search', 'q', 'page', 'page_size'] and value
                }
                
                queryset, search_metadata = AdvancedSearchFilter.search_posts_with_relevance(
                    self.get_queryset(), search_query, filters
                )
            else:
                # Usar filtros normales
                queryset = self.filter_queryset(self.get_queryset())
                search_metadata = {
                    'query': None,
                    'total_results': queryset.count(),
                    'search_time': timezone.now().isoformat(),
                    'filters_applied': bool(request.query_params)
                }
            
            # Paginación
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                response = self.get_paginated_response(serializer.data)
                response.data['search_metadata'] = search_metadata
                return response
            
            serializer = self.get_serializer(queryset, many=True)
            return self.success_response({
                'results': serializer.data,
                'search_metadata': search_metadata
            })
            
        except Exception as e:
            return self.error_response(f"Error en búsqueda avanzada: {str(e)}")

@api_view(['GET'])
def post_comments(request, post_id):
    """Get comments for a post"""
    try:
        post = Post.objects.get(id=post_id, status='published')
        comments = Comment.objects.filter(post=post, approved=True).order_by('-fecha_creacion')
        
        # Pagination
        paginator = StandardPagination()
        paginator.page_size = 20
        page = paginator.paginate_queryset(comments, request)
        
        if page is not None:
            serializer = CommentSerializer(page, many=True, context={'request': request})
            return paginator.get_paginated_response(serializer.data)
        
        serializer = CommentSerializer(comments, many=True, context={'request': request})
        return StandardResponse.success(serializer.data)
        
    except Post.DoesNotExist:
        return StandardResponse.not_found('Post not found')


@api_view(['GET'])
def get_tags(request):
    """Get all available tags from posts"""
    try:
        # This is a simplified implementation
        # In a real app, you might have a separate Tag model
        from django.db.models import Count
        
        # Get unique categories as tags
        categories = Category.objects.annotate(
            posts_count=Count('post', filter=Q(post__status='published'))
        ).filter(posts_count__gt=0).order_by('nombre')
        
        tags_data = []
        for category in categories:
            tags_data.append({
                'id': category.id,
                'name': category.nombre,
                'type': 'category',
                'posts_count': category.posts_count
            })
        
        # Get unique authors as tags
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        authors = User.objects.annotate(
            posts_count=Count('post', filter=Q(post__status='published'))
        ).filter(posts_count__gt=0).order_by('username')
        
        for author in authors:
            tags_data.append({
                'id': author.id,
                'name': author.username,
                'type': 'author',
                'posts_count': author.posts_count
            })
        
        return StandardResponse.success(tags_data)
        
    except Exception as e:
        return StandardResponse.error(f"Error fetching tags: {str(e)}")


@api_view(['GET'])
def get_search_suggestions(request):
    """Get search suggestions based on query"""
    try:
        query = request.GET.get('q', '').strip()
        
        if not query or len(query) < 2:
            return StandardResponse.success([])
        
        suggestions = []
        
        # Get post title suggestions
        posts = Post.objects.filter(
            status='published',
            titulo__icontains=query
        ).values_list('titulo', flat=True)[:5]
        
        for title in posts:
            suggestions.append({
                'text': title,
                'type': 'post_title'
            })
        
        # Get category suggestions
        categories = Category.objects.filter(
            nombre__icontains=query
        ).values_list('nombre', flat=True)[:3]
        
        for category in categories:
            suggestions.append({
                'text': category,
                'type': 'category'
            })
        
        # Get author suggestions
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        authors = User.objects.filter(
            Q(username__icontains=query) |
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query)
        ).values_list('username', flat=True)[:3]
        
        for author in authors:
            suggestions.append({
                'text': author,
                'type': 'author'
            })
        
        return StandardResponse.success(suggestions[:10])  # Limit to 10 suggestions
        
    except Exception as e:
        return StandardResponse.error(f"Error fetching suggestions: {str(e)}")