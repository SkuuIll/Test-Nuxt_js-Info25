#!/usr/bin/env python3

"""
Test script for serializer consistency
This script validates that all serializers work correctly and consistently
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

from django.contrib.auth import get_user_model
from posts.models import Post, Categoria, Comentario
from posts.serializers import (
    PostSerializer, PostListSerializer, PostCreateUpdateSerializer,
    CategorySerializer, CategoryCreateUpdateSerializer,
    CommentSerializer, CommentCreateUpdateSerializer,
    PostSearchSerializer, PostBulkActionSerializer,
    PostValidationSerializer
)
from users.serializers import (
    UserSerializer, UserRegistrationSerializer, UserUpdateSerializer,
    ChangePasswordSerializer, UserProfileSerializer
)
from django_blog.base_serializers import (
    BaseModelSerializer, UserBasicSerializer, CategoryBasicSerializer,
    PostBasicSerializer, CommentBasicSerializer, FilterSerializer,
    MediaUploadSerializer, BulkActionSerializer
)
import json

User = get_user_model()

def test_serializers_consistency():
    """Test all serializers for consistency and functionality"""
    
    print("🧪 Testing Serializer Consistency")
    print("=" * 50)
    
    results = {
        'base_serializer_tests': [],
        'post_serializer_tests': [],
        'user_serializer_tests': [],
        'validation_tests': [],
        'errors': []
    }
    
    try:
        # Setup test data
        print("\n📋 Setting up test data...")
        
        # Create test user
        test_user, created = User.objects.get_or_create(
            username='serializer_test_user',
            defaults={
                'email': 'serializer@test.com',
                'first_name': 'Test',
                'last_name': 'User',
                'is_active': True
            }
        )
        
        if created:
            test_user.set_password('testpass123')
            test_user.save()
        
        # Create test category
        test_category, created = Categoria.objects.get_or_create(
            nombre='Test Category',
            defaults={'descripcion': 'Test category description'}
        )
        
        # Create test post
        test_post, created = Post.objects.get_or_create(
            titulo='Test Post for Serializers',
            defaults={
                'contenido': 'This is a test post content for serializer testing. It has enough content to test various serializer features.',
                'autor': test_user,
                'categoria': test_category,
                'status': 'published'
            }
        )
        
        print(f"✅ Test data created: User, Category, Post")
        
        # Test 1: Base Serializers
        print("\n1. Testing Base Serializers...")
        
        try:
            # Test UserBasicSerializer
            user_serializer = UserBasicSerializer(test_user)
            user_data = user_serializer.data
            
            required_user_fields = ['id', 'username', 'email', 'full_name', 'avatar_url']
            has_required_fields = all(field in user_data for field in required_user_fields)
            
            print(f"✅ UserBasicSerializer: {has_required_fields}")
            results['base_serializer_tests'].append({
                'test': 'user_basic_serializer',
                'success': has_required_fields,
                'fields': list(user_data.keys())
            })
            
            # Test CategoryBasicSerializer
            category_serializer = CategoryBasicSerializer(test_category)
            category_data = category_serializer.data
            
            required_category_fields = ['id', 'nombre', 'posts_count']
            has_required_fields = all(field in category_data for field in required_category_fields)
            
            print(f"✅ CategoryBasicSerializer: {has_required_fields}")
            results['base_serializer_tests'].append({
                'test': 'category_basic_serializer',
                'success': has_required_fields,
                'fields': list(category_data.keys())
            })
            
        except Exception as e:
            print(f"❌ Base serializer test error: {e}")
            results['errors'].append(f"Base serializer test error: {str(e)}")
        
        # Test 2: Post Serializers
        print("\n2. Testing Post Serializers...")
        
        try:
            # Test PostSerializer
            post_serializer = PostSerializer(test_post)
            post_data = post_serializer.data
            
            required_post_fields = ['id', 'titulo', 'slug', 'author', 'category', 'engagement']
            has_required_fields = all(field in post_data for field in required_post_fields)
            
            print(f"✅ PostSerializer: {has_required_fields}")
            print(f"   Fields: {list(post_data.keys())}")
            
            results['post_serializer_tests'].append({
                'test': 'post_serializer',
                'success': has_required_fields,
                'fields': list(post_data.keys()),
                'has_engagement': 'engagement' in post_data
            })
            
            # Test PostListSerializer
            post_list_serializer = PostListSerializer(test_post)
            post_list_data = post_list_serializer.data
            
            required_list_fields = ['id', 'titulo', 'slug', 'excerpt', 'reading_time']
            has_required_fields = all(field in post_list_data for field in required_list_fields)
            
            print(f"✅ PostListSerializer: {has_required_fields}")
            
            results['post_serializer_tests'].append({
                'test': 'post_list_serializer',
                'success': has_required_fields,
                'fields': list(post_list_data.keys())
            })
            
            # Test PostCreateUpdateSerializer validation
            create_data = {
                'titulo': 'New Test Post',
                'contenido': 'This is a new test post with enough content to pass validation.',
                'categoria': test_category.id,
                'status': 'draft'
            }
            
            create_serializer = PostCreateUpdateSerializer(data=create_data)
            is_valid = create_serializer.is_valid()
            
            print(f"✅ PostCreateUpdateSerializer validation: {is_valid}")
            if not is_valid:
                print(f"   Errors: {create_serializer.errors}")
            
            results['post_serializer_tests'].append({
                'test': 'post_create_serializer_validation',
                'success': is_valid,
                'errors': create_serializer.errors if not is_valid else None
            })
            
        except Exception as e:
            print(f"❌ Post serializer test error: {e}")
            results['errors'].append(f"Post serializer test error: {str(e)}")
        
        # Test 3: User Serializers
        print("\n3. Testing User Serializers...")
        
        try:
            # Test UserSerializer
            user_serializer = UserSerializer(test_user)
            user_data = user_serializer.data
            
            required_user_fields = ['id', 'username', 'email', 'full_name']
            has_required_fields = all(field in user_data for field in required_user_fields)
            
            print(f"✅ UserSerializer: {has_required_fields}")
            
            results['user_serializer_tests'].append({
                'test': 'user_serializer',
                'success': has_required_fields,
                'fields': list(user_data.keys())
            })
            
            # Test UserRegistrationSerializer validation
            registration_data = {
                'username': 'newuser123',
                'email': 'newuser@test.com',
                'password': 'securepass123',
                'password_confirm': 'securepass123',
                'first_name': 'New',
                'last_name': 'User',
                'terms_accepted': True
            }
            
            registration_serializer = UserRegistrationSerializer(data=registration_data)
            is_valid = registration_serializer.is_valid()
            
            print(f"✅ UserRegistrationSerializer validation: {is_valid}")
            if not is_valid:
                print(f"   Errors: {registration_serializer.errors}")
            
            results['user_serializer_tests'].append({
                'test': 'user_registration_serializer_validation',
                'success': is_valid,
                'errors': registration_serializer.errors if not is_valid else None
            })
            
        except Exception as e:
            print(f"❌ User serializer test error: {e}")
            results['errors'].append(f"User serializer test error: {str(e)}")
        
        # Test 4: Validation Tests
        print("\n4. Testing Validation Logic...")
        
        try:
            # Test invalid post data
            invalid_post_data = {
                'titulo': 'Hi',  # Too short
                'contenido': 'Short',  # Too short
                'status': 'invalid_status'  # Invalid status
            }
            
            invalid_serializer = PostCreateUpdateSerializer(data=invalid_post_data)
            is_invalid = not invalid_serializer.is_valid()
            
            print(f"✅ Invalid post data correctly rejected: {is_invalid}")
            
            results['validation_tests'].append({
                'test': 'invalid_post_rejection',
                'success': is_invalid,
                'errors': invalid_serializer.errors if is_invalid else None
            })
            
            # Test search serializer
            search_data = {
                'search': 'test',
                'page': 1,
                'page_size': 10,
                'category': test_category.id,
                'status': 'published'
            }
            
            search_serializer = PostSearchSerializer(data=search_data)
            is_valid = search_serializer.is_valid()
            
            print(f"✅ PostSearchSerializer validation: {is_valid}")
            
            results['validation_tests'].append({
                'test': 'post_search_serializer_validation',
                'success': is_valid,
                'errors': search_serializer.errors if not is_valid else None
            })
            
            # Test bulk action serializer
            bulk_data = {
                'action': 'publish',
                'ids': [test_post.id]
            }
            
            bulk_serializer = PostBulkActionSerializer(data=bulk_data)
            is_valid = bulk_serializer.is_valid()
            
            print(f"✅ PostBulkActionSerializer validation: {is_valid}")
            
            results['validation_tests'].append({
                'test': 'post_bulk_action_serializer_validation',
                'success': is_valid,
                'errors': bulk_serializer.errors if not is_valid else None
            })
            
        except Exception as e:
            print(f"❌ Validation test error: {e}")
            results['errors'].append(f"Validation test error: {str(e)}")
        
        # Test 5: Response Format Consistency
        print("\n5. Testing Response Format Consistency...")
        
        try:
            # Test that all serializers return consistent field names
            post_fields = PostSerializer(test_post).data.keys()
            post_list_fields = PostListSerializer(test_post).data.keys()
            
            # Check for consistent naming
            consistent_naming = True
            naming_issues = []
            
            # Check for snake_case vs camelCase consistency
            for field in post_fields:
                if '-' in field or ' ' in field:
                    consistent_naming = False
                    naming_issues.append(f"Invalid field name: {field}")
            
            print(f"✅ Consistent field naming: {consistent_naming}")
            if naming_issues:
                print(f"   Issues: {naming_issues}")
            
            results['validation_tests'].append({
                'test': 'consistent_field_naming',
                'success': consistent_naming,
                'issues': naming_issues
            })
            
            # Test datetime field consistency
            datetime_fields = ['created_at', 'updated_at', 'published_at']
            post_data = PostSerializer(test_post).data
            
            datetime_consistency = True
            for field in datetime_fields:
                if field in post_data and post_data[field]:
                    # Check if it's ISO format
                    try:
                        from datetime import datetime
                        datetime.fromisoformat(post_data[field].replace('Z', '+00:00'))
                    except:
                        datetime_consistency = False
                        break
            
            print(f"✅ Datetime field consistency: {datetime_consistency}")
            
            results['validation_tests'].append({
                'test': 'datetime_field_consistency',
                'success': datetime_consistency
            })
            
        except Exception as e:
            print(f"❌ Response format test error: {e}")
            results['errors'].append(f"Response format test error: {str(e)}")
        
    except Exception as e:
        print(f"❌ Critical error during testing: {e}")
        results['errors'].append(f"Critical error: {str(e)}")
    
    # Print summary
    print("\n" + "=" * 50)
    print("📊 SERIALIZER CONSISTENCY TEST SUMMARY")
    print("=" * 50)
    
    total_tests = (
        len(results['base_serializer_tests']) + 
        len(results['post_serializer_tests']) + 
        len(results['user_serializer_tests']) + 
        len(results['validation_tests'])
    )
    
    successful_tests = (
        sum(1 for t in results['base_serializer_tests'] if t['success']) +
        sum(1 for t in results['post_serializer_tests'] if t['success']) +
        sum(1 for t in results['user_serializer_tests'] if t['success']) +
        sum(1 for t in results['validation_tests'] if t['success'])
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
        print("🎉 Serializers are highly consistent and working excellently!")
    elif success_rate >= 80:
        print("✅ Serializers are working well with good consistency!")
    elif success_rate >= 60:
        print("⚠️ Serializers have some consistency issues but are functional")
    else:
        print("❌ Serializers need significant consistency improvements")
    
    # Print detailed results
    print("\n📋 DETAILED TEST RESULTS:")
    print("-" * 30)
    
    for category, tests in results.items():
        if category != 'errors' and tests:
            print(f"\n{category.upper().replace('_', ' ')}:")
            for test in tests:
                status_icon = "✅" if test['success'] else "❌"
                print(f"  {status_icon} {test['test']}")
                if not test['success'] and 'errors' in test and test['errors']:
                    print(f"      Errors: {test['errors']}")
    
    return results


if __name__ == "__main__":
    test_serializers_consistency()