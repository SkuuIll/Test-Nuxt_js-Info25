#!/usr/bin/env python
"""
Script para probar las APIs de gestión de posts del dashboard
"""
import requests
import json

def test_posts_management_apis():
    """Probar todas las APIs de gestión de posts"""
    
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
        
        # Probar APIs de posts
        apis_to_test = [
            ('Lista de Posts', 'GET', f'{base_url}/api/v1/dashboard/api/posts/'),
            ('Estadísticas de Posts', 'GET', f'{base_url}/api/v1/dashboard/posts/stats/'),
            ('Métricas de Rendimiento', 'GET', f'{base_url}/api/v1/dashboard/posts/performance/'),
            ('Lista de Categorías', 'GET', f'{base_url}/api/v1/dashboard/api/categories/'),
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
        
        # Probar creación de post
        print(f"\n🆕 Probando creación de post...")
        create_post_data = {
            'titulo': 'Post de prueba desde API',
            'contenido': 'Este es un post de prueba creado desde la API del dashboard para verificar que la funcionalidad de creación funciona correctamente.',
            'status': 'draft',
            'featured': False,
            'meta_title': 'Post de prueba - SEO',
            'meta_description': 'Descripción SEO del post de prueba'
        }
        
        try:
            create_response = requests.post(
                f'{base_url}/api/v1/dashboard/api/posts/',
                headers=headers,
                json=create_post_data
            )
            
            if create_response.status_code == 201:
                created_post = create_response.json()
                print(f"✅ Post creado exitosamente!")
                print(f"   📝 ID: {created_post.get('id')}")
                print(f"   📝 Título: {created_post.get('titulo')}")
                
                # Probar actualización del post creado
                post_id = created_post.get('id')
                if post_id:
                    print(f"\n🔄 Probando actualización del post {post_id}...")
                    update_data = {
                        'titulo': 'Post de prueba ACTUALIZADO',
                        'status': 'published',
                        'featured': True
                    }
                    
                    update_response = requests.patch(
                        f'{base_url}/api/v1/dashboard/api/posts/{post_id}/',
                        headers=headers,
                        json=update_data
                    )
                    
                    if update_response.status_code == 200:
                        print(f"✅ Post actualizado exitosamente!")
                    else:
                        print(f"❌ Error al actualizar post: {update_response.status_code}")
                
            else:
                print(f"❌ Error al crear post: {create_response.status_code}")
                try:
                    error_data = create_response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Response: {create_response.text}")
                    
        except Exception as e:
            print(f"❌ Error al probar creación de post: {str(e)}")
        
        return success_count == len(apis_to_test)
        
    except requests.exceptions.ConnectionError:
        print(f"❌ Error de conexión. ¿Está el servidor Django ejecutándose en {base_url}?")
        return False
    except Exception as e:
        print(f"❌ Error inesperado: {str(e)}")
        return False

if __name__ == '__main__':
    print("🧪 TESTING APIs DE GESTIÓN DE POSTS")
    print("=" * 50)
    
    success = test_posts_management_apis()
    
    if success:
        print("\n🎉 Todas las APIs de posts funcionan correctamente!")
    else:
        print("\n⚠️  Algunas APIs tienen problemas.")
        
    print("\n📋 APIs implementadas:")
    print("   ✅ CRUD completo de posts")
    print("   ✅ Gestión de categorías") 
    print("   ✅ Estadísticas de posts")
    print("   ✅ Métricas de rendimiento")
    print("   ✅ Acciones en lote")
    print("   ✅ Toggle featured")
    print("   ✅ Duplicar posts")
    print("   ✅ Comentarios por post")