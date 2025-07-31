"""
Enhanced CORS Configuration for Django Blog
Provides comprehensive CORS settings for frontend-backend communication
"""

import os
import re
from django.conf import settings

def configure_cors():
    """
    Configure CORS settings based on environment and requirements
    """
    
    # Get environment variables with validation
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    DASHBOARD_URL = os.getenv('DASHBOARD_URL', 'http://localhost:3000')
    API_URL = os.getenv('API_URL', 'http://localhost:8000')
    
    # Validate URLs format
    def validate_url(url, name):
        if url and not re.match(r'^https?://', url):
            print(f"⚠️  Warning: {name} should start with http:// or https://")
        return url
    
    FRONTEND_URL = validate_url(FRONTEND_URL, 'FRONTEND_URL')
    DASHBOARD_URL = validate_url(DASHBOARD_URL, 'DASHBOARD_URL')
    API_URL = validate_url(API_URL, 'API_URL')
    
    # Base allowed origins from environment
    BASE_ORIGINS = [
        FRONTEND_URL,
        DASHBOARD_URL,
        API_URL,
    ]
    
    # Development origins for local development
    DEV_ORIGINS = [
        "http://localhost:3000",  # Nuxt.js development server
        "http://127.0.0.1:3000",
        "https://localhost:3000",  # HTTPS development
        "https://127.0.0.1:3000",
        "http://localhost:8080",  # Alternative frontend port
        "http://127.0.0.1:8080",
        "https://localhost:8080",
        "https://127.0.0.1:8080",
        "http://localhost:3001",  # Alternative development port
        "http://127.0.0.1:3001",
        "https://localhost:3001",
        "https://127.0.0.1:3001",
        "http://localhost:4000",  # Additional development ports
        "http://127.0.0.1:4000",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
        "http://localhost:8000",  # Django development server
        "http://127.0.0.1:8000",
        "https://localhost:8000",
        "https://127.0.0.1:8000",
    ]
    
    # Combine and clean origins
    ALL_ORIGINS = BASE_ORIGINS + DEV_ORIGINS
    CORS_ALLOWED_ORIGINS = list(set(filter(None, ALL_ORIGINS)))
    
    # Remove any invalid origins
    CORS_ALLOWED_ORIGINS = [origin for origin in CORS_ALLOWED_ORIGINS if origin and origin.startswith(('http://', 'https://'))]
    
    # Comprehensive headers that can be sent during requests
    CORS_ALLOW_HEADERS = [
        # Standard HTTP headers
        'accept',
        'accept-encoding',
        'accept-language',
        'authorization',
        'content-type',
        'dnt',
        'origin',
        'user-agent',
        'referer',
        'host',
        
        # CSRF and security headers
        'x-csrftoken',
        'x-requested-with',
        'x-forwarded-for',
        'x-forwarded-proto',
        'x-forwarded-host',
        'x-real-ip',
        
        # Caching and conditional request headers
        'cache-control',
        'pragma',
        'if-modified-since',
        'if-none-match',
        'if-match',
        'if-unmodified-since',
        'if-range',
        'etag',
        
        # Custom API headers
        'x-api-key',
        'x-api-version',
        'x-client-version',
        'x-device-id',
        'x-session-id',
        'x-request-id',
        'x-correlation-id',
        'x-trace-id',
        
        # File upload and content headers
        'x-file-name',
        'x-file-size',
        'x-file-type',
        'content-disposition',
        'content-range',
        'range',
        'x-upload-id',
        'x-chunk-number',
        'x-total-chunks',
        
        # Dashboard specific headers
        'x-dashboard-token',
        'x-dashboard-session',
        'x-dashboard-permissions',
        'x-dashboard-role',
        
        # Pagination and filtering headers
        'x-page',
        'x-per-page',
        'x-total-count',
        'x-page-count',
        'x-sort',
        'x-filter',
        'x-search',
        
        # Authentication and authorization headers
        'x-auth-token',
        'x-refresh-token',
        'x-access-token',
        'x-bearer-token',
        
        # WebSocket headers (if needed)
        'sec-websocket-key',
        'sec-websocket-version',
        'sec-websocket-protocol',
        'sec-websocket-extensions',
        'upgrade',
        'connection',
        
        # Custom business headers
        'x-timezone',
        'x-locale',
        'x-currency',
        'x-feature-flags',
    ]
    
    # Comprehensive headers that can be exposed to the browser
    CORS_EXPOSE_HEADERS = [
        # Content and response headers
        'content-type',
        'content-length',
        'content-encoding',
        'content-disposition',
        'content-range',
        'accept-ranges',
        
        # Security and CSRF headers
        'x-csrftoken',
        'x-frame-options',
        'x-content-type-options',
        'x-xss-protection',
        
        # Pagination and data headers
        'x-total-count',
        'x-page-count',
        'x-current-page',
        'x-per-page',
        'x-has-next',
        'x-has-previous',
        'x-total-pages',
        
        # Caching and validation headers
        'etag',
        'last-modified',
        'cache-control',
        'expires',
        'vary',
        'age',
        
        # Rate limiting headers
        'x-ratelimit-limit',
        'x-ratelimit-remaining',
        'x-ratelimit-reset',
        'x-ratelimit-retry-after',
        
        # API response and debugging headers
        'x-api-version',
        'x-response-time',
        'x-request-id',
        'x-correlation-id',
        'x-trace-id',
        'x-server-id',
        
        # File and media headers
        'x-file-name',
        'x-file-size',
        'x-file-type',
        'x-download-url',
        'x-upload-status',
        
        # Error and status headers
        'x-error-code',
        'x-error-message',
        'x-error-details',
        'x-warning',
        'x-deprecated',
        
        # Navigation and redirect headers
        'location',
        'refresh',
        
        # Custom business logic headers
        'x-feature-flags',
        'x-user-permissions',
        'x-session-expires',
        'x-maintenance-mode',
        'x-version-info',
        
        # Performance headers
        'x-cache-status',
        'x-cache-hits',
        'x-query-count',
        'x-memory-usage',
        'x-execution-time',
    ]
    
    # CORS regex patterns for dynamic subdomains
    CORS_ALLOWED_ORIGIN_REGEXES = []
    
    # Add regex patterns for production domains if environment variables are set
    PRODUCTION_DOMAIN = os.getenv('PRODUCTION_DOMAIN')
    STAGING_DOMAIN = os.getenv('STAGING_DOMAIN')
    
    if PRODUCTION_DOMAIN:
        CORS_ALLOWED_ORIGIN_REGEXES.extend([
            rf"^https://.*\.{re.escape(PRODUCTION_DOMAIN)}$",  # Subdomains
            rf"^https://{re.escape(PRODUCTION_DOMAIN)}$",      # Main domain
        ])
        print(f"🌐 CORS regex patterns added for production domain: {PRODUCTION_DOMAIN}")
    
    if STAGING_DOMAIN:
        CORS_ALLOWED_ORIGIN_REGEXES.extend([
            rf"^https://.*\.{re.escape(STAGING_DOMAIN)}$",     # Staging subdomains
            rf"^https://{re.escape(STAGING_DOMAIN)}$",         # Staging main domain
        ])
        print(f"🌐 CORS regex patterns added for staging domain: {STAGING_DOMAIN}")
    
    # Development vs Production settings
    DEBUG = getattr(settings, 'DEBUG', True)
    
    if DEBUG:
        # Development: More permissive settings
        CORS_ALLOW_ALL_ORIGINS = True
        CORS_PREFLIGHT_MAX_AGE = 600  # 10 minutes
        CORS_ALLOW_PRIVATE_NETWORK = True
        
        # Allow additional development headers
        CORS_ALLOW_HEADERS.extend([
            'x-debug',
            'x-development',
            'x-test-mode',
            'x-mock-data',
            'x-bypass-cache',
            'x-force-refresh',
            'x-debug-level',
            'x-verbose',
            'x-profiling',
            'x-benchmark',
        ])
        
        # Additional development expose headers
        CORS_EXPOSE_HEADERS.extend([
            'x-debug-info',
            'x-debug-queries',
            'x-debug-time',
            'x-debug-memory',
            'x-debug-cache',
            'x-debug-sql',
            'x-test-data',
            'x-mock-response',
        ])
        
        print(f"🔧 Enhanced CORS Development Mode:")
        print(f"   - Allow all origins: {CORS_ALLOW_ALL_ORIGINS}")
        print(f"   - Configured origins: {len(CORS_ALLOWED_ORIGINS)} origins")
        print(f"   - Allowed headers: {len(CORS_ALLOW_HEADERS)} headers")
        print(f"   - Exposed headers: {len(CORS_EXPOSE_HEADERS)} headers")
        print(f"   - Preflight cache: {CORS_PREFLIGHT_MAX_AGE} seconds")
        print(f"   - Private network: {CORS_ALLOW_PRIVATE_NETWORK}")
        
    else:
        # Production: Strict CORS settings
        CORS_ALLOW_ALL_ORIGINS = False
        CORS_PREFLIGHT_MAX_AGE = 86400  # 24 hours
        CORS_ALLOW_PRIVATE_NETWORK = False
        
        # Filter out localhost origins for production
        production_origins = [
            origin for origin in CORS_ALLOWED_ORIGINS 
            if not origin.startswith(('http://localhost', 'http://127.0.0.1', 'https://localhost', 'https://127.0.0.1'))
        ]
        
        if not production_origins:
            print("⚠️  Warning: No production origins configured. Using development origins.")
            print("   Set FRONTEND_URL, DASHBOARD_URL, and API_URL environment variables for production.")
        else:
            CORS_ALLOWED_ORIGINS = production_origins
            print(f"✅ Using {len(production_origins)} production origins")
        
        print(f"🔒 Enhanced CORS Production Mode:")
        print(f"   - Allowed origins: {CORS_ALLOWED_ORIGINS}")
        print(f"   - Allowed headers: {len(CORS_ALLOW_HEADERS)} headers")
        print(f"   - Exposed headers: {len(CORS_EXPOSE_HEADERS)} headers")
        print(f"   - Preflight cache: {CORS_PREFLIGHT_MAX_AGE} seconds")
        print(f"   - Private network: {CORS_ALLOW_PRIVATE_NETWORK}")
    
    return {
        'CORS_ALLOWED_ORIGINS': CORS_ALLOWED_ORIGINS,
        'CORS_ALLOWED_ORIGIN_REGEXES': CORS_ALLOWED_ORIGIN_REGEXES,
        'CORS_ALLOW_CREDENTIALS': True,
        'CORS_ALLOW_HEADERS': CORS_ALLOW_HEADERS,
        'CORS_ALLOWED_METHODS': [
            'DELETE',
            'GET',
            'HEAD',
            'OPTIONS',
            'PATCH',
            'POST',
            'PUT',
        ],
        'CORS_EXPOSE_HEADERS': CORS_EXPOSE_HEADERS,
        'CORS_PREFLIGHT_MAX_AGE': CORS_PREFLIGHT_MAX_AGE,
        'CORS_ALLOW_ALL_ORIGINS': CORS_ALLOW_ALL_ORIGINS,
        'CORS_URLS_REGEX': r'^/(api|media|admin|dashboard|tinymce)/.*',
        'CORS_ALLOW_PRIVATE_NETWORK': CORS_ALLOW_PRIVATE_NETWORK,
        # 'CORS_REPLACE_HTTPS_REFERER': not DEBUG,  # Removed in newer versions
    }


