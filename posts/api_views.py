from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from .models import Post, Category, Comment
from .serializers import PostSerializer, CategorySerializer, CommentSerializer
from .permissions import IsStaffOrReadOnly, IsAuthorOrReadOnly

class PostPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 100

class PostListAPIView(generics.ListCreateAPIView):
    queryset = Post.objects.filter(status='published').order_by('-fecha_publicacion')
    serializer_class = PostSerializer
    pagination_class = PostPagination
    permission_classes = [IsStaffOrReadOnly]
    
    def perform_create(self, serializer):
        serializer.save(autor=self.request.user)
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(categoria__nombre__icontains=category)
        
        # Filter by search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(titulo__icontains=search) |
                Q(contenido__icontains=search)
            )
        
        # Filter by author
        author = self.request.query_params.get('author')
        if author:
            queryset = queryset.filter(autor__username=author)
        
        # Ordering
        ordering = self.request.query_params.get('ordering', '-fecha_publicacion')
        if ordering:
            # Map API field names to model field names
            field_mapping = {
                '-published_at': '-fecha_publicacion',
                'published_at': 'fecha_publicacion',
                '-title': '-titulo',
                'title': 'titulo',
            }
            ordering = field_mapping.get(ordering, ordering)
            queryset = queryset.order_by(ordering)
        
        return queryset

class PostDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Post.objects.filter(status='published')
    serializer_class = PostSerializer
    lookup_field = 'pk'  # Use primary key instead of slug
    permission_classes = [IsAuthorOrReadOnly]

class CategoryListAPIView(generics.ListAPIView):
    queryset = Category.objects.all().order_by('nombre')
    serializer_class = CategorySerializer

class CategoryDetailAPIView(generics.RetrieveAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = 'pk'  # Use primary key instead of slug

@api_view(['GET'])
def featured_posts(request):
    """Get featured posts"""
    posts = Post.objects.filter(status='published', featured=True)[:6]
    serializer = PostSerializer(posts, many=True, context={'request': request})
    return Response(serializer.data)

@api_view(['GET'])
def search_posts(request):
    """Search posts with advanced filtering"""
    query = request.GET.get('q', '')
    category = request.GET.get('category', '')
    
    posts = Post.objects.filter(status='published')
    
    if query:
        posts = posts.filter(
            Q(titulo__icontains=query) |
            Q(contenido__icontains=query)
        )
    
    if category:
        posts = posts.filter(categoria__nombre__icontains=category)
    
    posts = posts.order_by('-fecha_publicacion')
    
    # Pagination
    paginator = PostPagination()
    page = paginator.paginate_queryset(posts, request)
    
    if page is not None:
        serializer = PostSerializer(page, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)
    
    serializer = PostSerializer(posts, many=True, context={'request': request})
    return Response(serializer.data)

@api_view(['GET'])
def post_comments(request, post_id):
    """Get comments for a post"""
    try:
        post = Post.objects.get(id=post_id, status='published')
        comments = Comment.objects.filter(post=post, approved=True).order_by('-fecha_creacion')
        
        # Pagination
        paginator = PageNumberPagination()
        paginator.page_size = 20
        page = paginator.paginate_queryset(comments, request)
        
        if page is not None:
            serializer = CommentSerializer(page, many=True, context={'request': request})
            return paginator.get_paginated_response(serializer.data)
        
        serializer = CommentSerializer(comments, many=True, context={'request': request})
        return Response(serializer.data)
        
    except Post.DoesNotExist:
        return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)