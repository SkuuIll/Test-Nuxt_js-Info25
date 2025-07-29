#!/usr/bin/env python
"""
Script para probar el login del dashboard
"""
import requests
import json

def test_dashboard_login():
    """Probar el endpoint de login del dashboard"""
    
    base_url = 'http://localhost:8000'
    login_url = f'{base_url}/api/v1/dashboard/auth/login/'
    
    # Credenciales de prueba
    credentials = {
        'username': 'admin',
        'password': 'admin123'
    }
    
    try:
        print(f"🔍 Probando login en: {login_url}")
        print(f"📝 Credenciales: {credentials['username']}")
        
        response = requests.post(login_url, json=credentials)
        
        print(f"📊 Status Code: {response.status_code}")
        print(f"📄 Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Login exitoso!")
            print(f"📋 Response data:")
            print(json.dumps(data, indent=2, ensure_ascii=False))
            
            # Probar endpoint de stats con el token
            if 'data' in data and 'access' in data['data']:
                access_token = data['data']['access']
                test_stats_endpoint(base_url, access_token)
            
        else:
            print(f"❌ Login falló!")
            try:
                error_data = response.json()
                print(f"📋 Error data:")
                print(json.dumps(error_data, indent=2, ensure_ascii=False))
            except:
                print(f"📋 Response text: {response.text}")
        
    except requests.exceptions.ConnectionError:
        print(f"❌ Error de conexión. ¿Está el servidor Django ejecutándose en {base_url}?")
    except Exception as e:
        print(f"❌ Error inesperado: {str(e)}")

def test_stats_endpoint(base_url, access_token):
    """Probar el endpoint de estadísticas"""
    
    stats_url = f'{base_url}/api/v1/dashboard/stats/summary/'
    
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    try:
        print(f"\n🔍 Probando stats en: {stats_url}")
        
        response = requests.get(stats_url, headers=headers)
        
        print(f"📊 Stats Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Stats obtenidas exitosamente!")
            print(f"📋 Stats data:")
            print(json.dumps(data, indent=2, ensure_ascii=False))
        else:
            print(f"❌ Error al obtener stats!")
            try:
                error_data = response.json()
                print(f"📋 Error data:")
                print(json.dumps(error_data, indent=2, ensure_ascii=False))
            except:
                print(f"📋 Response text: {response.text}")
                
    except Exception as e:
        print(f"❌ Error al probar stats: {str(e)}")

if __name__ == '__main__':
    test_dashboard_login()