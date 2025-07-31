"""
Django management command to test CORS configuration
Usage: python manage.py test_cors
"""

import requests
import json
import time
from django.core.management.base import BaseCommand
from django.conf import settings


class Command(BaseCommand):
    help = 'Test CORS configuration with various scenarios'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--server-url',
            type=str,
            default='http://localhost:8000',
            help='Django server URL to test against'
        )
        parser.add_argument(
            '--frontend-url',
            type=str,
            default='http://localhost:3000',
            help='Frontend URL to simulate requests from'
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Enable verbose output'
        )
        parser.add_argument(
            '--test-endpoints',
            nargs='+',
            default=['/api/posts/', '/api/dashboard/auth/login/', '/api/cors-test/'],
            help='API endpoints to test'
        )
    
    def handle(self, *args, **options):
        self.server_url = options['server_url'].rstrip('/')
        self.frontend_url = options['frontend_url']
        self.verbose = options['verbose']
        self.test_endpoints = options['test_endpoints']
        
        self.stdout.write(
            self.style.SUCCESS('🧪 Starting CORS Configuration Tests')
        )
        self.stdout.write(f"Server URL: {self.server_url}")
        self.stdout.write(f"Frontend URL: {self.frontend_url}")
        self.stdout.write("-" * 60)
        
        # Run all tests
        self.test_preflight_requests()
        self.test_simple_requests()
        self.test_credentialed_requests()
        self.test_custom_headers()
        self.test_different_origins()
        self.test_cors_test_endpoint()
        
        self.stdout.write("-" * 60)
        self.stdout.write(
            self.style.SUCCESS('✅ CORS testing completed')
        )
    
    def test_preflight_requests(self):
        """Test CORS preflight (OPTIONS) requests"""
        self.stdout.write(
            self.style.WARNING('\n🔍 Testing Preflight Requests')
        )
        
        for endpoint in self.test_endpoints:
            url = f"{self.server_url}{endpoint}"
            
            # Test preflight request
            headers = {
                'Origin': self.frontend_url,
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type, Authorization',
            }
            
            try:
                response = requests.options(url, headers=headers, timeout=10)
                
                if response.status_code == 200:
                    self.stdout.write(
                        f"  ✅ {endpoint} - Preflight OK ({response.status_code})"
                    )
                    
                    if self.verbose:
                        cors_headers = {
                            k: v for k, v in response.headers.items()
                            if k.lower().startswith('access-control-')
                        }
                        for header, value in cors_headers.items():
                            self.stdout.write(f"     {header}: {value}")
                else:
                    self.stdout.write(
                        f"  ❌ {endpoint} - Preflight Failed ({response.status_code})"
                    )
                    
            except requests.exceptions.RequestException as e:
                self.stdout.write(
                    f"  ❌ {endpoint} - Connection Error: {str(e)}"
                )
    
    def test_simple_requests(self):
        """Test simple CORS requests (GET)"""
        self.stdout.write(
            self.style.WARNING('\n🔍 Testing Simple Requests')
        )
        
        for endpoint in self.test_endpoints:
            url = f"{self.server_url}{endpoint}"
            
            headers = {
                'Origin': self.frontend_url,
            }
            
            try:
                response = requests.get(url, headers=headers, timeout=10)
                
                # Check for CORS headers
                has_cors_origin = 'Access-Control-Allow-Origin' in response.headers
                has_cors_credentials = 'Access-Control-Allow-Credentials' in response.headers
                
                if has_cors_origin:
                    self.stdout.write(
                        f"  ✅ {endpoint} - Simple request OK ({response.status_code})"
                    )
                    
                    if self.verbose:
                        self.stdout.write(
                            f"     Access-Control-Allow-Origin: {response.headers.get('Access-Control-Allow-Origin')}"
                        )
                        if has_cors_credentials:
                            self.stdout.write(
                                f"     Access-Control-Allow-Credentials: {response.headers.get('Access-Control-Allow-Credentials')}"
                            )
                else:
                    self.stdout.write(
                        f"  ⚠️  {endpoint} - No CORS headers ({response.status_code})"
                    )
                    
            except requests.exceptions.RequestException as e:
                self.stdout.write(
                    f"  ❌ {endpoint} - Connection Error: {str(e)}"
                )
    
    def test_credentialed_requests(self):
        """Test requests with credentials"""
        self.stdout.write(
            self.style.WARNING('\n🔍 Testing Credentialed Requests')
        )
        
        # Test with cookies and authorization header
        headers = {
            'Origin': self.frontend_url,
            'Authorization': 'Bearer test-token',
            'Cookie': 'sessionid=test-session',
        }
        
        for endpoint in self.test_endpoints:
            url = f"{self.server_url}{endpoint}"
            
            try:
                response = requests.get(url, headers=headers, timeout=10)
                
                allow_credentials = response.headers.get('Access-Control-Allow-Credentials', '').lower()
                
                if allow_credentials == 'true':
                    self.stdout.write(
                        f"  ✅ {endpoint} - Credentials allowed"
                    )
                else:
                    self.stdout.write(
                        f"  ⚠️  {endpoint} - Credentials not explicitly allowed"
                    )
                    
            except requests.exceptions.RequestException as e:
                self.stdout.write(
                    f"  ❌ {endpoint} - Connection Error: {str(e)}"
                )
    
    def test_custom_headers(self):
        """Test requests with custom headers"""
        self.stdout.write(
            self.style.WARNING('\n🔍 Testing Custom Headers')
        )
        
        custom_headers = [
            'X-API-Key',
            'X-Requested-With',
            'X-CSRFToken',
            'X-Dashboard-Token',
            'X-Custom-Header',
        ]
        
        for header_name in custom_headers:
            # Test preflight for custom header
            preflight_headers = {
                'Origin': self.frontend_url,
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': header_name,
            }
            
            url = f"{self.server_url}/api/cors-test/"
            
            try:
                response = requests.options(url, headers=preflight_headers, timeout=10)
                
                allowed_headers = response.headers.get('Access-Control-Allow-Headers', '').lower()
                
                if header_name.lower() in allowed_headers:
                    self.stdout.write(
                        f"  ✅ {header_name} - Header allowed"
                    )
                else:
                    self.stdout.write(
                        f"  ❌ {header_name} - Header not allowed"
                    )
                    
            except requests.exceptions.RequestException as e:
                self.stdout.write(
                    f"  ❌ {header_name} - Connection Error: {str(e)}"
                )
    
    def test_different_origins(self):
        """Test requests from different origins"""
        self.stdout.write(
            self.style.WARNING('\n🔍 Testing Different Origins')
        )
        
        test_origins = [
            'http://localhost:3000',
            'https://localhost:3000',
            'http://127.0.0.1:3000',
            'https://example.com',
            'https://malicious-site.com',
            'http://localhost:8080',
        ]
        
        url = f"{self.server_url}/api/cors-test/"
        
        for origin in test_origins:
            headers = {'Origin': origin}
            
            try:
                response = requests.get(url, headers=headers, timeout=10)
                
                allowed_origin = response.headers.get('Access-Control-Allow-Origin')
                
                if allowed_origin == origin or allowed_origin == '*':
                    self.stdout.write(
                        f"  ✅ {origin} - Origin allowed"
                    )
                else:
                    self.stdout.write(
                        f"  ❌ {origin} - Origin not allowed"
                    )
                    
            except requests.exceptions.RequestException as e:
                self.stdout.write(
                    f"  ❌ {origin} - Connection Error: {str(e)}"
                )
    
    def test_cors_test_endpoint(self):
        """Test the dedicated CORS test endpoint"""
        self.stdout.write(
            self.style.WARNING('\n🔍 Testing CORS Test Endpoint')
        )
        
        url = f"{self.server_url}/api/cors-test/"
        headers = {'Origin': self.frontend_url}
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    
                    self.stdout.write(
                        f"  ✅ CORS test endpoint responding"
                    )
                    
                    if self.verbose:
                        self.stdout.write(f"     Method: {data.get('method')}")
                        self.stdout.write(f"     Origin: {data.get('origin')}")
                        self.stdout.write(f"     CORS Enabled: {data.get('cors_enabled')}")
                        
                        server_info = data.get('server_info', {})
                        self.stdout.write(f"     Debug Mode: {server_info.get('debug_mode')}")
                        self.stdout.write(f"     Allow All Origins: {server_info.get('cors_allow_all_origins')}")
                        self.stdout.write(f"     Allow Credentials: {server_info.get('cors_allow_credentials')}")
                        
                except json.JSONDecodeError:
                    self.stdout.write(
                        f"  ⚠️  CORS test endpoint returned non-JSON response"
                    )
            else:
                self.stdout.write(
                    f"  ❌ CORS test endpoint failed ({response.status_code})"
                )
                
        except requests.exceptions.RequestException as e:
            self.stdout.write(
                f"  ❌ CORS test endpoint - Connection Error: {str(e)}"
            )
    
    def run_performance_test(self):
        """Test CORS performance impact"""
        self.stdout.write(
            self.style.WARNING('\n🔍 Testing CORS Performance Impact')
        )
        
        url = f"{self.server_url}/api/cors-test/"
        
        # Test without CORS headers
        start_time = time.time()
        for _ in range(10):
            try:
                requests.get(url, timeout=5)
            except:
                pass
        no_cors_time = time.time() - start_time
        
        # Test with CORS headers
        headers = {'Origin': self.frontend_url}
        start_time = time.time()
        for _ in range(10):
            try:
                requests.get(url, headers=headers, timeout=5)
            except:
                pass
        cors_time = time.time() - start_time
        
        self.stdout.write(
            f"  📊 10 requests without CORS headers: {no_cors_time:.3f}s"
        )
        self.stdout.write(
            f"  📊 10 requests with CORS headers: {cors_time:.3f}s"
        )
        
        if cors_time > no_cors_time * 1.1:  # More than 10% slower
            self.stdout.write(
                f"  ⚠️  CORS adds {((cors_time - no_cors_time) / no_cors_time * 100):.1f}% overhead"
            )
        else:
            self.stdout.write(
                f"  ✅ CORS overhead is minimal ({((cors_time - no_cors_time) / no_cors_time * 100):.1f}%)"
            )