<template>
  <div class="enhanced-image-container" :class="containerClass">
    <!-- Loading State -->
    <div 
      v-if="loading" 
      class="image-placeholder loading"
      :style="placeholderStyle"
      role="img"
      :aria-label="`Cargando imagen: ${alt}`"
    >
      <div class="loading-spinner">
        <svg class="animate-spin h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      <div v-if="showLoadingText" class="loading-text">
        {{ loadingText }}
      </div>
    </div>

    <!-- Error State -->
    <div 
      v-else-if="hasError && !currentFallbackSrc" 
      class="image-placeholder error"
      :style="placeholderStyle"
      role="img"
      :aria-label="`Error cargando imagen: ${alt}`"
    >
      <div class="error-content">
        <svg class="h-12 w-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p class="text-sm text-gray-500 mb-2">{{ currentErrorMessage }}</p>
        <div class="error-actions">
          <button 
            v-if="showRetryButton && canRetry"
            @click="retry"
            class="error-button retry-button"
            :disabled="retrying"
          >
            <svg v-if="retrying" class="animate-spin h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ retrying ? 'Reintentando...' : 'Reintentar' }}
          </button>
          <button 
            v-if="showReportButton"
            @click="reportError"
            class="error-button report-button"
          >
            Reportar problema
          </button>
        </div>
      </div>
    </div>

    <!-- Image -->
    <img
      v-else
      ref="imageRef"
      :src="currentSrc"
      :alt="alt"
      :class="[imageClass, { 'fade-in': fadeInOnLoad }]"
      :loading="lazyLoading ? 'lazy' : 'eager'"
      :style="imageStyle"
      :sizes="sizes"
      :srcset="srcset"
      @load="onLoad"
      @error="onError"
      @click="onClick"
    />

    <!-- Overlay Content -->
    <div v-if="$slots.overlay" class="image-overlay">
      <slot name="overlay" />
    </div>


  </div>
</template>

<script setup lang="ts">
import { useImageFallback, useIPXFallback, DEFAULT_FALLBACKS } from '~/composables/useImageFallback'

interface Props {
  src: string
  alt: string
  fallbackSrc?: string
  aspectRatio?: string
  containerClass?: string
  imageClass?: string
  lazyLoading?: boolean
  retryAttempts?: number
  retryDelay?: number
  showRetryButton?: boolean
  showReportButton?: boolean
  showLoadingText?: boolean
  loadingText?: string
  errorMessage?: string
  width?: number | string
  height?: number | string
  sizes?: string
  srcset?: string
  fadeInOnLoad?: boolean

  onErrorReport?: (error: ErrorReport) => void
}

interface ErrorReport {
  originalSrc: string
  currentSrc: string
  attempts: number
  errorType: string
  timestamp: number
  userAgent: string
}

const props = withDefaults(defineProps<Props>(), {
  fallbackSrc: '',
  aspectRatio: 'auto',
  containerClass: '',
  imageClass: 'w-full h-full object-cover',
  lazyLoading: true,
  retryAttempts: 3,
  retryDelay: 1000,
  showRetryButton: true,
  showReportButton: false,
  showLoadingText: false,
  loadingText: 'Cargando imagen...',
  errorMessage: 'Error al cargar imagen',
  fadeInOnLoad: true
})

const emit = defineEmits<{
  load: [event: Event]
  error: [error: Event]
  click: [event: Event]
  retry: [attempt: number]
  fallback: [fallbackSrc: string]
}>()

// Composables
const { handleIPXError, createIPXFallbackSrc } = useIPXFallback()

// State
const loading = ref(true)
const hasError = ref(false)
const retrying = ref(false)
const currentAttempt = ref(0)
const currentSrc = ref(props.src)
const currentFallbackSrc = ref('')
const currentErrorMessage = ref(props.errorMessage)
const imageRef = ref<HTMLImageElement>()
const errorHistory = ref<string[]>([])

