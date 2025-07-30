#!/usr/bin/env python3
"""
Script to update dashboard views to use standardized response format
"""

import re
import os


def update_dashboard_responses():
    """Update dashboard/views.py to use standardized responses"""
    
    file_path = 'dashboard/views.py'
    
    if not os.path.exists(file_path):
        print(f"File {file_path} not found")
        return
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Patterns to replace
    replacements = [
        # Replace Response with error: True
        (
            r'return Response\(\s*\{\s*[\'"]error[\'"]\s*:\s*True,\s*[\'"]message[\'"]\s*:\s*([^}]+)\s*\}\s*,\s*status\s*=\s*status\.HTTP_(\d+)_[A-Z_]+\s*\)',
            r'return DashboardAPIResponse.error(\1, status_code=HTTPStatus.\2)'
        ),
        # Replace Response with error: False
        (
            r'return Response\(\s*\{\s*[\'"]error[\'"]\s*:\s*False,\s*[\'"]data[\'"]\s*:\s*([^}]+)\s*\}\s*,\s*status\s*=\s*status\.HTTP_200_OK\s*\)',
            r'return DashboardAPIResponse.success(\1)'
        ),
        # Replace simple error responses
        (
            r'return Response\(\s*\{\s*[\'"]error[\'"]\s*:\s*True,\s*[\'"]message[\'"]\s*:\s*([^}]+)\s*\}\s*\)',
            r'return DashboardAPIResponse.error(\1)'
        ),
        # Replace simple success responses
        (
            r'return Response\(\s*\{\s*[\'"]error[\'"]\s*:\s*False,\s*[\'"]message[\'"]\s*:\s*([^}]+)\s*\}\s*\)',
            r'return DashboardAPIResponse.success(message=\1)'
        ),
    ]
    
    # Apply replacements
    updated_content = content
    for pattern, replacement in replacements:
        updated_content = re.sub(pattern, replacement, updated_content, flags=re.MULTILINE | re.DOTALL)
    
    # Manual replacements for complex cases
    manual_replacements = [
        # Update bulk_delete method
        (
            'return Response({\n                \'error\': True,\n                \'message\': \'post_ids es requerido\'\n            }, status=status.HTTP_400_BAD_REQUEST)',
            'return DashboardAPIResponse.error(\n                \'post_ids es requerido\',\n                status_code=HTTPStatus.BAD_REQUEST\n            )'
        ),
        # Update toggle_featured method
        (
            'return Response({\n                \'error\': False,\n                \'message\': f\'Post marcado como {action_desc}\',\n                \'featured\': post.featured\n            }, status=status.HTTP_200_OK)',
            'return DashboardAPIResponse.success({\n                \'featured\': post.featured\n            }, message=f\'Post marcado como {action_desc}\')'
        ),
    ]
    
    for old, new in manual_replacements:
        updated_content = updated_content.replace(old, new)
    
    # Write back the updated content
    if updated_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(updated_content)
        print(f"Updated {file_path} with standardized response format")
    else:
        print(f"No changes needed in {file_path}")


def update_remaining_views():
    """Update any remaining views that still use old Response format"""
    
    # Files to check
    files_to_check = [
        'posts/api_views.py',
        'users/api_views.py',
        'dashboard/views.py'
    ]
    
    for file_path in files_to_check:
        if not os.path.exists(file_path):
            continue
            
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for old Response patterns
        old_patterns = [
            r'Response\(\s*\{[^}]*[\'"]success[\'"][^}]*\}',
            r'Response\(\s*\{[^}]*[\'"]error[\'"][^}]*\}',
        ]
        
        found_patterns = []
        for pattern in old_patterns:
            matches = re.findall(pattern, content, re.MULTILINE | re.DOTALL)
            if matches:
                found_patterns.extend(matches)
        
        if found_patterns:
            print(f"\nFound old response patterns in {file_path}:")
            for i, pattern in enumerate(found_patterns[:5], 1):  # Show first 5
                print(f"  {i}. {pattern[:100]}...")
        else:
            print(f"✓ {file_path} - All responses use standardized format")


if __name__ == '__main__':
    print("Updating dashboard responses to use standardized format...")
    update_dashboard_responses()
    
    print("\nChecking for remaining old response patterns...")
    update_remaining_views()
    
    print("\nUpdate completed!")