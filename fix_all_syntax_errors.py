#!/usr/bin/env python3
"""
Script para arreglar todos los errores de sintaxis en dashboard/views.py
"""

import re

def fix_all_syntax_errors():
    """Arreglar todos los errores de sintaxis"""
    
    file_path = 'dashboard/views.py'
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Patrón 1: return DashboardAPIResponse.success(message='...', 'key': value)
    # Esto es inválido porque un argumento posicional no puede seguir a uno con nombre
    pattern1 = r"return DashboardAPIResponse\.success\(message='([^']+)',\s*'([^']+)':\s*([^)]+)\)"
    
    def replacement1(match):
        message = match.group(1)
        key = match.group(2)
        value = match.group(3)
        
        return f"""return DashboardAPIResponse.success({{
                '{key}': {value}
            }}, message='{message}')"""
    
    content = re.sub(pattern1, replacement1, content, flags=re.MULTILINE)
    
    # Patrón 2: return DashboardAPIResponse.success(data, 'key': value)
    pattern2 = r"return DashboardAPIResponse\.success\(([^,]+),\s*'([^']+)':\s*([^)]+)\)"
    
    def replacement2(match):
        data = match.group(1)
        key = match.group(2)
        value = match.group(3)
        
        return f"""return DashboardAPIResponse.success({{
                'data': {data},
                '{key}': {value}
            }})"""
    
    content = re.sub(pattern2, replacement2, content, flags=re.MULTILINE)
    
    # Patrón 3: Líneas partidas con argumentos mal ordenados
    lines = content.split('\n')
    fixed_lines = []
    i = 0
    
    while i < len(lines):
        line = lines[i].strip()
        
        # Buscar patrones problemáticos
        if ('return DashboardAPIResponse.success(' in line and 
            'message=' in line and 
            i + 1 < len(lines) and 
            "'" in lines[i + 1] and ':' in lines[i + 1]):
            
            # Línea problemática encontrada
            next_line = lines[i + 1].strip()
            
            # Extraer componentes
            if "message='" in line:
                message_start = line.find("message='") + 9
                message_end = line.find("'", message_start)
                message = line[message_start:message_end]
                
                # Extraer key:value de la siguiente línea
                if "'" in next_line and ':' in next_line:
                    key_start = next_line.find("'") + 1
                    key_end = next_line.find("'", key_start)
                    key = next_line[key_start:key_end]
                    
                    value_start = next_line.find(':') + 1
                    value_end = next_line.rfind(')')
                    value = next_line[value_start:value_end].strip()
                    
                    # Crear línea corregida
                    indent = len(lines[i]) - len(lines[i].lstrip())
                    fixed_line = ' ' * indent + f"return DashboardAPIResponse.success({{"
                    fixed_lines.append(fixed_line)
                    fixed_lines.append(' ' * (indent + 4) + f"'{key}': {value}")
                    fixed_lines.append(' ' * indent + f"}}, message='{message}')")
                    
                    i += 2  # Saltar la siguiente línea
                    continue
        
        fixed_lines.append(lines[i])
        i += 1
    
    content = '\n'.join(fixed_lines)
    
    # Escribir el archivo corregido
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("Todos los errores de sintaxis corregidos")

if __name__ == '__main__':
    fix_all_syntax_errors()