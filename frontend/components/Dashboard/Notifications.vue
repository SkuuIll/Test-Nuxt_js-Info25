<template>
  <div class="relative">
    <!-- Notifications button -->
    <button
      @click="isOpen = !isOpen"
      class="relative p-2 text-gray-400 hover:text-gray-500 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <BellIcon class="h-6 w-6" />
      
      <!-- Notification badge -->
      <span
        v-if="unreadCount > 0"
        class="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </button>

    <!-- Dropdown panel -->
    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50"
      >
        <!-- Header -->
        <div class="px-4 py-3 border-b border-gray-100">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium text-gray-900">
              Notificaciones
            </h3>
            <button
              v-if="unreadCount > 0"
              @click="markAllAsRead"
              class="text-xs text-blue-600 hover:text-blue-500"
            >
              Marcar todas como leídas
            </button>
          </div>
        </div>

        <!-- Notifications list -->
        <div class="max-h-96 overflow-y-auto">
          <div v-if="notifications.length === 0" class="px-4 py-8 text-center">
            <BellIcon class="mx-auto h-12 w-12 text-gray-300" />
            <p class="mt-2 text-sm text-gray-500">
              No tienes notificaciones
            </p>
          </div>
          
          <div v-else class="py-1">
            <div
              v-for="notification in notifications"
              :key="notification.id"
              :class="[
                'px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0',
                { 'bg-blue-50': !notification.read }
              ]"
              @click="markAsRead(notification.id)"
            >
              <div class="flex items-start space-x-3">
                <!-- Icon -->
                <div
                  :class="[
                    'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                    {
                      'bg-blue-100': notification.type === 'info',
                      'bg-green-100': notification.type === 'success',
                      'bg-yellow-100': notification.type === 'warning',
                      'bg-red-100': notification.type === 'error'
                    }
                  ]"
                >
                  <InformationCircleIcon
                    v-if="notification.type === 'info'"
                    class="h-4 w-4 text-blue-600"
                  />
                  <CheckCircleIcon
                    v-else-if="notification.type === 'success'"
                    class="h-4 w-4 text-green-600"
                  />
                  <ExclamationTriangleIcon
                    v-else-if="notification.type === 'warning'"
                    class="h-4 w-4 text-yellow-600"
                  />
                  <XCircleIcon
                    v-else
                    class="h-4 w-4 text-red-600"
                  />
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900">
                    {{ notification.title }}
                  </p>
                  <p v-if="notification.message" class="text-sm text-gray-500 mt-1">
                    {{ notification.message }}
                  </p>
                  <p class="text-xs text-gray-400 mt-1">
                    {{ formatTime(notification.timestamp) }}
                  </p>
                </div>

                <!-- Unread indicator -->
                <div
                  v-if="!notification.read"
                  class="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-4 py-3 border-t border-gray-100">
          <NuxtLink
            to="/dashboard/notifications"
            class="text-sm text-blue-600 hover:text-blue-500"
            @click="isOpen = false"
          >
            Ver todas las notificaciones
          </NuxtLink>
        </div>
      </div>
    </Transition>

    <!-- Backdrop -->
    <div
      v-if="isOpen"
      class="fixed inset-0 z-40"
      @click="isOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import {
  BellIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon
} from '@heroicons/vue/24/outline'

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message?: string
  timestamp: number
  read: boolean
}

// State
const isOpen = ref(false)
const notifications = ref<Notification[]>([
  {
    id: '1',
    type: 'info',
    title: 'Nuevo comentario',
    message: 'Tienes un nuevo comentario en "Mi primer post"',
    timestamp: Date.now() - 300000, // 5 minutes ago
    read: false
  },
  {
    id: '2',
    type: 'success',
    title: 'Post publicado',
    message: 'Tu post "Tutorial de Vue.js" ha sido publicado exitosamente',
    timestamp: Date.now() - 3600000, // 1 hour ago
    read: false
  },
  {
    id: '3',
    type: 'warning',
    title: 'Comentario pendiente',
    message: 'Hay 3 comentarios esperando moderación',
    timestamp: Date.now() - 7200000, // 2 hours ago
    read: true
  }
])

// Computed
const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.read).length
})

// Methods
const markAsRead = (id: string) => {
  const notification = notifications.value.find(n => n.id === id)
  if (notification) {
    notification.read = true
  }
}

const markAllAsRead = () => {
  notifications.value.forEach(n => {
    n.read = true
  })
}

const formatTime = (timestamp: number) => {
  const now = Date.now()
  const diff = now - timestamp
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'Ahora'
  if (minutes < 60) return `${minutes}m`
  if (hours < 24) return `${hours}h`
  return `${days}d`
}
</script>