<template>
  <div v-if="visible" class="error-display" :class="displayClasses">
    <!-- Error Icon -->
    <div class="error-icon">
      <Icon :name="errorIcon" :class="iconClasses" />
    </div>

    <!-- Error Content -->
    <div class="error-content">
      <!-- Title -->
      <h3 class="error-title">
        {{ errorTitle }}
      </h3>

      <!-- Message -->
      <p class="error-message">
        {{ errorMessage }}
      </p>

      <!-- Validation Errors -->
      <div v-if="validationErrors.length > 0" class="validation-errors">
        <h4 class="validation-title">Errores de validación:</h4>
        <ul class="validation-list">
          <li v-for="validationError in validationErrors" :key="validationError.field" class="validation-item">
            <strong>{{ formatFieldName(validationError.field) }}:</strong>
            {{ validationError.message }}
          </li>
        </ul>
      </div>

      <!-- Network Info -->
      <div v-if="showNetworkInfo && error?.type === 'network'" class="network-info">
        <h4 class="network-title">Información de conexión:</h4>
        <div class="network-details">
          <div class="network-item">
            <span class="network-label">Estado:</span>
            <span :class="networkStatusClass">
              {{ networkInfo.isOnline ? 'Conectado' : 'Desconectado' }}
            </span>
          </div>
          <div v-if="networkInfo.effectiveType" class="network-item">
            <span class="network-label">Tipo de conexión:</span>
            <span>{{ networkInfo.effectiveType }}</span>
          </div>
          <div v-if="networkInfo.downlink" class="network-item">
            <span class="network-label">Velocidad:</span>
            <span>{{ networkInfo.downlink }} Mbps</span>
          </div>
        </div>
      </div>

      <!-- Error Details (Collapsible) -->
      <details v-if="showDetails && error" class="error-details">
        <summary class="details-summary">
          <Icon name="heroicons:information-circle" class="w-4 h-4 mr-2" />
          Detalles técnicos
        </summary>
        <div class="details-content">
          <div class="detail-item">
            <span class="detail-label">ID:</span>
            <code class="detail-value">{{ error.id }}</code>
          </div>
          <div class="detail-item">
            <span class="detail-label">Código:</span>
            <code class="detail-value">{{ error.code || 'N/A' }}</code>
          </div>
          <div class="detail-item">
            <span class="detail-label">Tipo:</span>
            <code class="detail-value">{{ error.type }}</code>
          </div>
          <div class="detail-item">
            <span class="detail-label">Severidad:</span>
            <code class="detail-value">{{ error.severity }}</code>
          </div>
          <div class="detail-item">
            <span class="detail-label">Timestamp:</span>
            <code class="detail-value">{{ formatTimestamp(error.timestamp) }}</code>
          </div>
          <div v-if="error.context" class="detail-item">
            <span class="detail-label">Contexto:</span>
            <code class="detail-value">{{ error.context }}</code>
          </div>
          <div v-if="error.url" class="detail-item">
            <span class="detail-label">URL:</span>
            <code class="detail-value">{{ error.url }}</code>
          </div>
        </div>
      </details>

      <!-- Actions -->
      <div class="error-actions">
        <button
          v-if="error?.retryable && showRetry"
          @click="handleRetry"
          class="btn btn-primary"
          :disabled="retrying"
        >
          <Icon v-if="retrying" name="heroicons:arrow-path" class="w-4 h-4 animate-spin mr-2" />
          <Icon v-else name="heroicons:arrow-path" class="w-4 h-4 mr-2" />
          {{ retrying ? 'Reintentando...' : 'Reintentar' }}
        </button>

        <button
          v-if="showReload"
          @click="handleReload"
          class="btn btn-secondary"
        >
          <Icon name="heroicons:arrow-path" class="w-4 h-4 mr-2" />
          Recargar página
        </button>

        <button
          v-if="showReport"
          @click="handleReport"
          class="btn btn-outline"
          :disabled="reporting"
        >
          <Icon v-if="reporting" name="heroicons:arrow-path" class="w-4 h-4 animate-spin mr-2" />
          <Icon v-else name="heroicons:bug-ant" class="w-4 h-4 mr-2" />
          {{ reporting ? 'Reportando...' : 'Reportar error' }}
        </button>

        <button
          v-if="showDismiss"
          @click="handleDismiss"
          class="btn btn-ghost"
        >
          <Icon name="heroicons:x-mark" class="w-4 h-4 mr-2" />
          Descartar
        </button>
      </div>
    </div>

    <!-- Close Button -->
    <button
      v-if="showClose"
      @click="handleClose"
      class="error-close"
      :aria-label="'Cerrar error: ' + errorTitle"
    >
      <Icon name="heroicons:x-mark" class="w-5 h-5" />
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  error?: any
  validationErrors?: Array<{
    field: string
    message: string
    code?: string
    value?: any
  }>
  visible?: boolean
  showDetails?: boolean
  showRetry?: boolean
  showReload?: boolean
  showReport?: boolean
  showDismiss?: boolean
  showClose?: boolean
  showNetworkInfo?: boolean
  variant?: 'inline' | 'modal' | 'toast' | 'banner'
}

