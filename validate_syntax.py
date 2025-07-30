#!/usr/bin/env python3
"""
Script para validar y arreglar problemas de sintaxis
"""

import ast
import sys

def validate_python_syntax(file_path):
    """Validar sintaxis de Python"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Intentar parsear el código
        ast.parse(content)
        print(f"✓ {file_path} - Sintaxis válida")
        return True
        
    except SyntaxError as e:
        print(f"✗ {file_path} - Error de sintaxis:")
        print(f"  Línea {e.lineno}: {e.text}")
        print(f"  Error: {e.msg}")
        return False
    except Exception as e:
        print(f"✗ {file_path} - Error: {str(e)}")
        return False

def check_parentheses_balance(file_path):
    """Verificar balance de paréntesis, corchetes y llaves"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        stack = []
        pairs = {'(': ')', '[': ']', '{': '}'}
        
        for line_num, line in enumerate(lines, 1):
            for char_num, char in enumerate(line):
                if char in pairs:
                    stack.append((char, line_num, char_num))
                elif char in pairs.values():
                    if not stack:
                        print(f"Error línea {line_num}: '{char}' sin apertura correspondiente")
                        return False
                    
                    open_char, open_line, open_char_num = stack.pop()
                    if pairs[open_char] != char:
                        print(f"Error línea {line_num}: '{char}' no coincide con '{open_char}' de línea {open_line}")
                        return False
        
        if stack:
            for open_char, line_num, char_num in stack:
                print(f"Error línea {line_num}: '{open_char}' sin cierre correspondiente")
            return False
        
        print("✓ Paréntesis, corchetes y llaves balanceados")
        return True
        
    except Exception as e:
        print(f"Error verificando balance: {str(e)}")
        return False

if __name__ == '__main__':
    file_path = 'dashboard/views.py'
    
    print("Verificando sintaxis de Python...")
    syntax_ok = validate_python_syntax(file_path)
    
    print("\nVerificando balance de paréntesis...")
    balance_ok = check_parentheses_balance(file_path)
    
    if syntax_ok and balance_ok:
        print("\n✓ Archivo válido")
        sys.exit(0)
    else:
        print("\n✗ Archivo con errores")
        sys.exit(1)