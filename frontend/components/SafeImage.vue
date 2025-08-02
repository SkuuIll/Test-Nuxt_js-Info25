<template>
  <div class="safe-image-container" :class="containerClass" :style="placeholderStyle">
    <ClientOnly>
      <!-- Simple Image with Error Handling -->
      <div class="image-wrapper" :style="placeholderStyle">
        <img
          v-if="!hasError && src"
          :src="src"
          :alt="alt"
          :class="imageClass"
          :loading="lazyLoading ? 'lazy' : 'eager'"
          @load="onLoad"
          @error="onError"
          @click="$emit('click', $event)"
        />
        
        <!-- Error State -->
        <div 
          v-else-if="hasError"
          class="image-placeholder error"
          :style="placeholderStyle"
        >
          <div class="error-content">
            <svg class="h-8 w-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
            </svg>
            <span class="text-xs text-gray-400 mt-1">{{ errorMessage }}</span>
            <button 
              v-if="fallbackSrc && !triedFallback"
              @click="tryFallback"
              class="mt-2 text-xs text-primary-600 hover:text-primary-700 underline"
            >
              Reintentar
            </button>
          </div>
        </div>
        
        <!-- No Image State -->
        <div 
          v-else-if="!src"
          class="image-placeholder no-image"
          :style="placeholderStyle"
        >
          <div class="fallback-content">
            <svg class="h-8 w-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
            </svg>
            <span class="text-xs text-gray-400 mt-1">Sin imagen</span>
          </div>
        </div>
      </div>
      
      <template #fallback>
        <!-- Server-side fallback -->
        <div 
          class="image-placeholder fallback"
          :style="placeholderStyle"
          role="img"
          :aria-label="alt"
        >
          <div class="fallback-content">
            <svg class="h-8 w-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
            </svg>
            <span class="text-xs text-gray-400 mt-1">Imagen</span>
          </div>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
interface Props {
  src: string
  alt: string
  fallbackSrc?: string
  aspectRatio?: string
  containerClass?: string
  imageContainerClass?: string
  imageClass?: string
  lazyLoading?: boolean
  errorMessage?: string
  width?: number | string
  height?: number | string
}

const props = withDefaults(defineProps<Props>(), {
  fallbackSrc: '',
  aspectRatio: 'auto',
  containerClass: '',
  imageContainerClass: '',
  imageClass: 'w-full h-full object-cover',
  lazyLoading: true,
  errorMessage: 'Error al cargar imagen'
})

const emit = defineEmits<{
  load: [event: Event]
  error: [error: Event]
  click: [event: Event]
}>()

// State
const hasError = ref(false)
const triedFallback = ref(false)
const currentSrc = ref(props.src)

// Methods
const onLoad = (event: Event) => {
  hasError.value = false
  console.log('✅ SafeImage loaded:', currentSrc.value)
  emit('load', event)
}

const onError = (event: Event) => {
  console.error('❌ SafeImage error:', currentSrc.value)
  
  // Try fallback if available and not already tried
  if (props.fallbackSrc && !triedFallback.value && currentSrc.value !== props.fallbackSrc) {
    console.log('🔄 Trying fallback:', props.fallbackSrc)
    triedFallback.value = true
    currentSrc.value = props.fallbackSrc
    return
  }
  
  hasError.value = true
  emit('error', event)
}

const tryFallback = () => {
  if (props.fallbackSrc) {
    hasError.value = false
    triedFallback.value = true
    currentSrc.value = props.fallbackSrc
  }
}

// Watch for src changes
watch(() => props.src, (newSrc) => {
  if (newSrc !== currentSrc.value) {
    hasError.value = false
    triedFallback.value = false
    currentSrc.value = newSrc
  }
})

// Computed styles for fallback
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
</script>

<style scoped>
.safe-image-container {
  @apply relative overflow-hidden;
}

.image-placeholder {
  @apply flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800;
  min-height: 120px;
}

.image-placeholder.fallback {
  @apply border border-gray-200 dark:border-gray-700;
}

.fallback-content {
  @apply flex flex-col items-center justify-center text-center p-4;
}
</style>