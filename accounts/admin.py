from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import (
    User, UserProfile, Role, Permission, RolePermission, 
    UserRole, SecurityAuditLog, PasswordResetToken
)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Extended User admin"""
    list_display = [
        'username', 'email', 'is_email_verified', 'is_active', 
        'is_staff', 'failed_login_attempts', 'locked_until', 'date_joined'
    ]
    list_filter = [
        'is_email_verified', 'is_active', 'is_staff', 'is_superuser',
        'date_joined', 'last_login'
    ]
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering = ['-date_joined']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Email Verification', {
            'fields': ('is_email_verified', 'email_verification_token', 'email_verification_sent_at')
        }),
        ('Security', {
            'fields': ('failed_login_attempts', 'locked_until', 'last_password_change')
        }),
    )
    
    readonly_fields = ['email_verification_token', 'email_verification_sent_at', 'last_password_change']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('profile')
    
    actions = ['verify_email', 'unlock_accounts', 'reset_failed_attempts']
    
    def verify_email(self, request, queryset):
        """Admin action to verify user emails"""
        count = queryset.update(is_email_verified=True)
        self.message_user(request, f'{count} users had their email verified.')
    verify_email.short_description = "Verify selected users' emails"
    
    def unlock_accounts(self, request, queryset):
        """Admin action to unlock user accounts"""
        count = 0
        for user in queryset:
            if user.is_account_locked():
                user.unlock_account()
                count += 1
        self.message_user(request, f'{count} accounts were unlocked.')
    unlock_accounts.short_description = "Unlock selected accounts"
    
    def reset_failed_attempts(self, request, queryset):
        """Admin action to reset failed login attempts"""
        count = queryset.update(failed_login_attempts=0)
        self.message_user(request, f'Failed login attempts reset for {count} users.')
    reset_failed_attempts.short_description = "Reset failed login attempts"


class UserProfileInline(admin.StackedInline):
    """Inline admin for UserProfile"""
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'
    fields = [
        'avatar', 'bio', 'location', 'website', 'birth_date',
        'show_email', 'show_location', 'show_birth_date', 'allow_follow'
    ]


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """UserProfile admin"""
    list_display = ['user', 'location', 'show_email', 'show_location', 'allow_follow', 'created_at']
    list_filter = ['show_email', 'show_location', 'show_birth_date', 'allow_follow', 'created_at']
    search_fields = ['user__username', 'user__email', 'location', 'bio']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = [
        ('User', {
            'fields': ['user']
        }),
        ('Profile Information', {
            'fields': ['avatar', 'bio', 'location', 'website', 'birth_date']
        }),
        ('Privacy Settings', {
            'fields': ['show_email', 'show_location', 'show_birth_date', 'allow_follow']
        }),
        ('Timestamps', {
            'fields': ['created_at', 'updated_at'],
            'classes': ['collapse']
        })
    ]
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')


class RolePermissionInline(admin.TabularInline):
    """Inline admin for RolePermission"""
    model = RolePermission
    extra = 0
    fields = ['permission', 'granted']
    autocomplete_fields = ['permission']


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    """Role admin"""
    list_display = ['name', 'description', 'is_active', 'permission_count', 'user_count', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    inlines = [RolePermissionInline]
    
    def permission_count(self, obj):
        """Count of permissions for this role"""
        return obj.permissions.filter(granted=True).count()
    permission_count.short_description = 'Permissions'
    
    def user_count(self, obj):
        """Count of users with this role"""
        return obj.user_assignments.filter(is_active=True).count()
    user_count.short_description = 'Users'


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    """Permission admin"""
    list_display = ['name', 'codename', 'category', 'role_count']
    list_filter = ['category']
    search_fields = ['name', 'codename', 'description']
    ordering = ['category', 'name']
    
    def role_count(self, obj):
        """Count of roles with this permission"""
        return obj.roles.filter(granted=True).count()
    role_count.short_description = 'Roles'


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    """UserRole admin"""
    list_display = ['user', 'role', 'is_active', 'assigned_by', 'assigned_at']
    list_filter = ['is_active', 'role', 'assigned_at']
    search_fields = ['user__username', 'user__email', 'role__name']
    autocomplete_fields = ['user', 'role', 'assigned_by']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'role', 'assigned_by')


@admin.register(SecurityAuditLog)
class SecurityAuditLogAdmin(admin.ModelAdmin):
    """SecurityAuditLog admin"""
    list_display = ['user', 'action', 'success', 'ip_address', 'timestamp']
    list_filter = ['action', 'success', 'timestamp']
    search_fields = ['user__username', 'user__email', 'ip_address', 'user_agent']
    readonly_fields = ['user', 'action', 'ip_address', 'user_agent', 'success', 'details', 'timestamp']
    date_hierarchy = 'timestamp'
    
    def has_add_permission(self, request):
        """Disable adding audit logs manually"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Disable editing audit logs"""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Only superusers can delete audit logs"""
        return request.user.is_superuser
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')


@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    """PasswordResetToken admin"""
    list_display = ['user', 'is_used', 'created_at', 'used_at', 'is_valid_display']
    list_filter = ['is_used', 'created_at']
    search_fields = ['user__username', 'user__email', 'token']
    readonly_fields = ['user', 'token', 'created_at', 'used_at', 'is_used']
    
    def is_valid_display(self, obj):
        """Display if token is valid"""
        if obj.is_valid():
            return format_html('<span style="color: green;">✓ Valid</span>')
        else:
            return format_html('<span style="color: red;">✗ Invalid</span>')
    is_valid_display.short_description = 'Valid'
    
    def has_add_permission(self, request):
        """Disable adding tokens manually"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Disable editing tokens"""
        return False
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')


# Add UserProfile inline to User admin
UserAdmin.inlines = [UserProfileInline]