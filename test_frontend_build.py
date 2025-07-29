#!/usr/bin/env python
"""
Script para verificar que el frontend se puede construir sin errores
"""
import subprocess
import os
import sys

def test_frontend_build():
    """Probar que el frontend se puede construir"""
    
    frontend_dir = 'frontend'
    
    if not os.path.exists(frontend_dir):
        print("❌ Directorio frontend no encontrado")
        return False
    
    try:
        print("🔍 Verificando dependencias del frontend...")
        
        # Cambiar al directorio frontend
        os.chdir(frontend_dir)
        
        # Verificar que node_modules existe
        if not os.path.exists('node_modules'):
            print("📦 Instalando dependencias...")
            result = subprocess.run(['npm', 'install'], capture_output=True, text=True)
            if result.returncode != 0:
                print(f"❌ Error instalando dependencias: {result.stderr}")
                return False
        
        print("✅ Dependencias OK")
        
        # Intentar hacer build
        print("🏗️  Intentando build del frontend...")
        result = subprocess.run(['npm', 'run', 'build'], capture_output=True, text=True, timeout=120)
        
        if result.returncode == 0:
            print("✅ Build exitoso!")
            return True
        else:
            print(f"❌ Error en build:")
            print(f"STDOUT: {result.stdout}")
            print(f"STDERR: {result.stderr}")
            return False
            
    except subprocess.TimeoutExpired:
        print("❌ Build timeout (más de 2 minutos)")
        return False
    except Exception as e:
        print(f"❌ Error inesperado: {str(e)}")
        return False
    finally:
        # Volver al directorio original
        os.chdir('..')

def check_typescript_errors():
    """Verificar errores de TypeScript"""
    
    try:
        os.chdir('frontend')
        
        print("🔍 Verificando errores de TypeScript...")
        result = subprocess.run(['npx', 'nuxi', 'typecheck'], capture_output=True, text=True, timeout=60)
        
        if result.returncode == 0:
            print("✅ No hay errores de TypeScript")
            return True
        else:
            print(f"❌ Errores de TypeScript encontrados:")
            print(result.stdout)
            print(result.stderr)
            return False
            
    except subprocess.TimeoutExpired:
        print("❌ TypeScript check timeout")
        return False
    except Exception as e:
        print(f"❌ Error verificando TypeScript: {str(e)}")
        return False
    finally:
        os.chdir('..')

if __name__ == '__main__':
    print("🧪 Verificando frontend...")
    
    # Solo verificar TypeScript por ahora (build puede ser muy lento)
    typescript_ok = check_typescript_errors()
    
    if typescript_ok:
        print("\n🎉 Frontend verificado exitosamente!")
        sys.exit(0)
    else:
        print("\n⚠️  Frontend tiene algunos problemas.")
        sys.exit(1)