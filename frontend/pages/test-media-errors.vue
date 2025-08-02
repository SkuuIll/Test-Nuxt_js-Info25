<template>
  <div class="container mx-auto p-8">
    <h1 class="text-3xl font-bold mb-8">Test de Manejo de Errores de Medios</h1>
    
    <!-- Error Statistics -->
    <div class="bg-white rounded-lg shadow p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4">Estadísticas de Errores</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div class="bg-red-50 p-4 rounded-lg">
          <div class="text-2xl font-bold text-red-600">{{ errorStats.totalErrors }}</div>
          <div class="text-sm text-red-500">Errores Totales</div>
        </div>
        <div class="bg-blue-50 p-4 rounded-lg">
          <div class="text-2xl font-bold text-blue-600">{{ errorStats.performance.totalLoads }}</div>
          <div class="text-sm text-blue-500">Cargas Exitosas</div>
        </div>
        <div class="bg-yellow-50 p-4 rounded-lg">
          <div class="text-2xl font-bold text-yellow-600">
            {{ (errorStats.performance.failureRate * 100).toFixed(1) }}%
          </div>
          <div class="text-sm text-yellow-500">Tasa de Fallo</div>
        </div>
      </div>
      
      <div class="flex space-x-2">
        <button
          @click="refreshStats"
          class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          Actualizar Estadísticas
        </button>
        <button
          @click="clearStats"
          class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
        >
          Limpiar Estadísticas
        </button>
      </div>
    </div>

    <!-- Performance Insights -->
    <div v-if="insights.length > 0" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
      <h3 class="font-semibold text-yellow-800 mb-2">Insights de Rendimiento</h3>
      <ul class="space-y-1">
        <li v-for="insight in insights" :key="insight.message" class="text-yellow-700 text-sm">
          {{ insight.message }}
        </li>
      </ul>
    </div>

    <!-- Test Cases -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Valid Image -->
      <div class="test-case">
        <h3 class="font-semibold mb-2">✅ Imagen Válida</h3>
        <EnhancedImage
          src="/images/placeholder.svg"
          alt="Imagen válida de prueba"
          class="w-full h-32"
          :show-debug-info="true"
        />
      </div>

      <!-- 404 Error -->
      <div class="test-case">
        <h3 class="font-semibold mb-2">❌ Error 404</h3>
        <EnhancedImage
          src="/images/non-existent-image.jpg"
          alt="Imagen que no existe"
          fallback-src="/images/placeholder.svg"
          class="w-full h-32"
          :show-debug-info="true"
        />
      </div>

      <!-- IPX Error -->
      <div class="test-case">
        <h3 class="font-semibold mb-2">🔧 Error IPX</h3>
        <EnhancedImage
          src="/_ipx/f_webp/non-existent-image.jpg"
          alt="Error de optimización IPX"
          fallback-src="/images/placeholder.svg"
          class="w-full h-32"
          :show-debug-info="true"
        />
      </div>

      <!-- Network Error Simulation -->
      <div class="test-case">
        <h3 class="font-semibold mb-2">🌐 Error de Red</h3>
        <EnhancedImage
          src="https://httpstat.us/500.jpg"
          alt="Simulación de error de red"
          fallback-src="/images/placeholder.svg"
          class="w-full h-32"
          :show-debug-info="true"
          :retry-attempts="2"
        />
      </div>

      <!-- Slow Loading -->
      <div class="test-case">
        <h3 class="font-semibold mb-2">⏳ Carga Lenta</h3>
        <EnhancedImage
          src="https://httpstat.us/200.jpg?sleep=3000"
          alt="Imagen con carga lenta"
          fallback-src="/images/placeholder.svg"
          class="w-full h-32"
          :show-debug-info="true"
          :show-loading-text="true"
          loading-text="Cargando imagen lenta..."
        />
      </div>

      <!-- Custom Error Handling -->
      <div class="test-case">
        <h3 class="font-semibold mb-2">🛠️ Manejo Personalizado</h3>
        <EnhancedImage
          src="/images/another-non-existent.jpg"
          alt="Manejo de error personalizado"
          class="w-full h-32"
          :show-debug-info="true"
          :show-report-button="true"
          :on-error-report="handleErrorReport"
          error-message="Error personalizado detectado"
        />
      </div>

      <!-- Multiple Fallbacks -->
      <div class="test-case">
        <h3 class="font-semibold mb-2">🔄 Múltiples Fallbacks</h3>
        <EnhancedImage
          src="/images/primary-missing.jpg"
          alt="Test de múltiples fallbacks"
          fallback-src="/images/secondary-missing.jpg"
          class="w-full h-32"
          :show-debug-info="true"
          :retry-attempts="1"
        />
      </div>

      <!-- Avatar Context -->
      <div class="test-case">
        <h3 class="font-semibold mb-2">👤 Contexto Avatar</h3>
        <EnhancedImage
          src="/images/missing-avatar.jpg"
          alt="Avatar de usuario no encontrado"
          class="w-full h-32"
          :show-debug-info="true"
        />
      </div>

      <!-- Post Context -->
      <div class="test-case">
        <h3 class="font-semibold mb-2">📄 Contexto Post</h3>
        <EnhancedImage
          src="/images/missing-post-image.jpg"
          alt="Imagen de artículo no encontrada"
          class="w-full h-32"
          :show-debug-info="true"
        />
      </div>
    </div>

    <!-- Error History -->
    <div v-if="errorStats.recentErrors.length > 0" class="mt-8 bg-white rounded-lg shadow p-6">
      <h2 class="text-xl font-semibold mb-4">Historial de Errores Recientes</h2>
      
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Imagen
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tiempo
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="error in errorStats.recentErrors.slice(0, 10)" :key="error.timestamp">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 truncate max-w-xs">
                {{ error.src }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                  {{ error.type }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatTime(error.timestamp) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Test Controls -->
    <div class="mt-8 bg-gray-50 rounded-lg p-6">
      <h2 class="text-xl font-semibold mb-4">Controles de Prueba</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          @click="testImageLoad"
          class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
        >
          Probar Carga de Imagen
        </button>
        
        <button
          @click="preloadCriticalImages"
          class="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors"
        >
          Precargar Imágenes Críticas
        </button>
        
        <button
          @click="simulateNetworkError"
          class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
        >
          Simular Error de Red
        </button>
        
        <button
          @click="showDebugInfo"
          class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          Mostrar Info Debug
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Composables
const { $mediaError } = useNuxtApp()
const { success, error: showError, info } = useToast()

// State
const errorStats = ref({
  totalErrors: 0,
  errorsByType: {},
  errorsByDomain: {},
  recentErrors: [],
  performance: {
    totalLoads: 0,
    averageLoadTime: 0,
    failureRate: 0
  }
})

const insights = ref<Array<{ type: string; message: string }>>([])

// Methods
const refreshStats = () => {
  if ($mediaError) {
    errorStats.value = $mediaError.getErrorStats()
    insights.value = $mediaError.getPerformanceInsights()
    success('Estadísticas actualizadas')
  }
}

const clearStats = () => {
  if ($mediaError) {
    $mediaError.clearErrorHistory()
    refreshStats()
    info('Estadísticas limpiadas')
  }
}

const handleErrorReport = (report: any) => {
  console.log('📊 Error report received:', report)
  info(`Error reportado: ${report.errorType}`)
}

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString()
}

const testImageLoad = async () => {
  if ($mediaError) {
    const testUrl = '/images/placeholder.svg'
    const canLoad = await $mediaError.testImageLoad(testUrl)
    
    if (canLoad) {
      success(`✅ Imagen carga correctamente: ${testUrl}`)
    } else {
      showError(`❌ Error cargando imagen: ${testUrl}`)
    }
  }
}

const preloadCriticalImages = async () => {
  if ($mediaError) {
    const criticalImages = [
      '/images/placeholder.svg',
      '/images/post-placeholder.svg'
    ]
    
    const successful = await $mediaError.preloadCriticalImages(criticalImages)
    success(`✅ Precargadas ${successful}/${criticalImages.length} imágenes críticas`)
  }
}

const simulateNetworkError = () => {
  // Force reload a non-existent image to trigger error
  const img = new Image()
  img.src = `/images/network-error-test-${Date.now()}.jpg`
  info('🌐 Error de red simulado')
}

const showDebugInfo = () => {
  if (process.client && (window as any).__mediaErrorDebug) {
    console.log('🔧 Media Error Debug Info:', (window as any).__mediaErrorDebug.stats())
    info('📊 Info de debug mostrada en consola')
  } else {
    showError('Debug info no disponible')
  }
}

// Initialize
onMounted(() => {
  refreshStats()
  
  // Auto-refresh stats every 5 seconds
  const interval = setInterval(refreshStats, 5000)
  
  onUnmounted(() => {
    clearInterval(interval)
  })
})

// Meta tags
useHead({
  title: 'Test de Errores de Medios - Blog de Noticias',
  meta: [
    {
      name: 'description',
      content: 'Página de prueba para verificar el manejo de errores de archivos multimedia'
    }
  ]
})
</script>

<style scoped>
.test-case {
  @apply bg-white rounded-lg shadow p-4;
}

.test-case h3 {
  @apply text-gray-800 border-b border-gray-200 pb-2 mb-4;
}
</style>