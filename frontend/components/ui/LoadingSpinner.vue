<template>
  <div
    class="loading-spinner"
    :class="[
      `loading-spinner--${variant}`,
      `loading-spinner--${size}`,
      {
        'loading-spinner--overlay': overlay,
        'loading-spinner--fullscreen': fullscreen,
        'loading-spinner--inline': inline
      }
    ]"
    :style="customStyles"
    role="status"
    :aria-label="ariaLabel"
    aria-live="polite"
  >
    <!-- Overlay background -->
    <div
      v-if="overlay || fullscreen"
      class="loading-spinner__overlay"
      :class="{
        'loading-spinner__overlay--dark': overlayDark,
        'loading-spinner__overlay--blur': overlayBlur
      }"
    />
    
    <!-- Spinner container -->
    <div class="loading-spinner__container">
      <!-- Spinner -->
      <div class="loading-spinner__spinner">
        <!-- Default spinner -->
        <template v-if="variant === 'default'">
          <div class="spinner-default">
            <div class="spinner-default__circle" />
          </div>
        </template>
        
        <!-- Dots spinner -->
        <template v-else-if="variant === 'dots'">
          <div class="spinner-dots">
            <div class="spinner-dots__dot" />
            <div class="spinner-dots__dot" />
            <div class="spinner-dots__dot" />
          </div>
        </template>
        
        <!-- Pulse spinner -->
        <template v-else-if="variant === 'pulse'">
          <div class="spinner-pulse">
            <div class="spinner-pulse__circle" />
          </div>
        </template>
        
        <!-- Bars spinner -->
        <template v-else-if="variant === 'bars'">
          <div class="spinner-bars">
            <div class="spinner-bars__bar" />
            <div class="spinner-bars__bar" />
            <div class="spinner-bars__bar" />
            <div class="spinner-bars__bar" />
            <div class="spinner-bars__bar" />
          </div>
        </template>
        
        <!-- Ring spinner -->
        <template v-else-if="variant === 'ring'">
          <div class="spinner-ring">
            <div class="spinner-ring__circle" />
          </div>
        </template>
        
        <!-- Dual ring spinner -->
        <template v-else-if="variant === 'dual-ring'">
          <div class="spinner-dual-ring" />
        </template>
        
        <!-- Heart spinner -->
        <template v-else-if="variant === 'heart'">
          <div class="spinner-heart">
            <div class="spinner-heart__beat" />
          </div>
        </template>
        
        <!-- Custom spinner -->
        <template v-else-if="variant === 'custom'">
          <slot name="spinner" />
        </template>
      </div>
      
      <!-- Loading text -->
      <div
        v-if="showText && (text || message)"
        class="loading-spinner__text"
      >
        {{ text || message }}
      </div>
      
      <!-- Progress indicator -->
      <div
        v-if="showProgress && progress !== undefined"
        class="loading-spinner__progress"
      >
        <div class="loading-spinner__progress-bar">
          <div
            class="loading-spinner__progress-fill"
            :style="{ width: `${Math.max(0, Math.min(100, progress))}%` }"
          />
        </div>
        <div class="loading-spinner__progress-text">
          {{ Math.round(progress) }}%
        </div>
      </div>
      
      <!-- Cancel button -->
      <button
        v-if="cancellable && onCancel"
        @click="handleCancel"
        class="loading-spinner__cancel"
        type="button"
      >
        {{ cancelText }}
      </button>
      
      <!-- Additional content -->
      <div v-if="$slots.default" class="loading-spinner__content">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  // Spinner variant
  variant?: 'default' | 'dots' | 'pulse' | 'bars' | 'ring' | 'dual-ring' | 'heart' | 'custom'
  
  // Size
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  
  // Display options
  overlay?: boolean
  fullscreen?: boolean
  inline?: boolean
  overlayDark?: boolean
  overlayBlur?: boolean
  
  // Text and messaging
  text?: string
  message?: string
  showText?: boolean
  
  // Progress
  progress?: number
  showProgress?: boolean
  
  // Cancellation
  cancellable?: boolean
  cancelText?: string
  onCancel?: () => void
  
  // Styling
  color?: string
  backgroundColor?: string
  
  // Accessibility
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
  overlay: false,
  fullscreen: false,
  inline: false,
  overlayDark: false,
  overlayBlur: false,
  showText: true,
  showProgress: false,
  cancellable: false,
  cancelText: 'Cancelar',
  ariaLabel: 'Cargando...'
})