def test_cors_configuration():
    """
    Test CORS configuration for common scenarios
    """
    print("\n🧪 Testing CORS Configuration:")
    
    config = configure_cors()
    
    # Test origins
    test_origins = [
        'http://localhost:3000',
        'https://localhost:3000',
        'http://127.0.0.1:3000',
        'https://example.com',
        'https://app.example.com',
    ]
    
    print("\n📋 Origin Tests:")
    for origin in test_origins:
        if config['CORS_ALLOW_ALL_ORIGINS']:
            print(f"   ✅ {origin} - Allowed (all origins allowed)")
        elif origin in config['CORS_ALLOWED_ORIGINS']:
            print(f"   ✅ {origin} - Allowed (in allowed list)")
        else:
            # Check regex patterns
            allowed_by_regex = False
            for pattern in config['CORS_ALLOWED_ORIGIN_REGEXES']:
                if re.match(pattern, origin):
                    allowed_by_regex = True
                    break
            
            if allowed_by_regex:
                print(f"   ✅ {origin} - Allowed (matches regex pattern)")
            else:
                print(f"   ❌ {origin} - Not allowed")
    
    # Test headers
    test_headers = [
        'authorization',
        'content-type',
        'x-csrftoken',
        'x-api-key',
        'x-custom-header',
    ]
    
    print("\n📋 Header Tests:")
    for header in test_headers:
        if header.lower() in [h.lower() for h in config['CORS_ALLOW_HEADERS']]:
            print(f"   ✅ {header} - Allowed")
        else:
            print(f"   ❌ {header} - Not allowed")
    
    print(f"\n📊 Configuration Summary:")
    print(f"   - Total allowed origins: {len(config['CORS_ALLOWED_ORIGINS'])}")
    print(f"   - Regex patterns: {len(config['CORS_ALLOWED_ORIGIN_REGEXES'])}")
    print(f"   - Allowed headers: {len(config['CORS_ALLOW_HEADERS'])}")
    print(f"   - Exposed headers: {len(config['CORS_EXPOSE_HEADERS'])}")
    print(f"   - Allow credentials: {config['CORS_ALLOW_CREDENTIALS']}")
    print(f"   - Preflight cache: {config['CORS_PREFLIGHT_MAX_AGE']} seconds")


if __name__ == "__main__":
    # Run tests when executed directly
    test_cors_configuration()