<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Notificaciones
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          {{ totalCount > 0 ? `${totalCount} notificaciones` : 'No tienes notificaciones' }}
          <span v-if="unreadCount > 0" class="text-primary-600 dark:text-primary-400">
            ({{ unreadCount }} sin leer)
          </span>
        </p>
      </div>
      
      <div class="flex items-center space-x-3">
        <!-- Settings Button -->
        <NuxtLink
          to="/notifications/settings"
          class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Configuración
        </NuxtLink>
        
        <!-- Mark All Read Button -->
        <button
          v-if="unreadCount > 0"
          @click="handleMarkAllRead"
          :disabled="loading"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg v-if="loading" class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Marcar todas como leídas
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div class="flex flex-wrap items-center gap-4">
        <!-- Type Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tipo
          </label>
          <select
            v-model="filters.notification_type"
            @change="applyFilters"
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-sm"
          >
            <option value="">Todos</option>
            <option value="comment">Comentarios</option>
            <option value="comment_reply">Respuestas</option>
            <option value="post_featured">Posts destacados</option>
            <option value="system_announcement">Anuncios</option>
            <option value="user_registration">Registros</option>
            <option value="moderation_required">Moderación</option>
          </select>
        </div>
        
        <!-- Priority Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Prioridad
          </label>
          <select
            v-model="filters.priority"
            @change="applyFilters"
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-sm"
          >
            <option value="">Todas</option>
            <option value="urgent">Urgente</option>
            <option value="high">Alta</option>
            <option value="normal">Normal</option>
            <option value="low">Baja</option>
          </select>
        </div>
        
        <!-- Read Status Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Estado
          </label>
          <select
            v-model="readStatusFilter"
            @change="applyFilters"
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-sm"
          >
            <option value="all">Todas</option>
            <option value="unread">Sin leer</option>
            <option value="read">Leídas</option>
          </select>
        </div>
        
        <!-- Clear Filters -->
        <div class="flex items-end">
          <button
            @click="clearFilters"
            class="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Limpiar filtros
          </button>
        </div>
      </div>
    </div>

    <!-- Connection Status -->
    <div v-if="connectionStatus !== 'connected'" class="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
      <div class="flex items-center">
        <svg class="w-5 h-5 text-yellow-400 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-sm text-yellow-800 dark:text-yellow-200">
          Reconectando a las notificaciones en tiempo real...
        </span>
      </div>
    </div>

    <!-- Notifications List -->
    <div class="space-y-4">
      <!-- Loading State -->
      <div v-if="loading && notifications.length === 0" class="space-y-4">
        <div v-for="i in 5" :key="i" class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 animate-pulse">
          <div class="flex space-x-3">
            <div class="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div class="flex-1 space-y-2">
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="notifications.length === 0" class="text-center py-12">
        <svg class="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No hay notificaciones
        </h3>
        <p class="text-gray-500 dark:text-gray-400">
          {{ hasActiveFilters ? 'No se encontraron notificaciones con los filtros aplicados' : 'No tienes notificaciones en este momento' }}
        </p>
      </div>

      <!-- Notification Items -->
      <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow divide-y divide-gray-200 dark:divide-gray-700">
        <NotificationItem
          v-for="notification in notifications"
          :key="notification.id"
          :notification="notification"
          @read="handleNotificationRead"
          @dismiss="handleNotificationDismiss"
          @click="handleNotificationClick"
        />
      </div>
    </div>

    <!-- Load More Button -->
    <div v-if="hasNext" class="mt-8 text-center">
      <button
        @click="loadMore"
        :disabled="loading"
        class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg v-if="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Cargar más notificaciones
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NotificationFilters } from '~/types/notifications'

// Meta
definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

// Composables
const {
  notifications,
  unreadCount,
  totalCount,
  loading,
  connectionStatus,
  hasNext,
  fetchNotifications,
  loadMoreNotifications,
  markAllAsRead,
  handleNotificationClick
} = useNotifications()

// State
const filters = ref<NotificationFilters>({
  include_read: true,
  include_dismissed: false,
  page: 1,
  page_size: 20
})

const readStatusFilter = ref('all')

// Computed
const hasActiveFilters = computed(() => {
  return !!(
    filters.value.notification_type ||
    filters.value.priority ||
    readStatusFilter.value !== 'all'
  )
})

// Methods
const applyFilters = async () => {
  // Update include_read based on readStatusFilter
  if (readStatusFilter.value === 'unread') {
    filters.value.include_read = false
  } else if (readStatusFilter.value === 'read') {
    filters.value.include_read = true
    // Add logic to show only read notifications
  } else {
    filters.value.include_read = true
  }
  
  // Reset to first page when applying filters
  filters.value.page = 1
  
  await fetchNotifications(filters.value)
}

const clearFilters = async () => {
  filters.value = {
    include_read: true,
    include_dismissed: false,
    page: 1,
    page_size: 20
  }
  readStatusFilter.value = 'all'
  
  await fetchNotifications(filters.value)
}

const loadMore = async () => {
  await loadMoreNotifications()
}

const handleMarkAllRead = async () => {
  await markAllAsRead()
}

const handleNotificationRead = async (notificationId: number) => {
  // This is handled by the composable
}

const handleNotificationDismiss = async (notificationId: number) => {
  // This is handled by the composable
}

// Initialize
onMounted(async () => {
  await fetchNotifications(filters.value)
})
</script>

<style scoped>
/* Custom styles for notification page */
</style>