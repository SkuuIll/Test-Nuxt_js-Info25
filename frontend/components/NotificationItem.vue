<template>
  <div
    class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
    :class="{
      'bg-blue-50 dark:bg-blue-900/20': !notification.is_read,
      'opacity-75': notification.is_read
    }"
    @click="handleClick"
  >
    <div class="flex items-start space-x-3">
      <!-- Notification Icon -->
      <div class="flex-shrink-0">
        <div
          class="w-10 h-10 rounded-full flex items-center justify-center"
          :class="iconClasses"
        >
          <component :is="iconComponent" class="w-5 h-5" />
        </div>
      </div>

      <!-- Notification Content -->
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <!-- Title -->
            <p
              class="text-sm font-medium text-gray-900 dark:text-white truncate"
              :class="{ 'font-semibold': !notification.is_read }"
            >
              {{ notification.title }}
            </p>
            
            <!-- Message -->
            <p class="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
              {{ notification.message }}
            </p>
            
            <!-- Metadata -->
            <div class="flex items-center mt-2 space-x-2 text-xs text-gray-500 dark:text-gray-400">
              <!-- Sender -->
              <span v-if="notification.sender">
                {{ notification.sender.username }}
              </span>
              
              <!-- Timestamp -->
              <span>{{ formatTimestamp(notification.created_at) }}</span>
              
              <!-- Priority Badge -->
              <span
                v-if="notification.priority !== 'normal'"
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                :class="priorityClasses"
              >
                {{ notification.priority_display || notification.priority }}
              </span>
              
              <!-- Expiration Warning -->
              <span
                v-if="notification.expires_at && isExpiringSoon(notification.expires_at)"
                class="inline-flex items-center text-orange-600 dark:text-orange-400"
                title="Expira pronto"
              >
                <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Expira pronto
              </span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center space-x-1 ml-2">
            <!-- Mark as Read/Unread Button -->
            <button
              @click.stop="toggleRead"
              class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
              :title="notification.is_read ? 'Marcar como no leída' : 'Marcar como leída'"
            >
              <svg v-if="notification.is_read" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M12 12v7" />
              </svg>
              <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M12 12v7" />
              </svg>
            </button>

            <!-- Dismiss Button -->
            <button
              @click.stop="handleDismiss"
              class="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
              title="Eliminar notificación"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Unread Indicator -->
    <div
      v-if="!notification.is_read"
      class="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-primary-500 rounded-r"
    ></div>
  </div>
</template>

<script setup lang="ts">
import type { Notification } from '~/types/notifications'

// Props
interface Props {
  notification: Notification
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  read: [notificationId: number]
  dismiss: [notificationId: number]
  click: [notification: Notification]
}>()

// Computed properties
const iconComponent = computed(() => {
  switch (props.notification.notification_type) {
    case 'comment':
    case 'comment_reply':
      return 'ChatBubbleLeftIcon'
    case 'user_registration':
      return 'UserPlusIcon'
    case 'post_published':
    case 'post_featured':
      return 'DocumentTextIcon'
    case 'system_announcement':
      return 'SpeakerWaveIcon'
    case 'moderation_required':
      return 'ExclamationTriangleIcon'
    case 'post_liked':
      return 'HeartIcon'
    case 'user_followed':
      return 'UserGroupIcon'
    case 'content_approved':
      return 'CheckCircleIcon'
    case 'content_rejected':
      return 'XCircleIcon'
    default:
      return 'BellIcon'
  }
})

const iconClasses = computed(() => {
  const baseClasses = 'text-white'
  
  switch (props.notification.notification_type) {
    case 'comment':
    case 'comment_reply':
      return `${baseClasses} bg-blue-500`
    case 'user_registration':
      return `${baseClasses} bg-green-500`
    case 'post_published':
    case 'post_featured':
      return `${baseClasses} bg-purple-500`
    case 'system_announcement':
      return `${baseClasses} bg-orange-500`
    case 'moderation_required':
      return `${baseClasses} bg-red-500`
    case 'post_liked':
      return `${baseClasses} bg-pink-500`
    case 'user_followed':
      return `${baseClasses} bg-indigo-500`
    case 'content_approved':
      return `${baseClasses} bg-green-500`
    case 'content_rejected':
      return `${baseClasses} bg-red-500`
    default:
      return `${baseClasses} bg-gray-500`
  }
})

const priorityClasses = computed(() => {
  switch (props.notification.priority) {
    case 'urgent':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    case 'high':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    case 'low':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    default:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
  }
})

// Methods
const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return 'Ahora'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}m`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}h`
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days}d`
  } else {
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    })
  }
}

const isExpiringSoon = (expiresAt: string): boolean => {
  const expiration = new Date(expiresAt)
  const now = new Date()
  const diffInHours = (expiration.getTime() - now.getTime()) / (1000 * 60 * 60)
  
  return diffInHours > 0 && diffInHours <= 24 // Expires within 24 hours
}

const handleClick = () => {
  emit('click', props.notification)
}

const toggleRead = () => {
  emit('read', props.notification.id)
}

const handleDismiss = () => {
  emit('dismiss', props.notification.id)
}

// Import Heroicons components dynamically
const ChatBubbleLeftIcon = resolveComponent('ChatBubbleLeftIcon') || 'div'
const UserPlusIcon = resolveComponent('UserPlusIcon') || 'div'
const DocumentTextIcon = resolveComponent('DocumentTextIcon') || 'div'
const SpeakerWaveIcon = resolveComponent('SpeakerWaveIcon') || 'div'
const ExclamationTriangleIcon = resolveComponent('ExclamationTriangleIcon') || 'div'
const HeartIcon = resolveComponent('HeartIcon') || 'div'
const UserGroupIcon = resolveComponent('UserGroupIcon') || 'div'
const CheckCircleIcon = resolveComponent('CheckCircleIcon') || 'div'
const XCircleIcon = resolveComponent('XCircleIcon') || 'div'
const BellIcon = resolveComponent('BellIcon') || 'div'
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Hover effects */
.group:hover .group-hover\:opacity-100 {
  opacity: 1;
}

.group:hover .group-hover\:translate-x-0 {
  transform: translateX(0);
}

/* Smooth transitions */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
</style>