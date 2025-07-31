<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">
        Actividad Reciente
      </h3>
      
      <button
        @click="refreshActivity"
        :disabled="loading"
        class="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 disabled:opacity-50"
      >
        <Icon name="refresh" class="w-4 h-4" :class="{ 'animate-spin': loading }" />
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading && activities.length === 0" class="space-y-4">
      <div v-for="i in 5" :key="i" class="animate-pulse">
        <div class="flex items-center space-x-4">
          <div class="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div class="flex-1 space-y-2">
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Activity List -->
    <div v-else-if="activities.length > 0" class="space-y-4">
      <div
        v-for="activity in activities"
        :key="activity.id"
        class="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <!-- Icon -->
        <div class="flex-shrink-0">
          <div 
            class="w-8 h-8 rounded-full flex items-center justify-center"
            :class="getActivityIconBg(activity.type)"
          >
            <Icon 
              :name="getActivityIcon(activity.type)" 
              class="w-4 h-4"
              :class="getActivityIconColor(activity.type)"
            />
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              {{ activity.title }}
            </p>
            <time class="text-xs text-gray-500 dark:text-gray-400">
              {{ formatTime(activity.timestamp) }}
            </time>
          </div>
          
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {{ activity.description }}
          </p>
          
          <!-- Additional info -->
          <div v-if="activity.metadata" class="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span v-if="activity.metadata.user" class="flex items-center">
              <Icon name="user" class="w-3 h-3 mr-1" />
              {{ activity.metadata.user }}
            </span>
            <span v-if="activity.metadata.ip" class="flex items-center">
              <Icon name="globe" class="w-3 h-3 mr-1" />
              {{ activity.metadata.ip }}
            </span>
            <span v-if="activity.metadata.status" class="flex items-center">
              <div 
                class="w-2 h-2 rounded-full mr-1"
                :class="getStatusColor(activity.metadata.status)"
              ></div>
              {{ activity.metadata.status }}
            </span>
          </div>
        </div>

        <!-- Action button -->
        <div v-if="activity.actionUrl" class="flex-shrink-0">
          <NuxtLink
            :to="activity.actionUrl"
            class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            Ver
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-8">
      <Icon name="clock" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">
        No hay actividad reciente
      </h4>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        La actividad aparecerá aquí cuando ocurran eventos en el sistema
      </p>
    </div>

    <!-- Load More -->
    <div v-if="hasMore && activities.length > 0" class="mt-6 text-center">
      <button
        @click="loadMore"
        :disabled="loadingMore"
        class="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 disabled:opacity-50"
      >
        <Icon v-if="loadingMore" name="loading" class="w-4 h-4 animate-spin mr-2" />
        {{ loadingMore ? 'Cargando...' : 'Cargar más' }}
      </button>
    </div>
  </div>
</template>

<script setup>
const props = withDefaults(defineProps(), {
  limit: 10,
  autoRefresh: false,
  refreshInterval: 30000 // 30 seconds
})

// State
const activities = ref([])
const loading = ref(false)
const loadingMore = ref(false)
const hasMore = ref(true)
const page = ref(1)

// Auto refresh
let refreshTimer = null

// Methods
const fetchActivities = async (reset = false) => {
  try {
    if (reset) {
      loading.value = true
      page.value = 1
    } else {
      loadingMore.value = true
    }

    const { apiCall } = useDashboardAuth()
    const response = await apiCall(`/api/v1/dashboard/activity/`, {
      params: {
        page: page.value,
        limit: props.limit
      }
    })

    if (reset) {
      activities.value = response.results || []
    } else {
      activities.value.push(...(response.results || []))
    }

    hasMore.value = response.has_next || false
    
  } catch (error) {
    console.error('Error fetching activities:', error)
    
    // Mock data for development
    if (activities.value.length === 0) {
      activities.value = generateMockActivities()
    }
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const refreshActivity = () => {
  fetchActivities(true)
}

const loadMore = () => {
  if (hasMore.value && !loadingMore.value) {
    page.value++
    fetchActivities(false)
  }
}

const getActivityIcon = (type) => {
  const icons = {
    post: 'document-text',
    user: 'user',
    comment: 'chat-bubble-left',
    login: 'arrow-right-on-rectangle',
    system: 'cog',
    error: 'exclamation-triangle'
  }
  return icons[type] || 'information-circle'
}

const getActivityIconBg = (type) => {
  const classes = {
    post: 'bg-blue-100 dark:bg-blue-900',
    user: 'bg-green-100 dark:bg-green-900',
    comment: 'bg-yellow-100 dark:bg-yellow-900',
    login: 'bg-purple-100 dark:bg-purple-900',
    system: 'bg-gray-100 dark:bg-gray-700',
    error: 'bg-red-100 dark:bg-red-900'
  }
  return classes[type] || 'bg-gray-100 dark:bg-gray-700'
}

const getActivityIconColor = (type) => {
  const classes = {
    post: 'text-blue-600 dark:text-blue-400',
    user: 'text-green-600 dark:text-green-400',
    comment: 'text-yellow-600 dark:text-yellow-400',
    login: 'text-purple-600 dark:text-purple-400',
    system: 'text-gray-600 dark:text-gray-400',
    error: 'text-red-600 dark:text-red-400'
  }
  return classes[type] || 'text-gray-600 dark:text-gray-400'
}

const getStatusColor = (status) => {
  const classes = {
    success: 'bg-green-400',
    warning: 'bg-yellow-400',
    error: 'bg-red-400'
  }
  return classes[status] || 'bg-gray-400'
}

const formatTime = (timestamp) => {
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
    month: 'short',
    day: 'numeric'
  })
}

// Mock data generator for development
const generateMockActivities = () => {
  const mockActivities = [
    {
      id: '1',
      type: 'post',
      title: 'Nuevo post publicado',
      description: 'Se ha publicado el post "Guía completa de Vue 3"',
      timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
      metadata: { user: 'admin', status: 'success' },
      actionUrl: '/dashboard/posts/1'
    },
    {
      id: '2',
      type: 'user',
      title: 'Nuevo usuario registrado',
      description: 'El usuario "juan.perez" se ha registrado en el sistema',
      timestamp: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
      metadata: { user: 'juan.perez', ip: '192.168.1.100', status: 'success' }
    },
    {
      id: '3',
      type: 'comment',
      title: 'Nuevo comentario',
      description: 'Comentario en el post "Introducción a TypeScript"',
      timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
      metadata: { user: 'maria.garcia', status: 'success' },
      actionUrl: '/dashboard/comments'
    },
    {
      id: '4',
      type: 'login',
      title: 'Inicio de sesión',
      description: 'El administrador ha iniciado sesión',
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      metadata: { user: 'admin', ip: '192.168.1.50', status: 'success' }
    },
    {
      id: '5',
      type: 'system',
      title: 'Backup completado',
      description: 'Backup automático de la base de datos completado exitosamente',
      timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      metadata: { status: 'success' }
    }
  ]
  
  return mockActivities
}

// Setup auto refresh
const setupAutoRefresh = () => {
  if (props.autoRefresh && props.refreshInterval > 0) {
    refreshTimer = setInterval(() => {
      fetchActivities(true)
    }, props.refreshInterval)
  }
}

const clearAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

// Lifecycle
onMounted(() => {
  fetchActivities(true)
  setupAutoRefresh()
})

onUnmounted(() => {
  clearAutoRefresh()
})

// Watch for prop changes
watch(() => props.autoRefresh, (newValue) => {
  if (newValue) {
    setupAutoRefresh()
  } else {
    clearAutoRefresh()
  }
})
</script>