from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from .models import Post, Category, Comment
from .serializers import PostSerializer, CategorySerializer, CommentSerializer
from .permissions import IsStaffOrReadOnly, IsAuthorOrReadOnly
from .api_utils import StandardResponse, StandardPagination, BaseAPIView

# Use the standardized pagination class
PostPagination = StandardPagination

class PostListAPIView(BaseAPIView, generics.ListCreateAPIView):
    queryset = Post.objects.filter(status='published').order_by('-fecha_publicacion')
    serializer_class = PostSerializer
    pagination_class = PostPagination
    permission_classes = [IsStaffOrReadOnly]
    
    def perform_create(self, serializer):
        serializer.save(autor=self.request.user)
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            return self.success_response(
                data=serializer.data,
                message="Post created successfully",
                status_code=status.HTTP_201_CREATED
            )
        return self.validation_error_response(serializer.errors)
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by category (support both ID and name)
        category = self.request.query_params.get('category')
        if category:
            if category.isdigit():
                queryset = queryset.filter(categoria_id=category)
            else:
                queryset = queryset.filter(categoria__nombre__icontains=category)
        
        # Filter by category ID specifically
        category_id = self.request.query_params.get('category_id')
        if category_id:
            queryset = queryset.filter(categoria_id=category_id)
        
        # Filter by search (improved search across multiple fields)
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(titulo__icontains=search) |
                Q(contenido__icontains=search) |
                Q(excerpt__icontains=search) |
                Q(categoria__nombre__icontains=search) |
                Q(autor__username__icontains=search) |
                Q(autor__first_name__icontains=search) |
                Q(autor__last_name__icontains=search)
            )
        
        # Filter by author (support both username and ID)
        author = self.request.query_params.get('author')
        if author:
            if author.isdigit():
                queryset = queryset.filter(autor_id=author)
            else:
                queryset = queryset.filter(autor__username__icontains=author)
        
        # Filter by author ID specifically
        author_id = self.request.query_params.get('author_id')
        if author_id:
            queryset = queryset.filter(autor_id=author_id)
        
        # Filter by featured status
        featured = self.request.query_params.get('featured')
        if featured is not None:
            featured_bool = featured.lower() in ['true', '1', 'yes']
            queryset = queryset.filter(featured=featured_bool)
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        if date_from:
            try:
                from django.utils.dateparse import parse_date
                date_obj = parse_date(date_from)
                if date_obj:
                    queryset = queryset.filter(fecha_publicacion__gte=date_obj)
            except ValueError:
                pass
        
        date_to = self.request.query_params.get('date_to')
        if date_to:
            try:
                from django.utils.dateparse import parse_date
                date_obj = parse_date(date_to)
                if date_obj:
                    queryset = queryset.filter(fecha_publicacion__lte=date_obj)
            except ValueError:
                pass
        
        # Ordering with improved field mapping
        ordering = self.request.query_params.get('ordering', '-fecha_publicacion')
        if ordering:
            # Map API field names to model field names
            field_mapping = {
                '-published_at': '-fecha_publicacion',
                'published_at': 'fecha_publicacion',
                '-created_at': '-fecha_creacion',
                'created_at': 'fecha_creacion',
                '-updated_at': '-fecha_actualizacion',
                'updated_at': 'fecha_actualizacion',
                '-title': '-titulo',
                'title': 'titulo',
                '-author': '-autor__username',
                'author': 'autor__username',
                '-category': '-categoria__nombre',
                'category': 'categoria__nombre',
                'featured': 'featured',
                '-featured': '-featured'
            }
            ordering = field_mapping.get(ordering, ordering)
            
            # Validate ordering field exists
            valid_fields = [
                'fecha_publicacion', '-fecha_publicacion',
                'fecha_creacion', '-fecha_creacion',
                'fecha_actualizacion', '-fecha_actualizacion',
                'titulo', '-titulo',
                'autor__username', '-autor__username',
                'categoria__nombre', '-categoria__nombre',
                'featured', '-featured'
            ]
            
            if ordering in valid_fields:
                queryset = queryset.order_by(ordering)
            else:
                queryset = queryset.order_by('-fecha_publicacion')
        
        return queryset

