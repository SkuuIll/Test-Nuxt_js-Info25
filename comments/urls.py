from django.urls import path
from . import views

app_name = 'comments'

urlpatterns = [
    # Comments endpoints
    path('', views.CommentListAPIView.as_view(), name='comment_list'),
    path('<int:pk>/', views.CommentDetailAPIView.as_view(), name='comment_detail'),
    path('post/<int:post_id>/', views.PostCommentsAPIView.as_view(), name='post_comments'),
]
