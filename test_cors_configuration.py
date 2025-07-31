#!/usr/bin/env python3

"""
Test script for CORS configuration
This script validates the CORS setup between Django backend and Nuxt frontend
"""

import requests
import json
import sys
from urllib.parse import urljoin

def test_cors_configuration():
    """Test CORS configuration between frontend and backend"""
    
    print("🧪 Testing CORS Configuration")
    print("=" * 50)
    
    # Configuration
    backend_url = "http://localhost:8000"
    frontend_url = "http://localhost:3000"
    
    # Test endpoints
    test_endpoints = [
        "/api/v1/posts/",
        "/api/v1/categories/",
        "/api/v1/users/auth/login/",
        "/api/v1/dashboard/auth/login/",
    ]
    
    results = {
        'preflight_tests': [],
        'actual_requests': [],
        'cors_headers': [],
        'errors': []
    }
    
    print(f"\n1. Testing CORS Preflight Requests...")
    print(f"Backend URL: {backend_url}")
    print(f"Frontend URL: {frontend_url}")
    
    for endpoint in test_endpoints:
        url = urljoin(backend_url, endpoint)
        
        try:
            # Test preflight request (OPTIONS)
            print(f"\n🔍 Testing preflight for: {endpoint}")
            
            preflight_headers = {
                'Origin': frontend_url,
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type, Authorization'
            }
            
            response = requests.options(url, headers=preflight_headers, timeout=5)
            
            preflight_result = {
                'endpoint': endpoint,
                'status_code': response.status_code,
                'headers': dict(response.headers),
                'success': response.status_code == 200
            }
            
            results['preflight_tests'].append(preflight_result)
            
            # Check CORS headers
            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
                'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials'),
                'Access-Control-Max-Age': response.headers.get('Access-Control-Max-Age'),
            }
            
            results['cors_headers'].append({
                'endpoint': endpoint,
                'headers': cors_headers
            })
            
            # Print results
            if response.status_code == 200:
                print(f"✅ Preflight successful")
                print(f"   Allow-Origin: {cors_headers['Access-Control-Allow-Origin']}")
                print(f"   Allow-Methods: {cors_headers['Access-Control-Allow-Methods']}")
                print(f"   Allow-Headers: {cors_headers['Access-Control-Allow-Headers']}")
                print(f"   Allow-Credentials: {cors_headers['Access-Control-Allow-Credentials']}")
            else:
                print(f"❌ Preflight failed: {response.status_code}")
                results['errors'].append(f"Preflight failed for {endpoint}: {response.status_code}")
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Request error for {endpoint}: {e}")
            results['errors'].append(f"Request error for {endpoint}: {str(e)}")
    
    print(f"\n2. Testing Actual CORS Requests...")
    
    for endpoint in test_endpoints:
        url = urljoin(backend_url, endpoint)
        
        try:
            # Test actual request with CORS headers
            print(f"\n🔍 Testing actual request for: {endpoint}")
            
            request_headers = {
                'Origin': frontend_url,
                'Content-Type': 'application/json'
            }
            
            # Use GET for most endpoints, POST for auth endpoints
            method = 'POST' if 'login' in endpoint else 'GET'
            
            if method == 'GET':
                response = requests.get(url, headers=request_headers, timeout=5)
            else:
                # For login endpoints, send minimal valid data
                test_data = {'username': 'test', 'password': 'test'}
                response = requests.post(url, headers=request_headers, json=test_data, timeout=5)
            
            actual_result = {
                'endpoint': endpoint,
                'method': method,
                'status_code': response.status_code,
                'cors_headers': {
                    'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                    'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials'),
                },
                'success': response.status_code < 500  # Accept 4xx as valid CORS response
            }
            
            results['actual_requests'].append(actual_result)
            
            # Print results
            if response.status_code < 500:
                print(f"✅ Request successful (status: {response.status_code})")
                print(f"   CORS Origin: {actual_result['cors_headers']['Access-Control-Allow-Origin']}")
                print(f"   CORS Credentials: {actual_result['cors_headers']['Access-Control-Allow-Credentials']}")
            else:
                print(f"❌ Request failed: {response.status_code}")
                results['errors'].append(f"Request failed for {endpoint}: {response.status_code}")
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Request error for {endpoint}: {e}")
            results['errors'].append(f"Request error for {endpoint}: {str(e)}")
    
    print(f"\n3. CORS Configuration Analysis...")
    
    # Analyze results
    preflight_success = sum(1 for test in results['preflight_tests'] if test['success'])
    actual_success = sum(1 for test in results['actual_requests'] if test['success'])
    
    print(f"\n📊 Test Results Summary:")
    print(f"   Preflight tests: {preflight_success}/{len(results['preflight_tests'])} passed")
    print(f"   Actual requests: {actual_success}/{len(results['actual_requests'])} passed")
    print(f"   Total errors: {len(results['errors'])}")
    
    if results['errors']:
        print(f"\n❌ Errors found:")
        for error in results['errors']:
            print(f"   - {error}")
    
    # Check for common CORS issues
    print(f"\n🔍 CORS Configuration Check:")
    
    common_issues = []
    
    # Check if all origins are allowed
    for cors_header in results['cors_headers']:
        origin_header = cors_header['headers']['Access-Control-Allow-Origin']
        if origin_header == '*':
            common_issues.append("⚠️ Using wildcard (*) for Access-Control-Allow-Origin")
        elif origin_header != frontend_url and origin_header != 'http://localhost:3000':
            common_issues.append(f"⚠️ Origin mismatch: expected {frontend_url}, got {origin_header}")
    
    # Check credentials support
    for cors_header in results['cors_headers']:
        credentials_header = cors_header['headers']['Access-Control-Allow-Credentials']
        if credentials_header != 'true':
            common_issues.append("⚠️ Access-Control-Allow-Credentials not set to 'true'")
    
    if common_issues:
        print("   Issues found:")
        for issue in common_issues:
            print(f"   {issue}")
    else:
        print("   ✅ No common CORS issues detected")
    
    # Recommendations
    print(f"\n💡 Recommendations:")
    print("   1. Ensure CORS_ALLOW_CREDENTIALS = True in Django settings")
    print("   2. Add specific origins instead of CORS_ALLOW_ALL_ORIGINS in production")
    print("   3. Include all necessary headers in CORS_ALLOW_HEADERS")
    print("   4. Test with different request types (GET, POST, PUT, DELETE)")
    print("   5. Verify preflight cache settings with CORS_PREFLIGHT_MAX_AGE")
    
    # Save results to file
    with open('cors_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: cors_test_results.json")
    
    return len(results['errors']) == 0

if __name__ == "__main__":
    try:
        success = test_cors_configuration()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️ Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)