const emit = defineEmits<{
  cancel: []
}>()

// Computed styles
const customStyles = computed(() => {
  const styles: Record<string, string> = {}
  
  if (props.color) {
    styles['--spinner-color'] = props.color
  }
  
  if (props.backgroundColor) {
    styles['--spinner-bg-color'] = props.backgroundColor
  }
  
  return styles
})

// Methods
const handleCancel = () => {
  if (props.onCancel) {
    props.onCancel()
  }
  emit('cancel')
}
</script>

<style scoped>
/* CSS Custom Properties */
.loading-spinner {
  --spinner-color: theme('colors.blue.500');
  --spinner-bg-color: theme('colors.white');
  --spinner-size: 2rem;
}

/* Base spinner styles */
.loading-spinner {
  @apply relative;
}

.loading-spinner--overlay,
.loading-spinner--fullscreen {
  @apply fixed inset-0 z-50 flex items-center justify-center;
}

.loading-spinner--inline {
  @apply inline-flex items-center gap-2;
}

/* Overlay */
.loading-spinner__overlay {
  @apply absolute inset-0 bg-white bg-opacity-75 backdrop-blur-sm;
}

.loading-spinner__overlay--dark {
  @apply bg-gray-900 bg-opacity-50;
}

.loading-spinner__overlay--blur {
  @apply backdrop-blur-md;
}

/* Container */
.loading-spinner__container {
  @apply relative z-10 flex flex-col items-center gap-3;
}

.loading-spinner--inline .loading-spinner__container {
  @apply flex-row gap-2;
}

/* Spinner */
.loading-spinner__spinner {
  @apply relative;
}

/* Size variants */
.loading-spinner--xs {
  --spinner-size: 1rem;
}

.loading-spinner--sm {
  --spinner-size: 1.5rem;
}

.loading-spinner--md {
  --spinner-size: 2rem;
}

.loading-spinner--lg {
  --spinner-size: 3rem;
}

.loading-spinner--xl {
  --spinner-size: 4rem;
}

/* Default spinner */
.spinner-default {
  @apply relative;
  width: var(--spinner-size);
  height: var(--spinner-size);
}

.spinner-default__circle {
  @apply absolute inset-0 border-4 border-gray-200 rounded-full;
  border-top-color: var(--spinner-color);
  animation: spin 1s linear infinite;
}

/* Dots spinner */
.spinner-dots {
  @apply flex gap-1;
}

.spinner-dots__dot {
  @apply rounded-full bg-current;
  width: calc(var(--spinner-size) / 4);
  height: calc(var(--spinner-size) / 4);
  color: var(--spinner-color);
  animation: dots-bounce 1.4s ease-in-out infinite both;
}

.spinner-dots__dot:nth-child(1) {
  animation-delay: -0.32s;
}

.spinner-dots__dot:nth-child(2) {
  animation-delay: -0.16s;
}

/* Pulse spinner */
.spinner-pulse {
  @apply relative;
  width: var(--spinner-size);
  height: var(--spinner-size);
}

.spinner-pulse__circle {
  @apply absolute inset-0 rounded-full;
  background-color: var(--spinner-color);
  animation: pulse-scale 1s ease-in-out infinite;
}

/* Bars spinner */
.spinner-bars {
  @apply flex items-end gap-1;
  height: var(--spinner-size);
}

.spinner-bars__bar {
  @apply rounded-sm;
  width: calc(var(--spinner-size) / 8);
  background-color: var(--spinner-color);
  animation: bars-stretch 1.2s ease-in-out infinite;
}

.spinner-bars__bar:nth-child(1) {
  animation-delay: -1.2s;
}

.spinner-bars__bar:nth-child(2) {
  animation-delay: -1.1s;
}

.spinner-bars__bar:nth-child(3) {
  animation-delay: -1s;
}

.spinner-bars__bar:nth-child(4) {
  animation-delay: -0.9s;
}

