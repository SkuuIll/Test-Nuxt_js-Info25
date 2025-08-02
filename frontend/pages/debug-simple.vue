<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
    <div class="container mx-auto px-4">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold text-center mb-8">Debug Simple - Post ID 13</h1>
        
        <!-- Loading State -->
        <div v-if="loading" class="text-center py-8">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p class="mt-2 text-gray-600">Cargando post...</p>
        </div>
        
        <!-- Post Debug -->
        <div v-else-if="post" class="space-y-6">
          <!-- Raw Post Data -->
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border">
            <h2 class="text-xl font-semibold mb-4">Datos del Post (Raw)</h2>
            <pre class="text-xs bg-gray-100 dark:bg-gray-700 p-4 rounded overflow-auto">{{ JSON.stringify(post, null, 2) }}</pre>
          </div>
          
          <!-- Image URL Analysis -->
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border">
            <h2 class="text-xl font-semibold mb-4">Análisis de URL de Imagen</h2>
            <div class="space-y-3 text-sm">
              <div><strong>post.image:</strong> <code class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">{{ post.image || 'null' }}</code></div>
              <div><strong>post.image_url:</strong> <code class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">{{ post.image_url || 'null' }}</code></div>
              <div><strong>post.imagen:</strong> <code class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">{{ post.imagen || 'null' }}</code></div>
              <div><strong>getImageUrl(post):</strong> <code class="px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded">{{ getImageUrl(post) || 'null' }}</code></div>
              <div><strong>API Base:</strong> <code class="px-2 py-1 bg-green-100 dark:bg-green-900 rounded">{{ apiBase }}</code></div>
            </div>
          </div>
          
          <!-- Direct Image Test -->
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border">
            <h2 class="text-xl font-semibold mb-4">Test de Imagen Directa</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Using post.image directly -->
              <div>
                <h3 class="font-medium mb-2">post.image (directo)</h3>
                <div class="relative h-48 border border-gray-200 dark:border-gray-700 rounded">
                  <img 
                    v-if="post.image"
                    :src="post.image" 
                    :alt="post.title"
                    class="w-full h-full object-cover rounded"
                    @load="onDirectImageLoad"
                    @error="onDirectImageError"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center text-gray-500">
                    Sin imagen directa
                  </div>
                </div>
                <div class="mt-2 text-xs">
                  <div>URL: {{ post.image || 'N/A' }}</div>
                  <div>Estado: {{ directImageStatus }}</div>
                </div>
              </div>
              
              <!-- Using getImageUrl -->
              <div>
                <h3 class="font-medium mb-2">getImageUrl(post)</h3>
                <div class="relative h-48 border border-gray-200 dark:border-gray-700 rounded">
                  <img 
                    v-if="getImageUrl(post)"
                    :src="getImageUrl(post)" 
                    :alt="post.title"
                    class="w-full h-full object-cover rounded"
                    @load="onProcessedImageLoad"
                    @error="onProcessedImageError"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center text-gray-500">
                    Sin imagen procesada
                  </div>
                </div>
                <div class="mt-2 text-xs">
                  <div>URL: {{ getImageUrl(post) || 'N/A' }}</div>
                  <div>Estado: {{ processedImageStatus }}</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- SafeImage Test -->
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border">
            <h2 class="text-xl font-semibold mb-4">Test con SafeImage</h2>
            <div class="relative h-64 border border-gray-200 dark:border-gray-700 rounded">
              <SafeImage
                :src="getImageUrl(post)"
                :alt="post.title"
                :fallback-src="getPlaceholderUrl('post')"
                aspect-ratio="16/9"
                image-container-class="w-full h-full"
                image-class="w-full h-full object-cover rounded"
                @load="onSafeImageLoad"
                @error="onSafeImageError"
              />
            </div>
            <div class="mt-2 text-xs">
              <div>Estado: {{ safeImageStatus }}</div>
            </div>
          </div>
          
          <!-- Manual URL Test -->
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border">
            <h2 class="text-xl font-semibold mb-4">Test Manual de URL</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-2">URL de prueba:</label>
                <input
                  v-model="testUrl"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ingresa una URL de imagen..."
                />
              </div>
              <div class="flex space-x-2">
                <button
                  @click="testUrlManually"
                  class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Test URL
                </button>
                <button
                  @click="testBackendUrl"
                  class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Test Backend
                </button>
              </div>
              <div v-if="manualTestResult" class="p-3 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                <strong>Resultado:</strong> {{ manualTestResult }}
              </div>
            </div>
          </div>
        </div>
        
        <!-- Error State -->
        <div v-else-if="error" class="text-center py-8">
          <div class="text-red-500 mb-4">❌ Error: {{ error }}</div>
          <button
            @click="fetchPost"
            class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { getImageUrl, getPlaceholderUrl } = useImageUrl()
const config = useRuntimeConfig()

// State
const post = ref<any>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const directImageStatus = ref('Esperando...')
const processedImageStatus = ref('Esperando...')
const safeImageStatus = ref('Esperando...')
const testUrl = ref('')
const manualTestResult = ref('')

// Computed
const apiBase = computed(() => config.public.apiBase)

// Methods
const fetchPost = async () => {
  try {
    loading.value = true
    error.value = null
    
    const api = useApi()
    const response = await api.getPost('13-hola-como-estas')
    post.value = response.data || response
    
    console.log('📖 Post fetched:', post.value)
  } catch (err: any) {
    console.error('❌ Error fetching post:', err)
    error.value = err.message || 'Error al cargar post'
  } finally {
    loading.value = false
  }
}

const onDirectImageLoad = () => {
  directImageStatus.value = '✅ Cargada correctamente'
  console.log('✅ Direct image loaded')
}

const onDirectImageError = (event: Event) => {
  directImageStatus.value = '❌ Error al cargar'
  console.error('❌ Direct image error:', event)
}

const onProcessedImageLoad = () => {
  processedImageStatus.value = '✅ Cargada correctamente'
  console.log('✅ Processed image loaded')
}

const onProcessedImageError = (event: Event) => {
  processedImageStatus.value = '❌ Error al cargar'
  console.error('❌ Processed image error:', event)
}

const onSafeImageLoad = () => {
  safeImageStatus.value = '✅ Cargada correctamente'
  console.log('✅ SafeImage loaded')
}

const onSafeImageError = (event: Event) => {
  safeImageStatus.value = '❌ Error al cargar'
  console.error('❌ SafeImage error:', event)
}

const testUrlManually = async () => {
  if (!testUrl.value) return
  
  try {
    const response = await fetch(testUrl.value, { method: 'HEAD' })
    manualTestResult.value = `${response.ok ? '✅' : '❌'} ${response.status} - ${response.statusText}`
  } catch (error) {
    manualTestResult.value = `❌ Network Error: ${error}`
  }
}

const testBackendUrl = async () => {
  const backendUrl = `${apiBase.value}/media/uploads/5/0f722933-d8eb-43e8-bddb-a7b1db1d18e6.jpg`
  testUrl.value = backendUrl
  await testUrlManually()
}

// Initialize
onMounted(async () => {
  await fetchPost()
})

// SEO
useHead({
  title: 'Debug Simple - Blog de Noticias',
  meta: [
    { name: 'description', content: 'Página de debug simple para verificar carga de imágenes' }
  ]
})
</script>