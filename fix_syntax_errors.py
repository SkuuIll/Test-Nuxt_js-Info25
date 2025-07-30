#!/usr/bin/env python3
"""
Script para arreglar errores de sintaxis en dashboard/views.py
"""

import re

def fix_syntax_errors():
    """Arreglar errores de sintaxis en dashboard/views.py"""
    
    file_path = 'dashboard/views.py'
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Patrón para encontrar líneas mal formateadas
    # Buscar patrones como: return DashboardAPIResponse.error('mensaje'\n            , status_code=HTTPStatus.400)
    pattern = r"return DashboardAPIResponse\.error\('([^']+)'\s*\n\s*,\s*status_code=HTTPStatus\.(\d+)\)"
    
    def replacement(match):
        message = match.group(1)
        status_code = match.group(2)
        
        # Mapear códigos de estado
        status_map = {
            '400': 'BAD_REQUEST',
            '401': 'UNAUTHORIZED',
            '403': 'FORBIDDEN',
            '404': 'NOT_FOUND',
            '500': 'INTERNAL_SERVER_ERROR'
        }
        
        status_name = status_map.get(status_code, 'BAD_REQUEST')
        
        return f"""return DashboardAPIResponse.error(
                '{message}',
                status_code=HTTPStatus.{status_name}
            )"""
    
    # Aplicar el reemplazo
    content = re.sub(pattern, replacement, content, flags=re.MULTILINE)
    
    # También arreglar casos similares con diferentes comillas
    pattern2 = r'return DashboardAPIResponse\.error\("([^"]+)"\s*\n\s*,\s*status_code=HTTPStatus\.(\d+)\)'
    content = re.sub(pattern2, replacement, content, flags=re.MULTILINE)
    
    # Arreglar casos donde la línea está partida de manera diferente
    lines = content.split('\n')
    fixed_lines = []
    i = 0
    
    while i < len(lines):
        line = lines[i]
        
        # Buscar líneas que terminan con una cadena sin cerrar
        if ('return DashboardAPIResponse.error(' in line and 
            line.count("'") % 2 == 1 and 
            i + 1 < len(lines) and 
            ', status_code=HTTPStatus.' in lines[i + 1]):
            
            # Combinar las líneas
            next_line = lines[i + 1].strip()
            
            # Extraer el mensaje y código de estado
            message_part = line.split("'")[1] if "'" in line else line.split('"')[1]
            status_part = next_line.split('HTTPStatus.')[1].rstrip(')')
            
            # Mapear el código
            status_map = {
                '400': 'BAD_REQUEST',
                '401': 'UNAUTHORIZED', 
                '403': 'FORBIDDEN',
                '404': 'NOT_FOUND',
                '500': 'INTERNAL_SERVER_ERROR'
            }
            
            status_name = status_map.get(status_part, 'BAD_REQUEST')
            
            # Crear la línea corregida
            indent = len(line) - len(line.lstrip())
            fixed_line = ' ' * indent + f"return DashboardAPIResponse.error("
            fixed_lines.append(fixed_line)
            fixed_lines.append(' ' * (indent + 4) + f"'{message_part}',")
            fixed_lines.append(' ' * (indent + 4) + f"status_code=HTTPStatus.{status_name}")
            fixed_lines.append(' ' * indent + ")")
            
            i += 2  # Saltar la siguiente línea ya que la procesamos
        else:
            fixed_lines.append(line)
            i += 1
    
    content = '\n'.join(fixed_lines)
    
    # Escribir el archivo corregido
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("Errores de sintaxis corregidos en dashboard/views.py")

if __name__ == '__main__':
    fix_syntax_errors()