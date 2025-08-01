#!/usr/bin/env python
"""
Script para iniciar ambos servidores (backend y frontend) y verificar conectividad
"""
import os
import subprocess
import sys
import time
import threading
import requests
from urllib.parse import urljoin

def run_command_in_background(command, cwd=None, name="Process"):
    """Ejecuta un comando en segundo plano"""
    def run():
        try:
            print(f"Iniciando {name}...")
            process = subprocess.Popen(
                command,
                shell=True,
                cwd=cwd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                universal_newlines=True
            )
            
            # Leer output línea por línea
            for line in iter(process.stdout.readline, ''):
                if line.strip():
                    print(f"[{name}] {line.strip()}")
                    
        except Exception as e:
            print(f"Error en {name}: {e}")
    
    thread = threading.Thread(target=run, daemon=True)
    thread.start()
    return thread

def check_server(url, name, max_attempts=30):
    """Verifica si un servidor está respondiendo"""
    print(f"Verificando {name} en {url}...")
    
    for attempt in range(max_attempts):
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                print(f"{name} está funcionando correctamente!")
                return True
        except requests.exceptions.RequestException:
            pass
        
        if attempt < max_attempts - 1:
            print(f"Intento {attempt + 1}/{max_attempts} - Esperando {name}...")
            time.sleep(2)
    
    print(f"{name} no está respondiendo después de {max_attempts} intentos")
    return False

def test_api_connectivity():
    """Prueba la conectividad de la API"""
    print("\nProbando conectividad de la API...")
    
    # Test endpoints básicos con las rutas correctas
    endpoints = [
        ('/api/v1/posts/', 'Posts endpoint'),
        ('/api/v1/categories/', 'Categories endpoint'),
        ('/api/v1/health/', 'Health check'),
        ('/api/v1/comments/', 'Comments endpoint')
    ]
    
    base_url = 'http://localhost:8000'
    
    for endpoint, description in endpoints:
        try:
            url = urljoin(base_url, endpoint)
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                print(f"{description}: OK")
            else:
                print(f"{description}: HTTP {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print(f"{description}: Error - {e}")

def main():
    print("Iniciando servidores del proyecto...")
    print("=" * 50)
    
    # Verificar que estamos en el directorio correcto
    if not os.path.exists('manage.py'):
        print("Error: No se encontró manage.py. Ejecuta este script desde la raíz del proyecto.")
        sys.exit(1)
    
    if not os.path.exists('frontend/package.json'):
        print("Error: No se encontró frontend/package.json.")
        sys.exit(1)
    
    # Iniciar backend Django
    backend_thread = run_command_in_background(
        "python manage.py runserver 8000",
        name="Backend Django"
    )
    
    # Esperar un poco antes de iniciar el frontend
    time.sleep(3)
    
    # Iniciar frontend Nuxt
    frontend_thread = run_command_in_background(
        "npm run dev",
        cwd="frontend",
        name="Frontend Nuxt"
    )
    
    # Esperar a que los servidores se inicien
    print("\nEsperando a que los servidores se inicien...")
    time.sleep(10)
    
    # Verificar backend con el endpoint correcto
    backend_ok = check_server('http://localhost:8000/api/v1/posts/', 'Backend Django')
    
    # Verificar frontend
    frontend_ok = check_server('http://localhost:3000', 'Frontend Nuxt')
    
    if backend_ok and frontend_ok:
        print("\n¡Ambos servidores están funcionando correctamente!")
        
        # Probar conectividad de la API
        test_api_connectivity()
        
        print("\nResumen:")
        print("Backend Django: http://localhost:8000")
        print("Frontend Nuxt: http://localhost:3000")
        print("API disponible en: http://localhost:8000/api/")
        
        print("\nPara detener los servidores, presiona Ctrl+C")
        
        try:
            # Mantener el script corriendo
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\nDeteniendo servidores...")
            
    else:
        print("\nAlgunos servidores no se iniciaron correctamente.")
        print("\nVerifica los logs arriba para más detalles.")

if __name__ == '__main__':
    main()