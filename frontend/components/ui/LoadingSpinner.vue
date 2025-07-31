<template>
  <div 
    v-if="visible"
    :class="containerClasses"
    :style="containerStyles"
    role="status"
    :aria-label="ariaLabel"
    aria-live="polite"
  >
    <!-- Overlay for fullscreen/modal variants -->
    <div v-if="overlay" class="loading-overlay" @click="handleOverlayClick"></div>
    
    <!-- Loading content -->
    <div :class="contentClasses">
      <!-- Spinner -->
      <div :class="spinnerClasses" :style="spinnerStyles">
        <!-- Default spinner -->
        <div v-if="type === 'spinner'" class="spinner-default">
          <div class="spinner-ring"></div>
        </div>
        
        <!-- Dots spinner -->
        <div v-else-if="type === 'dots'" class="spinner-dots">
          <div class="dot" v-for="i in 3" :key="i"></div>
        </div>
        
        <!-- Bars spinner -->
        <div v-else-if="type === 'bars'" class="spinner-bars">
          <div class="bar" v-for="i in 5" :key="i"></div>
        </div>
        
        <!-- Pulse spinner -->
        <div v-else-if="type === 'pulse'" class="spinner-pulse">
          <div class="pulse-ring" v-for="i in 3" :key="i"></div>
        </div>
        
        <!-- Progress ring -->
        <div v-else-if="type === 'progress'" class="spinner-progress">
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
          <div v-if="showProgress" class="progress-text">
            {{ Math.round(progress) }}%
          </div>
        </div>
        
        <!-- Custom icon spinner -->
        <div v-else-if="type === 'icon' && icon" class="spinner-icon">
          <Icon :name="icon" :class="iconClasses" />
        </div>
      </div>
      
      <!-- Loading message -->
      <div v-if="message" :class="messageClasses">
        {{ message }}
      </div>
      
      <!-- Progress bar (for non-circular progress) -->
      <div v-if="showProgressBar && type !== 'progress'" class="progress-bar-container">
        <div class="progress-bar-bg">
          <div 
            class="progress-bar-fill"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>
        <div v-if="showProgress" class="progress-text">
          {{ Math.round(progress) }}%
        </div>
      </div>
      
      <!-- Cancel button -->
      <button
        v-if="cancellable && onCancel"
        @click="handleCancel"
        class="cancel-button"
        :disabled="cancelling"
      >
        <Icon name="heroicons:x-mark" class="w-4 h-4 mr-2" />
        {{ cancelling ? 'Cancelando...' : 'Cancelar' }}
      </button>
      
      <!-- Additional actions -->
      <div v-if="actions.length > 0" class="loading-actions">
        <button
          v-for="action in actions"
          :key="action.label"
          @click="action.handler"
          :class="getActionClasses(action)"
          :disabled="action.disabled"
        >
          <Icon v-if="action.icon" :name="action.icon" class="w-4 h-4 mr-2" />
          {{ action.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface LoadingAction {
  label: string
  handler: () => void
  icon?: string
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  disabled?: boolean
}

interface Props {
  visible?: boolean
  type?: 'spinner' | 'dots' | 'bars' | 'pulse' | 'progress' | 'icon'
  variant?: 'inline' | 'overlay' | 'modal' | 'fullscreen'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  color?: string
  message?: string
  progress?: number
  showProgress?: boolean
  showProgressBar?: boolean
  cancellable?: boolean
  onCancel?: () => void
  icon?: string
  speed?: 'slow' | 'normal' | 'fast'
  overlay?: boolean
  overlayClosable?: boolean
  actions?: LoadingAction[]
  className?: string
  zIndex?: number
}

const props = withDefaults(defineProps<Props>(), {
  visible: true,
  type: 'spinner',
  variant: 'inline',
  size: 'md',
  color: 'currentColor',
  message: '',
  progress: 0,
  showProgress: false,
  showProgressBar: false,
  cancellable: false,
  speed: 'normal',
  overlay: false,
  overlayClosable: false,
  actions: () => [],
  className: '',
  zIndex: 50
})

const emit = defineEmits<{
  cancel: []
  overlayClick: []
}>()

// State
const cancelling = ref(false)

// Computed properties
const containerClasses = computed(() => {
  const classes = ['loading-spinner', `loading-${props.variant}`, `loading-${props.size}`]
  
  if (props.className) {
    classes.push(props.className)
  }
  
  return classes
})

const containerStyles = computed(() => {
  const styles: Record<string, string> = {}
  
  if (props.zIndex) {
    styles.zIndex = props.zIndex.toString()
  }
  
  return styles
})

const contentClasses = computed(() => {
  const classes = ['loading-content']
  
  if (props.variant === 'modal') {
    classes.push('loading-modal')
  }
  
  return classes
})

const spinnerClasses = computed(() => {
  const classes = ['spinner', `spinner-${props.type}`, `spinner-${props.size}`, `spinner-${props.speed}`]
  return classes
})

const spinnerStyles = computed(() => {
  const styles: Record<string, string> = {}
  
  if (props.color && props.color !== 'currentColor') {
    styles.color = props.color
  }
  
  return styles
})

const iconClasses = computed(() => {
  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10'
  }
  
  return ['animate-spin', sizeClasses[props.size]]
})

const messageClasses = computed(() => {
  const classes = ['loading-message']
  
  if (props.size === 'xs' || props.size === 'sm') {
    classes.push('text-sm')
  } else if (props.size === 'lg' || props.size === 'xl') {
    classes.push('text-lg')
  }
  
  return classes
})

const ariaLabel = computed(() => {
  if (props.message) {
    return props.message
  }
  
  if (props.showProgress) {
    return `Cargando ${Math.round(props.progress)}%`
  }
  
  return 'Cargando...'
})

// Progress calculations
const circumference = computed(() => 2 * Math.PI * 20) // radius = 20

const progressOffset = computed(() => {
  const progress = Math.max(0, Math.min(100, props.progress))
  return circumference.value - (progress / 100) * circumference.value
})

// Methods
const handleCancel = async () => {
  if (cancelling.value || !props.onCancel) return
  
  cancelling.value = true
  
  try {
    await props.onCancel()
    emit('cancel')
  } catch (error) {
    console.error('Error during cancellation:', error)
  } finally {
    cancelling.value = false
  }
}

const handleOverlayClick = () => {
  if (props.overlayClosable) {
    emit('overlayClick')
  }
}

const getActionClasses = (action: LoadingAction) => {
  const baseClasses = ['action-button']
  
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    ghost: 'btn-ghost'
  }
  
  baseClasses.push(variantClasses[action.variant || 'secondary'])
  
  if (action.disabled) {
    baseClasses.push('disabled')
  }
  
  return baseClasses
}
</script>

