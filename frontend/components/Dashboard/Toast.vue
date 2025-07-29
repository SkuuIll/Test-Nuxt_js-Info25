<template>
  <div class="fixed top-4 right-4 z-50 space-y-2">
    <TransitionGroup
      name="toast"
      tag="div"
      class="space-y-2"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="[
          'max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden',
          {
            'border-l-4 border-green-400': toast.type === 'success',
            'border-l-4 border-red-400': toast.type === 'error',
            'border-l-4 border-yellow-400': toast.type === 'warning',
            'border-l-4 border-blue-400': toast.type === 'info'
          }
        ]"
      >
        <div class="p-4">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <!-- Success icon -->
              <CheckCircleIcon
                v-if="toast.type === 'success'"
                class="h-6 w-6 text-green-400"
              />
              <!-- Error icon -->
              <XCircleIcon
                v-else-if="toast.type === 'error'"
                class="h-6 w-6 text-red-400"
              />
              <!-- Warning icon -->
              <ExclamationTriangleIcon
                v-else-if="toast.type === 'warning'"
                class="h-6 w-6 text-yellow-400"
              />
              <!-- Info icon -->
              <InformationCircleIcon
                v-else
                class="h-6 w-6 text-blue-400"
              />
            </div>
            <div class="ml-3 w-0 flex-1 pt-0.5">
              <p class="text-sm font-medium text-gray-900">
                {{ toast.title }}
              </p>
              <p v-if="toast.message" class="mt-1 text-sm text-gray-500">
                {{ toast.message }}
              </p>
            </div>
            <div class="ml-4 flex-shrink-0 flex">
              <button
                type="button"
                class="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                @click="removeToast(toast.id)"
              >
                <span class="sr-only">Cerrar</span>
                <XMarkIcon class="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

const { toasts, removeToast } = useToast()
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>