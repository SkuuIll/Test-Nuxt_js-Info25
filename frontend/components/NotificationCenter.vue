<template>
  <div class="relative">
    <!-- Notification Bell Button -->
    <button
      @click="toggleDropdown"
      class="relative p-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg transition-colors"
      :class="{ 'text-primary-600 dark:text-primary-400': showDropdown }"
      aria-label="Notifications"
    >
      <!-- Bell Icon -->
      <svg
        class="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      
      <!-- Unread Count Badge -->
      <span
        v-if="unreadCount > 0"
        class="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full min-w-[1.25rem] h-5"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
      
      <!-- Connection Status Indicator -->
      <span
        v-if="!isConnected"
        class="absolute -bottom-1 -right-1 w-3 h-3 bg-yellow-400 border-2 border-white dark:border-gray-800 rounded-full"
        title="Reconnecting..."
      ></span>
    </button>

    <!-- Notification Dropdown -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="showDropdown"
        class="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50"
        @click.stop
      >
        <!-- Dropdown Header -->
        <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Notificaciones
            </h3>
            <div class="flex items-center space-x-2">
              <!-- Mark All Read Button -->
              <button
                v-if="unreadCount > 0"
                @click="handleMarkAllRead"
                :disabled="loading"
                class="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Marcar todas como leídas
              </button>
              
              <!-- Settings Button -->
              <button
                @click="goToSettings"
                class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                title="Configuración de notificaciones"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>
          
          <!-- Connection Status -->
          <div v-if="connectionStatus !== 'connected'" class="mt-2">
            <div class="flex items-center text-sm text-yellow-600 dark:text-yellow-400">
              <svg class="w-4 h-4 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Reconectando...
            </div>
          </div>
        </div>

        <!-- Notification List -->
        <div class="max-h-96 overflow-y-auto">
          <!-- Loading State -->
          <div v-if="loading && notifications.length === 0" class="p-4">
            <div class="animate-pulse space-y-3">
              <div v-for="i in 3" :key="i" class="flex space-x-3">
                <div class="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div class="flex-1 space-y-2">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else-if="notifications.length === 0" class="p-8 text-center">
            <svg class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p class="text-gray-500 dark:text-gray-400">No tienes notificaciones</p>
          </div>

          <!-- Notification Items -->
          <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
            <NotificationItem
              v-for="notification in recentNotifications"
              :key="notification.id"
              :notification="notification"
              @read="handleNotificationRead"
              @dismiss="handleNotificationDismiss"
              @click="handleNotificationClick"
            />
          </div>
        </div>

        <!-- Dropdown Footer -->
        <div class="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 rounded-b-lg">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-500 dark:text-gray-400">
              {{ totalCount > 0 ? `${Math.min(recentNotifications.length, 5)} de ${totalCount}` : 'Sin notificaciones' }}
            </span>
            <NuxtLink
              to="/notifications"
              @click="closeDropdown"
              class="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
            >
              Ver todas
            </NuxtLink>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Backdrop -->
    <div
      v-if="showDropdown"
      class="fixed inset-0 z-40"
      @click="closeDropdown"
    ></div>
  </div>
</template>

<script setup lang="ts">
import type { Notification } from '~/types/notifications'

// Props
interface Props {
  maxVisible?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxVisible: 5
})

// Composables
const notificationStore = useNotificationStore()
const { showToast } = useToast()

// State
const showDropdown = ref(false)

// Store getters
const {
  notifications,
  unreadCount,
  totalCount,
  loading,
  isConnected,
  connectionStatus,
  recentNotifications
} = storeToRefs(notificationStore)

// Methods
const toggleDropdown = async () => {
  showDropdown.value = !showDropdown.value
  
  if (showDropdown.value) {
    // Fetch latest notifications when opening
    await notificationStore.fetchNotifications({ page: 1, page_size: props.maxVisible })
  }
}

const closeDropdown = () => {
  showDropdown.value = false
}

const handleMarkAllRead = async () => {
  try {
    const success = await notificationStore.markAllAsRead()
    if (success) {
      showToast({
        title: 'Éxito',
        message: 'Todas las notificaciones han sido marcadas como leídas',
        type: 'success'
      })
    } else {
      throw new Error('Failed to mark all as read')
    }
  } catch (error) {
    showToast({
      title: 'Error',
      message: 'No se pudieron marcar las notificaciones como leídas',
      type: 'error'
    })
  }
}

const handleNotificationRead = async (notificationId: number) => {
  try {
    await notificationStore.markAsRead(notificationId)
  } catch (error) {
    console.error('Error marking notification as read:', error)
  }
}

const handleNotificationDismiss = async (notificationId: number) => {
  try {
    const success = await notificationStore.dismissNotification(notificationId)
    if (success) {
      showToast({
        title: 'Notificación eliminada',
        message: 'La notificación ha sido eliminada',
        type: 'info'
      })
    }
  } catch (error) {
    showToast({
      title: 'Error',
      message: 'No se pudo eliminar la notificación',
      type: 'error'
    })
  }
}

const handleNotificationClick = async (notification: Notification) => {
  // Mark as read if not already read
  if (!notification.is_read) {
    await handleNotificationRead(notification.id)
  }
  
  // Navigate to action URL if available
  if (notification.action_url) {
    closeDropdown()
    await navigateTo(notification.action_url)
  }
}

const goToSettings = () => {
  closeDropdown()
  navigateTo('/notifications/settings')
}

// Close dropdown when clicking outside
const handleClickOutside = (event: Event) => {
  const target = event.target as Element
  if (!target.closest('.relative')) {
    closeDropdown()
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Watch for new notifications to show toast
const nuxtApp = useNuxtApp()
onMounted(() => {
  nuxtApp.$bus?.on('new-notification', (notification: Notification) => {
    // Only show toast if dropdown is closed
    if (!showDropdown.value) {
      showToast({
        title: notification.title,
        message: notification.message,
        type: notification.priority === 'urgent' ? 'error' : 'info',
        duration: notification.priority === 'urgent' ? 0 : 5000,
        action: notification.action_url ? {
          label: 'Ver',
          handler: () => navigateTo(notification.action_url!)
        } : undefined
      })
    }
  })
  
  nuxtApp.$bus?.on('system-announcement', (announcement: Notification) => {
    showToast({
      title: '📢 ' + announcement.title,
      message: announcement.message,
      type: 'warning',
      duration: 10000,
      persistent: announcement.priority === 'urgent'
    })
  })
})
</script>

<style scoped>
/* Custom scrollbar for notification list */
.max-h-96::-webkit-scrollbar {
  width: 6px;
}

.max-h-96::-webkit-scrollbar-track {
  @apply bg-gray-100 dark:bg-gray-700;
}

.max-h-96::-webkit-scrollbar-thumb {
  @apply bg-gray-300 dark:bg-gray-600 rounded-full;
}

.max-h-96::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-400 dark:bg-gray-500;
}
</style>