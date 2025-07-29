from django.urls import path
from . import api_views
from .views_admin import tinymce_upload

app_name = 'posts'

urlpatterns = [
    # API Endpoints
    path('', api_views.PostListAPIView.as_view(), name='post_list'),
    path('posts/', api_views.PostListAPIView.as_view(), name='post_list_alt'),
    
    # Specific endpoints first (to avoid conflicts)
    path('posts/featured/', api_views.featured_posts, name='featured_posts'),
    path('posts/search/', api_views.search_posts, name='search_posts'),
    path('posts/<int:post_id>/comments/', api_views.post_comments, name='post_comments'),
    
    # Generic detail endpoint last
    path('posts/<int:pk>/', api_views.PostDetailAPIView.as_view(), name='post_detail'),
    
    # Categories
    path('categories/', api_views.CategoryListAPIView.as_view(), name='category_list'),
    path('categories/<int:pk>/', api_views.CategoryDetailAPIView.as_view(), name='category_detail'),
    
    # Admin utilities
    path('tinymce/upload/', tinymce_upload, name='tinymce_upload'),
]