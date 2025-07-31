#!/usr/bin/env python3

"""
Test script for media file handling
This script validates the media file management system
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

from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model
User = get_user_model()
from media_files.models import MediaFile
from media_files.serializers import MediaFileSerializer, MediaUploadSerializer
from django.conf import settings
import tempfile
import json

def test_media_handling():
    """Test media file handling functionality"""
    
    print("🧪 Testing Media File Handling System")
    print("=" * 50)
    
    results = {
        'model_tests': [],
        'serializer_tests': [],
        'file_operations': [],
        'errors': []
    }
    
    try:
        # Test 1: Model Creation and Validation
        print("\n1. Testing MediaFile Model...")
        
        # Create test user
        test_user, created = User.objects.get_or_create(
            username='testuser',
            defaults={'email': 'test@example.com'}
        )
        
        # Test model creation
        try:
            # Create a simple test file
            test_content = b"Test file content"
            test_file = SimpleUploadedFile(
                "test_image.jpg",
                test_content,
                content_type="image/jpeg"
            )
            
            media_file = MediaFile(
                file=test_file,
                original_filename="test_image.jpg",
                file_size=len(test_content),
                mime_type="image/jpeg",
                uploaded_by=test_user,
                alt_text="Test image",
                caption="Test caption",
                tags="test, image"
            )
            
            # Test file type detection
            file_type = media_file.get_file_type()
            print(f"✅ File type detection: {file_type}")
            results['model_tests'].append({
                'test': 'file_type_detection',
                'result': file_type,
                'success': file_type == 'image'
            })
            
            # Test file size display
            size_display = media_file.get_file_size_display()
            print(f"✅ File size display: {size_display}")
            results['model_tests'].append({
                'test': 'file_size_display',
                'result': size_display,
                'success': 'B' in size_display
            })
            
            # Test tags handling
            tags_list = media_file.get_tags_list()
            print(f"✅ Tags list: {tags_list}")
            results['model_tests'].append({
                'test': 'tags_handling',
                'result': tags_list,
                'success': len(tags_list) == 2
            })
            
        except Exception as e:
            print(f"❌ Model test error: {e}")
            results['errors'].append(f"Model test error: {str(e)}")
        
        # Test 2: Serializer Validation
        print("\n2. Testing Serializers...")
        
        try:
            # Test MediaUploadSerializer
            upload_data = {
                'file': test_file,
                'alt_text': 'Test alt text',
                'caption': 'Test caption',
                'is_public': True
            }
            
            upload_serializer = MediaUploadSerializer(data=upload_data)
            is_valid = upload_serializer.is_valid()
            print(f"✅ Upload serializer validation: {is_valid}")
            
            if not is_valid:
                print(f"   Errors: {upload_serializer.errors}")
            
            results['serializer_tests'].append({
                'test': 'upload_serializer_validation',
                'success': is_valid,
                'errors': upload_serializer.errors if not is_valid else None
            })
            
        except Exception as e:
            print(f"❌ Serializer test error: {e}")
            results['errors'].append(f"Serializer test error: {str(e)}")
        
        # Test 3: File Operations
        print("\n3. Testing File Operations...")
        
        try:
            # Test file extension validation
            allowed_extensions = settings.MEDIA_FILE_SETTINGS['ALLOWED_EXTENSIONS']
            print(f"✅ Allowed extensions configured: {len(allowed_extensions)} types")
            
            results['file_operations'].append({
                'test': 'allowed_extensions_config',
                'success': len(allowed_extensions) > 0,
                'result': f"{len(allowed_extensions)} file types configured"
            })
            
            # Test media directory creation
            media_root = settings.MEDIA_ROOT
            media_exists = os.path.exists(media_root)
            print(f"✅ Media directory exists: {media_exists} ({media_root})")
            
            results['file_operations'].append({
                'test': 'media_directory_exists',
                'success': media_exists,
                'result': str(media_root)
            })
            
            # Test upload path generation
            from media_files.models import get_upload_path
            
            # Create a mock instance for testing
            class MockInstance:
                def get_file_type(self):
                    return 'image'
            
            mock_instance = MockInstance()
            upload_path = get_upload_path(mock_instance, 'test.jpg')
            print(f"✅ Upload path generation: {upload_path}")
            
            results['file_operations'].append({
                'test': 'upload_path_generation',
                'success': 'uploads/image/' in upload_path,
                'result': upload_path
            })
            
        except Exception as e:
            print(f"❌ File operations test error: {e}")
            results['errors'].append(f"File operations test error: {str(e)}")
        
        # Test 4: Settings Validation
        print("\n4. Testing Settings Configuration...")
        
        try:
            # Check media settings
            media_settings = getattr(settings, 'MEDIA_FILE_SETTINGS', {})
            print(f"✅ Media file settings configured: {bool(media_settings)}")
            
            required_settings = ['MAX_FILE_SIZE', 'ALLOWED_EXTENSIONS', 'THUMBNAIL_SIZES']
            missing_settings = [s for s in required_settings if s not in media_settings]
            
            if missing_settings:
                print(f"⚠️ Missing settings: {missing_settings}")
            else:
                print("✅ All required settings present")
            
            results['file_operations'].append({
                'test': 'settings_configuration',
                'success': len(missing_settings) == 0,
                'result': f"Missing: {missing_settings}" if missing_settings else "All present"
            })
            
            # Check file upload limits
            max_size = getattr(settings, 'FILE_UPLOAD_MAX_MEMORY_SIZE', 0)
            print(f"✅ File upload max size: {max_size / (1024*1024):.1f}MB")
            
            results['file_operations'].append({
                'test': 'file_upload_limits',
                'success': max_size > 0,
                'result': f"{max_size / (1024*1024):.1f}MB"
            })
            
        except Exception as e:
            print(f"❌ Settings test error: {e}")
            results['errors'].append(f"Settings test error: {str(e)}")
        
        # Test 5: URL Configuration
        print("\n5. Testing URL Configuration...")
        
        try:
            from django.urls import reverse, NoReverseMatch
            
            # Test URL patterns
            url_patterns = [
                'media_files:upload',
                'media_files:file-list',
                'media_files:stats',
                'media_files:dashboard',
            ]
            
            url_test_results = []
            for pattern in url_patterns:
                try:
                    url = reverse(pattern)
                    url_test_results.append({'pattern': pattern, 'url': url, 'success': True})
                    print(f"✅ URL pattern '{pattern}': {url}")
                except NoReverseMatch as e:
                    url_test_results.append({'pattern': pattern, 'error': str(e), 'success': False})
                    print(f"❌ URL pattern '{pattern}': {e}")
            
            results['file_operations'].append({
                'test': 'url_configuration',
                'success': all(r['success'] for r in url_test_results),
                'result': url_test_results
            })
            
        except Exception as e:
            print(f"❌ URL configuration test error: {e}")
            results['errors'].append(f"URL configuration test error: {str(e)}")
        
    except Exception as e:
        print(f"❌ Critical error during testing: {e}")
        results['errors'].append(f"Critical error: {str(e)}")
    
    # Print summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    
    total_tests = (
        len(results['model_tests']) + 
        len(results['serializer_tests']) + 
        len(results['file_operations'])
    )
    
    successful_tests = (
        sum(1 for t in results['model_tests'] if t['success']) +
        sum(1 for t in results['serializer_tests'] if t['success']) +
        sum(1 for t in results['file_operations'] if t['success'])
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
    
    if success_rate >= 80:
        print("🎉 Media handling system is working well!")
    elif success_rate >= 60:
        print("⚠️ Media handling system has some issues but is functional")
    else:
        print("❌ Media handling system needs significant fixes")
    
    return results


if __name__ == "__main__":
    test_media_handling()