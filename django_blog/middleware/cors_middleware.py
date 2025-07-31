"""
Enhanced CORS Middleware for Django Blog
Provides additional CORS handling beyond django-cors-headers
"""

import re
from django.http import HttpResponse
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings


class EnhancedCORSMiddleware(MiddlewareMixin):
    """
    Enhanced CORS middleware that provides additional functionality
    beyond the standard django-cors-headers package
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        super().__init__(get_response)
        
        # Cache compiled regex patterns for performance
        self.origin_regexes = []
        if hasattr(settings, 'CORS_ALLOWED_ORIGIN_REGEXES'):
            self.origin_regexes = [
                re.compile(pattern) for pattern in settings.CORS_ALLOWED_ORIGIN_REGEXES
            ]
    
    def process_request(self, request):
        """
        Process incoming request for CORS handling
        """
        # Add CORS information to request for debugging
        if settings.DEBUG:
            origin = request.META.get('HTTP_ORIGIN', '')
            request.cors_info = {
                'origin': origin,
                'method': request.method,
                'is_preflight': request.method == 'OPTIONS',
                'has_origin': bool(origin),
                'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                'referer': request.META.get('HTTP_REFERER', ''),
            }
    
    def process_response(self, request, response):
        """
        Process response to add additional CORS headers
        """
        # Skip if not a CORS request
        origin = request.META.get('HTTP_ORIGIN', '')
        if not origin:
            return response
        
        # Add additional security headers for CORS requests
        if self._is_cors_enabled_for_request(request):
            # Add timing information for debugging
            if settings.DEBUG and hasattr(request, '_cors_start_time'):
                import time
                processing_time = time.time() - request._cors_start_time
                response['X-CORS-Processing-Time'] = f"{processing_time:.4f}s"
            
            # Add CORS debugging headers in development
            if settings.DEBUG:
                response['X-CORS-Debug'] = 'enabled'
                response['X-CORS-Origin-Allowed'] = str(self._is_origin_allowed(origin))
                response['X-CORS-Method-Allowed'] = str(request.method in getattr(settings, 'CORS_ALLOWED_METHODS', []))
            
            # Add security headers for CORS requests
            if not settings.DEBUG:
                response['X-Content-Type-Options'] = 'nosniff'
                response['X-Frame-Options'] = 'DENY'
                response['X-XSS-Protection'] = '1; mode=block'
            
            # Add custom business headers
            response['X-API-Version'] = getattr(settings, 'API_VERSION', '1.0')
            response['X-Server-Time'] = str(int(time.time() * 1000))  # Timestamp in milliseconds
        
        return response
    
    def _is_cors_enabled_for_request(self, request):
        """
        Check if CORS is enabled for this request based on URL patterns
        """
        cors_urls_regex = getattr(settings, 'CORS_URLS_REGEX', None)
        if cors_urls_regex:
            return bool(re.match(cors_urls_regex, request.path))
        return True
    
    def _is_origin_allowed(self, origin):
        """
        Check if origin is allowed based on settings and regex patterns
        """
        # Check if all origins are allowed
        if getattr(settings, 'CORS_ALLOW_ALL_ORIGINS', False):
            return True
        
        # Check explicit allowed origins
        allowed_origins = getattr(settings, 'CORS_ALLOWED_ORIGINS', [])
        if origin in allowed_origins:
            return True
        
        # Check regex patterns
        for regex in self.origin_regexes:
            if regex.match(origin):
                return True
        
        return False


class CORSPreflightMiddleware(MiddlewareMixin):
    """
    Middleware to handle CORS preflight requests with enhanced functionality
    """
    
    def process_request(self, request):
        """
        Handle preflight OPTIONS requests
        """
        if request.method != 'OPTIONS':
            return None
        
        # Check if this is a CORS preflight request
        origin = request.META.get('HTTP_ORIGIN', '')
        access_control_request_method = request.META.get('HTTP_ACCESS_CONTROL_REQUEST_METHOD', '')
        
        if not origin or not access_control_request_method:
            return None
        
        # Let django-cors-headers handle the actual CORS logic
        # This middleware just adds enhanced logging and debugging
        
        if settings.DEBUG:
            print(f"🔍 CORS Preflight Request:")
            print(f"   - Origin: {origin}")
            print(f"   - Method: {access_control_request_method}")
            print(f"   - Headers: {request.META.get('HTTP_ACCESS_CONTROL_REQUEST_HEADERS', 'None')}")
            print(f"   - Path: {request.path}")
            print(f"   - User-Agent: {request.META.get('HTTP_USER_AGENT', 'Unknown')[:100]}")
        
        return None


class CORSLoggingMiddleware(MiddlewareMixin):
    """
    Middleware to log CORS requests for debugging and monitoring
    """
    
    def process_request(self, request):
        """
        Log CORS request information
        """
        origin = request.META.get('HTTP_ORIGIN', '')
        if not origin:
            return None
        
        # Add start time for performance tracking
        if settings.DEBUG:
            import time
            request._cors_start_time = time.time()
        
        # Log CORS requests in development
        if settings.DEBUG:
            method = request.method
            path = request.path
            user_agent = request.META.get('HTTP_USER_AGENT', 'Unknown')[:50]
            
            print(f"🌐 CORS Request: {method} {path}")
            print(f"   - Origin: {origin}")
            print(f"   - User-Agent: {user_agent}...")
            
            # Log preflight requests specially
            if method == 'OPTIONS':
                requested_method = request.META.get('HTTP_ACCESS_CONTROL_REQUEST_METHOD', 'None')
                requested_headers = request.META.get('HTTP_ACCESS_CONTROL_REQUEST_HEADERS', 'None')
                print(f"   - Preflight for: {requested_method}")
                print(f"   - Requested headers: {requested_headers}")
        
        return None
    
    def process_response(self, request, response):
        """
        Log CORS response information
        """
        origin = request.META.get('HTTP_ORIGIN', '')
        if not origin or not settings.DEBUG:
            return response
        
        # Log response status and CORS headers
        cors_headers = {}
        for header, value in response.items():
            if header.lower().startswith('access-control-'):
                cors_headers[header] = value
        
        if cors_headers:
            print(f"📤 CORS Response: {response.status_code}")
            for header, value in cors_headers.items():
                print(f"   - {header}: {value}")
        
        return response


class CORSSecurityMiddleware(MiddlewareMixin):
    """
    Middleware to add security enhancements for CORS requests
    """
    
    def process_response(self, request, response):
        """
        Add security headers for CORS requests
        """
        origin = request.META.get('HTTP_ORIGIN', '')
        if not origin:
            return response
        
        # Add security headers for cross-origin requests
        if not settings.DEBUG:
            # Prevent MIME type sniffing
            if 'X-Content-Type-Options' not in response:
                response['X-Content-Type-Options'] = 'nosniff'
            
            # Prevent clickjacking
            if 'X-Frame-Options' not in response:
                response['X-Frame-Options'] = 'SAMEORIGIN'
            
            # XSS protection
            if 'X-XSS-Protection' not in response:
                response['X-XSS-Protection'] = '1; mode=block'
            
            # Referrer policy for cross-origin requests
            if 'Referrer-Policy' not in response:
                response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Add rate limiting headers (placeholder - implement actual rate limiting)
        response['X-RateLimit-Limit'] = '1000'
        response['X-RateLimit-Remaining'] = '999'
        response['X-RateLimit-Reset'] = str(int(time.time()) + 3600)
        
        return response


def cors_test_view(request):
    """
    Test view for CORS functionality
    Available at /api/cors-test/
    """
    import json
    from django.http import JsonResponse
    
    cors_info = {
        'method': request.method,
        'origin': request.META.get('HTTP_ORIGIN', 'No origin'),
        'user_agent': request.META.get('HTTP_USER_AGENT', 'No user agent'),
        'headers': dict(request.headers),
        'cors_enabled': True,
        'timestamp': int(time.time() * 1000),
        'server_info': {
            'debug_mode': settings.DEBUG,
            'cors_allow_all_origins': getattr(settings, 'CORS_ALLOW_ALL_ORIGINS', False),
            'cors_allow_credentials': getattr(settings, 'CORS_ALLOW_CREDENTIALS', False),
        }
    }
    
    # Add debug information in development
    if settings.DEBUG:
        cors_info['debug'] = {
            'allowed_origins': getattr(settings, 'CORS_ALLOWED_ORIGINS', []),
            'allowed_methods': getattr(settings, 'CORS_ALLOWED_METHODS', []),
            'allowed_headers': getattr(settings, 'CORS_ALLOW_HEADERS', [])[:10],  # First 10 headers
            'exposed_headers': getattr(settings, 'CORS_EXPOSE_HEADERS', [])[:10],  # First 10 headers
        }
    
    response = JsonResponse(cors_info)
    
    # Add test-specific headers
    response['X-CORS-Test'] = 'success'
    response['X-Test-Timestamp'] = str(int(time.time() * 1000))
    
    return response