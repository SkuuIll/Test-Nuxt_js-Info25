#!/usr/bin/env python
"""
Script to update dashboard views with consistent pagination
"""

import re

def update_dashboard_pagination():
    """Update dashboard views to use consistent pagination"""
    
    # Read the file
    with open('dashboard/views.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Pattern to find ViewSet classes that need pagination
    viewset_pattern = r'(class Dashboard\w+ViewSet\(viewsets\.ModelViewSet\):\s*"""[^"]*"""\s*queryset[^=]*=\s*[^\n]*\n\s*serializer_class[^=]*=\s*[^\n]*\n\s*permission_classes[^=]*=\s*[^\n]*\n)(\s*filter_backends)'
    
    # Replacement with pagination added
    replacement = r'\1    pagination_class = DashboardPagination\n\2'
    
    # Apply the replacement
    updated_content = re.sub(viewset_pattern, replacement, content, flags=re.MULTILINE | re.DOTALL)
    
    # Also handle cases where there's no filter_backends
    viewset_pattern2 = r'(class Dashboard\w+ViewSet\(viewsets\.ModelViewSet\):\s*"""[^"]*"""\s*queryset[^=]*=\s*[^\n]*\n\s*serializer_class[^=]*=\s*[^\n]*\n\s*permission_classes[^=]*=\s*[^\n]*\n)(\s*def|\s*@|\s*class|\s*\n\s*\n)'
    
    # Check if pagination_class is already there
    if 'pagination_class = DashboardPagination' not in updated_content:
        replacement2 = r'\1    pagination_class = DashboardPagination\n\n\2'
        updated_content = re.sub(viewset_pattern2, replacement2, updated_content, flags=re.MULTILINE | re.DOTALL)
    
    # Write back the file
    with open('dashboard/views.py', 'w', encoding='utf-8') as f:
        f.write(updated_content)
    
    print("✅ Dashboard pagination updated successfully")

if __name__ == '__main__':
    update_dashboard_pagination()