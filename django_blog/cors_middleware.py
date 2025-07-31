"""
Custom CORS middleware for enhanced CORS handling
Provides more granular control over CORS policies for different endpoints
"""

import re
from django.conf import settings
from django.http import HttpResponse
from django.utils.deprecation import MiddlewareMixin
from django.urls import resolve, Resolver404
import logging

logger = logging.getLogger(__name__)

class EnhancedCORSMiddleware(MiddlewareMixin):
    """
    Enhanced CORS middleware with endpoint-specific policies
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        
        # Compile regex patterns for better performance
        self.api_pattern = re.compile(r'^/api/')
        self.dashboard_pattern = re.compile(r'^/api/v1/dashboard/')
        self.auth_pattern = re.compile(r'^/api/v1/users/auth/')
        self.media_pattern = re.compile(r'^/media/')
        
        # CORS policies for different endpoint types
        self.cors_policies = {
            'api': {
                'allow_credentials': True,
                'max_age': 86400,
                'allow_headers': [
                    'accept', 'accept-encoding', 'authorization', 'content-type',
                    'dnt', 'origin', 'user-agent', 'x-csrftoken', 'x-requested-with'
                ],
                'expose_headers': ['content-type', 'x-csrftoken', 'x-total-count'],
                'allow_methods': ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']
            },
            'dashboard': {
                'allow_credentials': True,
                'max_age': 3600,  # Shorter cache for dashboard
                'allow_headers': [
                    'accept', 'accept-encoding', 'authorization', 'content-type',
                    'dnt', 'origin', 'user-agent', 'x-csrftoken', 'x-requested-with',
                    'x-dashboard-token'
                ],
                'expose_headers': ['content-type', 'x-csrftoken', 'x-dashboard-session'],
                'allow_methods': ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']
            },
            'auth': {
                'allow_credentials': True,
                'max_age': 600,  # Short cache for auth endpoints
                'allow_headers': [
                    'accept', 'accept-encoding', 'authorization', 'content-type',
                    'dnt', 'origin', 'user-agent', 'x-csrftoken', 'x-requested-with'
                ],
                'expose_headers': ['content-type', 'x-csrftoken'],
                'allow_methods': ['POST', 'OPTIONS', 'HEAD']
            },
            'media': {
                'allow_credentials': False,
                'max_age': 86400,
                'allow_headers': ['accept', 'accept-encoding', 'origin', 'user-agent'],
                'expose_headers': ['content-type', 'content-length', 'etag', 'last-modified'],
                'allow_methods': ['GET', 'HEAD', 'OPTIONS']
            },
            'default': {
                'allow_credentials': True,
                'max_age': 86400,
                'allow_headers': [
                    'accept', 'accept-encoding', 'authorization', 'content-type',
                    'dnt', 'origin', 'user-agent', 'x-csrftoken', 'x-requested-with'
                ],
                'expose_headers': ['content-type'],
                'allow_methods': ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']
            }
        }
        
        super().__init__(get_response)
    
    def get_cors_policy(self, request):
        """
        Determine the appropriate CORS policy based on the request path
        """
        path = request.path
        
        if self.dashboard_pattern.match(path):
            return 'dashboard'
        elif self.auth_pattern.match(path):
            return 'auth'
        elif self.api_pattern.match(path):
            return 'api'
        elif self.media_pattern.match(path):
            return 'media'
        else:
            return 'default'
    
    def is_origin_allowed(self, origin, policy_type):
        """
        Check if the origin is allowed for the given policy type
        """
        if not origin:
            return False
        
        # In development, allow all origins if configured
        if getattr(settings, 'CORS_ALLOW_ALL_ORIGINS', False):
            return True
        
        # Check against allowed origins
        allowed_origins = getattr(settings, 'CORS_ALLOWED_ORIGINS', [])
        if origin in allowed_origins:
            return True
        
        # Check against regex patterns if configured
        allowed_regexes = getattr(settings, 'CORS_ALLOWED_ORIGIN_REGEXES', [])
        for regex_pattern in allowed_regexes:
            if re.match(regex_pattern, origin):
                return True
        
        # Special handling for localhost in development
        if settings.DEBUG and ('localhost' in origin or '127.0.0.1' in origin):
            return True
        
        return False
    
    def add_cors_headers(self, response, request, policy_type):
        """
        Add CORS headers to the response based on the policy type
        """
        origin = request.META.get('HTTP_ORIGIN')
        policy = self.cors_policies[policy_type]
        
        # Check if origin is allowed
        if not self.is_origin_allowed(origin, policy_type):
            logger.warning(f"CORS: Origin '{origin}' not allowed for policy '{policy_type}'")
            return response
        
        # Add CORS headers
        response['Access-Control-Allow-Origin'] = origin
        
        if policy['allow_credentials']:
            response['Access-Control-Allow-Credentials'] = 'true'
        
        # Add exposed headers
        if policy['expose_headers']:
            response['Access-Control-Expose-Headers'] = ', '.join(policy['expose_headers'])
        
        # Add Vary header to indicate that the response varies by Origin
        vary_header = response.get('Vary', '')
        if 'Origin' not in vary_header:
            response['Vary'] = f"{vary_header}, Origin".strip(', ')
        
        return response
    
    def handle_preflight(self, request, policy_type):
        """
        Handle CORS preflight requests
        """
        origin = request.META.get('HTTP_ORIGIN')
        policy = self.cors_policies[policy_type]
        
        # Check if origin is allowed
        if not self.is_origin_allowed(origin, policy_type):
            logger.warning(f"CORS Preflight: Origin '{origin}' not allowed for policy '{policy_type}'")
            return HttpResponse(status=403)
        
        # Create preflight response
        response = HttpResponse(status=200)
        response['Access-Control-Allow-Origin'] = origin
        
        if policy['allow_credentials']:
            response['Access-Control-Allow-Credentials'] = 'true'
        
        # Add allowed methods
        response['Access-Control-Allow-Methods'] = ', '.join(policy['allow_methods'])
        
        # Add allowed headers
        requested_headers = request.META.get('HTTP_ACCESS_CONTROL_REQUEST_HEADERS', '')
        if requested_headers:
            # Check if requested headers are allowed
            requested_headers_list = [h.strip().lower() for h in requested_headers.split(',')]
            allowed_headers_lower = [h.lower() for h in policy['allow_headers']]
            
            # Allow requested headers that are in our allowed list
            allowed_requested_headers = [
                h for h in requested_headers_list 
                if h in allowed_headers_lower
            ]
            
            if allowed_requested_headers:
                response['Access-Control-Allow-Headers'] = ', '.join(allowed_requested_headers)
            else:
                # Fallback to default allowed headers
                response['Access-Control-Allow-Headers'] = ', '.join(policy['allow_headers'])
        else:
            response['Access-Control-Allow-Headers'] = ', '.join(policy['allow_headers'])
        
        # Add max age
        response['Access-Control-Max-Age'] = str(policy['max_age'])
        
        # Add Vary header
        response['Vary'] = 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers'
        
        logger.debug(f"CORS Preflight handled for {origin} with policy '{policy_type}'")
        return response
    
    def process_request(self, request):
        """
        Process incoming request for CORS handling
        """
        # Only handle requests with Origin header
        if not request.META.get('HTTP_ORIGIN'):
            return None
        
        # Determine CORS policy
        policy_type = self.get_cors_policy(request)
        
        # Handle preflight requests
        if request.method == 'OPTIONS':
            # Check if this is a CORS preflight request
            if request.META.get('HTTP_ACCESS_CONTROL_REQUEST_METHOD'):
                return self.handle_preflight(request, policy_type)
        
        # Store policy type for response processing
        request._cors_policy_type = policy_type
        
        return None
    
    def process_response(self, request, response):
        """
        Process response to add CORS headers
        """
        # Only add CORS headers if request had Origin header
        if not request.META.get('HTTP_ORIGIN'):
            return response
        
        # Get policy type from request (set in process_request)
        policy_type = getattr(request, '_cors_policy_type', 'default')
        
        # Add CORS headers
        return self.add_cors_headers(response, request, policy_type)
    
    def process_exception(self, request, exception):
        """
        Handle exceptions and ensure CORS headers are still added
        """
        # This ensures CORS headers are added even when exceptions occur
        return None