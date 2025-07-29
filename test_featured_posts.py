#!/usr/bin/env python
"""
Script para probar el endpoint de posts destacados
"""
import requests
import json

def test_featured_posts():
    """Probar el endpoint de posts destacados"""
    
    base_url = 'http://localhost:8000'
    featured_url = f'{base_url}/api/v1/posts/featured/'
    
    try:
        print(f"🔍 Probando posts destacados en: {featured_url}")
        
        response = requests.get(featured_url)
        
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Posts destacados obtenidos exitosamente!")
            print(f"📋 Cantidad de posts: {len(data)}")
            
            if data:
                print(f"📋 Primer post:")
                first_post = data[0]
                print(f"   - ID: {first_post.get('id')}")
                print(f"   - Título: {first_post.get('titulo')}")
                print(f"   - Featured: {first_post.get('featured')}")
                print(f"   - Status: {first_post.get('status')}")
            else:
                print("ℹ️  No hay posts destacados")
                
        else:
            print(f"❌ Error al obtener posts destacados!")
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

def test_posts_list():
    """Probar el endpoint de lista de posts"""
    
    base_url = 'http://localhost:8000'
    posts_url = f'{base_url}/api/v1/posts/'
    
    try:
        print(f"\n🔍 Probando lista de posts en: {posts_url}")
        
        response = requests.get(posts_url)
        
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Lista de posts obtenida exitosamente!")
            print(f"📋 Total de posts: {data.get('count', 'N/A')}")
            print(f"📋 Posts en esta página: {len(data.get('results', []))}")
                
        else:
            print(f"❌ Error al obtener lista de posts!")
            try:
                error_data = response.json()
                print(f"📋 Error data:")
                print(json.dumps(error_data, indent=2, ensure_ascii=False))
            except:
                print(f"📋 Response text: {response.text}")
        
    except Exception as e:
        print(f"❌ Error inesperado: {str(e)}")

if __name__ == '__main__':
    test_featured_posts()
    test_posts_list()