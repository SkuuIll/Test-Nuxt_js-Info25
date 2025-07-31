<template>
  <div 
    v-if="show"
    class="loading-indicator"
    :class="[
      `loading-${variant}`,
      `loading-${size}`,
      { 'loading-overlay': overlay }
    ]"
  >
    <!-- Overlay background -->
    <div v-if="overlay" class="loading-backdrop" @click="onBackdropClick" />
    
    <!-- Loading content -->
    <div class="loading-content">
      <!-- Spinner -->
      <div class="loading-spinner" :class="spinnerClass">
        <!-- Default spinner -->
        <template v-if="variant === 'spinner'">
          <div class="spinner-ring">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
        </template>

        <!-- Dots spinner -->
        <template v-else-if="variant === 'dots'">
          <div class="spinner-dots">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
        </template>

        <!-- Pulse spinner -->
        <template v-else-if="variant === 'pulse'">
          <div class="spinner-pulse">
            <div class="pulse-circle"></div>
          </div>
        </template>

        <!-- Bars spinner -->
        <template v-else-if="variant === 'bars'">
          <div class="spinner-bars">
            <div class="bar"></div>
            <div class="bar"></div>
            <div class="bar"></div>
            <div class="bar"></div>
            <div class="bar"></div>
          </div>
        </template>

        <!-- Progress circle -->
        <template v-else-if="variant === 'progress'">
          <div class="progress-circle">
            <svg class="progress-svg" viewBox="0 0 50 50">
              <circle
                class="progress-bg"
                cx="25"
                cy="25"
                r="20"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                opacity="0.3"
              />
              <circle
                class="progress-bar"
                cx="25"
                cy="25"
                r="20"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                :stroke-dasharray="circumference"
                :stroke-dashoffset="progressOffset"
                transform="rotate(-90 25 25)"
              />
            </svg>
            <div v-if="showPercentage" class="progress-text">
              {{ Math.round(progress) }}%
            </div>
          </div>
        </template>
      </div>

      <!-- Loading message -->
      <div v-if="message" class="loading-message">
        {{ message }}
      </div>

      <!-- Progress bar (for linear progress) -->
      <div v-if="showProgressBar" class="progress-bar-container">
        <div class="progress-bar-bg">
          <div 
            class="progress-bar-fill"
            :style="{ width: `${progress}%` }"
          />
        </div>
        <div v-if="showPercentage" class="progress-percentage">
          {{ Math.round(progress) }}%
        </div>
      </div>

      <!-- Estimated time remaining -->
      <div v-if="showTimeRemaining && estimatedTimeRemaining" class="time-remaining">
        {{ formatTimeRemaining(estimatedTimeRemaining) }}
      </div>

      <!-- Cancel button -->
      <button 
        v-if="cancellable" 
        @click="onCancel"
        class="loading-cancel-btn"
      >
        Cancel
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  show?: boolean
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars' | 'progress'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  overlay?: boolean
  message?: string
  progress?: number
  showProgressBar?: boolean
  showPercentage?: boolean
  showTimeRemaining?: boolean
  estimatedDuration?: number
  startTime?: number
  cancellable?: boolean
  spinnerClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  show: true,
  variant: 'spinner',
  size: 'md',
  overlay: false,
  progress: 0,
  showProgressBar: false,
  showPercentage: false,
  showTimeRemaining: false,
  cancellable: false,
  spinnerClass: ''
})

const emit = defineEmits<{
  cancel: []
  backdropClick: []
}>()

// Computed properties
const circumference = computed(() => 2 * Math.PI * 20) // radius = 20

const progressOffset = computed(() => {
  const progress = Math.max(0, Math.min(100, props.progress))
  return circumference.value - (progress / 100) * circumference.value
})

const estimatedTimeRemaining = computed(() => {
  if (!props.estimatedDuration || !props.startTime || props.progress <= 0) {
    return null
  }

  const elapsed = Date.now() - props.startTime
  const progressRatio = props.progress / 100
  const estimatedTotal = elapsed / progressRatio
  const remaining = estimatedTotal - elapsed

  return Math.max(0, remaining)
})

// Methods
const onCancel = () => {
  emit('cancel')
}

const onBackdropClick = () => {
  emit('backdropClick')
}

const formatTimeRemaining = (ms: number): string => {
  const seconds = Math.ceil(ms / 1000)
  
  if (seconds < 60) {
    return `${seconds}s remaining`
  } else if (seconds < 3600) {
    const minutes = Math.ceil(seconds / 60)
    return `${minutes}m remaining`
  } else {
    const hours = Math.ceil(seconds / 3600)
    return `${hours}h remaining`
  }
}
</script>

<style scoped>
.loading-indicator {
  @apply flex items-center justify-center;
}

.loading-overlay {
  @apply fixed inset-0 z-50 flex items-center justify-center;
}

