#!/usr/bin/env python3

"""
Script to fix syntax errors in dashboard/views.py
"""

import re

def fix_dashboard_syntax():
    """Fix syntax errors in dashboard views"""
    
    # Read the file
    with open('dashboard/views.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix incomplete str(e) patterns
    content = re.sub(r"f'([^']*): \{str\(e\n\s*\)\}\}'", r"f'\1: {str(e)}'", content)
    
    # Fix incomplete str(e patterns without closing parenthesis
    content = re.sub(r"f'([^']*): \{str\(e$", r"f'\1: {str(e)}'", content, flags=re.MULTILINE)
    
    # Fix patterns like: 'message': f'Error...: {str(e
    content = re.sub(r"'message': f'([^']*): \{str\(e$", r"'message': f'\1: {str(e)}'", content, flags=re.MULTILINE)
    
    # Remove extra closing braces and parentheses
    content = re.sub(r'\s*\)\}\}\'$', '', content, flags=re.MULTILINE)
    content = re.sub(r'\s*\}\)\'$', '', content, flags=re.MULTILINE)
    
    # Fix specific patterns found in the file
    patterns_to_fix = [
        (r"'message': f'([^']*): \{str\(e\n\s*\)\}\}'", r"'message': f'\1: {str(e)}'"),
        (r"'data': message=f'([^']*)'", r"'message': f'\1'"),
        (r"'data': message=f'([^']*)'", r"'message': f'\1'"),
        (r"\n\s*\)\}\}'\n\s*\}, status=", r"'\n            }, status="),
    ]
    
    for pattern, replacement in patterns_to_fix:
        content = re.sub(pattern, replacement, content, flags=re.MULTILINE | re.DOTALL)
    
    # Fix specific malformed lines
    specific_fixes = [
        # Fix incomplete str(e patterns
        ("'message': f'Error al obtener comentarios: {str(e", "'message': f'Error al obtener comentarios: {str(e)}'"),
        ("'message': f'Error al obtener posts por categoría: {str(e", "'message': f'Error al obtener posts por categoría: {str(e)}'"),
        ("'message': f'Error al activar usuario: {str(e", "'message': f'Error al activar usuario: {str(e)}'"),
        ("'message': f'Error al desactivar usuario: {str(e", "'message': f'Error al desactivar usuario: {str(e)}'"),
        ("'message': f'Error al obtener actividad: {str(e", "'message': f'Error al obtener actividad: {str(e)}'"),
        ("'message': f'Error al obtener estadísticas: {str(e", "'message': f'Error al obtener estadísticas: {str(e)}'"),
        ("'message': f'Error al aprobar comentario: {str(e", "'message': f'Error al aprobar comentario: {str(e)}'"),
        ("'message': f'Error al rechazar comentario: {str(e", "'message': f'Error al rechazar comentario: {str(e)}'"),
        ("'message': f'Error al obtener comentarios pendientes: {str(e", "'message': f'Error al obtener comentarios pendientes: {str(e)}'"),
        ("'message': f'Error al obtener respuestas: {str(e", "'message': f'Error al obtener respuestas: {str(e)}'"),
        ("'message': f'Error al obtener estadísticas de posts: {str(e", "'message': f'Error al obtener estadísticas de posts: {str(e)}'"),
        ("'message': f'Error al obtener estadísticas del post: {str(e", "'message': f'Error al obtener estadísticas del post: {str(e)}'"),
        ("'message': f'Error al obtener métricas de posts: {str(e", "'message': f'Error al obtener métricas de posts: {str(e)}'"),
        ("'message': f'Error al obtener estadísticas de comentarios: {str(e", "'message': f'Error al obtener estadísticas de comentarios: {str(e)}'"),
        ("'message': f'Error al obtener cola de moderación: {str(e", "'message': f'Error al obtener cola de moderación: {str(e)}'"),
        ("'message': f'Error al obtener métricas de comentarios: {str(e", "'message': f'Error al obtener métricas de comentarios: {str(e)}'"),
        
        # Fix malformed data/message patterns
        ("'data': message=f'Usuario", "'message': f'Usuario"),
        
        # Remove extra closing patterns
        ("            })}'", ""),
        ("            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)\n            })}'", ""),
    ]
    
    for old, new in specific_fixes:
        content = content.replace(old, new)
    
    # Remove duplicate closing braces and fix structure
    content = re.sub(r'\n\s*\)\}\}\'[^\n]*\n\s*\}, status=', '\n            }, status=', content)
    
    # Write the fixed content back
    with open('dashboard/views.py', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Fixed syntax errors in dashboard/views.py")

if __name__ == "__main__":
    fix_dashboard_syntax()