// Environment detection
const isDevelopment = computed(() => process.env.NODE_ENV === 'development')

// Image analysis
const isIPXUrl = computed(() => currentSrc.value.includes('/_ipx/'))
const canRetry = computed(() => currentAttempt.value < props.retryAttempts)

// Computed styles
const placeholderStyle = computed(() => {
  const style: Record<string, string> = {}
  
  if (props.aspectRatio && props.aspectRatio !== 'auto') {
    style.aspectRatio = props.aspectRatio
  }
  
  if (props.width) {
    style.width = typeof props.width === 'number' ? `${props.width}px` : props.width
  }
  
  if (props.height) {
    style.height = typeof props.height === 'number' ? `${props.height}px` : props.height
  }
  
  return style
})

const imageStyle = computed(() => {
  const style: Record<string, string> = {}
  
  if (props.width) {
    style.width = typeof props.width === 'number' ? `${props.width}px` : props.width
  }
  
  if (props.height) {
    style.height = typeof props.height === 'number' ? `${props.height}px` : props.height
  }
  
  return style
})

// Methods
const onLoad = (event: Event) => {
  loading.value = false
  hasError.value = false
  retrying.value = false
  
  // Reset retry count on successful load
  if (currentAttempt.value > 0) {
    currentAttempt.value = 0
  }
  
  emit('load', event)
}

const onError = async (event: Event) => {
  const errorSrc = currentSrc.value
  
  // Add to error history
  errorHistory.value.push(errorSrc)
  
  // Update error message based on error type
  if (isIPXUrl.value) {
    currentErrorMessage.value = 'Error de optimización de imagen'
  } else if (errorSrc.includes('http')) {
    currentErrorMessage.value = 'Error de conexión'
  } else {
    currentErrorMessage.value = props.errorMessage
  }

  // Try IPX fallback first if it's an IPX URL
  if (isIPXUrl.value && !currentFallbackSrc.value) {
    try {
      const fallbackSrc = handleIPXError(errorSrc)

      currentSrc.value = fallbackSrc
      currentFallbackSrc.value = fallbackSrc
      emit('fallback', fallbackSrc)
      return
    } catch (ipxError) {
      // IPX fallback failed, continue to next fallback
    }
  }
  
  // Try custom fallback if available and not already using it
  if (props.fallbackSrc && currentSrc.value !== props.fallbackSrc && !currentFallbackSrc.value) {

    currentSrc.value = props.fallbackSrc
    currentFallbackSrc.value = props.fallbackSrc
    emit('fallback', props.fallbackSrc)
    return
  }
  
  // Try default fallback based on context
  const defaultFallback = getDefaultFallback()
  if (defaultFallback && currentSrc.value !== defaultFallback && !currentFallbackSrc.value) {

    currentSrc.value = defaultFallback
    currentFallbackSrc.value = defaultFallback
    emit('fallback', defaultFallback)
    return
  }
  
  // Try retry if attempts remaining
  if (canRetry.value) {
    await retryWithDelay()
    return
  }
  
  // All attempts failed
  loading.value = false
  hasError.value = true
  retrying.value = false
  emit('error', event)
}

const retryWithDelay = async () => {
  if (!canRetry.value) return
  
  currentAttempt.value++
  retrying.value = true
  

  
  // Wait for retry delay
  if (props.retryDelay > 0) {
    await new Promise(resolve => setTimeout(resolve, props.retryDelay))
  }
  
  // Add cache busting parameter
  const separator = props.src.includes('?') ? '&' : '?'
  currentSrc.value = `${props.src}${separator}_retry=${currentAttempt.value}&_t=${Date.now()}`
  
  emit('retry', currentAttempt.value)
}

const retry = async () => {
  if (retrying.value) return
  
  loading.value = true
  hasError.value = false
  retrying.value = true
  currentAttempt.value = 0
  currentFallbackSrc.value = ''
  currentErrorMessage.value = props.errorMessage
  errorHistory.value = []
  
  // Reset to original source
  currentSrc.value = props.src
  
  emit('retry', 0)
}

