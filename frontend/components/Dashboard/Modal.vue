<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 overflow-y-auto">
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        @click="$emit('close')"
      />
      
      <!-- Modal -->
      <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div
          class="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
          @click.stop
        >
          <!-- Header -->
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div
                v-if="type"
                :class="[
                  'mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10',
                  {
                    'bg-red-100': type === 'danger',
                    'bg-yellow-100': type === 'warning',
                    'bg-blue-100': type === 'info',
                    'bg-green-100': type === 'success'
                  }
                ]"
              >
                <ExclamationTriangleIcon
                  v-if="type === 'danger' || type === 'warning'"
                  :class="[
                    'h-6 w-6',
                    {
                      'text-red-600': type === 'danger',
                      'text-yellow-600': type === 'warning'
                    }
                  ]"
                />
                <InformationCircleIcon
                  v-else-if="type === 'info'"
                  class="h-6 w-6 text-blue-600"
                />
                <CheckCircleIcon
                  v-else-if="type === 'success'"
                  class="h-6 w-6 text-green-600"
                />
              </div>
              
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3
                  v-if="title"
                  class="text-lg font-medium leading-6 text-gray-900"
                >
                  {{ title }}
                </h3>
                
                <div class="mt-2">
                  <slot />
                </div>
              </div>
            </div>
          </div>
          
          <!-- Actions -->
          <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <slot name="actions">
              <button
                type="button"
                class="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                @click="$emit('close')"
              >
                Cerrar
              </button>
            </slot>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon
} from '@heroicons/vue/24/outline'

interface Props {
  title?: string
  type?: 'danger' | 'warning' | 'info' | 'success'
}

defineProps<Props>()

defineEmits<{
  close: []
}>()
</script>