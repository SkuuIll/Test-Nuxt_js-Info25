<template>
  <div class="enhanced-image-container" :class="containerClass">
    <!-- Loading State -->
    <div 
      v-if="loading" 
      class="image-placeholder loading"
      :style="{ aspectRatio: aspectRatio }"
    >
      <div class="loading-spinner">
        <svg class="animate-spin h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    </div>

    <!-- Error State -->
    <div 
      v-else-if="hasError && !fallbackSrc" 
      class="image-placeholder error"
      :style="{ aspectRatio: aspectRatio }"
    >
      <div class="error-content">
        <svg class="h-12 w-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p class="text-sm text-gray-500">{{ errorMessage }}</p>
        <button 
          v-if="showRetryButton"
          @click="retry"
          class="mt-2 text-xs text-primary-600 hover:text-primary-700 underline"
        >
          Reintentar
        </button>
      </div>
    </div>

    <!-- Image -->
    <img
      v-else
      ref="imageRef"
      :src="currentSrc"
      :alt="alt"
      :class="imageClass"
      :loading="lazyLoading ? 'lazy' : 'eager'"
      :style="imageStyle"
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
interface Props {
  src: string
  alt: string
  fallbackSrc?: string
  aspectRatio?: string
  containerClass?: string
  imageClass?: string
  lazyLoading?: boolean
  retryAttempts?: number
  showRetryButton?: boolean
  errorMessage?: string
  width?: number | string
  height?: number | string
}

const props = withDefaults(defineProps<Props>(), {
  fallbackSrc: '',
  aspectRatio: 'auto',
  containerClass: '',
  imageClass: 'w-full h-full object-cover',
  lazyLoading: true,
  retryAttempts: 2,
  showRetryButton: true,
  errorMessage: 'Error al cargar imagen'
})

const emit = defineEmits<{
  load: [event: Event]
  error: [error: Event]
  click: [event: Event]
}>()

// State
const loading = ref(true)
const hasError = ref(false)
const currentAttempt = ref(0)
const currentSrc = ref(props.src)
const imageRef = ref<HTMLImageElement>()

// Computed
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
  emit('load', event)
}

const onError = (event: Event) => {
  console.warn(`❌ Error loading image: ${currentSrc.value}`)
  
  // Try fallback if available and not already using it
  if (props.fallbackSrc && currentSrc.value !== props.fallbackSrc) {
    console.log(`🔄 Trying fallback image: ${props.fallbackSrc}`)
    currentSrc.value = props.fallbackSrc
    return
  }
  
  // Try retry if attempts remaining
  if (currentAttempt.value < props.retryAttempts) {
    currentAttempt.value++
    console.log(`🔄 Retrying image load (attempt ${currentAttempt.value}/${props.retryAttempts})`)
    
    // Add cache busting parameter
    const separator = currentSrc.value.includes('?') ? '&' : '?'
    currentSrc.value = `${props.src}${separator}_retry=${currentAttempt.value}&_t=${Date.now()}`
    return
  }
  
  // All attempts failed
  loading.value = false
  hasError.value = true
  emit('error', event)
}

const retry = () => {
  loading.value = true
  hasError.value = false
  currentAttempt.value = 0
  currentSrc.value = props.src
}

const onClick = (event: Event) => {
  emit('click', event)
}

// Watch for src changes
watch(() => props.src, (newSrc) => {
  if (newSrc !== currentSrc.value) {
    loading.value = true
    hasError.value = false
    currentAttempt.value = 0
    currentSrc.value = newSrc
  }
})

// Intersection Observer for lazy loading optimization
const { stop } = useIntersectionObserver(
  imageRef,
  ([{ isIntersecting }]) => {
    if (isIntersecting && props.lazyLoading) {
      // Image is in viewport, ensure it starts loading
      if (imageRef.value && !imageRef.value.complete) {
        loading.value = true
      }
    }
  },
  {
    rootMargin: '50px'
  }
)

onUnmounted(() => {
  stop()
})
</script>

<style scoped>
.enhanced-image-container {
  @apply relative overflow-hidden;
}

.image-placeholder {
  @apply flex items-center justify-center bg-gray-100 dark:bg-gray-800;
}

.image-placeholder.loading {
  @apply animate-pulse;
}

.image-placeholder.error {
  @apply border-2 border-dashed border-gray-300 dark:border-gray-600;
}

.loading-spinner {
  @apply flex items-center justify-center;
}

.error-content {
  @apply flex flex-col items-center justify-center text-center p-4;
}

.image-overlay {
  @apply absolute inset-0 flex items-center justify-center;
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