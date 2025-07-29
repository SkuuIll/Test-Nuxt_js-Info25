<template>
  <div class="flow-root">
    <ul v-if="activities.length > 0" role="list" class="-mb-8">
      <li
        v-for="(activity, activityIdx) in activities"
        :key="activity.id"
      >
        <div class="relative pb-8">
          <!-- Connector line -->
          <span
            v-if="activityIdx !== activities.length - 1"
            class="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
            aria-hidden="true"
          />
          
          <div class="relative flex space-x-3">
            <!-- Activity icon -->
            <div>
              <span
                :class="[
                  'h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white',
                  getActivityColor(activity.action)
                ]"
              >
                <component
                  :is="getActivityIcon(activity.action)"
                  class="h-4 w-4 text-white"
                />
              </span>
            </div>
            
            <!-- Activity content -->
            <div class="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
              <div>
                <p class="text-sm text-gray-500">
                  <span class="font-medium text-gray-900">
                    {{ activity.username }}
                  </span>
                  {{ activity.action_display || getActionDisplay(activity.action) }}
                </p>
                <p v-if="activity.description" class="mt-1 text-sm text-gray-600">
                  {{ activity.description }}
                </p>
              </div>
              <div class="text-right text-sm whitespace-nowrap text-gray-500">
                <time :datetime="activity.timestamp">
                  {{ formatTime(activity.timestamp) }}
                </time>
              </div>
            </div>
          </div>
        </div>
      </li>
    </ul>
    
    <!-- Empty state -->
    <div v-else class="text-center py-8">
      <ClockIcon class="mx-auto h-12 w-12 text-gray-300" />
      <h3 class="mt-2 text-sm font-medium text-gray-900">
        No hay actividad reciente
      </h3>
      <p class="mt-1 text-sm text-gray-500">
        La actividad del dashboard aparecerá aquí
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  UserIcon,
  ChatBubbleLeftIcon,
  ClockIcon
} from '@heroicons/vue/24/outline'

interface Activity {
  id: number | string
  username: string
  action: string
  action_display?: string
  description: string
  timestamp: string
}

interface Props {
  activities: Activity[]
}

defineProps<Props>()

// Activity icon mapping
const getActivityIcon = (action: string) => {
  const iconMap: Record<string, any> = {
    'created_post': PlusIcon,
    'updated_post': PencilIcon,
    'deleted_post': TrashIcon,
    'login': UserIcon,
    'logout': UserIcon,
    'created_comment': ChatBubbleLeftIcon,
    'approved_comment': ChatBubbleLeftIcon,
    'viewed_post': EyeIcon,
    'token_refresh': UserIcon
  }
  
  return iconMap[action] || PlusIcon
}

// Activity color mapping
const getActivityColor = (action: string) => {
  const colorMap: Record<string, string> = {
    'created_post': 'bg-green-500',
    'updated_post': 'bg-blue-500',
    'deleted_post': 'bg-red-500',
    'login': 'bg-indigo-500',
    'logout': 'bg-gray-500',
    'created_comment': 'bg-purple-500',
    'approved_comment': 'bg-green-500',
    'viewed_post': 'bg-yellow-500',
    'token_refresh': 'bg-indigo-400'
  }
  
  return colorMap[action] || 'bg-gray-500'
}

// Action display text
const getActionDisplay = (action: string) => {
  const displayMap: Record<string, string> = {
    'created_post': 'creó un post',
    'updated_post': 'actualizó un post',
    'deleted_post': 'eliminó un post',
    'login': 'inició sesión',
    'logout': 'cerró sesión',
    'created_comment': 'creó un comentario',
    'approved_comment': 'aprobó un comentario',
    'viewed_post': 'vio un post',
    'token_refresh': 'renovó su sesión'
  }
  
  return displayMap[action] || 'realizó una acción'
}

// Format time
const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'Ahora'
  if (minutes < 60) return `${minutes}m`
  if (hours < 24) return `${hours}h`
  if (days < 7) return `${days}d`
  
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short'
  })
}
</script>