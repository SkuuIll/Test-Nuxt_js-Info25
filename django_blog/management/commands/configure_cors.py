"""
Django management command to configure CORS settings
Usage: python manage.py configure_cors [options]
"""

import os
import re
from django.core.management.base import BaseCommand
from django.conf import settings
from django.utils import timezone


class Command(BaseCommand):
    help = 'Configure CORS settings for different environments'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--environment',
            type=str,
            choices=['development', 'staging', 'production'],
            default='development',
            help='Environment to configure CORS for'
        )
        parser.add_argument(
            '--frontend-url',
            type=str,
            help='Frontend URL to allow'
        )
        parser.add_argument(
            '--dashboard-url',
            type=str,
            help='Dashboard URL to allow'
        )
        parser.add_argument(
            '--api-url',
            type=str,
            help='API URL to allow'
        )
        parser.add_argument(
            '--domain',
            type=str,
            help='Production domain for regex patterns'
        )
        parser.add_argument(
            '--test',
            action='store_true',
            help='Test the configuration after setting it up'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be configured without making changes'
        )
    
    def handle(self, *args, **options):
        environment = options['environment']
        
        self.stdout.write(
            self.style.SUCCESS(f'🔧 Configuring CORS for {environment} environment')
        )
        
        # Generate configuration
        config = self.generate_cors_config(environment, options)
        
        if options['dry_run']:
            self.show_dry_run(config)
            return
        
        # Apply configuration
        self.apply_cors_config(config, environment)
        
        # Test configuration if requested
        if options['test']:
            self.test_configuration()
        
        self.stdout.write(
            self.style.SUCCESS('✅ CORS configuration completed successfully')
        )
    
    def generate_cors_config(self, environment, options):
        """Generate CORS configuration based on environment and options"""
        
        config = {
            'environment': environment,
            'origins': [],
            'regex_patterns': [],
            'headers': [],
            'methods': ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
            'allow_credentials': True,
            'preflight_max_age': 600 if environment == 'development' else 86400,
            'allow_all_origins': environment == 'development'
        }
        
        # Set origins based on environment
        if environment == 'development':
            config['origins'] = [
                'http://localhost:3000',
                'https://localhost:3000',
                'http://127.0.0.1:3000',
                'https://127.0.0.1:3000',
                'http://localhost:8080',
                'http://127.0.0.1:8080',
                'http://localhost:4000',
                'http://127.0.0.1:4000',
                'http://localhost:8000',
                'http://127.0.0.1:8000',
            ]
        
        # Add custom URLs from options
        if options['frontend_url']:
            config['origins'].append(options['frontend_url'])
        
        if options['dashboard_url']:
            config['origins'].append(options['dashboard_url'])
        
        if options['api_url']:
            config['origins'].append(options['api_url'])
        
        # Add domain regex patterns for production
        if options['domain'] and environment in ['staging', 'production']:
            domain = options['domain']
            config['regex_patterns'] = [
                rf\"^https://.*\\.{re.escape(domain)}$\",  # Subdomains
                rf\"^https://{re.escape(domain)}$\",      # Main domain
            ]
        
        # Set headers based on environment
        base_headers = [
            'accept',
            'accept-encoding',
            'accept-language',
            'authorization',
            'content-type',
            'dnt',
            'origin',
            'user-agent',
            'x-csrftoken',
            'x-requested-with',
        ]
        
        if environment == 'development':
            base_headers.extend([
                'x-debug',
                'x-development',
                'x-test-mode',
            ])
        
        # Add API and business headers
        api_headers = [
            'x-api-key',
            'x-api-version',
            'x-dashboard-token',
            'x-session-id',
            'x-request-id',
        ]
        
        config['headers'] = base_headers + api_headers
        
        return config
    
    def show_dry_run(self, config):
        """Show what would be configured without making changes"""
        self.stdout.write(
            self.style.WARNING('🔍 Dry run - showing configuration that would be applied:')
        )
        self.stdout.write('-' * 60)
        
        self.stdout.write(f\"Environment: {config['environment']}\")
        self.stdout.write(f\"Allow all origins: {config['allow_all_origins']}\")
        self.stdout.write(f\"Allow credentials: {config['allow_credentials']}\")
        self.stdout.write(f\"Preflight max age: {config['preflight_max_age']} seconds\")
        
        self.stdout.write(f\"\\nAllowed origins ({len(config['origins'])}):\")
        for origin in config['origins']:
            self.stdout.write(f\"  - {origin}\")
        
        if config['regex_patterns']:
            self.stdout.write(f\"\\nRegex patterns ({len(config['regex_patterns'])}):\")
            for pattern in config['regex_patterns']:
                self.stdout.write(f\"  - {pattern}\")
        
        self.stdout.write(f\"\\nAllowed methods ({len(config['methods'])}):\")
        self.stdout.write(f\"  {', '.join(config['methods'])}\")
        
        self.stdout.write(f\"\\nAllowed headers ({len(config['headers'])}):\")
        for i, header in enumerate(config['headers']):
            if i < 10:  # Show first 10
                self.stdout.write(f\"  - {header}\")
            elif i == 10:
                self.stdout.write(f\"  ... and {len(config['headers']) - 10} more\")
                break
    
    def apply_cors_config(self, config, environment):
        \"\"\"Apply CORS configuration to environment variables or settings\"\"\"
        
        # Create environment file content
        env_content = self.generate_env_content(config)
        
        # Write to .env file
        env_file = f\".env.{environment}\"
        
        try:
            with open(env_file, 'w') as f:
                f.write(env_content)
            
            self.stdout.write(
                self.style.SUCCESS(f'📝 CORS configuration written to {env_file}')
            )
            
            # Show instructions
            self.stdout.write('\\n📋 Next steps:')
            self.stdout.write(f'1. Load the environment file: source {env_file}')
            self.stdout.write('2. Restart your Django server')
            self.stdout.write('3. Test CORS functionality with: python manage.py test_cors')
            
        except IOError as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Failed to write configuration file: {e}')
            )
    
    def generate_env_content(self, config):
        \"\"\"Generate environment file content\"\"\"
        
        content = [
            f\"# CORS Configuration for {config['environment']} environment\",
            f\"# Generated on {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}\",
            \"\",
            \"# Frontend and API URLs\",
        ]
        
        # Add origin URLs
        if config['origins']:
            content.append(f\"FRONTEND_URL={config['origins'][0]}\")
            if len(config['origins']) > 1:
                content.append(f\"DASHBOARD_URL={config['origins'][1]}\")
            if len(config['origins']) > 2:
                content.append(f\"API_URL={config['origins'][2]}\")
        
        content.extend([
            \"\",
            \"# CORS Settings\",
            f\"CORS_ALLOW_ALL_ORIGINS={str(config['allow_all_origins']).lower()}\",
            f\"CORS_ALLOW_CREDENTIALS={str(config['allow_credentials']).lower()}\",
            f\"CORS_PREFLIGHT_MAX_AGE={config['preflight_max_age']}\",
        ])
        
        # Add domain for regex patterns
        if config['regex_patterns']:
            content.extend([
                \"\",
                \"# Domain for regex patterns\",
                \"PRODUCTION_DOMAIN=yourdomain.com  # Replace with your actual domain\",
            ])
        
        content.extend([
            \"\",
            \"# Environment\",
            f\"DJANGO_ENV={config['environment']}\",
            f\"DEBUG={str(config['environment'] == 'development').lower()}\",
        ])
        
        return \"\\n\".join(content)
    
    def test_configuration(self):
        \"\"\"Test the CORS configuration\"\"\"
        self.stdout.write('\\n🧪 Testing CORS configuration...')
        
        try:
            from django.core.management import call_command
            call_command('test_cors', verbosity=0)
            
            self.stdout.write(
                self.style.SUCCESS('✅ CORS configuration test completed')
            )
        except Exception as e:
            self.stdout.write(
                self.style.WARNING(f'⚠️  CORS test failed: {e}')
            )
            self.stdout.write('You can run the test manually with: python manage.py test_cors')
    
    def validate_url(self, url):
        \"\"\"Validate URL format\"\"\"
        if not url:
            return False
        
        url_pattern = re.compile(
            r'^https?://'  # http:// or https://
            r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\\.)+'  # domain...
            r'(?:[A-Z]{2,6}\\.?|[A-Z0-9-]{2,}\\.?)|'  # host...
            r'localhost|'  # localhost...
            r'\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3})'  # ...or ip
            r'(?::\\d+)?'  # optional port
            r'(?:/?|[/?]\\S+)$', re.IGNORECASE)
        
        return bool(url_pattern.match(url))
    
    def get_current_config(self):
        \"\"\"Get current CORS configuration from settings\"\"\"
        
        current_config = {
            'CORS_ALLOWED_ORIGINS': getattr(settings, 'CORS_ALLOWED_ORIGINS', []),
            'CORS_ALLOW_ALL_ORIGINS': getattr(settings, 'CORS_ALLOW_ALL_ORIGINS', False),
            'CORS_ALLOW_CREDENTIALS': getattr(settings, 'CORS_ALLOW_CREDENTIALS', False),
            'CORS_ALLOW_HEADERS': getattr(settings, 'CORS_ALLOW_HEADERS', []),
            'CORS_ALLOWED_METHODS': getattr(settings, 'CORS_ALLOWED_METHODS', []),
            'CORS_PREFLIGHT_MAX_AGE': getattr(settings, 'CORS_PREFLIGHT_MAX_AGE', 86400),
        }
        
        return current_config