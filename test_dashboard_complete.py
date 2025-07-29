#!/usr/bin/env python
"""
Script para probar todos los endpoints del dashboard
"""
import requests
import json

def test_dashboard_endpoints():
    """Probar todos los endpoints del dashboard"""
    
    base_url = 'http://localhost:8000'
    
    # Primero hacer login
    login_url = f'{base_url}/api/v1/dashboard/auth/login/'
    credentials = {
        'username': 'admin',
        'password': 'admin123'
    }
    
    try:
        print("🔐 Probando login del dashboard...")
        login_response = requests.post(login_url, json=credentials)
        
        if login_response.status_code != 200:
            print(f"❌ Error en login: {login_response.status_code}")
            return False
        
        login_data = login_response.json()
        if login_data.get('error'):
            print(f"❌ Error en login: {login_data.get('message')}")
            return False
        
        access_token = login_data['data']['access']
        headers = {'Authorization': f'Bearer {access_token}'}
        
        print("✅ Login exitoso!")
        
        # Endpoints a probar
        endpoints = [
            ('Stats Summary', f'{base_url}/api/v1/dashboard/stats/summary/'),
            ('Stats General', f'{base_url}/api/v1/dashboard/stats/'),
            ('User Stats', f'{base_url}/api/v1/dashboard/stats/users/'),
            ('Content Stats', f'{base_url}/api/v1/dashboard/stats/content/'),
            ('Recent Activity', f'{base_url}/api/v1/dashboard/stats/recent-activity/'),
            ('Popular Posts', f'{base_url}/api/v1/dashboard/stats/popular-posts/'),
        ]
        
        success_count = 0
        total_count = len(endpoints)
        
        for name, url in endpoints:
            try:
                print(f"\n🔍 Probando {name}...")
                response = requests.get(url, headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    if not data.get('error', True):
                        print(f"✅ {name}: OK")
                        success_count += 1
                    else:
                        print(f"❌ {name}: Error en respuesta - {data.get('message', 'Unknown error')}")
                else:
                    print(f"❌ {name}: HTTP {response.status_code}")
                    if response.status_code == 404:
                        print(f"   Endpoint no encontrado: {url}")
                    
            except Exception as e:
                print(f"❌ {name}: Error de conexión - {str(e)}")
        
        print(f"\n📊 Resumen: {success_count}/{total_count} endpoints funcionando")
        
        # Probar endpoints públicos también
        print(f"\n🌐 Probando endpoints públicos...")
        public_endpoints = [
            ('Posts List', f'{base_url}/api/v1/posts/'),
            ('Featured Posts', f'{base_url}/api/v1/posts/featured/'),
            ('Categories', f'{base_url}/api/v1/categories/'),
        ]
        
        public_success = 0
        for name, url in public_endpoints:
            try:
                response = requests.get(url)
                if response.status_code == 200:
                    print(f"✅ {name}: OK")
                    public_success += 1
                else:
                    print(f"❌ {name}: HTTP {response.status_code}")
            except Exception as e:
                print(f"❌ {name}: Error - {str(e)}")
        
        print(f"📊 Endpoints públicos: {public_success}/{len(public_endpoints)} funcionando")
        
        return success_count == total_count and public_success == len(public_endpoints)
        
    except requests.exceptions.ConnectionError:
        print(f"❌ Error de conexión. ¿Está el servidor Django ejecutándose en {base_url}?")
        return False
    except Exception as e:
        print(f"❌ Error inesperado: {str(e)}")
        return False

if __name__ == '__main__':
    success = test_dashboard_endpoints()
    if success:
        print("\n🎉 Todos los endpoints funcionan correctamente!")
    else:
        print("\n⚠️  Algunos endpoints tienen problemas.")