const props = withDefaults(defineProps<Props>(), {
  error: null,
  validationErrors: () => [],
  visible: true,
  showDetails: false,
  showRetry: true,
  showReload: false,
  showReport: true,
  showDismiss: true,
  showClose: true,
  showNetworkInfo: true,
  variant: 'inline'
})

const emit = defineEmits<{
  retry: []
  reload: []
  report: []
  dismiss: []
  close: []
}>()

const { networkInfo, reportError } = useErrorHandler()

// State
const retrying = ref(false)
const reporting = ref(false)

// Computed
const displayClasses = computed(() => {
  const baseClasses = ['error-display']
  
  if (props.error?.severity) {
    baseClasses.push(`error-${props.error.severity}`)
  }
  
  if (props.variant) {
    baseClasses.push(`error-${props.variant}`)
  }
  
  return baseClasses
})

const errorIcon = computed(() => {
  if (!props.error) return 'heroicons:exclamation-triangle'
  
  const iconMap = {
    network: 'heroicons:wifi-slash',
    auth: 'heroicons:lock-closed',
    validation: 'heroicons:exclamation-circle',
    api: 'heroicons:server',
    client: 'heroicons:bug-ant',
    unknown: 'heroicons:question-mark-circle'
  }
  
  return iconMap[props.error.type as keyof typeof iconMap] || iconMap.unknown
})

const iconClasses = computed(() => {
  const baseClasses = ['w-6 h-6']
  
  if (props.error?.severity) {
    const colorMap = {
      low: 'text-yellow-500',
      medium: 'text-orange-500',
      high: 'text-red-500',
      critical: 'text-red-600'
    }
    baseClasses.push(colorMap[props.error.severity as keyof typeof colorMap] || 'text-red-500')
  }
  
  return baseClasses
})

const errorTitle = computed(() => {
  if (!props.error) return 'Error'
  
  const titleMap = {
    network: 'Error de conexión',
    auth: 'Error de autenticación',
    validation: 'Error de validación',
    api: 'Error del servidor',
    client: 'Error de la aplicación',
    unknown: 'Error desconocido'
  }
  
  return titleMap[props.error.type as keyof typeof titleMap] || titleMap.unknown
})

const errorMessage = computed(() => {
  return props.error?.message || 'Ha ocurrido un error inesperado'
})

const networkStatusClass = computed(() => {
  return networkInfo.value.isOnline ? 'text-green-600' : 'text-red-600'
})

// Methods
const formatFieldName = (field: string): string => {
  return field
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}

const formatTimestamp = (timestamp: Date): string => {
  return new Date(timestamp).toLocaleString()
}

const handleRetry = async () => {
  if (retrying.value) return
  
  retrying.value = true
  
  try {
    emit('retry')
    
    // Simulate retry delay
    await new Promise(resolve => setTimeout(resolve, 1000))
  } finally {
    retrying.value = false
  }
}

