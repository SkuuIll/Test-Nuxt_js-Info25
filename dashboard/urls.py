from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DashboardTokenObtainPairView,
    DashboardTokenRefreshView,
    DashboardLogoutView,
    DashboardUserProfileView,
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
    DashboardCommentViewSet
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
    
    # API endpoints (se agregarán en tareas posteriores)
    path('api/', include(router.urls)),
]