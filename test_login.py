#!/usr/bin/env python3
import requests
import json

# Test login
login_data = {
    "username": "admin",
    "password": "admin123"
}

try:
    response = requests.post(
        "http://localhost:8000/api/v1/dashboard/auth/login/",
        json=login_data,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        data = response.json()
        access_token = data.get('access')
        print(f"Access Token: {access_token[:50]}..." if access_token else "No access token")
        
        # Test media upload endpoint
        if access_token:
            media_response = requests.get(
                "http://localhost:8000/api/v1/media/files/",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            print(f"Media endpoint status: {media_response.status_code}")
            print(f"Media response: {media_response.text}")
    
except Exception as e:
    print(f"Error: {e}")