.loading-backdrop {
  @apply absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm;
}

.loading-content {
  @apply relative flex flex-col items-center space-y-4 p-6 bg-white rounded-lg shadow-lg;
}

.loading-overlay .loading-content {
  @apply z-10;
}

/* Spinner sizes */
.loading-sm .loading-spinner {
  @apply w-6 h-6;
}

.loading-md .loading-spinner {
  @apply w-8 h-8;
}

.loading-lg .loading-spinner {
  @apply w-12 h-12;
}

.loading-xl .loading-spinner {
  @apply w-16 h-16;
}

/* Default spinner (ring) */
.spinner-ring {
  @apply relative w-full h-full;
}

.spinner-ring div {
  @apply absolute border-2 border-blue-500 rounded-full animate-spin;
  width: 100%;
  height: 100%;
  border-color: currentColor transparent transparent transparent;
}

.spinner-ring div:nth-child(1) {
  animation-delay: -0.45s;
}

.spinner-ring div:nth-child(2) {
  animation-delay: -0.3s;
}

.spinner-ring div:nth-child(3) {
  animation-delay: -0.15s;
}

/* Dots spinner */
.spinner-dots {
  @apply flex space-x-1;
}

.spinner-dots .dot {
  @apply w-2 h-2 bg-blue-500 rounded-full animate-pulse;
}

.spinner-dots .dot:nth-child(1) {
  animation-delay: 0s;
}

.spinner-dots .dot:nth-child(2) {
  animation-delay: 0.2s;
}

.spinner-dots .dot:nth-child(3) {
  animation-delay: 0.4s;
}

/* Pulse spinner */
.spinner-pulse {
  @apply relative w-full h-full;
}

.pulse-circle {
  @apply w-full h-full bg-blue-500 rounded-full animate-ping;
}

/* Bars spinner */
.spinner-bars {
  @apply flex items-end space-x-1 h-full;
}

.spinner-bars .bar {
  @apply w-1 bg-blue-500 rounded-full;
  animation: bar-bounce 1.2s infinite ease-in-out;
}

.spinner-bars .bar:nth-child(1) {
  animation-delay: -1.2s;
  height: 100%;
}

.spinner-bars .bar:nth-child(2) {
  animation-delay: -1.1s;
  height: 80%;
}

.spinner-bars .bar:nth-child(3) {
  animation-delay: -1.0s;
  height: 60%;
}

.spinner-bars .bar:nth-child(4) {
  animation-delay: -0.9s;
  height: 80%;
}

.spinner-bars .bar:nth-child(5) {
  animation-delay: -0.8s;
  height: 100%;
}

@keyframes bar-bounce {
  0%, 40%, 100% {
    transform: scaleY(0.4);
  }
  20% {
    transform: scaleY(1.0);
  }
}

/* Progress circle */
.progress-circle {
  @apply relative w-full h-full;
}

.progress-svg {
  @apply w-full h-full transform -rotate-90;
}

.progress-bar {
  transition: stroke-dashoffset 0.3s ease;
}

.progress-text {
  @apply absolute inset-0 flex items-center justify-center text-sm font-medium;
}

/* Loading message */
.loading-message {
  @apply text-sm text-gray-600 text-center max-w-xs;
}

/* Progress bar */
.progress-bar-container {
  @apply w-full max-w-xs space-y-2;
}

.progress-bar-bg {
  @apply w-full h-2 bg-gray-200 rounded-full overflow-hidden;
}

.progress-bar-fill {
  @apply h-full bg-blue-500 rounded-full transition-all duration-300 ease-out;
}

.progress-percentage {
  @apply text-xs text-gray-500 text-center;
}

/* Time remaining */
.time-remaining {
  @apply text-xs text-gray-500;
}

/* Cancel button */
.loading-cancel-btn {
  @apply px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50 transition-colors;
}

/* Dark mode support */
.dark .loading-content {
  @apply bg-gray-800 text-white;
}

.dark .loading-message {
  @apply text-gray-300;
}

.dark .progress-bar-bg {
  @apply bg-gray-700;
}

.dark .time-remaining,
.dark .progress-percentage {
  @apply text-gray-400;
}

.dark .loading-cancel-btn {
  @apply text-gray-300 hover:text-white border-gray-600 hover:bg-gray-700;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .loading-content {
    @apply p-4 mx-4;
  }
  
  .progress-bar-container {
    @apply max-w-full;
  }
}

/* Animation variants */
.loading-spinner {
  color: theme('colors.blue.500');
}

.loading-primary .loading-spinner {
  color: theme('colors.blue.500');
}

.loading-success .loading-spinner {
  color: theme('colors.green.500');
}

.loading-warning .loading-spinner {
  color: theme('colors.yellow.500');
}

.loading-error .loading-spinner {
  color: theme('colors.red.500');
}
</style>