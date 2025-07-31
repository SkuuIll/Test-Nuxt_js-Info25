<template>
  <div class="error-boundary">
    <!-- Normal content when no error -->
    <div v-if="!hasError" class="error-boundary-content">
      <slot />
    </div>
    
    <!-- Error state -->
    <div v-else class="error-boundary-error">
      <div class="error-container">
        <!-- Error Icon -->
        <div class="error-icon">
          <svg
            class="w-16 h-16 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        
        <!-- Error Title -->
        <h2 class="error-title">
          {{ errorTitle }}
        </h2>
        
        <!-- Error Message -->
        <p class="error-message">
          {{ errorMessage }}
        </p>
        
        <!-- Error Details (in development) -->
        <div v-if="showDetails && errorDetails" class="error-details">
          <details class="error-details-toggle">
            <summary class="error-details-summary">
              Detalles técnicos
            </summary>
            <div class="error-details-content">
              <pre class="error-stack">{{ errorDetails }}</pre>
            </div>
          </details>
        </div>
        
        <!-- Error Actions -->
        <div class="error-actions">
          <button
            @click="retry"
            class="error-action-button error-action-primary"
            :disabled="retrying"
          >
            <svg
              v-if="retrying"
              class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {{ retrying ? 'Reintentando...' : 'Reintentar' }}
          </button>
          
          <button
            v-if="showReload"
            @click="reload"
            class="error-action-button error-action-secondary"
          >
            Recargar página
          </button>
          
          <button
            v-if="showReport"
            @click="reportError"
            class="error-action-button error-action-secondary"
          >
            Reportar error
          </button>
          
          <button
            v-if="showGoBack"
            @click="goBack"
            class="error-action-button error-action-secondary"
          >
            Volver atrás
          </button>
        </div>
        
        <!-- Error ID for support -->
        <div v-if="errorId" class="error-id">
          <span class="error-id-label">ID del error:</span>
          <code class="error-id-value">{{ errorId }}</code>
          <button
            @click="copyErrorId"
            class="error-id-copy"
            :class="{ 'copied': idCopied }"
          >
            {{ idCopied ? 'Copiado!' : 'Copiar' }}
          </button>
        </div>
        
        <!-- Recovery suggestions -->
        <div v-if="suggestions.length > 0" class="error-suggestions">
          <h3 class="error-suggestions-title">Sugerencias:</h3>
          <ul class="error-suggestions-list">
            <li
              v-for="(suggestion, index) in suggestions"
              :key="index"
              class="error-suggestion-item"
            >
              {{ suggestion }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  // Error boundary configuration
  fallbackComponent?: string
  showDetails?: boolean
  showReload?: boolean
  showReport?: boolean
  showGoBack?: boolean
  autoRetry?: boolean
  maxRetries?: number
  retryDelay?: number
  
  // Custom messages
  title?: string
  message?: string
  
  // Error handling options
  onError?: (error: Error, errorInfo: any) => void
  onRetry?: () => void | Promise<void>
  onRecover?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  showDetails: process.env.NODE_ENV === 'development',
  showReload: true,
  showReport: true,
  showGoBack: true,
  autoRetry: false,
  maxRetries: 3,
  retryDelay: 1000,
  title: 'Algo salió mal',
  message: 'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.'
})

const emit = defineEmits<{
  error: [error: Error, errorInfo: any]
  retry: []
  recover: []
}>()

// Global error handler
const { handleClientError, createErrorReport } = useGlobalErrorHandler()

// State
const hasError = ref(false)
const currentError = ref<Error | null>(null)
const errorInfo = ref<any>(null)
const retrying = ref(false)
const retryCount = ref(0)
const errorId = ref<string>('')
const idCopied = ref(false)

// Computed
const errorTitle = computed(() => {
  if (currentError.value?.name === 'ChunkLoadError') {
    return 'Error de carga'
  }
  if (currentError.value?.name === 'NetworkError') {
    return 'Error de conexión'
  }
  return props.title
})

const errorMessage = computed(() => {
  if (currentError.value?.name === 'ChunkLoadError') {
    return 'Error al cargar recursos de la aplicación. Por favor, recarga la página.'
  }
  if (currentError.value?.name === 'NetworkError') {
    return 'Error de conexión. Verifica tu conexión a internet e intenta nuevamente.'
  }
  if (currentError.value?.message) {
    return currentError.value.message
  }
  return props.message
})

const errorDetails = computed(() => {
  if (!currentError.value) return ''
  
  const details = []
  details.push(`Error: ${currentError.value.name || 'Unknown'}`)
  details.push(`Message: ${currentError.value.message || 'No message'}`)
  
  if (currentError.value.stack) {
    details.push(`Stack: ${currentError.value.stack}`)
  }
  
  if (errorInfo.value) {
    details.push(`Component Info: ${JSON.stringify(errorInfo.value, null, 2)}`)
  }
  
  return details.join('\n\n')
})

const suggestions = computed(() => {
  const suggestions: string[] = []
  
  if (currentError.value?.name === 'ChunkLoadError') {
    suggestions.push('Recarga la página para obtener la versión más reciente')
    suggestions.push('Verifica tu conexión a internet')
    suggestions.push('Limpia la caché del navegador')
  } else if (currentError.value?.name === 'NetworkError') {
    suggestions.push('Verifica tu conexión a internet')
    suggestions.push('Intenta nuevamente en unos momentos')
    suggestions.push('Contacta al soporte si el problema persiste')
  } else {
    suggestions.push('Intenta recargar la página')
    suggestions.push('Verifica que todos los campos estén correctos')
    suggestions.push('Contacta al soporte si el problema persiste')
  }
  
  return suggestions
})