<style scoped>
.loading-spinner {
  @apply flex items-center justify-center;
}

.loading-inline {
  @apply inline-flex;
}

.loading-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center;
}

.loading-modal {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center;
}

.loading-fullscreen {
  @apply fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center;
}

.loading-content {
  @apply flex flex-col items-center space-y-4 p-6;
}

.loading-modal .loading-content {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full mx-4;
}

.loading-overlay {
  @apply absolute inset-0 bg-black bg-opacity-30;
}

/* Spinner Sizes */
.spinner-xs { @apply w-4 h-4; }
.spinner-sm { @apply w-5 h-5; }
.spinner-md { @apply w-6 h-6; }
.spinner-lg { @apply w-8 h-8; }
.spinner-xl { @apply w-10 h-10; }

/* Speed Variants */
.spinner-slow * { animation-duration: 2s !important; }
.spinner-fast * { animation-duration: 0.8s !important; }

/* Default Spinner */
.spinner-default {
  @apply relative;
}

.spinner-ring {
  @apply w-full h-full border-2 border-gray-300 border-t-current rounded-full;
  animation: spin 1.2s linear infinite;
}

/* Dots Spinner */
.spinner-dots {
  @apply flex space-x-1;
}

.spinner-dots .dot {
  @apply w-2 h-2 bg-current rounded-full;
  animation: dot-bounce 1.4s ease-in-out infinite both;
}

.spinner-dots .dot:nth-child(1) { animation-delay: -0.32s; }
.spinner-dots .dot:nth-child(2) { animation-delay: -0.16s; }

/* Bars Spinner */
.spinner-bars {
  @apply flex items-end space-x-1;
}

.spinner-bars .bar {
  @apply w-1 bg-current;
  height: 100%;
  animation: bar-scale 1.2s ease-in-out infinite;
}

.spinner-bars .bar:nth-child(1) { animation-delay: -1.1s; }
.spinner-bars .bar:nth-child(2) { animation-delay: -1.0s; }
.spinner-bars .bar:nth-child(3) { animation-delay: -0.9s; }
.spinner-bars .bar:nth-child(4) { animation-delay: -0.8s; }
.spinner-bars .bar:nth-child(5) { animation-delay: -0.7s; }

/* Pulse Spinner */
.spinner-pulse {
  @apply relative flex items-center justify-center;
}

.spinner-pulse .pulse-ring {
  @apply absolute w-full h-full border-2 border-current rounded-full opacity-75;
  animation: pulse-ring 1.25s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
}

.spinner-pulse .pulse-ring:nth-child(1) { animation-delay: 0s; }
.spinner-pulse .pulse-ring:nth-child(2) { animation-delay: -0.4s; }
.spinner-pulse .pulse-ring:nth-child(3) { animation-delay: -0.8s; }

/* Progress Spinner */
.spinner-progress {
  @apply relative flex items-center justify-center;
}

.progress-svg {
  @apply w-full h-full transform -rotate-90;
}

.progress-bar {
  transition: stroke-dashoffset 0.3s ease;
}

.progress-text {
  @apply absolute text-xs font-medium;
}

/* Progress Bar */
.progress-bar-container {
  @apply w-full space-y-2;
}

.progress-bar-bg {
  @apply w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden;
}

.progress-bar-fill {
  @apply h-full bg-current rounded-full transition-all duration-300 ease-out;
}

/* Loading Message */
.loading-message {
  @apply text-gray-600 dark:text-gray-400 text-center font-medium;
}

/* Cancel Button */
.cancel-button {
  @apply px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400;
  @apply hover:text-gray-800 dark:hover:text-gray-200;
  @apply border border-gray-300 dark:border-gray-600 rounded-lg;
  @apply hover:bg-gray-50 dark:hover:bg-gray-700;
  @apply focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
  @apply transition-colors duration-200;
  @apply flex items-center;
}

/* Action Buttons */
.loading-actions {
  @apply flex space-x-2;
}

.action-button {
  @apply px-3 py-2 text-sm font-medium rounded-lg;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
  @apply transition-colors duration-200;
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
  @apply dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700;
}

.btn-ghost {
  @apply text-gray-600 hover:text-gray-800 hover:bg-gray-100 focus:ring-gray-500;
  @apply dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800;
}

/* Animations */
@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes dot-bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

@keyframes bar-scale {
  0%, 40%, 100% {
    transform: scaleY(0.4);
  }
  20% {
    transform: scaleY(1);
  }
}

@keyframes pulse-ring {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .loading-modal .loading-content {
    @apply mx-4 p-4;
  }
  
  .loading-actions {
    @apply flex-col space-x-0 space-y-2 w-full;
  }
  
  .action-button {
    @apply w-full justify-center;
  }
}
</style>