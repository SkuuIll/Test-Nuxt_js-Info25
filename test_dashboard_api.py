#!/usr/bin/env python
import os
import sys
import django
import requests
import json

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_blog.settings')
django.setup()

BASE_URL = 'http://localhost:8000'

def test_api_root():
    """Test API root endpoint"""
    print("🔍 Testing API root...")
    try:
        response = requests.get(f'{BASE_URL}/')
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_dashboard_login():
    """Test dashboard login"""
    print("\n🔍 Testing dashboard login...")
    try:
        data = {
            'username': 'admin',
            'password': 'admin123'
        }
        response = requests.post(f'{BASE_URL}/api/v1/dashboard/auth/login/', json=data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            return response.json().get('data', {}).get('access')
        return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_dashboard_stats(token):
    """Test dashboard stats with token"""
    print("\n🔍 Testing dashboard stats...")
    try:
        headers = {'Authorization': f'Bearer {token}'}
        response = requests.get(f'{BASE_URL}/api/v1/dashboard/stats/', headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_posts_api(token):
    """Test posts API"""
    print("\n🔍 Testing posts API...")
    try:
        headers = {'Authorization': f'Bearer {token}'}
        response = requests.get(f'{BASE_URL}/api/v1/dashboard/api/posts/', headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_regular_posts_api():
    """Test regular posts API (should work without auth)"""
    print("\n🔍 Testing regular posts API...")
    try:
        response = requests.get(f'{BASE_URL}/api/v1/posts/')
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == '__main__':
    print("🚀 Testing Dashboard API Connectivity\n")
    
    # Test API root
    if not test_api_root():
        print("❌ API root failed")
        sys.exit(1)
    
    # Test regular posts API
    if not test_regular_posts_api():
        print("❌ Regular posts API failed")
    
    # Test dashboard login
    token = test_dashboard_login()
    if not token:
        print("❌ Dashboard login failed")
        sys.exit(1)
    
    print(f"✅ Login successful! Token: {token[:50]}...")
    
    # Test dashboard stats
    if not test_dashboard_stats(token):
        print("❌ Dashboard stats failed")
    
    # Test posts API
    if not test_posts_api(token):
        print("❌ Dashboard posts API failed")
    
    print("\n✅ All tests completed!")