<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end z-50"
    >
      <div class="w-full flex flex-col items-center space-y-4 sm:items-end">
        <ToastNotification
          v-for="toast in toasts"
          :key="toast.id"
          :toast="toast"
          @dismiss="removeToast"
        />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { ToastNotification } from '~/types/notifications'

// State
const toasts = ref<ToastNotification[]>([])

// Methods
const addToast = (toast: Omit<ToastNotification, 'id'>) => {
  const newToast: ToastNotification = {
    ...toast,
    id: generateToastId()
  }
  
  toasts.value.push(newToast)
  
  // Limit the number of toasts shown at once
  if (toasts.value.length > 5) {
    toasts.value.shift()
  }
}

const removeToast = (id: string) => {
  const index = toasts.value.findIndex(toast => toast.id === id)
  if (index > -1) {
    toasts.value.splice(index, 1)
  }
}

const clearAllToasts = () => {
  toasts.value = []
}

const generateToastId = (): string => {
  return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Enhanced toast methods with different types
const showSuccess = (message: string, title?: string) => {
  addToast({
    type: 'success',
    title: title || 'Éxito',
    message,
    duration: 5000
  })
}

const showError = (message: string, title?: string) => {
  addToast({
    type: 'error',
    title: title || 'Error',
    message,
    duration: 7000
  })
}

const showWarning = (message: string, title?: string) => {
  addToast({
    type: 'warning',
    title: title || 'Advertencia',
    message,
    duration: 6000
  })
}

const showInfo = (message: string, title?: string) => {
  addToast({
    type: 'info',
    title: title || 'Información',
    message,
    duration: 5000
  })
}

// Expose methods for global access
const nuxtApp = useNuxtApp()

// Create global toast methods - check if already provided to avoid conflicts
if (!nuxtApp.$toast) {
  nuxtApp.provide('toast', {
    show: addToast,
    success: showSuccess,
    error: showError,
    warning: showWarning,
    info: showInfo,
    remove: removeToast,
    clear: clearAllToasts
  })
}

// Listen for toast events
onMounted(() => {
  // Listen for global toast events
  nuxtApp.$bus?.on('show-toast', addToast)
  nuxtApp.$bus?.on('remove-toast', removeToast)
  nuxtApp.$bus?.on('clear-toasts', clearAllToasts)
})

onUnmounted(() => {
  // Clean up event listeners
  nuxtApp.$bus?.off('show-toast', addToast)
  nuxtApp.$bus?.off('remove-toast', removeToast)
  nuxtApp.$bus?.off('clear-toasts', clearAllToasts)
})
</script>

<style scoped>
/* Ensure toasts appear above everything else */
.z-50 {
  z-index: 50;
}

/* Mobile adjustments */
@media (max-width: 640px) {
  .fixed {
    padding: 1rem;
  }
}
</style>