from django.core.management.base import BaseCommand
from accounts.models import Permission, Role, RolePermission


class Command(BaseCommand):
    help = 'Setup initial permissions and roles'
    
    def handle(self, *args, **options):
        self.stdout.write('Setting up initial permissions and roles...')
        
        # Create basic permissions
        permissions_data = [
            # Posts permissions
            ('posts.view_post', 'View Posts', 'posts', 'Can view published posts'),
            ('posts.add_post', 'Add Posts', 'posts', 'Can create new posts'),
            ('posts.change_post', 'Edit Posts', 'posts', 'Can edit existing posts'),
            ('posts.delete_post', 'Delete Posts', 'posts', 'Can delete posts'),
            ('posts.publish_post', 'Publish Posts', 'posts', 'Can publish/unpublish posts'),
            
            # Comments permissions
            ('comments.view_comment', 'View Comments', 'comments', 'Can view comments'),
            ('comments.add_comment', 'Add Comments', 'comments', 'Can create comments'),
            ('comments.change_comment', 'Edit Comments', 'comments', 'Can edit comments'),
            ('comments.delete_comment', 'Delete Comments', 'comments', 'Can delete comments'),
            ('comments.approve_comment', 'Approve Comments', 'comments', 'Can approve/disapprove comments'),
            
            # User management permissions
            ('users.view_user', 'View Users', 'users', 'Can view user profiles'),
            ('users.change_user', 'Edit Users', 'users', 'Can edit user profiles'),
            ('users.delete_user', 'Delete Users', 'users', 'Can delete users'),
            ('users.manage_roles', 'Manage User Roles', 'users', 'Can assign/remove user roles'),
            
            # Dashboard permissions
            ('dashboard.view_dashboard', 'View Dashboard', 'dashboard', 'Can access dashboard'),
            ('dashboard.view_stats', 'View Statistics', 'dashboard', 'Can view system statistics'),
            ('dashboard.manage_content', 'Manage Content', 'dashboard', 'Can manage all content'),
            
            # Admin permissions
            ('admin.full_access', 'Full Admin Access', 'admin', 'Full administrative access'),
            ('admin.system_settings', 'System Settings', 'admin', 'Can modify system settings'),
            
            # Content permissions
            ('content.moderate', 'Moderate Content', 'content', 'Can moderate user-generated content'),
            ('content.feature', 'Feature Content', 'content', 'Can feature/unfeature content'),
        ]
        
        created_permissions = []
        for codename, name, category, description in permissions_data:
            permission, created = Permission.objects.get_or_create(
                codename=codename,
                defaults={
                    'name': name,
                    'category': category,
                    'description': description
                }
            )
            if created:
                created_permissions.append(permission)
                self.stdout.write(f'  Created permission: {name}')
        
        # Create basic roles
        roles_data = [
            ('Admin', 'Full system administrator', [
                'admin.full_access', 'admin.system_settings', 'dashboard.view_dashboard',
                'dashboard.view_stats', 'dashboard.manage_content', 'posts.view_post',
                'posts.add_post', 'posts.change_post', 'posts.delete_post', 'posts.publish_post',
                'comments.view_comment', 'comments.add_comment', 'comments.change_comment',
                'comments.delete_comment', 'comments.approve_comment', 'users.view_user',
                'users.change_user', 'users.delete_user', 'users.manage_roles',
                'content.moderate', 'content.feature'
            ]),
            ('Editor', 'Content editor and moderator', [
                'dashboard.view_dashboard', 'dashboard.view_stats', 'posts.view_post',
                'posts.add_post', 'posts.change_post', 'posts.publish_post',
                'comments.view_comment', 'comments.approve_comment', 'content.moderate',
                'content.feature'
            ]),
            ('Author', 'Content author', [
                'posts.view_post', 'posts.add_post', 'posts.change_post',
                'comments.view_comment', 'comments.add_comment'
            ]),
            ('Moderator', 'Comment and content moderator', [
                'comments.view_comment', 'comments.approve_comment', 'comments.change_comment',
                'comments.delete_comment', 'content.moderate', 'users.view_user'
            ]),
            ('User', 'Regular user', [
                'posts.view_post', 'comments.view_comment', 'comments.add_comment'
            ])
        ]
        
        created_roles = []
        for role_name, description, permission_codenames in roles_data:
            role, created = Role.objects.get_or_create(
                name=role_name,
                defaults={'description': description}
            )
            if created:
                created_roles.append(role)
                self.stdout.write(f'  Created role: {role_name}')
            
            # Assign permissions to role
            for codename in permission_codenames:
                try:
                    permission = Permission.objects.get(codename=codename)
                    role_permission, created = RolePermission.objects.get_or_create(
                        role=role,
                        permission=permission,
                        defaults={'granted': True}
                    )
                    if created:
                        self.stdout.write(f'    Assigned {codename} to {role_name}')
                except Permission.DoesNotExist:
                    self.stdout.write(
                        self.style.WARNING(f'    Permission {codename} not found for role {role_name}')
                    )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created {len(created_permissions)} permissions and {len(created_roles)} roles'
            )
        )