// Methods
const captureError = (error: Error, info: any) => {
  hasError.value = true
  currentError.value = error
  errorInfo.value = info
  errorId.value = generateErrorId()
  
  // Handle error with global handler
  handleClientError(error, 'Error Boundary')
  
  // Emit error event
  emit('error', error, info)
  
  // Call custom error handler
  if (props.onError) {
    props.onError(error, info)
  }
  
  // Auto retry if enabled
  if (props.autoRetry && retryCount.value < props.maxRetries) {
    setTimeout(() => {
      retry()
    }, props.retryDelay)
  }
}

const generateErrorId = (): string => {
  return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

const retry = async () => {
  if (retrying.value) return
  
  retrying.value = true
  retryCount.value++
  
  try {
    // Call custom retry handler
    if (props.onRetry) {
      await props.onRetry()
    }
    
    // Reset error state
    hasError.value = false
    currentError.value = null
    errorInfo.value = null
    errorId.value = ''
    
    emit('retry')
    
    // Call recovery handler
    if (props.onRecover) {
      props.onRecover()
    }
    
    emit('recover')
    
  } catch (error) {
    console.error('Retry failed:', error)
    // Keep error state if retry fails
  } finally {
    retrying.value = false
  }
}

const reload = () => {
  if (import.meta.client) {
    window.location.reload()
  }
}

const reportError = async () => {
  try {
    const report = createErrorReport()
    
    // Add error boundary specific info
    const boundaryReport = {
      ...report,
      errorBoundary: {
        errorId: errorId.value,
        retryCount: retryCount.value,
        error: {
          name: currentError.value?.name,
          message: currentError.value?.message,
          stack: currentError.value?.stack
        },
        errorInfo: errorInfo.value
      }
    }
    
    // Here you would send to your error reporting service
    console.log('Error report:', boundaryReport)
    
    const { success } = useToast()
    success('Error reportado', 'Gracias por reportar este error. Nuestro equipo lo revisará.')
    
  } catch (error) {
    console.error('Failed to report error:', error)
    const { error: showError } = useToast()
    showError('Error al reportar', 'No se pudo enviar el reporte de error.')
  }
}

const goBack = () => {
  if (import.meta.client && window.history.length > 1) {
    window.history.back()
  } else {
    navigateTo('/')
  }
}

const copyErrorId = async () => {
  if (!import.meta.client || !errorId.value) return
  
  try {
    await navigator.clipboard.writeText(errorId.value)
    idCopied.value = true
    
    setTimeout(() => {
      idCopied.value = false
    }, 2000)
  } catch (error) {
    console.error('Failed to copy error ID:', error)
  }
}

// Vue error handling
onErrorCaptured((error: Error, instance: any, info: string) => {
  captureError(error, { instance, info })
  return false // Prevent error from propagating
})

// Global error handling for unhandled errors
if (import.meta.client) {
  onMounted(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      captureError(event.error || new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      })
    }
    
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason))
      
      captureError(error, { type: 'unhandledrejection' })
    }
    
    window.addEventListener('error', handleGlobalError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    
    onUnmounted(() => {
      window.removeEventListener('error', handleGlobalError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    })
  })
}
</script>

<style scoped>
.error-boundary {
  width: 100%;
  height: 100%;
}

.error-boundary-content {
  width: 100%;
  height: 100%;
}

.error-boundary-error {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 2rem;
  background-color: #fafafa;
}

.error-container {
  max-width: 600px;
  width: 100%;
  text-align: center;
  background: white;
  border-radius: 12px;
  padding: 3rem 2rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.error-icon {
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: center;
}

.error-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

.error-message {
  font-size: 1rem;
  color: #6b7280;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.error-details {
  margin-bottom: 2rem;
  text-align: left;
}

.error-details-toggle {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}

.error-details-summary {
  background: #f9fafb;
  padding: 0.75rem 1rem;
  cursor: pointer;
  font-weight: 500;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
}

.error-details-summary:hover {
  background: #f3f4f6;
}

.error-details-content {
  padding: 1rem;
  background: #1f2937;
  color: #f9fafb;
  max-height: 300px;
  overflow-y: auto;
}

.error-stack {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.75rem;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-all;
}

.error-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
  margin-bottom: 2rem;
}

.error-action-button {
  display: inline-flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.2s;
  cursor: pointer;
  border: none;
}

.error-action-primary {
  background: #3b82f6;
  color: white;
}

.error-action-primary:hover:not(:disabled) {
  background: #2563eb;
}

.error-action-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.error-action-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.error-action-secondary:hover {
  background: #e5e7eb;
}

.error-id {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 6px;
  font-size: 0.875rem;
}

.error-id-label {
  color: #6b7280;
  font-weight: 500;
}

.error-id-value {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  background: #e5e7eb;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  color: #374151;
}

.error-id-copy {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.error-id-copy:hover {
  background: #2563eb;
}

.error-id-copy.copied {
  background: #10b981;
}

.error-suggestions {
  text-align: left;
  background: #fffbeb;
  border: 1px solid #fbbf24;
  border-radius: 6px;
  padding: 1rem;
}

.error-suggestions-title {
  font-weight: 600;
  color: #92400e;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.error-suggestions-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.error-suggestion-item {
  color: #78350f;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
  padding-left: 1rem;
  position: relative;
}

.error-suggestion-item::before {
  content: '•';
  color: #fbbf24;
  position: absolute;
  left: 0;
}

/* Responsive design */
@media (max-width: 640px) {
  .error-boundary-error {
    padding: 1rem;
  }
  
  .error-container {
    padding: 2rem 1.5rem;
  }
  
  .error-actions {
    flex-direction: column;
  }
  
  .error-action-button {
    width: 100%;
    justify-content: center;
  }
  
  .error-id {
    flex-direction: column;
    gap: 0.25rem;
  }
}

/* Animation for retry button */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>