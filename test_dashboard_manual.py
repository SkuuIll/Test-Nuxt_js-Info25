#!/usr/bin/env python
"""
Script para verificar manualmente que el dashboard funciona
"""
import webbrowser
import time
import requests

def check_servers():
    """Verificar que los servidores estén ejecutándose"""
    
    print("🔍 Verificando servidores...")
    
    # Verificar Django
    try:
        response = requests.get('http://localhost:8000/api/v1/', timeout=5)
        if response.status_code == 200:
            print("✅ Django backend: OK (puerto 8000)")
        else:
            print(f"❌ Django backend: HTTP {response.status_code}")
            return False
    except requests.exceptions.RequestException:
        print("❌ Django backend: No responde (¿está ejecutándose en puerto 8000?)")
        return False
    
    # Verificar Nuxt
    try:
        response = requests.get('http://localhost:3001/', timeout=5)
        if response.status_code == 200:
            print("✅ Nuxt frontend: OK (puerto 3001)")
        else:
            print(f"❌ Nuxt frontend: HTTP {response.status_code}")
            return False
    except requests.exceptions.RequestException:
        print("❌ Nuxt frontend: No responde (¿está ejecutándose en puerto 3001?)")
        return False
    
    return True

def test_dashboard_login():
    """Probar el login del dashboard"""
    
    print("\n🔐 Probando login del dashboard...")
    
    login_url = 'http://localhost:8000/api/v1/dashboard/auth/login/'
    credentials = {
        'username': 'admin',
        'password': 'admin123'
    }
    
    try:
        response = requests.post(login_url, json=credentials)
        if response.status_code == 200:
            data = response.json()
            if not data.get('error'):
                print("✅ Login del dashboard: OK")
                return True
            else:
                print(f"❌ Login del dashboard: {data.get('message')}")
                return False
        else:
            print(f"❌ Login del dashboard: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Login del dashboard: Error - {str(e)}")
        return False

def open_dashboard():
    """Abrir el dashboard en el navegador"""
    
    print("\n🌐 Abriendo dashboard en el navegador...")
    
    urls = [
        'http://localhost:3001/dashboard/login',
        'http://localhost:3001/dashboard',
        'http://localhost:3001/dashboard/stats'
    ]
    
    for url in urls:
        print(f"📂 Abriendo: {url}")
        webbrowser.open(url)
        time.sleep(1)

def print_instructions():
    """Imprimir instrucciones para el usuario"""
    
    print("\n📋 Instrucciones para probar el dashboard:")
    print("=" * 50)
    print("1. 🔐 Login:")
    print("   - Usuario: admin")
    print("   - Contraseña: admin123")
    print()
    print("2. 🧪 Funcionalidades a probar:")
    print("   - ✅ Login sin parpadeo")
    print("   - ✅ Navegación entre páginas")
    print("   - ✅ Estadísticas en dashboard principal")
    print("   - ✅ Página de estadísticas detalladas")
    print("   - ✅ Menú de usuario (esquina superior derecha)")
    print("   - ✅ Notificaciones")
    print("   - ✅ Logout")
    print()
    print("3. 🐛 Reportar problemas:")
    print("   - Abrir consola del navegador (F12)")
    print("   - Buscar errores en rojo")
    print("   - Verificar que no hay errores 404 o 500")
    print()
    print("4. 📊 URLs importantes:")
    print("   - Dashboard: http://localhost:3001/dashboard")
    print("   - Login: http://localhost:3001/dashboard/login")
    print("   - Stats: http://localhost:3001/dashboard/stats")
    print("   - API: http://localhost:8000/api/v1/")

if __name__ == '__main__':
    print("🧪 Verificación manual del dashboard")
    print("=" * 40)
    
    # Verificar servidores
    if not check_servers():
        print("\n❌ Los servidores no están ejecutándose correctamente.")
        print("\n📝 Para iniciar los servidores:")
        print("   Backend: python manage.py runserver")
        print("   Frontend: cd frontend && npm run dev")
        exit(1)
    
    # Probar login
    if not test_dashboard_login():
        print("\n❌ El login del dashboard no funciona.")
        print("   Ejecuta: python create_dashboard_user.py")
        exit(1)
    
    # Abrir dashboard
    open_dashboard()
    
    # Mostrar instrucciones
    print_instructions()
    
    print("\n🎉 ¡Dashboard listo para probar!")
    print("   Revisa las ventanas del navegador que se abrieron.")