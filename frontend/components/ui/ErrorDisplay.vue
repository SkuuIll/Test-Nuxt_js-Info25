<template>
  <div class="error-display">
    <!-- Error Summary Card -->
    <div
      v-if="showSummary && (errors.length > 0 || errorStats.total > 0)"
      class="error-summary-card"
    >
      <div class="error-summary-header">
        <div class="error-summary-icon">
          <svg
            class="w-6 h-6 text-red-500"
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
        
        <div class="error-summary-title">
          <h3>{{ summaryTitle }}</h3>
          <p class="error-summary-subtitle">
            {{ summarySubtitle }}
          </p>
        </div>
        
        <button
          v-if="dismissible"
          @click="dismiss"
          class="error-summary-dismiss"
          aria-label="Cerrar resumen de errores"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      
      <!-- Error Statistics -->
      <div v-if="showStats" class="error-stats">
        <div class="error-stats-grid">
          <div class="error-stat">
            <div class="error-stat-value">{{ errorStats.total || errors.length }}</div>
            <div class="error-stat-label">Total</div>
          </div>
          
          <div
            v-if="errorStats.bySeverity?.critical"
            class="error-stat error-stat--critical"
          >
            <div class="error-stat-value">{{ errorStats.bySeverity.critical }}</div>
            <div class="error-stat-label">Críticos</div>
          </div>
          
          <div
            v-if="errorStats.bySeverity?.high"
            class="error-stat error-stat--high"
          >
            <div class="error-stat-value">{{ errorStats.bySeverity.high }}</div>
            <div class="error-stat-label">Altos</div>
          </div>
          
          <div
            v-if="errorStats.byType?.network"
            class="error-stat error-stat--network"
          >
            <div class="error-stat-value">{{ errorStats.byType.network }}</div>
            <div class="error-stat-label">Red</div>
          </div>
        </div>
      </div>
      
      <!-- Quick Actions -->
      <div v-if="showActions" class="error-summary-actions">
        <button
          v-if="hasRetryableErrors"
          @click="retryErrors"
          class="error-action-button error-action-primary"
          :disabled="retrying"
        >
          <svg
            v-if="retrying"
            class="animate-spin -ml-1 mr-2 h-4 w-4"
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
          @click="clearAllErrors"
          class="error-action-button error-action-secondary"
        >
          Limpiar errores
        </button>
        
        <button
          v-if="showExport"
          @click="exportErrors"
          class="error-action-button error-action-secondary"
        >
          Exportar
        </button>
      </div>
    </div>
    
    <!-- Individual Error List -->
    <div
      v-if="showList && errors.length > 0"
      class="error-list"
    >
      <div class="error-list-header">
        <h4>Errores recientes</h4>
        <span class="error-list-count">{{ errors.length }}</span>
      </div>
      
      <div class="error-list-items">
        <div
          v-for="(error, index) in displayedErrors"
          :key="error.id || index"
          class="error-item"
          :class="`error-item--${error.severity || 'medium'}`"
        >
          <div class="error-item-icon">
            <component :is="getErrorIcon(error)" class="w-4 h-4" />
          </div>
          
          <div class="error-item-content">
            <div class="error-item-header">
              <span class="error-item-type">{{ formatErrorType(error.type) }}</span>
              <span class="error-item-time">{{ formatTime(error.timestamp) }}</span>
            </div>
            
            <div class="error-item-message">
              {{ error.message }}
            </div>
            
            <div v-if="error.context" class="error-item-context">
              {{ error.context }}
            </div>
            
            <div v-if="showDetails" class="error-item-details">
              <button
                @click="toggleErrorDetails(index)"
                class="error-details-toggle"
              >
                {{ expandedErrors.has(index) ? 'Ocultar' : 'Ver' }} detalles
              </button>
              
              <div
                v-if="expandedErrors.has(index)"
                class="error-details-content"
              >
                <div v-if="error.code" class="error-detail">
                  <strong>Código:</strong> {{ error.code }}
                </div>
                <div v-if="error.url" class="error-detail">
                  <strong>URL:</strong> {{ error.url }}
                </div>
                <div v-if="error.userId" class="error-detail">
                  <strong>Usuario:</strong> {{ error.userId }}
                </div>
                <div v-if="error.stack && showStack" class="error-detail">
                  <strong>Stack:</strong>
                  <pre class="error-stack">{{ error.stack }}</pre>
                </div>
              </div>
            </div>
          </div>
          
          <div class="error-item-actions">
            <button
              v-if="error.retryable"
              @click="retryError(error, index)"
              class="error-item-action"
              :disabled="retryingErrors.has(index)"
              title="Reintentar"
            >
              <svg
                :class="{ 'animate-spin': retryingErrors.has(index) }"
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
            
            <button
              @click="dismissError(index)"
              class="error-item-action"
              title="Descartar"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Load More Button -->
      <div
        v-if="errors.length > displayLimit"
        class="error-list-footer"
      >
        <button
          @click="loadMore"
          class="error-load-more"
        >
          Ver más errores ({{ errors.length - displayLimit }} restantes)
        </button>
      </div>
    </div>
    
    <!-- Network Status -->
    <div
      v-if="showNetworkStatus && networkInfo && !networkInfo.isOnline"
      class="network-status"
    >
      <div class="network-status-icon">
        <svg
          class="w-5 h-5 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      
      <div class="network-status-content">
        <div class="network-status-title">Sin conexión</div>
        <div class="network-status-message">
          Algunos errores pueden estar relacionados con la falta de conexión a internet
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  // Display options
  showSummary?: boolean
  showList?: boolean
  showStats?: boolean
  showActions?: boolean
  showDetails?: boolean
  showStack?: boolean
  showExport?: boolean
  showNetworkStatus?: boolean
  
  // Behavior
  dismissible?: boolean
  maxErrors?: number
  autoRefresh?: boolean
  refreshInterval?: number
  
  // Customization
  title?: string
  subtitle?: string
}

