#!/usr/bin/env python3
"""
Script to fix all remaining Response patterns in dashboard/views.py
"""

import re


def fix_dashboard_responses():
    """Fix all remaining Response patterns in dashboard/views.py"""
    
    file_path = 'dashboard/views.py'
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Pattern 1: Error responses with exception
    pattern1 = r'return Response\(\s*\{\s*[\'"]error[\'"]\s*:\s*True,\s*[\'"]message[\'"]\s*:\s*([^}]+)\s*\}\s*,\s*status\s*=\s*status\.HTTP_500_INTERNAL_SERVER_ERROR\s*\)'
    replacement1 = r'return DashboardAPIResponse.error(\1, status_code=HTTPStatus.INTERNAL_SERVER_ERROR)'
    content = re.sub(pattern1, replacement1, content, flags=re.MULTILINE | re.DOTALL)
    
    # Pattern 2: Success responses with data
    pattern2 = r'return Response\(\s*\{\s*[\'"]error[\'"]\s*:\s*False,\s*[\'"]data[\'"]\s*:\s*([^}]+)\s*\}\s*,\s*status\s*=\s*status\.HTTP_200_OK\s*\)'
    replacement2 = r'return DashboardAPIResponse.success(\1)'
    content = re.sub(pattern2, replacement2, content, flags=re.MULTILINE | re.DOTALL)
    
    # Pattern 3: Success responses with message
    pattern3 = r'return Response\(\s*\{\s*[\'"]error[\'"]\s*:\s*False,\s*[\'"]message[\'"]\s*:\s*([^}]+)\s*\}\s*,\s*status\s*=\s*status\.HTTP_200_OK\s*\)'
    replacement3 = r'return DashboardAPIResponse.success(message=\1)'
    content = re.sub(pattern3, replacement3, content, flags=re.MULTILINE | re.DOTALL)
    
    # Pattern 4: Error responses without status
    pattern4 = r'return Response\(\s*\{\s*[\'"]error[\'"]\s*:\s*True,\s*[\'"]message[\'"]\s*:\s*([^}]+)\s*\}\s*\)'
    replacement4 = r'return DashboardAPIResponse.error(\1)'
    content = re.sub(pattern4, replacement4, content, flags=re.MULTILINE | re.DOTALL)
    
    # Manual fixes for complex patterns
    manual_fixes = [
        # Fix UserStatsView return
        (
            '''return Response({
                'error': False,
                'data': {
                    'total_users': total_users,
                    'active_users': active_users,
                    'new_users_month': new_users_month,
                    'staff_users': staff_users,
                    'top_authors': top_authors_data,
                    'top_commenters': top_commenters_data
                }
            }, status=status.HTTP_200_OK)''',
            '''return DashboardAPIResponse.success({
                'total_users': total_users,
                'active_users': active_users,
                'new_users_month': new_users_month,
                'staff_users': staff_users,
                'top_authors': top_authors_data,
                'top_commenters': top_commenters_data
            })'''
        ),
        # Fix ContentStatsView return
        (
            '''return Response({
                'error': False,
                'data': {
                    'posts': {
                        'total': total_posts,
                        'published': published_posts,
                        'draft': draft_posts,
                        'archived': archived_posts,
                        'featured': featured_posts
                    },
                    'comments': {
                        'total': total_comments,
                        'approved': approved_comments,
                        'pending': pending_comments
                    },
                    'categories': categories_data,
                    'most_commented_posts': most_commented_data
                }
            }, status=status.HTTP_200_OK)''',
            '''return DashboardAPIResponse.success({
                'posts': {
                    'total': total_posts,
                    'published': published_posts,
                    'draft': draft_posts,
                    'archived': archived_posts,
                    'featured': featured_posts
                },
                'comments': {
                    'total': total_comments,
                    'approved': approved_comments,
                    'pending': pending_comments
                },
                'categories': categories_data,
                'most_commented_posts': most_commented_data
            })'''
        ),
        # Fix bulk operations
        (
            '''return Response({
                'error': False,
                'message': f'{updated_count} posts actualizados exitosamente',
                'updated_count': updated_count
            }, status=status.HTTP_200_OK)''',
            '''return DashboardAPIResponse.success({
                'updated_count': updated_count
            }, message=f'{updated_count} posts actualizados exitosamente')'''
        ),
        (
            '''return Response({
                'error': False,
                'message': f'{deleted_count} posts eliminados exitosamente',
                'deleted_count': deleted_count
            }, status=status.HTTP_200_OK)''',
            '''return DashboardAPIResponse.success({
                'deleted_count': deleted_count
            }, message=f'{deleted_count} posts eliminados exitosamente')'''
        ),
        # Fix toggle_featured
        (
            '''return Response({
                'error': False,
                'message': f'Post marcado como {action_desc}',
                'featured': post.featured
            }, status=status.HTTP_200_OK)''',
            '''return DashboardAPIResponse.success({
                'featured': post.featured
            }, message=f'Post marcado como {action_desc}')'''
        ),
        # Fix comments response
        (
            '''return Response({
                'error': False,
                'data': serializer.data
            }, status=status.HTTP_200_OK)''',
            '''return DashboardAPIResponse.success(serializer.data)'''
        ),
        # Fix user activation/deactivation
        (
            '''return Response({
                'error': False,
                'message': f'Usuario {user.username} activado exitosamente'
            }, status=status.HTTP_200_OK)''',
            '''return DashboardAPIResponse.success(message=f'Usuario {user.username} activado exitosamente')'''
        ),
        (
            '''return Response({
                'error': False,
                'message': f'Usuario {user.username} desactivado exitosamente'
            }, status=status.HTTP_200_OK)''',
            '''return DashboardAPIResponse.success(message=f'Usuario {user.username} desactivado exitosamente')'''
        ),
        # Fix permissions update
        (
            '''return Response({
                'error': False,
                'message': 'Permisos actualizados exitosamente',
                'permissions': DashboardPermissionSerializer(dashboard_permission).data
            }, status=status.HTTP_200_OK)''',
            '''return DashboardAPIResponse.success({
                'permissions': DashboardPermissionSerializer(dashboard_permission).data
            }, message='Permisos actualizados exitosamente')'''
        ),
    ]
    
    for old, new in manual_fixes:
        content = content.replace(old, new)
    
    # Write the updated content back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("Fixed all remaining Response patterns in dashboard/views.py")


if __name__ == '__main__':
    fix_dashboard_responses()