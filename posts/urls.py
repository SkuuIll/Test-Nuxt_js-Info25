from django.urls import path
from . import api_views
from .views_admin import tinymce_upload
from .media_views import MediaUploadView, api_upload_media, tinymce_upload_improved

app_name = 'posts'

urlpatterns = [
    # Posts endpoints - specific endpoints first to avoid conflicts
    path('posts/featured/', api_views.featured_posts, name='featured_posts'),
    path('posts/search/', api_views.search_posts, name='search_posts'),
    path('posts/<int:post_id>/comments/', api_views.post_comments, name='post_comments'),
    path('posts/<str:pk>/', api_views.PostDetailAPIView.as_view(), name='post_detail'),
    path('posts/', api_views.PostListAPIView.as_view(), name='post_list'),
    
    # Search and tags endpoints
    path('search/advanced/', api_views.AdvancedSearchAPIView.as_view(), name='advanced_search'),
    path('search/suggestions/', api_views.get_search_suggestions, name='search_suggestions'),
    path('search/popular/', api_views.popular_searches, name='popular_searches'),
    path('search/filters/', api_views.search_filters, name='search_filters'),
    path('search/stats/', api_views.search_stats, name='search_stats'),
    path('tags/', api_views.get_tags, name='get_tags'),
    
    # Additional content endpoints
    path('posts/<int:post_id>/related/', api_views.get_related_posts, name='related_posts'),
    path('posts/trending/', api_views.get_trending_posts, name='trending_posts'),
    path('archive/', api_views.get_archive_data, name='archive_data'),
    
    # Categories endpoints - support both ID and slug
    path('categories/<str:pk>/posts/', api_views.CategoryPostsAPIView.as_view(), name='category_posts'),
    path('categories/<int:pk>/', api_views.CategoryDetailAPIView.as_view(), name='category_detail'),
    path('categories/', api_views.CategoryListAPIView.as_view(), name='category_list'),
    
    # Authors endpoints
    path('authors/<str:author_id>/posts/', api_views.AuthorPostsAPIView.as_view(), name='author_posts'),
    
    # Comments endpoints
    path('comments/<int:pk>/', api_views.CommentDetailAPIView.as_view(), name='comment_detail'),
    
    # Media upload endpoints
    path('media/upload/', MediaUploadView.as_view(), name='media_upload'),
    path('api/media/upload/', api_upload_media, name='api_media_upload'),
    
    # Admin utilities
    path('tinymce/upload/', tinymce_upload_improved, name='tinymce_upload'),
    path('tinymce/upload/legacy/', tinymce_upload, name='tinymce_upload_legacy'),
    
    # Root endpoint redirects to posts
    path('', api_views.PostListAPIView.as_view(), name='api_root'),
]