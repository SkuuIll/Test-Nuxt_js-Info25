#!/usr/bin/env python3

"""
Simple test script for dashboard authentication system
"""

import os
import sys
import django
from pathlib import Path

# Add the project directory to Python path
project_dir = Path(__file__).parent
sys.path.insert(0, str(project_dir))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_blog.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from dashboard.models import DashboardPermission
import json

User = get_user_model()

def test_dashboard_auth_simple():
    """Simple test for dashboard authentication"""
    
    print("🧪 Simple Dashboard Authentication Test")
    print("=" * 40)
    
    # Setup test data
    print("\n📋 Setting up test data...")
    
    # Create test user with dashboard permissions
    test_user, created = User.objects.get_or_create(
        username='dashboard_simple_test',
        defaults={
            'email': 'simple@test.com',
            'first_name': 'Simple',
            'last_name': 'Test',
            'is_active': True
        }
    )
    
    if created:
        test_user.set_password('testpass123')
        test_user.save()
        print(f"✅ New user created with password")
    else:
        # Update password for existing user
        test_user.set_password('testpass123')
        test_user.save()
        print(f"✅ Existing user password updated")
    
    # Create dashboard permissions
    dashboard_permission, created = DashboardPermission.objects.get_or_create(
        user=test_user,
        defaults={
            'can_view_stats': True,
            'can_manage_posts': True,
            'can_manage_users': False,
            'can_manage_comments': True
        }
    )
    
    print(f"✅ Test user: {test_user.username}")
    print(f"✅ User is active: {test_user.is_active}")
    print(f"✅ Dashboard permissions: {dashboard_permission}")
    
    # Test authentication directly
    from django.contrib.auth import authenticate
    auth_test = authenticate(username='simple@test.com', password='testpass123')  # Use email
    print(f"✅ Direct authentication test: {auth_test is not None}")
    
    # Test login
    print("\n1. Testing Login...")
    
    client = APIClient()
    
    login_data = {
        'username': 'simple@test.com',  # Use email since USERNAME_FIELD = 'email'
        'password': 'testpass123'
    }
    
    response = client.post('/api/v1/dashboard/auth/login/', login_data, format='json')
    
    print(f"Login Status: {response.status_code}")
    print(f"Login Response: {response.data}")
    
    if response.status_code == 200:
        print("✅ Login successful!")
        
        # Extract tokens
        access_token = response.data['data']['access']
        refresh_token = response.data['data']['refresh']
        
        print(f"✅ Access token received: {access_token[:50]}...")
        print(f"✅ Refresh token received: {refresh_token[:50]}...")
        
        # Test authenticated request
        print("\n2. Testing Authenticated Request...")
        
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        profile_response = client.get('/api/v1/dashboard/auth/profile/')
        
        print(f"Profile Status: {profile_response.status_code}")
        if profile_response.status_code == 200:
            print("✅ Profile request successful!")
            profile_data = profile_response.data['data']
            print(f"✅ User: {profile_data['username']}")
            print(f"✅ Permissions: {profile_data['permissions']}")
        else:
            print(f"❌ Profile request failed: {profile_response.data}")
        
        # Test token refresh
        print("\n3. Testing Token Refresh...")
        
        refresh_data = {'refresh': refresh_token}
        refresh_response = client.post('/api/v1/dashboard/auth/refresh/', refresh_data, format='json')
        
        print(f"Refresh Status: {refresh_response.status_code}")
        if refresh_response.status_code == 200:
            print("✅ Token refresh successful!")
            new_access_token = refresh_response.data['data']['access']
            print(f"✅ New access token: {new_access_token[:50]}...")
        else:
            print(f"❌ Token refresh failed: {refresh_response.data}")
        
        # Test logout
        print("\n4. Testing Logout...")
        
        logout_data = {'refresh': refresh_token}
        logout_response = client.post('/api/v1/dashboard/auth/logout/', logout_data, format='json')
        
        print(f"Logout Status: {logout_response.status_code}")
        if logout_response.status_code == 200:
            print("✅ Logout successful!")
        else:
            print(f"❌ Logout failed: {logout_response.data}")
        
    else:
        print(f"❌ Login failed: {response.data}")
    
    # Test invalid login
    print("\n5. Testing Invalid Login...")
    
    invalid_login_data = {
        'username': 'simple@test.com',  # Use email
        'password': 'wrongpassword'
    }
    
    invalid_response = client.post('/api/v1/dashboard/auth/login/', invalid_login_data, format='json')
    
    print(f"Invalid Login Status: {invalid_response.status_code}")
    if invalid_response.status_code == 401:
        print("✅ Invalid login correctly rejected!")
    else:
        print(f"❌ Invalid login response: {invalid_response.data}")
    
    print("\n" + "=" * 40)
    print("🎯 Test Complete!")


if __name__ == "__main__":
    test_dashboard_auth_simple()