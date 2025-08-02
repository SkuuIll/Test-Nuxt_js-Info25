<template>
  <div class="container mx-auto p-8">
    <h1 class="text-3xl font-bold mb-8">Test de Manejo de Errores</h1>
    
    <!-- Error Recovery Status -->
    <div class="bg-white rounded-lg shadow p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4">Estado del Sistema de Recuperación</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div class="bg-red-50 p-4 rounded-lg">
          <div class="text-2xl font-bold text-red-600">{{ hasError ? 'SÍ' : 'NO' }}</div>
          <div class="text-sm text-red-500">Error Activo</div>
        </div>
        <div class="bg-blue-50 p-4 rounded-lg">
          <div class="text-2xl font-bold text-blue-600">{{ retryCount }}</div>
          <div class="text-sm text-blue-500">Reintentos</div>
        </div>
        <div class="bg-yellow-50 p-4 rounded-lg">
          <div class="text-2xl font-bold text-yellow-600">{{ isRecovering ? 'SÍ' : 'NO' }}</div>
          <div class="text-sm text-yellow-500">Recuperando</div>
        </div>
      </div>
      
      <div v-if="hasError" class="bg-red-100 border border-red-300 rounded-lg p-4 mb-4">
        <div class="font-semibold text-red-800">Error Actual:</div>
        <div class="text-red-700">{{ errorMessage }}</div>
      </div>
      
      <div v-if="recoveryActions.length > 0" class="flex flex-wrap gap-2">
        <button
          v-for="action in recoveryActions"
          :key="action.label"
          @click="action.action"
          :class="[
            'px-4 py-2 rounded font-medium transition-colors',
            action.type === 'primary' 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          ]"
        >
          {{ action.label }}
        </button>
      </div>
    </div>

    <!-- Error Test Cases -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <!-- JavaScript Error -->
      <div class="test-case">
        <h3 class="font-semibold mb-2">💥 Error JavaScript</h3>
        <p class="text-sm text-gray-600 mb-4">Lanza un error de JavaScript para probar el manejo global</p>
        <button
          @click="throwJavaScriptError"
          class="test-button error"
        >
          Lanzar Error JS
        </button>
      </div>

      <!-- Network Error -->
      <div class="test-case">
        <h3 class="font-semibold mb-2">🌐 Error de Red</h3>
        <p class="text-sm text-gray-600 mb-4">Simula un error de conexión de red</p>
        <button
          @click="simulateNetworkError"
          class="test-button error"
        >
          Error de Red
        </button>
      </div>

      <!-- API Error -->
      <div class="test-case">
        <h3 class="font-semibold mb-2">🔌 Error de API</h3>
        <p class="text-sm text-gray-600 mb-4">Simula diferentes errores de API</p>
        <div class="space-y-2">
          <button
            @click="simulateAPIError(401)"
            class="test-button error w-full"
          >
            Error 401
          </button>
          <button
            @click="simulateAPIError(403)"
            class="test-button error w-full"
          >
            Error 403
          </button>
          <button
            @click="simulateAPIError(500)"
            class="test-button error w-full"
          >
            Error 500
          </button>
        </div>
      </div>

      <!-- Promise Rejection -->
      <div class="test-case">
        <h3 class="font-semibold mb-2">🚫 Promise Rejection</h3>
        <p class="text-sm text-gray-600 mb-4">Lanza una promesa rechazada no manejada</p>
        <button
          @click="throwUnhandledPromiseRejection"
          class="test-button error"
        >
          Promise Rejection
        </button>
      </div>

      <!-- Validation Error -->
      <div class="test-case">
        <h3 class="font-semibold mb-2">✅ Error de Validación</h3>
        <p class="text-sm text-gray-600 mb-4">Simula un error de validación de datos</p>
        <button
          @click="simulateValidationError"
          class="test-button error"
        >
          Error Validación
        </button>
      </div>

      <!-- Hydration Error -->
      <div class="test-case">
        <h3 class="font-semibold mb-2">💧 Error de Hidratación</h3>
        <p class="text-sm text-gray-600 mb-4">Simula un error de hidratación SSR</p>
        <button
          @click="simulateHydrationError"
          class="test-button error"
        >
          Error Hidratación
        </button>
      </div>
    </div>

    <!-- Error Boundary Test -->
    <div class="bg-white rounded-lg shadow p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4">Test de Error Boundary</h2>
      
      <ErrorBoundary ref="errorBoundary">
        <div class="p-4 bg-gray-50 rounded-lg">
          <p class="mb-4">Este contenido está protegido por un Error Boundary</p>
          <button
            @click="throwErrorInBoundary"
            class="test-button error"
          >
            Lanzar Error en Boundary
          </button>
        </div>
      </ErrorBoundary>
    </div>

    <!-- Error Statistics -->
    <div class="bg-white rounded-lg shadow p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4">Estadísticas de Errores</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 class="font-medium mb-2">Por Tipo</h3>
          <div class="space-y-1">
            <div v-for="(count, type) in errorStats.byType" :key="type" class="flex justify-between">
              <span class="text-sm">{{ type }}:</span>
              <span class="text-sm font-medium">{{ count }}</span>
            </div>
          </div>
        </div>
        
        <div>
          <h3 class="font-medium mb-2">Por Severidad</h3>
          <div class="space-y-1">
            <div v-for="(count, severity) in errorStats.bySeverity" :key="severity" class="flex justify-between">
              <span class="text-sm">{{ severity }}:</span>
              <span class="text-sm font-medium">{{ count }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="mt-4 pt-4 border-t">
        <div class="text-lg font-semibold">Total de errores: {{ errorStats.total }}</div>
      </div>
    </div>

    <!-- Recent Errors -->
    <div v-if="errorStats.recent.length > 0" class="bg-white rounded-lg shadow p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4">Errores Recientes</h2>
      
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mensaje
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Severidad
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tiempo
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="error in errorStats.recent" :key="error.id">
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                  {{ error.type }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-900 truncate max-w-xs">
                {{ error.message }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="[
                  'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                  getSeverityClass(error.severity)
                ]">
                  {{ error.severity }}
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
    <div class="bg-gray-50 rounded-lg p-6">
      <h2 class="text-xl font-semibold mb-4">Controles de Prueba</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          @click="clearAllErrors"
          class="test-button success"
        >
          Limpiar Errores
        </button>
        
        <button
          @click="refreshStats"
          class="test-button info"
        >
          Actualizar Stats
        </button>
        
        <button
          @click="testRecovery"
          class="test-button warning"
        >
          Test Recuperación
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Composables
const {
  hasError,
  errorMessage,
  retryCount,
  isRecovering,
  recoveryActions,
  handleError,
  clearError,
  getErrorStats
} = useErrorRecovery()

const { success, error: showError, warning, info } = useToast()

// State
const errorStats = ref({
  total: 0,
  byType: {},
  bySeverity: {},
  recent: []
})

const errorBoundary = ref()

// Methods
const throwJavaScriptError = () => {
  throw new Error('Este es un error de JavaScript de prueba')
}

const simulateNetworkError = async () => {
  try {
    await $fetch('https://httpstat.us/500', { timeout: 1000 })
  } catch (error) {
    handleError(error, 'Network Error Test')
  }
}

const simulateAPIError = async (statusCode: number) => {
  try {
    await $fetch(`https://httpstat.us/${statusCode}`)
  } catch (error) {
    handleError(error, `API Error ${statusCode} Test`)
  }
}

const throwUnhandledPromiseRejection = () => {
  // Create an unhandled promise rejection
  Promise.reject(new Error('Unhandled promise rejection test'))
}

const simulateValidationError = () => {
  const validationError = {
    status: 400,
    message: 'Datos de validación incorrectos',
    data: {
      errors: {
        email: ['El email es requerido'],
        password: ['La contraseña debe tener al menos 8 caracteres']
      }
    }
  }
  
  handleError(validationError, 'Validation Error Test')
}

const simulateHydrationError = () => {
  const hydrationError = new Error('Hydration mismatch: expected server HTML to contain a matching div')
  handleError(hydrationError, 'Hydration Error Test')
}

const throwErrorInBoundary = () => {
  if (errorBoundary.value) {
    errorBoundary.value.captureError(
      new Error('Error capturado por Error Boundary'),
      'Error Boundary Test'
    )
  }
}

const clearAllErrors = () => {
  clearError()
  if (errorBoundary.value) {
    errorBoundary.value.clearError()
  }
  refreshStats()
  success('Todos los errores han sido limpiados')
}

const refreshStats = () => {
  errorStats.value = getErrorStats()
  info('Estadísticas actualizadas')
}

const testRecovery = async () => {
  warning('Iniciando test de recuperación...')
  
  // Simulate an error and then recovery
  try {
    throw new Error('Error de prueba para recuperación')
  } catch (error) {
    handleError(error, 'Recovery Test')
    
    // Simulate successful recovery after 2 seconds
    setTimeout(() => {
      clearError()
      success('Recuperación exitosa!')
    }, 2000)
  }
}

const getSeverityClass = (severity: string) => {
  switch (severity) {
    case 'critical':
      return 'bg-red-100 text-red-800'
    case 'high':
      return 'bg-orange-100 text-orange-800'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800'
    case 'low':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString()
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
  title: 'Test de Manejo de Errores - Blog de Noticias',
  meta: [
    {
      name: 'description',
      content: 'Página de prueba para verificar el sistema de manejo y recuperación de errores'
    }
  ]
})
</script>

<style scoped>
.test-case {
  @apply bg-white rounded-lg shadow p-6;
}

.test-button {
  @apply px-4 py-2 rounded font-medium transition-colors duration-200;
}

.test-button.error {
  @apply bg-red-500 text-white hover:bg-red-600;
}

.test-button.success {
  @apply bg-green-500 text-white hover:bg-green-600;
}

.test-button.info {
  @apply bg-blue-500 text-white hover:bg-blue-600;
}

.test-button.warning {
  @apply bg-yellow-500 text-white hover:bg-yellow-600;
}
</style>