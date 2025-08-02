<template>
  <div v-if="hasError" class="error-boundary">
    <div class="error-container">
      <!-- Error Icon -->
      <div class="error-icon">
        <svg class="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>

      <!-- Error Message -->
      <div class="error-content">
        <h2 class="error-title">{{ errorTitle }}</h2>
        <p class="error-message">{{ errorMessage }}</p>
        
        <!-- Error Details (Development Only) -->
        <details v-if="showDetails && isDevelopment" class="error-details">
          <summary class="error-details-summary">Detalles técnicos</summary>
          <div class="error-details-content">
            <div class="error-detail">
              <strong>Tipo:</strong> {{ errorInfo.type }}
            </div>
            <div class="error-detail">
              <strong>Contexto:</strong> {{ errorInfo.context }}
            </div>
            <div class="error-detail">
              <strong>Timestamp:</strong> {{ formatTimestamp(errorInfo.timestamp) }}
            </div>
            <div v-if="errorInfo.originalError" class="error-detail">
              <strong>Error original:</strong>
              <pre class="error-stack">{{ formatError(errorInfo.originalError) }}</pre>
            </div>
          </div>
        </details>
      </div>

      <!-- Recovery Actions -->
      <div class="error-actions">
        <button
          v-for="action in recoveryActions"
          :key="action.label"
          @click="executeAction(action)"
          :class="[
            'error-action-button',
            action.type === 'primary' ? 'primary' : 'secondary'
          ]"
          :disabled="isRecovering"
        >
          <svg v-if="isRecovering && action.type === 'primary'" class="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ action.label }}
        </button>
      </div>

      <!-- Feedback Section -->
      <div v-if="enableFeedback" class="error-feedback">
        <div class="feedback-header">
          <h3>¿Te ayudamos a resolver este problema?</h3>
        </div>
        
        <div class="feedback-options">
          <button
            @click="sendFeedback('helpful')"
            class="feedback-button positive"
            :disabled="feedbackSent"
          >
            👍 Sí, fue útil
          </button>
          <button
            @click="sendFeedback('not-helpful')"
            class="feedback-button negative"
            :disabled="feedbackSent"
          >
            👎 No fue útil
          </button>
        </div>

        <div v-if="feedbackSent" class="feedback-thanks">
          ¡Gracias por tu feedback!
        </div>
      </div>
    </div>
  </div>
  
  <!-- Normal Content -->
  <div v-else>
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  fallbackComponent?: string
  enableFeedback?: boolean
  showDetails?: boolean
  autoRecover?: boolean
  maxRetries?: number
}

const props = withDefaults(defineProps<Props>(), {
  fallbackComponent: '',
  enableFeedback: true,
  showDetails: true,
  autoRecover: true,
  maxRetries: 3
})

// Composables
const { 
  hasError, 
  errorMessage, 
  recoveryActions, 
  isRecovering,
  handleError,
  clearError,
  attemptRecovery
} = useErrorRecovery({
  enableAutoRecovery: props.autoRecover,
  maxRetryAttempts: props.maxRetries
})

// State
const errorInfo = ref<any>({})
const feedbackSent = ref(false)
const retryCount = ref(0)

// Environment detection
const isDevelopment = computed(() => process.env.NODE_ENV === 'development')

// Computed
const errorTitle = computed(() => {
  if (!errorInfo.value.type) return 'Ha ocurrido un error'
  
  switch (errorInfo.value.type) {
    case 'NETWORK': return 'Error de Conexión'
    case 'API': return 'Error del Servidor'
    case 'AUTHENTICATION': return 'Sesión Expirada'
    case 'PERMISSION': return 'Acceso Denegado'
    case 'VALIDATION': return 'Datos Inválidos'
    case 'HYDRATION': return 'Error de Carga'
    case 'JAVASCRIPT': return 'Error de Aplicación'
    default: return 'Error Inesperado'
  }
})

// Methods
const captureError = (error: any, context: string = 'ErrorBoundary') => {
  console.error('🛡️ Error captured by boundary:', error)
  
  const structuredError = handleError(error, context)
  errorInfo.value = structuredError
  
  // Reset feedback state
  feedbackSent.value = false
}

const executeAction = async (action: any) => {
  try {
    await action.action()
  } catch (actionError) {
    console.error('❌ Recovery action failed:', actionError)
    captureError(actionError, 'Recovery Action')
  }
}

const sendFeedback = async (type: 'helpful' | 'not-helpful') => {
  try {
    await $fetch('/api/v1/error-feedback', {
      method: 'POST',
      body: {
        errorId: errorInfo.value.id,
        feedback: type,
        timestamp: Date.now()
      }
    })
    
    feedbackSent.value = true
  } catch (e) {
    console.warn('Failed to send feedback:', e)
  }
}

const formatTimestamp = (timestamp: number) => {
  return new Date(timestamp).toLocaleString()
}

const formatError = (error: any) => {
  if (error instanceof Error) {
    return error.stack || error.message
  }
  return JSON.stringify(error, null, 2)
}

const retry = async () => {
  if (retryCount.value >= props.maxRetries) return
  
  retryCount.value++
  
  try {
    await attemptRecovery(errorInfo.value)
    clearError()
  } catch (retryError) {
    console.error('❌ Retry failed:', retryError)
  }
}

// Error capture using onErrorCaptured
onErrorCaptured((error, instance, info) => {
  captureError(error, `Component Error: ${info}`)
  return false // Prevent error from propagating
})

// Expose methods for parent components
defineExpose({
  captureError,
  clearError,
  retry
})
</script>

<style scoped>
.error-boundary {
  @apply min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4;
}

.error-container {
  @apply max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center;
}

.error-icon {
  @apply flex justify-center mb-6;
}

.error-content {
  @apply mb-8;
}

.error-title {
  @apply text-2xl font-bold text-gray-900 dark:text-white mb-4;
}

.error-message {
  @apply text-gray-600 dark:text-gray-300 mb-6 leading-relaxed;
}

.error-details {
  @apply mt-6 text-left bg-gray-50 dark:bg-gray-700 rounded-lg p-4;
}

.error-details-summary {
  @apply cursor-pointer font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white;
}

.error-details-content {
  @apply mt-4 space-y-2;
}

.error-detail {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.error-stack {
  @apply mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono overflow-x-auto;
}

.error-actions {
  @apply flex flex-col sm:flex-row gap-3 justify-center mb-8;
}

.error-action-button {
  @apply inline-flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed;
}

.error-action-button.primary {
  @apply bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
}

.error-action-button.secondary {
  @apply bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500;
}

.error-feedback {
  @apply border-t border-gray-200 dark:border-gray-600 pt-6;
}

.feedback-header h3 {
  @apply text-lg font-medium text-gray-900 dark:text-white mb-4;
}

.feedback-options {
  @apply flex gap-3 justify-center mb-4;
}

.feedback-button {
  @apply px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed;
}

.feedback-button.positive {
  @apply bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800;
}

.feedback-button.negative {
  @apply bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800;
}

.feedback-thanks {
  @apply text-sm text-green-600 dark:text-green-400 font-medium;
}
</style>