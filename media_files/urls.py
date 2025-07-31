from django.urls import path
from . import views

app_name = 'media_files'

# API URLs
urlpatterns = [
    # File upload
    path('upload/', views.MediaFileUploadView.as_view(), name='upload'),
    
    # File management
    path('files/', views.MediaFileListView.as_view(), name='file-list'),
    path('files/<int:pk>/', views.MediaFileDetailView.as_view(), name='file-detail'),
    
    # Statistics
    path('stats/', views.media_stats, name='stats'),
]