const handleReload = () => {
  emit('reload')
  
  if (import.meta.client) {
    window.location.reload()
  }
}

const handleReport = async () => {
  if (reporting.value || !props.error) return
  
  reporting.value = true
  
  try {
    await reportError(props.error)
    emit('report')
    
    const { success } = useToast()
    success('Error reportado', 'Gracias por reportar este error')
  } catch (error) {
    const { error: errorToast } = useToast()
    errorToast('Error al reportar', 'No se pudo reportar el error')
  } finally {
    reporting.value = false
  }
}

const handleDismiss = () => {
  emit('dismiss')
}

const handleClose = () => {
  emit('close')
}
</script>

<style scoped>
.error-display {
  @apply relative flex items-start space-x-4 p-4 rounded-lg border;
  @apply bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800;
}

.error-display.error-low {
  @apply bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800;
}

.error-display.error-medium {
  @apply bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800;
}

.error-display.error-high {
  @apply bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800;
}

.error-display.error-critical {
  @apply bg-red-100 border-red-300 dark:bg-red-900/30 dark:border-red-700;
  @apply shadow-lg;
}

.error-display.error-modal {
  @apply fixed inset-0 z-50 flex items-center justify-center p-4;
  @apply bg-black bg-opacity-50;
}

.error-display.error-banner {
  @apply w-full rounded-none border-x-0 border-t-0;
}

.error-icon {
  @apply flex-shrink-0;
}

.error-content {
  @apply flex-1 min-w-0;
}

.error-title {
  @apply text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2;
}

.error-message {
  @apply text-gray-700 dark:text-gray-300 mb-4 leading-relaxed;
}

.validation-errors {
  @apply mb-4 p-3 bg-white dark:bg-gray-800 rounded border;
}

.validation-title {
  @apply text-sm font-medium text-gray-900 dark:text-gray-100 mb-2;
}

.validation-list {
  @apply space-y-1;
}

.validation-item {
  @apply text-sm text-gray-700 dark:text-gray-300;
}

.network-info {
  @apply mb-4 p-3 bg-white dark:bg-gray-800 rounded border;
}

.network-title {
  @apply text-sm font-medium text-gray-900 dark:text-gray-100 mb-2;
}

.network-details {
  @apply space-y-1;
}

.network-item {
  @apply flex justify-between text-sm;
}

.network-label {
  @apply text-gray-600 dark:text-gray-400;
}

.error-details {
  @apply mb-4 border border-gray-200 dark:border-gray-700 rounded;
}

.details-summary {
  @apply cursor-pointer p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700;
  @apply flex items-center text-sm font-medium text-gray-700 dark:text-gray-300;
  @apply transition-colors;
}

.details-content {
  @apply p-3 space-y-2 bg-white dark:bg-gray-900;
}

.detail-item {
  @apply flex items-center space-x-2 text-sm;
}

.detail-label {
  @apply font-medium text-gray-600 dark:text-gray-400 min-w-20;
}

.detail-value {
  @apply bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs font-mono;
  @apply text-gray-800 dark:text-gray-200;
}

.error-actions {
  @apply flex flex-wrap gap-2;
}

.btn {
  @apply px-4 py-2 rounded-lg font-medium transition-colors;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
  @apply flex items-center;
}

.btn-primary {
  @apply bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500;
}

.btn-secondary {
  @apply bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500;
}

.btn-outline {
  @apply border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500;
  @apply dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800;
}

.btn-ghost {
  @apply text-gray-600 hover:text-gray-800 hover:bg-gray-100 focus:ring-gray-500;
  @apply dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800;
}

.error-close {
  @apply absolute top-4 right-4 p-1 rounded-full;
  @apply text-gray-400 hover:text-gray-600 hover:bg-gray-100;
  @apply dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-800;
  @apply focus:outline-none focus:ring-2 focus:ring-gray-500;
  @apply transition-colors;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .error-display {
    @apply flex-col space-x-0 space-y-4;
  }
  
  .error-actions {
    @apply flex-col;
  }
  
  .btn {
    @apply w-full justify-center;
  }
}
</style>