.spinner-bars__bar:nth-child(5) {
  animation-delay: -0.8s;
}

/* Ring spinner */
.spinner-ring {
  @apply relative;
  width: var(--spinner-size);
  height: var(--spinner-size);
}

.spinner-ring__circle {
  @apply absolute inset-0 border-4 border-transparent rounded-full;
  border-top-color: var(--spinner-color);
  border-right-color: var(--spinner-color);
  animation: spin 1s linear infinite;
}

/* Dual ring spinner */
.spinner-dual-ring {
  @apply relative border-4 border-gray-200 rounded-full;
  width: var(--spinner-size);
  height: var(--spinner-size);
  border-top-color: var(--spinner-color);
  border-bottom-color: var(--spinner-color);
  animation: spin 0.8s linear infinite;
}

/* Heart spinner */
.spinner-heart {
  @apply relative;
  width: var(--spinner-size);
  height: var(--spinner-size);
}

.spinner-heart__beat {
  @apply absolute inset-0;
  background-color: var(--spinner-color);
  animation: heart-beat 1.2s ease-in-out infinite;
  clip-path: path('M12,21.35l-1.45-1.32C5.4,15.36,2,12.28,2,8.5 C2,5.42,4.42,3,7.5,3c1.74,0,3.41,0.81,4.5,2.09C13.09,3.81,14.76,3,16.5,3 C19.58,3,22,5.42,22,8.5c0,3.78-3.4,6.86-8.55,11.54L12,21.35z');
}

/* Text */
.loading-spinner__text {
  @apply text-sm text-gray-600 dark:text-gray-400 text-center;
}

.loading-spinner--inline .loading-spinner__text {
  @apply text-xs;
}

/* Progress */
.loading-spinner__progress {
  @apply w-full max-w-xs;
}

.loading-spinner__progress-bar {
  @apply w-full h-2 bg-gray-200 rounded-full overflow-hidden;
}

.loading-spinner__progress-fill {
  @apply h-full bg-current transition-all duration-300 ease-out;
  color: var(--spinner-color);
}

.loading-spinner__progress-text {
  @apply text-xs text-gray-500 text-center mt-1;
}

/* Cancel button */
.loading-spinner__cancel {
  @apply px-3 py-1 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50 transition-colors;
}

/* Content */
.loading-spinner__content {
  @apply text-center;
}

/* Animations */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes dots-bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

@keyframes pulse-scale {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

@keyframes bars-stretch {
  0%, 40%, 100% {
    transform: scaleY(0.4);
  }
  20% {
    transform: scaleY(1);
  }
}

@keyframes heart-beat {
  0% {
    transform: scale(1);
  }
  14% {
    transform: scale(1.3);
  }
  28% {
    transform: scale(1);
  }
  42% {
    transform: scale(1.3);
  }
  70% {
    transform: scale(1);
  }
}

/* Dark mode */
.dark .loading-spinner__overlay {
  @apply bg-gray-900 bg-opacity-75;
}

.dark .loading-spinner__text {
  @apply text-gray-300;
}

.dark .loading-spinner__progress-bar {
  @apply bg-gray-700;
}

.dark .loading-spinner__cancel {
  @apply text-gray-300 border-gray-600 hover:text-white hover:bg-gray-700;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .spinner-default__circle,
  .spinner-ring__circle,
  .spinner-dual-ring {
    animation-duration: 2s;
  }
  
  .spinner-dots__dot {
    animation: none;
    opacity: 0.7;
  }
  
  .spinner-pulse__circle {
    animation: none;
    opacity: 0.8;
  }
  
  .spinner-bars__bar {
    animation: none;
    height: 50%;
  }
  
  .spinner-heart__beat {
    animation: none;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .loading-spinner {
    --spinner-color: theme('colors.black');
  }
  
  .dark .loading-spinner {
    --spinner-color: theme('colors.white');
  }
}

/* Focus styles for cancel button */
.loading-spinner__cancel:focus {
  @apply outline-none ring-2 ring-blue-500 ring-offset-2;
}

.dark .loading-spinner__cancel:focus {
  @apply ring-offset-gray-900;
}
</style>