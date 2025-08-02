<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
    <div class="container mx-auto px-4">
      <div class="max-w-6xl mx-auto">
        <h1 class="text-3xl font-bold text-center mb-8">Debug de Imágenes en Posts</h1>
        
        <!-- Loading State -->
        <div v-if="loading" class="text-center py-8">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p class="mt-2 text-gray-600">Cargando posts...</p>
        </div>
        
        <!-- Posts Debug -->
        <div v-else class="space-y-8">
          <!-- Summary -->
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border">
            <h2 class="text-xl font-semibold mb-4">Resumen</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <strong>Total Posts:</strong> {{ posts.length }}
              </div>
              <div>
                <strong>Con Imagen:</strong> {{ postsWithImages }}
              </div>
              <div>
                <strong>Sin Imagen:</strong> {{ postsWithoutImages }}
              </div>
            </div>
          </div>
          
          <!-- Posts List -->
          <div class="space-y-6">
            <div 
              v-for="post in posts" 
              :key="post.id"
              class="bg-white dark:bg-gray-800 rounded-lg p-6 border"
            >
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Post Info -->
                <div>
                  <h3 class="text-lg font-semibold mb-2">{{ post.title || post.titulo }}</h3>
                  <div class="space-y-2 text-sm">
                    <div><strong>ID:</strong> {{ post.id }}</div>
                    <div><strong>Slug:</strong> {{ post.slug }}</div>
                    <div><strong>image_url:</strong> 
                      <code class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                        {{ post.image_url || 'null' }}
                      </code>
                    </div>
                    <div><strong>image:</strong> 
                      <code class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                        {{ post.image || 'null' }}
                      </code>
                    </div>
                    <div><strong>imagen:</strong> 
                      <code class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                        {{ post.imagen || 'null' }}
                      </code>
                    </div>
                    <div><strong>URL Normalizada:</strong> 
                      <code class="px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded text-xs">
                        {{ getImageUrl(post) || 'null' }}
                      </code>
                    </div>
                    <div><strong>Estado:</strong> 
                      <span :class="getImageStatusClass(post)" class="font-medium">
                        {{ getImageStatus(post) }}
                      </span>
                    </div>
                  </div>
                </div>
                
                <!-- Image Preview -->
                <div>
                  <h4 class="font-medium mb-2">Vista Previa</h4>
                  <div class="relative h-48 border border-gray-200 dark:border-gray-700 rounded">
                    <SafeImage
                      :src="getImageUrl(post)"
                      :alt="post.title || post.titulo"
                      :fallback-src="getPlaceholderUrl('post')"
                      aspect-ratio="16/9"
                      image-container-class="w-full h-full"
                      image-class="w-full h-full object-cover rounded"
                      @load="onImageLoad(post)"
                      @error="onImageError(post)"
                    />
                  </div>
                  <div class="mt-2 text-xs text-gray-500">
                    <div v-if="imageLoadStatus[post.id]">
                      Estado: {{ imageLoadStatus[post.id] }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- No Posts -->
          <div v-if="posts.length === 0" class="text-center py-8">
            <p class="text-gray-600">No se encontraron posts para debuggear.</p>
          </div>
        </div>
        
        <!-- Debug Controls -->
        <div class="mt-8 bg-gray-100 dark:bg-gray-700 rounded-lg p-6">
          <h2 class="text-xl font-semibold mb-4">Controles de Debug</h2>
          <div class="flex flex-wrap gap-4">
            <button
              @click="refreshPosts"
              class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Refrescar Posts
            </button>
            <button
              @click="clearImageCache"
              class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Limpiar Cache de Imágenes
            </button>
            <button
              @click="testImageUrls"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Test URLs de Imágenes
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { getImageUrl, getPlaceholderUrl } = useImageUrl()
const blogStore = useBlogStore()

// State
const loading = ref(true)
const imageLoadStatus = ref<Record<number, string>>({})

// Computed
const posts = computed(() => blogStore.posts)
const postsWithImages = computed(() => 
  posts.value.filter(post => getImageUrl(post)).length
)
const postsWithoutImages = computed(() => 
  posts.value.filter(post => !getImageUrl(post)).length
)

// Methods
const getImageStatus = (post: any) => {
  const imageUrl = getImageUrl(post)
  if (!imageUrl) return 'Sin imagen'
  if (imageUrl.includes('/media/media/')) return 'URL duplicada'
  if (imageUrl.startsWith('http')) return 'URL válida'
  return 'URL relativa'
}

const getImageStatusClass = (post: any) => {
  const status = getImageStatus(post)
  switch (status) {
    case 'URL válida': return 'text-green-600'
    case 'URL duplicada': return 'text-red-600'
    case 'Sin imagen': return 'text-gray-500'
    default: return 'text-yellow-600'
  }
}

const onImageLoad = (post: any) => {
  imageLoadStatus.value[post.id] = 'Cargada correctamente'
  console.log(`✅ Image loaded for post ${post.id}:`, getImageUrl(post))
}

const onImageError = (post: any) => {
  imageLoadStatus.value[post.id] = 'Error al cargar'
  console.error(`❌ Image failed for post ${post.id}:`, getImageUrl(post))
}

const refreshPosts = async () => {
  loading.value = true
  imageLoadStatus.value = {}
  try {
    await blogStore.fetchPosts({ page: 1, limit: 10 })
  } catch (error) {
    console.error('Error refreshing posts:', error)
  } finally {
    loading.value = false
  }
}

const clearImageCache = () => {
  // Clear browser image cache by adding timestamp
  const images = document.querySelectorAll('img')
  images.forEach(img => {
    if (img.src) {
      const url = new URL(img.src)
      url.searchParams.set('_cache_bust', Date.now().toString())
      img.src = url.toString()
    }
  })
  console.log('🧹 Image cache cleared')
}

const testImageUrls = async () => {
  console.log('🧪 Testing image URLs...')
  for (const post of posts.value) {
    const imageUrl = getImageUrl(post)
    if (imageUrl) {
      try {
        const response = await fetch(imageUrl, { method: 'HEAD' })
        console.log(`${response.ok ? '✅' : '❌'} ${imageUrl} - ${response.status}`)
      } catch (error) {
        console.log(`❌ ${imageUrl} - Network Error`)
      }
    }
  }
}

// Initialize
onMounted(async () => {
  try {
    await blogStore.fetchPosts({ page: 1, limit: 10 })
  } catch (error) {
    console.error('Error loading posts:', error)
  } finally {
    loading.value = false
  }
})

// SEO
useHead({
  title: 'Debug Posts Images - Blog de Noticias',
  meta: [
    { name: 'description', content: 'Página de debug para verificar la carga de imágenes en posts' }
  ]
})
</script>