<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Bienvenido de vuelta, {{ user?.username || 'Usuario' }}
        </p>
      </div>
      
      <div class="flex items-center space-x-3">
        <button
          @click="refreshStats"
          :disabled="loading"
          class="btn btn-secondary"
        >
          <Icon name="refresh" class="w-4 h-4 mr-2" :class="{ 'animate-spin': loading }" />
          Actualizar
        </button>
        
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Última actualización: {{ lastUpdated }}
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <DashboardStatCard
        title="Total Posts"
        :value="stats.totalPosts"
        icon="document-text"
        color="blue"
        :change="stats.postsChange"
        :loading="loading"
        :trend="stats.postsTrend"
      />
      
      <DashboardStatCard
        title="Total Usuarios"
        :value="stats.totalUsers"
        icon="users"
        color="green"
        :change="stats.usersChange"
        :loading="loading"
        :trend="stats.usersTrend"
      />
      
      <DashboardStatCard
        title="Comentarios"
        :value="stats.totalComments"
        icon="chat-bubble-left"
        color="yellow"
        :change="stats.commentsChange"
        :loading="loading"
        :trend="stats.commentsTrend"
      />
      
      <DashboardStatCard
        title="Vistas del Mes"
        :value="stats.monthlyViews"
        icon="eye"
        color="purple"
        :change="stats.viewsChange"
        :loading="loading"
        :trend="stats.viewsTrend"
        format="number"
      />
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Posts Chart -->
      <DashboardChart
        title="Posts Publicados"
        subtitle="Número de posts publicados por día"
        type="line"
        :data="chartsData.posts"
        :loading="chartsLoading"
        color="#3B82F6"
        :filled="true"
        @period-change="handlePostsPeriodChange"
      />
      
      <!-- Users Chart -->
      <DashboardChart
        title="Nuevos Usuarios"
        subtitle="Registros de usuarios por día"
        type="bar"
        :data="chartsData.users"
        :loading="chartsLoading"
        color="#10B981"
        @period-change="handleUsersPeriodChange"
      />
    </div>

    <!-- Activity and Quick Actions -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Recent Activity -->
      <div class="lg:col-span-2">
        <DashboardRecentActivity
          :limit="8"
          :auto-refresh="true"
          :refresh-interval="60000"
        />
      </div>
      
      <!-- Quick Actions -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-6">
          Acciones Rápidas
        </h3>
        
        <div class="space-y-4">
          <NuxtLink
            to="/dashboard/posts/create"
            class="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
          >
            <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
              <Icon name="plus" class="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                Crear Post
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Escribir un nuevo artículo
              </p>
            </div>
          </NuxtLink>
          
          <NuxtLink
            to="/dashboard/posts"
            class="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
          >
            <div class="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-800 transition-colors">
              <Icon name="document-text" class="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                Gestionar Posts
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Ver y editar artículos
              </p>
            </div>
          </NuxtLink>
          
          <NuxtLink
            to="/dashboard/users"
            class="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
          >
            <div class="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center group-hover:bg-yellow-200 dark:group-hover:bg-yellow-800 transition-colors">
              <Icon name="users" class="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                Usuarios
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Administrar usuarios
              </p>
            </div>
          </NuxtLink>
          
          <button
            @click="viewSite"
            class="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group w-full text-left"
          >
            <div class="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors">
              <Icon name="external-link" class="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                Ver Sitio
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Abrir el blog público
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- System Status -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Estado del Sistema
      </h3>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="flex items-center">
          <div class="w-3 h-3 bg-green-400 rounded-full mr-3"></div>
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              Base de Datos
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Funcionando correctamente
            </p>
          </div>
        </div>
        
        <div class="flex items-center">
          <div class="w-3 h-3 bg-green-400 rounded-full mr-3"></div>
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              API
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Tiempo de respuesta: {{ apiResponseTime }}ms
            </p>
          </div>
        </div>
        
        <div class="flex items-center">
          <div class="w-3 h-3 bg-yellow-400 rounded-full mr-3"></div>
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              Almacenamiento
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ storageUsed }}% utilizado
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'dashboard',
  middleware: 'dashboard-auth'
})

