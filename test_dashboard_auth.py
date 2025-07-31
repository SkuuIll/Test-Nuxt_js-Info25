#!/usr/bin/env python3

"""
Test script for dashboard authentication system
This script validates the dashboard authentication functionality
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

from django.test import RequestFactory, TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from dashboard.models import DashboardPermission
from dashboard.views import (
    DashboardTokenObtainPairView, 
    DashboardTokenRefreshView,
    DashboardLogoutView,
    DashboardUserProfileView,
    check_dashboard_permission
)
import json

User = get_user_model()

def test_dashboard_authentication():
    """Test the complete dashboard authentication system"""
    
    print("🧪 Testing Dashboard Authentication System")
    print("=" * 50)
    
    results = {
        'login_tests': [],
        'token_tests': [],
        'permission_tests': [],
        'profile_tests': [],
        'errors': []
    }
    
    try:
        # Setup test data
        print("\n📋 Setting up test data...")
        
        # Create test user with dashboard permissions
        test_user, created = User.objects.get_or_create(
            username='dashboard_test_user',
            defaults={
                'email': 'dashboard@test.com',
                'first_name': 'Dashboard',
                'last_name': 'User',
                'is_active': True
            }
        )
        
        if created:
            test_user.set_password('testpassword123')
            test_user.save()
        
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
        
        print(f"✅ Test user created: {test_user.username}")
        print(f"✅ Dashboard permissions: {dashboard_permission}")
        
        # Test 1: Dashboard Login
        print("\n1. Testing Dashboard Login...")
        
        try:
            factory = APIRequestFactory()
            
            # Test successful login
            login_data = {
                'username': 'dashboard_test_user',
                'password': 'testpassword123'
            }
            
            request = factory.post('/api/v1/dashboard/auth/login/', login_data, format='json')
            # Add META attribute to request for testing
            request.META = {
                'REMOTE_ADDR': '127.0.0.1',
                'HTTP_USER_AGENT': 'Test Client'
            }
            # Add data attribute for DRF
            request.data = login_data
            
            view = DashboardTokenObtainPairView.as_view()
            response = view(request)
            
            print(f"✅ Login response status: {response.status_code}")
            if hasattr(response, 'data'):
                print(f"Login response data: {response.data}")
            
            if response.status_code == 200:
                response_data = response.data
                print(f"✅ Login response format: {list(response_data.keys())}")
                
                # Check if tokens are present
                has_tokens = 'data' in response_data and 'access' in response_data['data']
                print(f"✅ Tokens present: {has_tokens}")
                
                results['login_tests'].append({
                    'test': 'successful_login',
                    'success': has_tokens,
                    'status_code': response.status_code,
                    'has_access_token': 'access' in response_data.get('data', {}),
                    'has_refresh_token': 'refresh' in response_data.get('data', {}),
                    'has_user_data': 'user' in response_data.get('data', {})
                })
                
                # Store tokens for further tests
                if has_tokens:
                    access_token = response_data['data']['access']
                    refresh_token = response_data['data']['refresh']
                    print(f"✅ Tokens extracted successfully")
                
            # Test login with invalid credentials
            invalid_login_data = {
                'username': 'dashboard_test_user',
                'password': 'wrongpassword'
            }
            
            request = factory.post('/api/v1/dashboard/auth/login/', invalid_login_data, format='json')
            # Add META attribute to request for testing
            request.META = {
                'REMOTE_ADDR': '127.0.0.1',
                'HTTP_USER_AGENT': 'Test Client'
            }
            # Add data attribute for DRF
            request.data = invalid_login_data
            
            response = view(request)
            
            print(f"✅ Invalid login response status: {response.status_code}")
            
            results['login_tests'].append({
                'test': 'invalid_credentials',
                'success': response.status_code == 401,
                'status_code': response.status_code
            })
            
        except Exception as e:
            print(f"❌ Login test error: {e}")
            results['errors'].append(f"Login test error: {str(e)}")
        
        # Test 2: Token Refresh
        print("\n2. Testing Token Refresh...")
        
        try:
            if 'refresh_token' in locals():
                refresh_data = {'refresh': refresh_token}
                
                request = factory.post('/api/v1/dashboard/auth/refresh/', refresh_data, format='json')
                # Add META attribute to request for testing
                request.META = {
                    'REMOTE_ADDR': '127.0.0.1',
                    'HTTP_USER_AGENT': 'Test Client'
                }
                # Add data attribute for DRF
                request.data = refresh_data
                
                view = DashboardTokenRefreshView.as_view()
                response = view(request)
                
                print(f"✅ Token refresh status: {response.status_code}")
                
                if response.status_code == 200:
                    response_data = response.data
                    has_new_token = 'data' in response_data and 'access' in response_data['data']
                    print(f"✅ New access token received: {has_new_token}")
                    
                    results['token_tests'].append({
                        'test': 'token_refresh',
                        'success': has_new_token,
                        'status_code': response.status_code
                    })
                
                # Test with invalid refresh token
                invalid_refresh_data = {'refresh': 'invalid_token'}
                request = factory.post('/api/v1/dashboard/auth/refresh/', invalid_refresh_data, format='json')
                # Add META attribute to request for testing
                request.META = {
                    'REMOTE_ADDR': '127.0.0.1',
                    'HTTP_USER_AGENT': 'Test Client'
                }
                # Add data attribute for DRF
                request.data = invalid_refresh_data
                
                response = view(request)
                
                print(f"✅ Invalid refresh token status: {response.status_code}")
                
                results['token_tests'].append({
                    'test': 'invalid_refresh_token',
                    'success': response.status_code == 401,
                    'status_code': response.status_code
                })
            
        except Exception as e:
            print(f"❌ Token refresh test error: {e}")
            results['errors'].append(f"Token refresh test error: {str(e)}")
        
        # Test 3: Permission Checking
        print("\n3. Testing Permission Checking...")
        
        try:
            # Test permission check endpoint
            request = factory.post('/api/v1/dashboard/auth/check-permission/', {
                'permission': 'manage_posts'
            })
            force_authenticate(request, user=test_user)
            
            response = check_dashboard_permission(request)
            
            print(f"✅ Permission check status: {response.status_code}")
            
            if response.status_code == 200:
                response_data = response.data
                has_permission = response_data.get('data', {}).get('has_permission', False)
                print(f"✅ Has manage_posts permission: {has_permission}")
                
                results['permission_tests'].append({
                    'test': 'manage_posts_permission',
                    'success': has_permission,
                    'status_code': response.status_code
                })
            
            # Test permission that user doesn't have
            request = factory.post('/api/v1/dashboard/auth/check-permission/', {
                'permission': 'manage_users'
            })
            force_authenticate(request, user=test_user)
            
            response = check_dashboard_permission(request)
            
            if response.status_code == 200:
                response_data = response.data
                has_permission = response_data.get('data', {}).get('has_permission', False)
                print(f"✅ Has manage_users permission (should be False): {has_permission}")
                
                results['permission_tests'].append({
                    'test': 'manage_users_permission_denied',
                    'success': not has_permission,  # Should be False
                    'status_code': response.status_code
                })
            
        except Exception as e:
            print(f"❌ Permission test error: {e}")
            results['errors'].append(f"Permission test error: {str(e)}")
        
        # Test 4: User Profile
        print("\n4. Testing User Profile...")
        
        try:
            request = factory.get('/api/v1/dashboard/auth/profile/')
            force_authenticate(request, user=test_user)
            
            view = DashboardUserProfileView.as_view()
            response = view(request)
            
            print(f"✅ Profile response status: {response.status_code}")
            
            if response.status_code == 200:
                response_data = response.data
                has_user_data = 'data' in response_data and 'username' in response_data['data']
                has_permissions = 'permissions' in response_data.get('data', {})
                has_stats = 'stats' in response_data.get('data', {})
                
                print(f"✅ Profile has user data: {has_user_data}")
                print(f"✅ Profile has permissions: {has_permissions}")
                print(f"✅ Profile has stats: {has_stats}")
                
                results['profile_tests'].append({
                    'test': 'user_profile',
                    'success': has_user_data and has_permissions,
                    'status_code': response.status_code,
                    'has_user_data': has_user_data,
                    'has_permissions': has_permissions,
                    'has_stats': has_stats
                })
            
        except Exception as e:
            print(f"❌ Profile test error: {e}")
            results['errors'].append(f"Profile test error: {str(e)}")
        
        # Test 5: Logout
        print("\n5. Testing Logout...")
        
        try:
            if 'refresh_token' in locals():
                logout_data = {'refresh': refresh_token}
                
                request = factory.post('/api/v1/dashboard/auth/logout/', logout_data)
                force_authenticate(request, user=test_user)
                
                view = DashboardLogoutView.as_view()
                response = view(request)
                
                print(f"✅ Logout response status: {response.status_code}")
                
                results['login_tests'].append({
                    'test': 'logout',
                    'success': response.status_code == 200,
                    'status_code': response.status_code
                })
            
        except Exception as e:
            print(f"❌ Logout test error: {e}")
            results['errors'].append(f"Logout test error: {str(e)}")
        
    except Exception as e:
        print(f"❌ Critical error during testing: {e}")
        results['errors'].append(f"Critical error: {str(e)}")
    
    # Print summary
    print("\n" + "=" * 50)
    print("📊 DASHBOARD AUTHENTICATION TEST SUMMARY")
    print("=" * 50)
    
    total_tests = (
        len(results['login_tests']) + 
        len(results['token_tests']) + 
        len(results['permission_tests']) + 
        len(results['profile_tests'])
    )
    
    successful_tests = (
        sum(1 for t in results['login_tests'] if t['success']) +
        sum(1 for t in results['token_tests'] if t['success']) +
        sum(1 for t in results['permission_tests'] if t['success']) +
        sum(1 for t in results['profile_tests'] if t['success'])
    )
    
    print(f"Total Tests: {total_tests}")
    print(f"Successful: {successful_tests}")
    print(f"Failed: {total_tests - successful_tests}")
    print(f"Errors: {len(results['errors'])}")
    
    if results['errors']:
        print("\n🚨 ERRORS:")
        for error in results['errors']:
            print(f"  - {error}")
    
    success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
    print(f"\n✅ Success Rate: {success_rate:.1f}%")
    
    if success_rate >= 90:
        print("🎉 Dashboard authentication system is working excellently!")
    elif success_rate >= 80:
        print("✅ Dashboard authentication system is working well!")
    elif success_rate >= 60:
        print("⚠️ Dashboard authentication system has some issues but is functional")
    else:
        print("❌ Dashboard authentication system needs significant fixes")
    
    # Print detailed test results
    print("\n📋 DETAILED TEST RESULTS:")
    print("-" * 30)
    
    for category, tests in results.items():
        if category != 'errors' and tests:
            print(f"\n{category.upper()}:")
            for test in tests:
                status_icon = "✅" if test['success'] else "❌"
                print(f"  {status_icon} {test['test']}: {test.get('status_code', 'N/A')}")
    
    return results


if __name__ == "__main__":
    test_dashboard_authentication()