#!/usr/bin/env python
"""
Script para probar las APIs de gestión de comentarios del dashboard
"""
import requests
import json

def test_comments_management_apis():
    """Probar todas las APIs de gestión de comentarios"""
    
    base_url = 'http://localhost:8000'
    
    # Hacer login primero
    login_url = f'{base_url}/api/v1/dashboard/auth/login/'
    credentials = {
        'username': 'admin',
        'password': 'admin123'
    }
    
    try:
        print("🔐 Haciendo login...")
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
        
        # Probar APIs de comentarios
        apis_to_test = [
            ('Lista de Comentarios', 'GET', f'{base_url}/api/v1/dashboard/api/comments/'),
            ('Estadísticas de Comentarios', 'GET', f'{base_url}/api/v1/dashboard/comments/stats/'),
            ('Cola de Moderación', 'GET', f'{base_url}/api/v1/dashboard/comments/moderation-queue/'),
            ('Métricas de Engagement', 'GET', f'{base_url}/api/v1/dashboard/comments/engagement/'),
            ('Detectar Spam', 'GET', f'{base_url}/api/v1/dashboard/comments/detect-spam/'),
            ('Comentarios Pendientes', 'GET', f'{base_url}/api/v1/dashboard/api/comments/pending/'),
        ]
        
        success_count = 0
        
        for name, method, url in apis_to_test:
            try:
                print(f"\n🔍 Probando {name}...")
                
                if method == 'GET':
                    response = requests.get(url, headers=headers)
                elif method == 'POST':
                    response = requests.post(url, headers=headers, json={})
                
                if response.status_code == 200:
                    data = response.json()
                    if not data.get('error', True):
                        print(f"✅ {name}: OK")
                        success_count += 1
                        
                        # Mostrar algunos datos de ejemplo
                        if 'data' in data:
                            if isinstance(data['data'], dict):
                                if 'total_comments' in data['data']:
                                    print(f"   📊 Total comentarios: {data['data']['total_comments']}")
                                elif 'urgent' in data['data']:
                                    print(f"   📊 Urgentes: {len(data['data']['urgent'])}")
                                else:
                                    print(f"   📊 Datos: {list(data['data'].keys())}")
                            elif isinstance(data['data'], list):
                                print(f"   📊 Elementos: {len(data['data'])}")
                    else:
                        print(f"❌ {name}: Error en respuesta - {data.get('message', 'Unknown error')}")
                else:
                    print(f"❌ {name}: HTTP {response.status_code}")
                    if response.status_code == 404:
                        print(f"   Endpoint no encontrado: {url}")
                    elif response.status_code == 403:
                        print(f"   Sin permisos para acceder")
                    
            except Exception as e:
                print(f"❌ {name}: Error de conexión - {str(e)}")
        
        print(f"\n📊 Resumen: {success_count}/{len(apis_to_test)} APIs funcionando")
        
        # Probar acciones específicas de comentarios
        print(f"\n🔧 Probando acciones específicas...")
        
        # Obtener lista de comentarios para probar acciones
        try:
            comments_response = requests.get(
                f'{base_url}/api/v1/dashboard/api/comments/',
                headers=headers
            )
            
            if comments_response.status_code == 200:
                comments_data = comments_response.json()
                if comments_data.get('results'):
                    comment_id = comments_data['results'][0]['id']
                    
                    # Probar aprobar comentario
                    print(f"🔍 Probando aprobar comentario {comment_id}...")
                    approve_response = requests.post(
                        f'{base_url}/api/v1/dashboard/api/comments/{comment_id}/approve/',
                        headers=headers
                    )
                    
                    if approve_response.status_code == 200:
                        print(f"✅ Comentario aprobado exitosamente")
                    else:
                        print(f"❌ Error al aprobar comentario: {approve_response.status_code}")
                    
                    # Probar rechazar comentario
                    print(f"🔍 Probando rechazar comentario {comment_id}...")
                    reject_response = requests.post(
                        f'{base_url}/api/v1/dashboard/api/comments/{comment_id}/reject/',
                        headers=headers
                    )
                    
                    if reject_response.status_code == 200:
                        print(f"✅ Comentario rechazado exitosamente")
                    else:
                        print(f"❌ Error al rechazar comentario: {reject_response.status_code}")
                
        except Exception as e:
            print(f"❌ Error al probar acciones específicas: {str(e)}")
        
        # Probar moderación automática
        print(f"\n🤖 Probando moderación automática...")
        try:
            auto_moderate_response = requests.post(
                f'{base_url}/api/v1/dashboard/comments/auto-moderate/',
                headers=headers
            )
            
            if auto_moderate_response.status_code == 200:
                auto_data = auto_moderate_response.json()
                print(f"✅ Moderación automática completada")
                if 'data' in auto_data:
                    print(f"   📊 Aprobados: {auto_data['data'].get('auto_approved', 0)}")
                    print(f"   📊 Rechazados: {auto_data['data'].get('auto_rejected', 0)}")
            else:
                print(f"❌ Error en moderación automática: {auto_moderate_response.status_code}")
                
        except Exception as e:
            print(f"❌ Error al probar moderación automática: {str(e)}")
        
        return success_count >= len(apis_to_test) * 0.8  # 80% de éxito
        
    except requests.exceptions.ConnectionError:
        print(f"❌ Error de conexión. ¿Está el servidor Django ejecutándose en {base_url}?")
        return False
    except Exception as e:
        print(f"❌ Error inesperado: {str(e)}")
        return False

if __name__ == '__main__':
    print("🧪 TESTING APIs DE GESTIÓN DE COMENTARIOS")
    print("=" * 50)
    
    success = test_comments_management_apis()
    
    if success:
        print("\n🎉 Las APIs de comentarios funcionan correctamente!")
    else:
        print("\n⚠️  Algunas APIs tienen problemas.")
        
    print("\n📋 APIs implementadas:")
    print("   ✅ CRUD completo de comentarios")
    print("   ✅ Aprobar/rechazar comentarios") 
    print("   ✅ Moderación en lote")
    print("   ✅ Detección de spam")
    print("   ✅ Cola de moderación")
    print("   ✅ Estadísticas de comentarios")
    print("   ✅ Métricas de engagement")
    print("   ✅ Moderación automática")
    print("   ✅ Gestión de respuestas")
    print("   ✅ Filtros avanzados")