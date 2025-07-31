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
    DashboardCommentViewSet
)
from .auth_views import (
    DashboardTokenValidateView,
    DashboardPermissionUpdateView,
    DashboardHealthCheckView,
    dashboard_user_list,
    revoke_dashboard_access
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
    path('auth/validate-token/', DashboardTokenValidateView.as_view(), name='validate_token'),
    path('auth/update-permissions/', DashboardPermissionUpdateView.as_view(), name='update_permissions'),
    path('auth/dashboard-users/', dashboard_user_list, name='dashboard_users'),
    path('auth/revoke-access/', revoke_dashboard_access, name='revoke_access'),
    path('auth/health/', DashboardHealthCheckView.as_view(), name='health_check'),
    
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
    
    # API endpoints para gestión
    path('api/', include(router.urls)),
]