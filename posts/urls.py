from django.urls import path
from . import api_views
from .views_admin import tinymce_upload

app_name = 'posts'

urlpatterns = [
    # Posts endpoints - specific endpoints first to avoid conflicts
    path('posts/featured/', api_views.featured_posts, name='featured_posts'),
    path('posts/search/', api_views.search_posts, name='search_posts'),
    path('posts/<int:post_id>/comments/', api_views.post_comments, name='post_comments'),
    path('posts/<int:pk>/', api_views.PostDetailAPIView.as_view(), name='post_detail'),
    path('posts/', api_views.PostListAPIView.as_view(), name='post_list'),
    
    # Search and tags endpoints
    path('tags/', api_views.get_tags, name='get_tags'),
    path('search/suggestions/', api_views.get_search_suggestions, name='search_suggestions'),
    
    # Categories endpoints
    path('categories/<int:pk>/posts/', api_views.CategoryPostsAPIView.as_view(), name='category_posts'),
    path('categories/<int:pk>/', api_views.CategoryDetailAPIView.as_view(), name='category_detail'),
    path('categories/', api_views.CategoryListAPIView.as_view(), name='category_list'),
    
    # Comments endpoints
    path('comments/<int:pk>/', api_views.CommentDetailAPIView.as_view(), name='comment_detail'),
    
    # Admin utilities
    path('tinymce/upload/', tinymce_upload, name='tinymce_upload'),
    
    # Root endpoint redirects to posts
    path('', api_views.PostListAPIView.as_view(), name='api_root'),
]