const getDefaultFallback = (): string => {
  // Determine appropriate fallback based on alt text or context
  const altLower = props.alt.toLowerCase()
  
  if (altLower.includes('avatar') || altLower.includes('profile') || altLower.includes('usuario')) {
    return DEFAULT_FALLBACKS.avatar
  } else if (altLower.includes('post') || altLower.includes('article') || altLower.includes('artículo')) {
    return DEFAULT_FALLBACKS.post
  } else if (altLower.includes('category') || altLower.includes('categoría')) {
    return DEFAULT_FALLBACKS.category
  }
  
  return DEFAULT_FALLBACKS.general
}

const reportError = () => {
  if (!props.onErrorReport) return
  
  const errorReport: ErrorReport = {
    originalSrc: props.src,
    currentSrc: currentSrc.value,
    attempts: currentAttempt.value,
    errorType: isIPXUrl.value ? 'IPX_ERROR' : 'LOAD_ERROR',
    timestamp: Date.now(),
    userAgent: navigator.userAgent
  }
  
  props.onErrorReport(errorReport)
  console.log('📊 Error reported:', errorReport)
}

const onClick = (event: Event) => {
  if (!hasError.value) {
    emit('click', event)
  }
}

// Watch for src changes
watch(() => props.src, (newSrc) => {
  if (newSrc !== props.src) {
    loading.value = true
    hasError.value = false
    retrying.value = false
    currentAttempt.value = 0
    currentFallbackSrc.value = ''
    currentErrorMessage.value = props.errorMessage
    errorHistory.value = []
    currentSrc.value = newSrc
  }
})

// Intersection Observer for lazy loading optimization
let intersectionObserver: IntersectionObserver | null = null

onMounted(() => {
  if (props.lazyLoading && imageRef.value) {
    intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Image is in viewport, ensure it starts loading
          if (imageRef.value && !imageRef.value.complete) {
            loading.value = true
          }
          // Stop observing once image is in viewport
          intersectionObserver?.unobserve(imageRef.value!)
        }
      },
      {
        rootMargin: '50px'
      }
    )
    
    intersectionObserver.observe(imageRef.value)
  }
})

onUnmounted(() => {
  if (intersectionObserver) {
    intersectionObserver.disconnect()
  }
})
</script>

<style scoped>
.enhanced-image-container {
  @apply relative overflow-hidden;
}

.image-placeholder {
  @apply flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800;
  min-height: 120px;
}

.image-placeholder.loading {
  @apply animate-pulse;
}

.image-placeholder.error {
  @apply border-2 border-dashed border-gray-300 dark:border-gray-600;
}

.loading-spinner {
  @apply flex items-center justify-center mb-2;
}

.loading-text {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

.error-content {
  @apply flex flex-col items-center justify-center text-center p-4 max-w-xs;
}

.error-actions {
  @apply flex flex-col sm:flex-row gap-2 mt-2;
}

.error-button {
  @apply inline-flex items-center justify-center px-3 py-1 text-xs font-medium rounded transition-colors duration-200;
}

.retry-button {
  @apply text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 dark:bg-primary-900 dark:text-primary-300 dark:hover:bg-primary-800;
}

.retry-button:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.report-button {
  @apply text-gray-600 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700;
}

.image-overlay {
  @apply absolute inset-0 flex items-center justify-center;
}

.debug-info {
  @apply absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded max-w-xs;
}

.debug-item {
  @apply truncate;
}

/* Fade in animation */
.fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Responsive image styles */
.enhanced-image-container img {
  @apply transition-all duration-300;
}

.enhanced-image-container:hover img {
  @apply transform scale-105;
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .image-placeholder {
    @apply bg-gray-800 border-gray-700;
  }
  
  .error-content svg {
    @apply text-gray-600;
  }
  
  .error-content p {
    @apply text-gray-400;
  }
}
</style>