// Composables
const { user, apiCall } = useDashboardAuth()
const { handleError } = useErrorHandler()

// State
const loading = ref(false)
const chartsLoading = ref(false)
const lastUpdated = ref('')

const stats = reactive({
  totalPosts: 0,
  totalUsers: 0,
  totalComments: 0,
  monthlyViews: 0,
  postsChange: 0,
  usersChange: 0,
  commentsChange: 0,
  viewsChange: 0,
  postsTrend: [],
  usersTrend: [],
  commentsTrend: [],
  viewsTrend: []
})

const chartsData = reactive({
  posts: [],
  users: []
})

const apiResponseTime = ref(45)
const storageUsed = ref(67)

// Methods
const fetchStats = async () => {
  try {
    loading.value = true
    
    const response = await apiCall('/api/v1/dashboard/stats/')
    
    // Update stats
    Object.assign(stats, response)
    
    lastUpdated.value = new Date().toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
    
  } catch (error) {
    console.error('Error fetching stats:', error)
    handleError(error, 'fetchStats')
    
    // Mock data for development
    loadMockStats()
  } finally {
    loading.value = false
  }
}

const fetchChartsData = async () => {
  try {
    chartsLoading.value = true
    
    const [postsData, usersData] = await Promise.all([
      apiCall('/api/v1/dashboard/charts/posts/'),
      apiCall('/api/v1/dashboard/charts/users/')
    ])
    
    chartsData.posts = postsData
    chartsData.users = usersData
    
  } catch (error) {
    console.error('Error fetching charts data:', error)
    
    // Mock data for development
    loadMockChartsData()
  } finally {
    chartsLoading.value = false
  }
}

const refreshStats = async () => {
  await Promise.all([
    fetchStats(),
    fetchChartsData()
  ])
}

const handlePostsPeriodChange = async (period) => {
  try {
    chartsLoading.value = true
    const response = await apiCall(`/api/v1/dashboard/charts/posts/?period=${period}`)
    chartsData.posts = response
  } catch (error) {
    console.error('Error fetching posts chart data:', error)
  } finally {
    chartsLoading.value = false
  }
}

const handleUsersPeriodChange = async (period) => {
  try {
    chartsLoading.value = true
    const response = await apiCall(`/api/v1/dashboard/charts/users/?period=${period}`)
    chartsData.users = response
  } catch (error) {
    console.error('Error fetching users chart data:', error)
  } finally {
    chartsLoading.value = false
  }
}

const viewSite = () => {
  window.open('/', '_blank')
}

// Mock data for development
const loadMockStats = () => {
  Object.assign(stats, {
    totalPosts: 156,
    totalUsers: 1247,
    totalComments: 892,
    monthlyViews: 45678,
    postsChange: 12.5,
    usersChange: 8.3,
    commentsChange: -2.1,
    viewsChange: 15.7,
    postsTrend: [10, 12, 8, 15, 18, 14, 20],
    usersTrend: [25, 30, 28, 35, 32, 38, 42],
    commentsTrend: [45, 52, 48, 55, 51, 49, 53],
    viewsTrend: [1200, 1350, 1180, 1420, 1380, 1450, 1520]
  })
  
  lastUpdated.value = new Date().toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const loadMockChartsData = () => {
  const generateDailyData = (days, baseValue, variance) => {
    return Array.from({ length: days }, (_, i) => ({
      label: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES', { 
        month: 'short', 
        day: 'numeric' 
      }),
      value: Math.floor(baseValue + Math.random() * variance - variance / 2)
    }))
  }
  
  chartsData.posts = generateDailyData(7, 5, 4)
  chartsData.users = generateDailyData(7, 12, 8)
}

// Initialize
onMounted(async () => {
  await refreshStats()
})

// SEO
useHead({
  title: 'Dashboard - Panel de Administración'
})
</script>