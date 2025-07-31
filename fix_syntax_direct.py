#!/usr/bin/env python3

"""
Direct fix for all syntax errors in dashboard/views.py
"""

import re

def fix_syntax_direct():
    """Fix all syntax errors directly"""
    
    # Read the file
    with open('dashboard/views.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix all patterns with extra closing braces/parentheses
    content = re.sub(r"'message': f'([^']*): \{str\(e\)\}'\)\}\'\n\n\s*\}, status=", 
                     r"'message': f'\1: {str(e)}'\n            }, status=", content)
    
    content = re.sub(r"'message': f'([^']*): \{str\(e\)\}'\)\}\'\n\s*\}, status=", 
                     r"'message': f'\1: {str(e)}'\n            }, status=", content)
    
    # Fix incomplete str(e) patterns
    content = re.sub(r"'message': f'([^']*): \{str\(e\n\s*\)\}\}'", 
                     r"'message': f'\1: {str(e)}'", content)
    
    # Fix malformed closing patterns
    content = re.sub(r"str\(e\)\}'\)\}\'\n\n\s*\}, status=", 
                     r"str(e)}'\n            }, status=", content)
    
    # Fix specific patterns found in the file
    fixes = [
        (r"'message': f'([^']*): \{str\(e\)\}'\)\}\'\n\n\s*\}, status=", r"'message': f'\1: {str(e)}'\n            }, status="),
        (r"'message': f'([^']*): \{str\(e\)\}'\)\}\'\n\s*\}, status=", r"'message': f'\1: {str(e)}'\n            }, status="),
        (r"'data': message=f'([^']*)'", r"'message': f'\1'"),
        (r"\n\s*\)\}\}'\n\s*\}, status=", r"\n            }, status="),
        (r"str\(e\)\}'\)\}\'\n\n\s*\}", r"str(e)}'\n            }"),
    ]
    
    for pattern, replacement in fixes:
        content = re.sub(pattern, replacement, content, flags=re.MULTILINE | re.DOTALL)
    
    # Manual fixes for specific problematic lines
    manual_fixes = [
        ("'message': f'Error al obtener comentarios: {str(e)}')}'", "'message': f'Error al obtener comentarios: {str(e)}'"),
        ("'message': f'Error al obtener posts por categoría: {str(e)}')}'", "'message': f'Error al obtener posts por categoría: {str(e)}'"),
        ("'message': f'Error al activar usuario: {str(e)}')}'", "'message': f'Error al activar usuario: {str(e)}'"),
        ("'message': f'Error al desactivar usuario: {str(e)}')}'", "'message': f'Error al desactivar usuario: {str(e)}'"),
        ("'message': f'Error al obtener actividad: {str(e)}')}'", "'message': f'Error al obtener actividad: {str(e)}'"),
        ("'message': f'Error al obtener estadísticas: {str(e)}')}'", "'message': f'Error al obtener estadísticas: {str(e)}'"),
        ("'message': f'Error al aprobar comentario: {str(e)}')}'", "'message': f'Error al aprobar comentario: {str(e)}'"),
        ("'message': f'Error al rechazar comentario: {str(e)}')}'", "'message': f'Error al rechazar comentario: {str(e)}'"),
        ("'message': f'Error al obtener comentarios pendientes: {str(e)}')}'", "'message': f'Error al obtener comentarios pendientes: {str(e)}'"),
        ("'message': f'Error al obtener respuestas: {str(e)}')}'", "'message': f'Error al obtener respuestas: {str(e)}'"),
        ("'message': f'Error al obtener estadísticas de posts: {str(e)}')}'", "'message': f'Error al obtener estadísticas de posts: {str(e)}'"),
        ("'message': f'Error al obtener estadísticas del post: {str(e)}')}'", "'message': f'Error al obtener estadísticas del post: {str(e)}'"),
        ("'message': f'Error al obtener métricas de posts: {str(e)}')}'", "'message': f'Error al obtener métricas de posts: {str(e)}'"),
        ("'message': f'Error al obtener estadísticas de comentarios: {str(e)}')}'", "'message': f'Error al obtener estadísticas de comentarios: {str(e)}'"),
        ("'message': f'Error al obtener cola de moderación: {str(e)}')}'", "'message': f'Error al obtener cola de moderación: {str(e)}'"),
        ("'message': f'Error al obtener métricas de comentarios: {str(e)}')}'", "'message': f'Error al obtener métricas de comentarios: {str(e)}'"),
        ("'data': message=f'Usuario", "'message': f'Usuario"),
    ]
    
    for old, new in manual_fixes:
        content = content.replace(old, new)
    
    # Remove orphaned closing patterns
    content = re.sub(r'\n\s*\)\}\}\'[^\n]*\n', '\n', content)
    content = re.sub(r'\n\s*\}\)\'[^\n]*\n', '\n', content)
    
    # Write the fixed content back
    with open('dashboard/views.py', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Applied direct syntax fixes to dashboard/views.py")

if __name__ == "__main__":
    fix_syntax_direct()