const props = withDefaults(defineProps<Props>(), {
  showSummary: true,
  showList: true,
  showStats: true,
  showActions: true,
  showDetails: true,
  showStack: false,
  showExport: true,
  showNetworkStatus: true,
  dismissible: true,
  maxErrors: 50,
  autoRefresh: false,
  refreshInterval: 30000
})

const emit = defineEmits<{
  dismiss: []
  retry: [error: any]
  clear: []
  export: []
}>()

// Global error handler
const {
  errors,
  errorStats,
  networkInfo,
  clearErrors,
  exportErrors: exportErrorsFromHandler,
  getRetryableErrors
} = useGlobalErrorHandler()

// Local state
const displayLimit = ref(10)
const expandedErrors = ref(new Set<number>())
const retrying = ref(false)
const retryingErrors = ref(new Set<number>())
const dismissed = ref(false)

// Computed
const displayedErrors = computed(() => {
  return errors.value.slice(0, displayLimit.value)
})

const hasRetryableErrors = computed(() => {
  return getRetryableErrors().length > 0
})

const summaryTitle = computed(() => {
  if (props.title) return props.title
  
  const total = errorStats.value.total || errors.value.length
  if (total === 0) return 'Sin errores'
  if (total === 1) return '1 error detectado'
  return `${total} errores detectados`
})

const summarySubtitle = computed(() => {
  if (props.subtitle) return props.subtitle
  
  const critical = errorStats.value.bySeverity?.critical || 0
  const network = errorStats.value.byType?.network || 0
  
  if (critical > 0) {
    return `${critical} error${critical > 1 ? 'es' : ''} crítico${critical > 1 ? 's' : ''} requiere${critical === 1 ? '' : 'n'} atención`
  }
  
  if (network > 0) {
    return `${network} error${network > 1 ? 'es' : ''} de conexión detectado${network > 1 ? 's' : ''}`
  }
  
  return 'Revisa los detalles para más información'
})

