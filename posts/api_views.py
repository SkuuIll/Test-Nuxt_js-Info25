from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from django.utils import timezone
from django.contrib.auth import get_user_model

User = get_user_model()
from .models import Post, Categoria, Comentario
from .serializers import (
    PostSerializer, PostListSerializer, PostDetailSerializer,
    CategorySerializer, CommentSerializer, PostSearchSerializer
)
from .permissions import IsStaffOrReadOnly, IsAuthorOrReadOnly
from django_blog.api_utils import StandardAPIResponse, BaseAPIView
from django_blog.pagination import StandardPagination, SearchPagination
from django_blog.decorators import api_error_handler, validate_pagination_params, log_api_call
from .filters import PostFilter, CategoryFilter, CommentFilter, AdvancedSearchFilter

# Use the standardized pagination classes
PostPagination = StandardPagination
SearchPostPagination = SearchPagination

class PostListAPIView(BaseAPIView, generics.ListCreateAPIView):
    serializer_class = PostListSerializer
    pagination_class = StandardPagination
    permission_classes = [IsStaffOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_class = PostFilter
    
    # Field mapping for proper filtering and ordering
    field_mapping = {
        'title': 'titulo',
        'content': 'contenido',
        'author': 'autor__username',
        'author_name': 'autor__first_name',
        'author_lastname': 'autor__last_name',
        'category': 'categoria__nombre',
        'category_id': 'categoria__id',
        'published_date': 'fecha_publicacion',
        'created_date': 'fecha_creacion',
        'updated_date': 'fecha_actualizacion',
        'status': 'status',
        'featured': 'featured',
        'comments_count': 'comments_count',
        'meta_title': 'meta_title',
        'meta_description': 'meta_description'
    }
    
    def get_queryset(self):
        """Get queryset with proper ordering and annotations"""
        queryset = Post.objects.filter(status='published').select_related('autor', 'categoria')
        
        # Add annotations for sorting and filtering
        queryset = queryset.annotate(
            comments_count=Count('comentarios', filter=Q(comentarios__approved=True)),
            reading_time=Count('contenido') / 200  # Approximate reading time in minutes
        )
        
        # Apply search if provided
        search_query = self.request.query_params.get('search') or self.request.query_params.get('q')
        if search_query:
            queryset = self._apply_search(queryset, search_query)
        
        # Apply ordering
        ordering = self.request.query_params.get('ordering', '-fecha_publicacion')
        queryset = self._apply_ordering(queryset, ordering, search_query)
        
        return queryset
    
    def _apply_search(self, queryset, search_query):
        """Apply advanced search with relevance scoring"""
        if not search_query:
            return queryset
        
        # Use the AdvancedSearchFilter for relevance-based search
        filters = {
            key: value for key, value in self.request.query_params.items()
            if key not in ['search', 'q', 'page', 'page_size', 'ordering'] and value
        }
        
        searched_queryset, _ = AdvancedSearchFilter.search_posts_with_relevance(
            queryset, search_query, filters
        )
        
        return searched_queryset
    
    def _apply_ordering(self, queryset, ordering, search_query=None):
        """Apply proper ordering with field mapping"""
        # Handle special ordering cases
        if ordering == 'relevance':
            if search_query:
                # Relevance ordering is already applied in search
                return queryset
            else:
                ordering = '-fecha_publicacion'  # Default fallback
        
        # Map ordering field if needed
        ordering_field = ordering.lstrip('-')
        if ordering_field in self.field_mapping:
            mapped_field = self.field_mapping[ordering_field]
            ordering = f"{'-' if ordering.startswith('-') else ''}{mapped_field}"
        
        # Validate ordering field
        valid_fields = [
            'comments_count', 'fecha_publicacion', 'fecha_actualizacion', 
            'titulo', 'autor__username', 'categoria__nombre', 'autor__first_name',
            'autor__last_name', 'status', 'featured', 'reading_time'
        ]
        
        if ordering.lstrip('-') in valid_fields:
            queryset = queryset.order_by(ordering)
        else:
            queryset = queryset.order_by('-fecha_publicacion')  # Default ordering
        
        return queryset
    
    @api_error_handler
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
    queryset = Categoria.objects.all().order_by('nombre')
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
    queryset = Categoria.objects.all()
    serializer_class = CategorySerializer
    lookup_field = 'pk'  # Use primary key instead of slug
    
    def retrieve(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return self.success_response(serializer.data)
        except Categoria.DoesNotExist:
            return self.not_found_response("Category not found")

class CategoryPostsAPIView(BaseAPIView, generics.ListAPIView):
    serializer_class = PostSerializer
    pagination_class = StandardPagination
    
    def get_queryset(self):
        category_id = self.kwargs['pk']
        try:
            # Verify category exists
            Categoria.objects.get(pk=category_id)
            return Post.objects.filter(
                categoria_id=category_id, 
                status='published'
            ).order_by('-fecha_publicacion')
        except Categoria.DoesNotExist:
            return Post.objects.none()
    
    def list(self, request, *args, **kwargs):
        try:
            # Check if category exists
            category_id = self.kwargs['pk']
            Categoria.objects.get(pk=category_id)
            
            queryset = self.get_queryset()
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            
            serializer = self.get_serializer(queryset, many=True)
            return self.success_response(serializer.data)
        except Categoria.DoesNotExist:
            return self.not_found_response("Category not found")

class CommentDetailAPIView(BaseAPIView, generics.RetrieveUpdateDestroyAPIView):
    queryset = Comentario.objects.filter(approved=True)
    serializer_class = CommentSerializer
    permission_classes = [IsAuthorOrReadOnly]
    
    def retrieve(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return self.success_response(serializer.data)
        except Comentario.DoesNotExist:
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
        except Comentario.DoesNotExist:
            return self.not_found_response("Comment not found")
    
    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            instance.delete()
            return self.success_response(message="Comment deleted successfully")
        except Comentario.DoesNotExist:
            return self.not_found_response("Comment not found")

@api_view(['GET'])
def featured_posts(request):
    """Get featured posts"""
    try:
        posts = Post.objects.filter(status='published', featured=True)[:6]
        serializer = PostSerializer(posts, many=True, context={'request': request})
        return StandardAPIResponse.success(serializer.data)
    except Exception as e:
        return StandardAPIResponse.error(f"Error fetching featured posts: {str(e)}")

@api_view(['GET'])
def search_posts(request):
    """Búsqueda avanzada de posts con scoring de relevancia y filtros mejorados"""
    try:
        query = request.GET.get('q', '').strip()
        
        if not query:
            return StandardAPIResponse.error('Parámetro de búsqueda "q" es requerido')
        
        # Validar longitud mínima de query
        if len(query) < 2:
            return StandardAPIResponse.error('La búsqueda debe tener al menos 2 caracteres')
        
        # Obtener filtros adicionales
        filters = {
            key: value for key, value in request.GET.items()
            if key not in ['q', 'page', 'page_size', 'ordering'] and value
        }
        
        # Log de búsqueda para analytics (en producción)
        search_log = {
            'query': query,
            'filters': filters,
            'timestamp': timezone.now(),
            'user_id': request.user.id if request.user.is_authenticated else None,
            'ip_address': request.META.get('REMOTE_ADDR'),
            'user_agent': request.META.get('HTTP_USER_AGENT', '')[:200]
        }
        
        # Realizar búsqueda con relevancia
        base_queryset = Post.objects.filter(status='published').select_related('autor', 'categoria')
        posts, metadata = AdvancedSearchFilter.search_posts_with_relevance(
            base_queryset, query, filters
        )
        
        # Aplicar ordenamiento si se especifica
        ordering = request.GET.get('ordering', 'relevance')
        if ordering != 'relevance':
            # Mapeo de campos de ordenamiento
            field_mapping = {
                'title': 'titulo',
                'date': 'fecha_publicacion',
                'author': 'autor__username',
                'category': 'categoria__nombre',
                'comments': 'comments_count'
            }
            
            ordering_field = ordering.lstrip('-')
            if ordering_field in field_mapping:
                mapped_field = field_mapping[ordering_field]
                ordering = f"{'-' if ordering.startswith('-') else ''}{mapped_field}"
            
            # Anotar conteo de comentarios si es necesario
            if 'comments_count' in ordering:
                posts = posts.annotate(
                    comments_count=Count('comentarios', filter=Q(comentarios__approved=True))
                )
            
            # Aplicar ordenamiento
            valid_fields = ['titulo', 'fecha_publicacion', 'autor__username', 'categoria__nombre', 'comments_count']
            if ordering.lstrip('-') in valid_fields:
                posts = posts.order_by(ordering)
        
        # Agregar información adicional a los metadatos
        metadata.update({
            'has_filters': bool(filters),
            'applied_filters': list(filters.keys()),
            'search_id': f"search_{timezone.now().timestamp()}",
            'user_authenticated': request.user.is_authenticated,
            'ordering': ordering,
            'query_length': len(query),
            'terms_count': len(query.split())
        })
        
        # Paginación
        paginator = StandardPagination()
        page = paginator.paginate_queryset(posts, request)
        
        if page is not None:
            serializer = PostListSerializer(page, many=True, context={'request': request})
            response = paginator.get_paginated_response(serializer.data)
            response.data['search_metadata'] = metadata
            
            # Agregar sugerencias si hay pocos resultados
            if metadata['total_results'] < 5 and len(query) >= 3:
                suggestions = AdvancedSearchFilter.get_search_suggestions(query, 5)
                response.data['suggestions'] = suggestions
            
            # Agregar términos relacionados
            if metadata['total_results'] > 0:
                related_terms = AdvancedSearchFilter.get_related_terms(query, posts[:10])
                response.data['related_terms'] = related_terms
            
            return response
        
        serializer = PostListSerializer(posts, many=True, context={'request': request})
        result_data = {
            'results': serializer.data,
            'search_metadata': metadata
        }
        
        # Agregar sugerencias si hay pocos resultados
        if metadata['total_results'] < 5 and len(query) >= 3:
            suggestions = AdvancedSearchFilter.get_search_suggestions(query, 5)
            result_data['suggestions'] = suggestions
        
        # Agregar términos relacionados
        if metadata['total_results'] > 0:
            related_terms = AdvancedSearchFilter.get_related_terms(query, posts[:10])
            result_data['related_terms'] = related_terms
        
        return StandardAPIResponse.success(result_data)
        
    except Exception as e:
        return StandardAPIResponse.error(f"Error en búsqueda: {str(e)}")


@api_view(['GET'])
def search_suggestions(request):
    """Obtener sugerencias de búsqueda"""
    try:
        query = request.GET.get('q', '').strip()
        limit = int(request.GET.get('limit', 10))
        
        suggestions = AdvancedSearchFilter.get_search_suggestions(query, limit)
        
        return StandardAPIResponse.success({
            'suggestions': suggestions,
            'query': query
        })
        
    except Exception as e:
        return StandardAPIResponse.error(f"Error obteniendo sugerencias: {str(e)}")


@api_view(['GET'])
def popular_searches(request):
    """Obtener búsquedas populares"""
    try:
        limit = int(request.GET.get('limit', 10))
        popular = AdvancedSearchFilter.get_popular_searches(limit)
        
        return StandardAPIResponse.success({
            'popular_searches': popular
        })
        
    except Exception as e:
        return StandardAPIResponse.error(f"Error obteniendo búsquedas populares: {str(e)}")


@api_view(['GET'])
def search_filters(request):
    """Obtener opciones disponibles para filtros"""
    try:
        # Obtener categorías disponibles
        categories = Categoria.objects.annotate(
            posts_count=Count('post', filter=Q(post__status='published'))
        ).filter(posts_count__gt=0).order_by('nombre')
        
        # Obtener autores con posts publicados
        authors = User.objects.annotate(
            posts_count=Count('post', filter=Q(post__status='published'))
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
                {'value': 'categoria__nombre', 'label': 'Categoría (A-Z)'},
                {'value': '-comments_count', 'label': 'Más comentados'},
                {'value': 'comments_count', 'label': 'Menos comentados'},
                {'value': '-fecha_actualizacion', 'label': 'Actualizados recientemente'},
                {'value': 'fecha_actualizacion', 'label': 'Actualizados hace tiempo'},
                {'value': 'relevance', 'label': 'Más relevantes (solo búsqueda)'}
            ]
        }
        
        return StandardAPIResponse.success(filter_options)
        
    except Exception as e:
        return StandardAPIResponse.error(f"Error obteniendo filtros: {str(e)}")


@api_view(['GET'])
def search_stats(request):
    """Obtener estadísticas de búsqueda y contenido"""
    try:
        # Estadísticas generales
        total_posts = Post.objects.filter(status='published').count()
        total_categories = Categoria.objects.count()
        total_authors = User.objects.annotate(
            posts_count=Count('post', filter=Q(post__status='published'))
        ).filter(posts_count__gt=0).count()
        
        # Posts más comentados
        most_commented = Post.objects.filter(status='published').annotate(
            comments_count=Count('comentarios', filter=Q(comentarios__approved=True))
        ).order_by('-comments_count')[:5]
        
        # Categorías más populares
        popular_categories = Categoria.objects.annotate(
            posts_count=Count('post', filter=Q(post__status='published'))
        ).filter(posts_count__gt=0).order_by('-posts_count')[:5]
        
        # Autores más activos
        active_authors = User.objects.annotate(
            posts_count=Count('post', filter=Q(post__status='published'))
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
        
        return StandardAPIResponse.success(stats)
        
    except Exception as e:
        return StandardAPIResponse.error(f"Error obteniendo estadísticas: {str(e)}")


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
        comments = Comentario.objects.filter(post=post, approved=True).order_by('-fecha_creacion')
        
        # Pagination
        paginator = StandardPagination()
        paginator.page_size = 20
        page = paginator.paginate_queryset(comments, request)
        
        if page is not None:
            serializer = CommentSerializer(page, many=True, context={'request': request})
            return paginator.get_paginated_response(serializer.data)
        
        serializer = CommentSerializer(comments, many=True, context={'request': request})
        return StandardAPIResponse.success(serializer.data)
        
    except Post.DoesNotExist:
        return StandardAPIResponse.not_found('Post not found')


@api_view(['GET'])
def get_tags(request):
    """Get all available tags from posts"""
    try:
        # This is a simplified implementation
        # In a real app, you might have a separate Tag model
        from django.db.models import Count
        
        # Get unique categories as tags
        categories = Categoria.objects.annotate(
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
        
        return StandardAPIResponse.success(tags_data)
        
    except Exception as e:
        return StandardAPIResponse.error(f"Error fetching tags: {str(e)}")


@api_view(['GET'])
def get_search_suggestions(request):
    """Get enhanced search suggestions based on query with relevance scoring"""
    try:
        query = request.GET.get('q', '').strip()
        limit = int(request.GET.get('limit', 10))
        
        if not query or len(query) < 2:
            return StandardAPIResponse.success([])
        
        suggestions = AdvancedSearchFilter.get_search_suggestions(query, limit)
        
        return StandardAPIResponse.success({
            'suggestions': suggestions,
            'query': query,
            'total': len(suggestions)
        })
        
    except Exception as e:
        return StandardAPIResponse.error(f"Error fetching suggestions: {str(e)}")


@api_view(['GET'])
def get_related_posts(request, post_id):
    """Get related posts based on category and tags"""
    try:
        # Get the current post
        current_post = Post.objects.get(id=post_id, status='published')
        
        # Find related posts by category
        related_posts = Post.objects.filter(
            categoria=current_post.categoria,
            status='published'
        ).exclude(id=post_id).select_related('autor', 'categoria')
        
        # If we don't have enough related posts, add posts from same author
        if related_posts.count() < 5:
            author_posts = Post.objects.filter(
                autor=current_post.autor,
                status='published'
            ).exclude(id=post_id).select_related('autor', 'categoria')
            
            # Combine and remove duplicates
            related_posts = (related_posts | author_posts).distinct()
        
        # Limit to 6 posts and order by publication date
        related_posts = related_posts.order_by('-fecha_publicacion')[:6]
        
        serializer = PostListSerializer(related_posts, many=True, context={'request': request})
        
        return StandardAPIResponse.success({
            'related_posts': serializer.data,
            'total': len(serializer.data),
            'current_post_id': post_id
        })
        
    except Post.DoesNotExist:
        return StandardAPIResponse.not_found('Post not found')
    except Exception as e:
        return StandardAPIResponse.error(f"Error fetching related posts: {str(e)}")


@api_view(['GET'])
def get_trending_posts(request):
    """Get trending posts based on recent activity"""
    try:
        # Get posts from the last 30 days with most comments
        from datetime import timedelta
        thirty_days_ago = timezone.now() - timedelta(days=30)
        
        trending_posts = Post.objects.filter(
            status='published',
            fecha_publicacion__gte=thirty_days_ago
        ).annotate(
            comments_count=Count('comentarios', filter=Q(comentarios__approved=True)),
            recent_comments=Count('comentarios', filter=Q(
                comentarios__approved=True,
                comentarios__fecha_creacion__gte=thirty_days_ago
            ))
        ).order_by('-recent_comments', '-comments_count', '-fecha_publicacion')[:10]
        
        serializer = PostListSerializer(trending_posts, many=True, context={'request': request})
        
        return StandardAPIResponse.success({
            'trending_posts': serializer.data,
            'total': len(serializer.data),
            'period': '30 days'
        })
        
    except Exception as e:
        return StandardAPIResponse.error(f"Error fetching trending posts: {str(e)}")


@api_view(['GET'])
def get_archive_data(request):
    """Get archive data for posts by year and month"""
    try:
        from django.db.models import Count
        from django.db.models.functions import TruncMonth, TruncYear
        
        # Get posts grouped by year and month
        archive_data = Post.objects.filter(
            status='published',
            fecha_publicacion__isnull=False
        ).annotate(
            year=TruncYear('fecha_publicacion'),
            month=TruncMonth('fecha_publicacion')
        ).values('year', 'month').annotate(
            posts_count=Count('id')
        ).order_by('-year', '-month')
        
        # Format the data
        formatted_archive = []
        current_year = None
        year_data = None
        
        for item in archive_data:
            year = item['year'].year
            month = item['month']
            count = item['posts_count']
            
            if year != current_year:
                if year_data:
                    formatted_archive.append(year_data)
                
                current_year = year
                year_data = {
                    'year': year,
                    'total_posts': 0,
                    'months': []
                }
            
            year_data['total_posts'] += count
            year_data['months'].append({
                'month': month.month,
                'month_name': month.strftime('%B'),
                'posts_count': count,
                'date': month.isoformat()
            })
        
        if year_data:
            formatted_archive.append(year_data)
        
        return StandardAPIResponse.success({
            'archive': formatted_archive,
            'total_years': len(formatted_archive)
        })
        
    except Exception as e:
        return StandardAPIResponse.error(f"Error fetching archive data: {str(e)}")


@api_view(['GET'])
def get_post_by_slug(request, slug):
    """Get post by slug (extracted from slug format: id-title)"""
    try:
        # Extract ID from slug (format: id-title)
        try:
            post_id = int(slug.split('-')[0])
        except (ValueError, IndexError):
            return StandardAPIResponse.not_found('Invalid post slug format')
        
        post = Post.objects.select_related('autor', 'categoria').prefetch_related(
            'comentarios__usuario'
        ).get(id=post_id, status='published')
        
        serializer = PostDetailSerializer(post, context={'request': request})
        
        return StandardAPIResponse.success(serializer.data)
        
    except Post.DoesNotExist:
        return StandardAPIResponse.not_found('Post not found')
    except Exception as e:
        return StandardAPIResponse.error(f"Error fetching post: {str(e)}")


@api_view(['GET'])
def get_category_by_slug(request, slug):
    """Get category by slug (extracted from slug format: id-name)"""
    try:
        # Extract ID from slug (format: id-name)
        try:
            category_id = int(slug.split('-')[0])
        except (ValueError, IndexError):
            return StandardAPIResponse.not_found('Invalid category slug format')
        
        category = Categoria.objects.get(id=category_id)
        
        # Get posts in this category
        posts = Post.objects.filter(
            categoria=category,
            status='published'
        ).select_related('autor', 'categoria').order_by('-fecha_publicacion')
        
        # Pagination
        paginator = StandardPagination()
        page = paginator.paginate_queryset(posts, request)
        
        category_serializer = CategorySerializer(category, context={'request': request})
        
        if page is not None:
            posts_serializer = PostListSerializer(page, many=True, context={'request': request})
            response = paginator.get_paginated_response(posts_serializer.data)
            response.data['category'] = category_serializer.data
            return response
        
        posts_serializer = PostListSerializer(posts, many=True, context={'request': request})
        
        return StandardAPIResponse.success({
            'category': category_serializer.data,
            'posts': posts_serializer.data,
            'total_posts': posts.count()
        })
        
    except Categoria.DoesNotExist:
        return StandardAPIResponse.not_found('Category not found')
    except Exception as e:
        return StandardAPIResponse.error(f"Error fetching category: {str(e)}")