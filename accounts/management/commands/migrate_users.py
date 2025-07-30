from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from accounts.models import Role, UserRole
import sqlite3
import os

User = get_user_model()


class Command(BaseCommand):
    help = 'Migrate users from old database to new user model'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--old-db',
            type=str,
            default='db_backup.sqlite3',
            help='Path to the old database file'
        )
    
    def handle(self, *args, **options):
        old_db_path = options['old_db']
        
        if not os.path.exists(old_db_path):
            self.stdout.write(
                self.style.ERROR(f'Old database file not found: {old_db_path}')
            )
            return
        
        self.stdout.write('Migrating users from old database...')
        
        # Connect to old database
        conn = sqlite3.connect(old_db_path)
        cursor = conn.cursor()
        
        try:
            # Get users from old database
            cursor.execute("""
                SELECT id, username, first_name, last_name, email, is_staff, 
                       is_active, is_superuser, date_joined, last_login, password
                FROM auth_user
            """)
            
            old_users = cursor.fetchall()
            migrated_count = 0
            
            # Get default user role
            user_role, _ = Role.objects.get_or_create(
                name='User',
                defaults={'description': 'Regular user'}
            )
            
            admin_role, _ = Role.objects.get_or_create(
                name='Admin',
                defaults={'description': 'Full system administrator'}
            )
            
            for user_data in old_users:
                (old_id, username, first_name, last_name, email, is_staff,
                 is_active, is_superuser, date_joined, last_login, password) = user_data
                
                # Check if user already exists
                if User.objects.filter(email=email).exists():
                    self.stdout.write(f'  User {email} already exists, skipping...')
                    continue
                
                # Create new user
                user = User.objects.create(
                    username=username,
                    first_name=first_name,
                    last_name=last_name,
                    email=email,
                    is_staff=is_staff,
                    is_active=is_active,
                    is_superuser=is_superuser,
                    date_joined=date_joined,
                    last_login=last_login,
                    password=password,
                    is_email_verified=True  # Assume existing users are verified
                )
                
                # Assign appropriate role
                if is_superuser or is_staff:
                    UserRole.objects.create(user=user, role=admin_role)
                    self.stdout.write(f'  Migrated admin user: {email}')
                else:
                    UserRole.objects.create(user=user, role=user_role)
                    self.stdout.write(f'  Migrated user: {email}')
                
                migrated_count += 1
            
            self.stdout.write(
                self.style.SUCCESS(f'Successfully migrated {migrated_count} users')
            )
            
        except sqlite3.Error as e:
            self.stdout.write(
                self.style.ERROR(f'Database error: {e}')
            )
        finally:
            conn.close()