// Methods
const dismiss = () => {
  dismissed.value = true
  emit('dismiss')
}

const clearAllErrors = () => {
  clearErrors()
  emit('clear')
}

const retryErrors = async () => {
  if (retrying.value) return
  
  retrying.value = true
  
  try {
    const retryableErrors = getRetryableErrors()
    
    for (const error of retryableErrors) {
      try {
        // This would need to be implemented based on the specific error type
        console.log('Retrying error:', error.id)
        emit('retry', error)
      } catch (retryError) {
        console.error('Retry failed for error:', error.id, retryError)
      }
    }
  } finally {
    retrying.value = false
  }
}

const retryError = async (error: any, index: number) => {
  if (retryingErrors.value.has(index)) return
  
  retryingErrors.value.add(index)
  
  try {
    console.log('Retrying individual error:', error.id)
    emit('retry', error)
  } finally {
    retryingErrors.value.delete(index)
  }
}

const dismissError = (index: number) => {
  // Remove error from display (this would need integration with the error handler)
  console.log('Dismissing error at index:', index)
}

const toggleErrorDetails = (index: number) => {
  if (expandedErrors.value.has(index)) {
    expandedErrors.value.delete(index)
  } else {
    expandedErrors.value.add(index)
  }
}

const loadMore = () => {
  displayLimit.value += 10
}

const exportErrors = () => {
  exportErrorsFromHandler()
  emit('export')
}

const getErrorIcon = (error: any) => {
  const iconMap = {
    critical: 'IconCritical',
    high: 'IconHigh',
    medium: 'IconMedium',
    low: 'IconLow'
  }
  
  return iconMap[error.severity as keyof typeof iconMap] || 'IconMedium'
}

const formatErrorType = (type: string): string => {
  const typeMap: Record<string, string> = {
    api: 'API',
    auth: 'Autenticación',
    validation: 'Validación',
    network: 'Red',
    client: 'Cliente',
    unknown: 'Desconocido'
  }
  
  return typeMap[type] || type
}