class PostDetailAPIView(BaseAPIView, generics.RetrieveUpdateDestroyAPIView):
    queryset = Post.objects.filter(status='published')
    serializer_class = PostSerializer
    lookup_field = 'pk'  # Use primary key instead of slug
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
    """Search posts with advanced filtering"""
    try:
        query = request.GET.get('q', '').strip()
        category = request.GET.get('category', '').strip()
        author = request.GET.get('author', '').strip()
        featured = request.GET.get('featured', '').strip()
        date_from = request.GET.get('date_from', '').strip()
        date_to = request.GET.get('date_to', '').strip()
        ordering = request.GET.get('ordering', '-fecha_publicacion')
        
        # Start with published posts
        posts = Post.objects.filter(status='published').select_related('autor', 'categoria')
        
        # Apply search query
        if query:
            posts = posts.filter(
                Q(titulo__icontains=query) |
                Q(contenido__icontains=query) |
                Q(excerpt__icontains=query) |
                Q(categoria__nombre__icontains=query) |
                Q(autor__username__icontains=query) |
                Q(autor__first_name__icontains=query) |
                Q(autor__last_name__icontains=query)
            )
        
        # Apply category filter
        if category:
            if category.isdigit():
                posts = posts.filter(categoria_id=category)
            else:
                posts = posts.filter(categoria__nombre__icontains=category)
        
        # Apply author filter
        if author:
            if author.isdigit():
                posts = posts.filter(autor_id=author)
            else:
                posts = posts.filter(autor__username__icontains=author)
        
        # Apply featured filter
        if featured:
            featured_bool = featured.lower() in ['true', '1', 'yes']
            posts = posts.filter(featured=featured_bool)
        
        # Apply date filters
        if date_from:
            try:
                from django.utils.dateparse import parse_date
                date_obj = parse_date(date_from)
                if date_obj:
                    posts = posts.filter(fecha_publicacion__gte=date_obj)
            except ValueError:
                pass
        
        if date_to:
            try:
                from django.utils.dateparse import parse_date
                date_obj = parse_date(date_to)
                if date_obj:
                    posts = posts.filter(fecha_publicacion__lte=date_obj)
            except ValueError:
                pass
        
        # Apply ordering
        field_mapping = {
            '-published_at': '-fecha_publicacion',
            'published_at': 'fecha_publicacion',
            '-created_at': '-fecha_creacion',
            'created_at': 'fecha_creacion',
            '-title': '-titulo',
            'title': 'titulo',
            '-author': '-autor__username',
            'author': 'autor__username',
            '-category': '-categoria__nombre',
            'category': 'categoria__nombre',
            'relevance': '-fecha_publicacion'  # Default for relevance
        }
        
        ordering = field_mapping.get(ordering, ordering)
        posts = posts.order_by(ordering)
        
        # Add search metadata
        search_metadata = {
            'query': query,
            'filters': {
                'category': category,
                'author': author,
                'featured': featured,
                'date_from': date_from,
                'date_to': date_to
            },
            'total_results': posts.count()
        }
        
        # Pagination
        paginator = StandardPagination()
        page = paginator.paginate_queryset(posts, request)
        
        if page is not None:
            serializer = PostSerializer(page, many=True, context={'request': request})
            response_data = paginator.get_paginated_response(serializer.data)
            # Add search metadata to response
            response_data.data['search_metadata'] = search_metadata
            return response_data
        
        serializer = PostSerializer(posts, many=True, context={'request': request})
        return StandardResponse.success({
            'results': serializer.data,
            'search_metadata': search_metadata
        })
        
    except Exception as e:
        return StandardResponse.error(f"Error searching posts: {str(e)}")

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