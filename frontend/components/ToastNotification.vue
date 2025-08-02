<template>
  <Transition
    name="toast"
    appear
    @enter="onEnter"
    @leave="onLeave"
  >
    <div
      v-if="visible"
      class="toast-notification max-w-sm w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden"
      :class="toastClasses"
      @mouseenter="pauseTimer"
      @mouseleave="resumeTimer"
    >
      <div class="p-4">
        <div class="flex items-start">
          <!-- Icon -->
          <div class="flex-shrink-0">
            <component
              :is="iconComponent"
              class="h-6 w-6"
              :class="iconClasses"
              aria-hidden="true"
            />
          </div>
          
          <!-- Content -->
          <div class="ml-3 w-0 flex-1 pt-0.5">
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              {{ toast.title }}
            </p>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-300">
              {{ toast.message }}
            </p>
            
            <!-- Action Button -->
            <div v-if="toast.action" class="mt-3">
              <button
                @click="handleAction"
                class="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 focus:outline-none focus:underline"
              >
                {{ toast.action.label }}
              </button>
            </div>
          </div>
          
          <!-- Close Button -->
          <div class="ml-4 flex-shrink-0 flex">
            <button
              @click="dismiss"
              class="bg-white dark:bg-gray-800 rounded-md inline-flex text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <span class="sr-only">Cerrar</span>
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Progress Bar -->
      <div
        v-if="showProgress && !toast.persistent"
        class="h-1 bg-gray-200 dark:bg-gray-700"
      >
        <div
          class="h-full transition-all ease-linear"
          :class="progressBarClasses"
          :style="{ width: `${progress}%` }"
        ></div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { ToastNotification } from '~/types/notifications'

// Props
interface Props {
  toast: ToastNotification
  showProgress?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showProgress: true
})

// Emits
const emit = defineEmits<{
  dismiss: [id: string]
}>()

// State
const visible = ref(true)
const progress = ref(100)
const isPaused = ref(false)
const startTime = ref(Date.now())
const remainingTime = ref(props.toast.duration || 5000)

// Timer
let timer: NodeJS.Timeout | null = null
let progressTimer: NodeJS.Timeout | null = null

// Computed properties
const toastClasses = computed(() => {
  const baseClasses = 'border-l-4'
  
  switch (props.toast.type) {
    case 'success':
      return `${baseClasses} border-green-400`
    case 'error':
      return `${baseClasses} border-red-400`
    case 'warning':
      return `${baseClasses} border-yellow-400`
    case 'info':
    default:
      return `${baseClasses} border-blue-400`
  }
})

const iconComponent = computed(() => {
  switch (props.toast.type) {
    case 'success':
      return 'CheckCircleIcon'
    case 'error':
      return 'XCircleIcon'
    case 'warning':
      return 'ExclamationTriangleIcon'
    case 'info':
    default:
      return 'InformationCircleIcon'
  }
})

const iconClasses = computed(() => {
  switch (props.toast.type) {
    case 'success':
      return 'text-green-400'
    case 'error':
      return 'text-red-400'
    case 'warning':
      return 'text-yellow-400'
    case 'info':
    default:
      return 'text-blue-400'
  }
})

const progressBarClasses = computed(() => {
  switch (props.toast.type) {
    case 'success':
      return 'bg-green-400'
    case 'error':
      return 'bg-red-400'
    case 'warning':
      return 'bg-yellow-400'
    case 'info':
    default:
      return 'bg-blue-400'
  }
})

// Methods
const dismiss = () => {
  visible.value = false
  clearTimers()
}

const handleAction = () => {
  if (props.toast.action?.handler) {
    props.toast.action.handler()
  }
  dismiss()
}

const pauseTimer = () => {
  if (props.toast.persistent || !timer) return
  
  isPaused.value = true
  clearTimers()
  
  // Calculate remaining time
  const elapsed = Date.now() - startTime.value
  remainingTime.value = Math.max(0, remainingTime.value - elapsed)
}

const resumeTimer = () => {
  if (props.toast.persistent || isPaused.value === false) return
  
  isPaused.value = false
  startTime.value = Date.now()
  
  if (remainingTime.value > 0) {
    startTimer(remainingTime.value)
  } else {
    dismiss()
  }
}

const startTimer = (duration: number) => {
  if (props.toast.persistent) return
  
  // Auto dismiss timer
  timer = setTimeout(() => {
    dismiss()
  }, duration)
  
  // Progress bar timer
  if (props.showProgress) {
    const startProgress = progress.value
    const progressDuration = duration
    const progressInterval = 50 // Update every 50ms
    
    progressTimer = setInterval(() => {
      const elapsed = Date.now() - startTime.value
      const remaining = Math.max(0, progressDuration - elapsed)
      progress.value = (remaining / progressDuration) * startProgress
      
      if (remaining <= 0) {
        clearInterval(progressTimer!)
        progressTimer = null
      }
    }, progressInterval)
  }
}

const clearTimers = () => {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }
}

const onEnter = () => {
  // Start auto-dismiss timer when toast enters
  if (!props.toast.persistent && props.toast.duration && props.toast.duration > 0) {
    startTime.value = Date.now()
    remainingTime.value = props.toast.duration
    startTimer(props.toast.duration)
  }
}

const onLeave = () => {
  // Emit dismiss event when toast leaves
  emit('dismiss', props.toast.id)
}

// Cleanup on unmount
onUnmounted(() => {
  clearTimers()
})

// Import Heroicons components
const CheckCircleIcon = resolveComponent('CheckCircleIcon') || 'div'
const XCircleIcon = resolveComponent('XCircleIcon') || 'div'
const ExclamationTriangleIcon = resolveComponent('ExclamationTriangleIcon') || 'div'
const InformationCircleIcon = resolveComponent('InformationCircleIcon') || 'div'
</script>

<style scoped>
/* Toast animations */
.toast-enter-active {
  transition: all 0.3s ease-out;
}

.toast-leave-active {
  transition: all 0.3s ease-in;
}

.toast-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.toast-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* Hover effects */
.toast-notification:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.toast-notification {
  transition: all 0.2s ease-in-out;
}

/* Progress bar animation */
.progress-bar {
  transition: width linear;
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .toast-notification {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
  }
  
  .toast-notification:hover {
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3);
  }
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .toast-notification {
    max-width: calc(100vw - 2rem);
    margin: 0 1rem;
  }
}
</style>