const formatTime = (timestamp: Date | string): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) { // Less than 1 minute
    return 'Hace un momento'
  } else if (diff < 3600000) { // Less than 1 hour
    const minutes = Math.floor(diff / 60000)
    return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`
  } else if (diff < 86400000) { // Less than 1 day
    const hours = Math.floor(diff / 3600000)
    return `Hace ${hours} hora${hours > 1 ? 's' : ''}`
  } else {
    return date.toLocaleDateString()
  }
}

// Auto refresh
if (props.autoRefresh && import.meta.client) {
  const refreshTimer = setInterval(() => {
    // Refresh would be handled by the global error handler
    console.log('Auto-refreshing error display')
  }, props.refreshInterval)
  
  onUnmounted(() => {
    clearInterval(refreshTimer)
  })
}

// Icon components (simplified inline definitions)
const IconCritical = {
  template: `
    <svg class="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
    </svg>
  `
}

const IconHigh = {
  template: `
    <svg class="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
    </svg>
  `
}

const IconMedium = {
  template: `
    <svg class="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
    </svg>
  `
}

const IconLow = {
  template: `
    <svg class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
    </svg>
  `
}
</script>

<style scoped>
.error-display {
  @apply space-y-4;
}

/* Summary Card */
.error-summary-card {
  @apply bg-red-50 border border-red-200 rounded-lg p-4;
}

.error-summary-header {
  @apply flex items-start gap-3;
}

.error-summary-icon {
  @apply flex-shrink-0;
}

.error-summary-title {
  @apply flex-1 min-w-0;
}

.error-summary-title h3 {
  @apply text-lg font-semibold text-red-800 mb-1;
}

.error-summary-subtitle {
  @apply text-sm text-red-600;
}

.error-summary-dismiss {
  @apply flex-shrink-0 p-1 rounded-md text-red-500 hover:bg-red-100 transition-colors;
}

/* Error Stats */
.error-stats {
  @apply mt-4 pt-4 border-t border-red-200;
}

.error-stats-grid {
  @apply grid grid-cols-2 md:grid-cols-4 gap-4;
}

.error-stat {
  @apply text-center;
}

.error-stat-value {
  @apply text-2xl font-bold text-red-700;
}

.error-stat-label {
  @apply text-xs text-red-600 uppercase tracking-wide;
}

.error-stat--critical .error-stat-value {
  @apply text-red-800;
}

.error-stat--high .error-stat-value {
  @apply text-orange-700;
}

.error-stat--network .error-stat-value {
  @apply text-blue-700;
}

/* Summary Actions */
.error-summary-actions {
  @apply flex gap-2 mt-4 pt-4 border-t border-red-200;
}

.error-action-button {
  @apply px-3 py-2 text-sm font-medium rounded-md transition-colors;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.error-action-primary {
  @apply bg-red-600 text-white hover:bg-red-700 focus:ring-red-500;
}

.error-action-primary:disabled {
  @apply bg-red-400 cursor-not-allowed;
}

.error-action-secondary {
  @apply bg-white text-red-700 border border-red-300 hover:bg-red-50 focus:ring-red-500;
}

/* Error List */
.error-list {
  @apply bg-white border border-gray-200 rounded-lg overflow-hidden;
}

.error-list-header {
  @apply flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200;
}

.error-list-header h4 {
  @apply text-sm font-medium text-gray-900;
}

.error-list-count {
  @apply text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full;
}

.error-list-items {
  @apply divide-y divide-gray-200;
}

/* Error Item */
.error-item {
  @apply flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors;
}

.error-item--critical {
  @apply bg-red-50 border-l-4 border-red-500;
}

.error-item--high {
  @apply bg-orange-50 border-l-4 border-orange-500;
}

.error-item--medium {
  @apply bg-yellow-50 border-l-4 border-yellow-500;
}

.error-item--low {
  @apply bg-blue-50 border-l-4 border-blue-500;
}

.error-item-icon {
  @apply flex-shrink-0 mt-1;
}

.error-item-content {
  @apply flex-1 min-w-0;
}

.error-item-header {
  @apply flex items-center justify-between mb-1;
}

.error-item-type {
  @apply text-xs font-medium text-gray-500 uppercase tracking-wide;
}

.error-item-time {
  @apply text-xs text-gray-400;
}

.error-item-message {
  @apply text-sm text-gray-900 mb-1;
}

.error-item-context {
  @apply text-xs text-gray-500;
}

.error-item-details {
  @apply mt-2;
}

.error-details-toggle {
  @apply text-xs text-blue-600 hover:text-blue-800 underline;
}

.error-details-content {
  @apply mt-2 p-2 bg-gray-100 rounded text-xs space-y-1;
}

.error-detail {
  @apply text-gray-700;
}

.error-stack {
  @apply mt-1 p-2 bg-gray-800 text-gray-100 rounded text-xs font-mono overflow-x-auto;
}

.error-item-actions {
  @apply flex gap-1;
}

.error-item-action {
  @apply p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors;
}

/* Load More */
.error-list-footer {
  @apply p-4 bg-gray-50 border-t border-gray-200 text-center;
}

.error-load-more {
  @apply text-sm text-blue-600 hover:text-blue-800 underline;
}

/* Network Status */
.network-status {
  @apply flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg;
}

.network-status-icon {
  @apply flex-shrink-0;
}

.network-status-content {
  @apply flex-1;
}

.network-status-title {
  @apply text-sm font-medium text-red-800;
}

.network-status-message {
  @apply text-xs text-red-600;
}

/* Responsive */
@media (max-width: 640px) {
  .error-stats-grid {
    @apply grid-cols-2;
  }
  
  .error-summary-actions {
    @apply flex-col;
  }
  
  .error-action-button {
    @apply w-full justify-center;
  }
  
  .error-item {
    @apply flex-col gap-2;
  }
  
  .error-item-actions {
    @apply self-end;
  }
}

/* Animations */
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