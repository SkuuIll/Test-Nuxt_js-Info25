from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DashboardTokenObtainPairView,
    DashboardTokenRefreshView,
    DashboardLogoutView,
    DashboardUserProfileView,
    DashboardChangePasswordView,
    DashboardSessionInfoView,
    check_dashboard_permission,
    DashboardStatsView,
    PopularPostsView,
    RecentActivityView,
    MonthlyStatsView,
    UserStatsView,
    ContentStatsView,
    dashboard_summary,
    GrowthStatsView,
    TopPerformingContentView,
    DashboardPostViewSet,
    DashboardCategoryViewSet,
    DashboardUserViewSet,
    DashboardCommentViewSet,
    get_posts_statistics,
    get_post_engagement_stats,
    duplicate_post,
    get_post_performance_metrics,
    get_comments_statistics,
    get_moderation_queue,
    get_comment_engagement_metrics,
    auto_moderate_comments,
    bulk_moderate_comments,
    detect_spam_comments
)

app_name = 'dashboard'

# Router para ViewSets
router = DefaultRouter()
router.register(r'posts', DashboardPostViewSet, basename='posts')
router.register(r'categories', DashboardCategoryViewSet, basename='categories')
router.register(r'users', DashboardUserViewSet, basename='users')
router.register(r'comments', DashboardCommentViewSet, basename='comments')

urlpatterns = [
    # Autenticación
    path('auth/login/', DashboardTokenObtainPairView.as_view(), name='login'),
    path('auth/refresh/', DashboardTokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', DashboardLogoutView.as_view(), name='logout'),
    path('auth/profile/', DashboardUserProfileView.as_view(), name='profile'),
    path('auth/change-password/', DashboardChangePasswordView.as_view(), name='change_password'),
    path('auth/session-info/', DashboardSessionInfoView.as_view(), name='session_info'),
    path('auth/check-permission/', check_dashboard_permission, name='check_permission'),
    
    # Estadísticas
    path('stats/', DashboardStatsView.as_view(), name='stats'),
    path('stats/summary/', dashboard_summary, name='stats_summary'),
    path('stats/popular-posts/', PopularPostsView.as_view(), name='popular_posts'),
    path('stats/recent-activity/', RecentActivityView.as_view(), name='recent_activity'),
    path('stats/monthly/', MonthlyStatsView.as_view(), name='monthly_stats'),
    path('stats/users/', UserStatsView.as_view(), name='user_stats'),
    path('stats/content/', ContentStatsView.as_view(), name='content_stats'),
    path('stats/growth/', GrowthStatsView.as_view(), name='growth_stats'),
    path('stats/top-content/', TopPerformingContentView.as_view(), name='top_content'),
    
    # API endpoints para gestión
    path('api/', include(router.urls)),
    
    # Posts management endpoints
    path('posts/stats/', get_posts_statistics, name='posts_stats'),
    path('posts/<int:post_id>/engagement/', get_post_engagement_stats, name='post_engagement'),
    path('posts/<int:post_id>/duplicate/', duplicate_post, name='duplicate_post'),
    path('posts/performance/', get_post_performance_metrics, name='posts_performance'),
    
    # Comments management endpoints
    path('comments/stats/', get_comments_statistics, name='comments_stats'),
    path('comments/moderation-queue/', get_moderation_queue, name='moderation_queue'),
    path('comments/engagement/', get_comment_engagement_metrics, name='comments_engagement'),
    path('comments/auto-moderate/', auto_moderate_comments, name='auto_moderate'),
    path('comments/bulk-moderate/', bulk_moderate_comments, name='bulk_moderate'),
    path('comments/detect-spam/', detect_spam_comments, name='detect_spam'),
]