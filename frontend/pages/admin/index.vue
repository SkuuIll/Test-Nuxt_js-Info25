<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
    <div class="container mx-auto px-4">
      <div class="max-w-7xl mx-auto">
        <!-- Enhanced Header -->
        <div class="mb-8">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent mb-2">
                Panel de Administración
              </h1>
              <p class="text-gray-600 dark:text-gray-400 text-lg">
                Bienvenido, <span class="font-semibold text-primary-600 dark:text-primary-400">{{ user?.first_name || user?.username }}</span>. 
                Gestiona tu blog desde aquí.
              </p>
            </div>
            <div class="hidden md:flex items-center space-x-4">
              <div class="text-right">
                <p class="text-sm text-gray-500 dark:text-gray-400">Último acceso</p>
                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ formatDate(new Date()) }}</p>
              </div>
              <div class="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {{ userInitials }}
              </div>
            </div>
          </div>
        </div>

        <!-- Enhanced Stats with Animations -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div class="group bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Posts</p>
                <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ animatedStats.totalPosts }}</p>
                <p class="text-xs text-green-600 dark:text-green-400 flex items-center mt-1">
                  <Icon name="arrow-up" class="w-3 h-3 mr-1" />
                  +12% este mes
                </p>
              </div>
              <div class="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Icon name="document-text" class="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <div class="group bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Usuarios</p>
                <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ animatedStats.totalUsers }}</p>
                <p class="text-xs text-green-600 dark:text-green-400 flex items-center mt-1">
                  <Icon name="arrow-up" class="w-3 h-3 mr-1" />
                  +5% este mes
                </p>
              </div>
              <div class="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Icon name="users" class="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <div class="group bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Comentarios</p>
                <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ animatedStats.totalComments }}</p>
                <p class="text-xs text-yellow-600 dark:text-yellow-400 flex items-center mt-1">
                  <Icon name="arrow-up" class="w-3 h-3 mr-1" />
                  +8% este mes
                </p>
              </div>
              <div class="p-3 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Icon name="chat-bubble-left-right" class="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <div class="group bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Visitas</p>
                <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ formatNumber(animatedStats.totalViews) }}</p>
                <p class="text-xs text-purple-600 dark:text-purple-400 flex items-center mt-1">
                  <Icon name="arrow-up" class="w-3 h-3 mr-1" />
                  +23% este mes
                </p>
              </div>
              <div class="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Icon name="eye" class="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <!-- Quick Actions - Enhanced -->
          <div class="lg:col-span-2">
            <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                  Acciones Rápidas
                </h2>
                <div class="flex space-x-2">
                  <button 
                    @click="activeQuickTab = 'posts'"
                    :class="[
                      'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      activeQuickTab === 'posts' 
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    ]"
                  >
                    Posts
                  </button>
                  <button 
                    @click="activeQuickTab = 'management'"
                    :class="[
                      'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      activeQuickTab === 'management' 
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    ]"
                  >
                    Gestión
                  </button>
                </div>
              </div>

              <div v-show="activeQuickTab === 'posts'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <NuxtLink 
                  to="/admin/posts/create" 
                  class="group p-4 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl hover:from-primary-100 hover:to-primary-200 dark:hover:from-primary-900/30 dark:hover:to-primary-800/30 transition-all duration-300 border border-primary-200 dark:border-primary-800"
                >
                  <div class="flex items-center">
                    <div class="p-3 bg-primary-500 rounded-lg group-hover:bg-primary-600 transition-colors">
                      <Icon name="plus" class="w-6 h-6 text-white" />
                    </div>
                    <div class="ml-4">
                      <p class="font-bold text-primary-900 dark:text-primary-100 text-lg">Crear Post</p>
                      <p class="text-sm text-primary-600 dark:text-primary-400">Nuevo artículo</p>
                    </div>
                  </div>
                </NuxtLink>
                
                <NuxtLink 
                  to="/admin/posts" 
                  class="group p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 border border-gray-200 dark:border-gray-600"
                >
                  <div class="flex items-center">
                    <div class="p-3 bg-gray-500 rounded-lg group-hover:bg-gray-600 transition-colors">
                      <Icon name="document-text" class="w-6 h-6 text-white" />
                    </div>
                    <div class="ml-4">
                      <p class="font-bold text-gray-900 dark:text-white text-lg">Gestionar Posts</p>
                      <p class="text-sm text-gray-600 dark:text-gray-400">Editar y organizar</p>
                    </div>
                  </div>
                </NuxtLink>

                <NuxtLink 
                  to="/admin/stats" 
                  class="group p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-xl hover:from-indigo-100 hover:to-indigo-200 dark:hover:from-indigo-900/30 dark:hover:to-indigo-800/30 transition-all duration-300 border border-indigo-200 dark:border-indigo-800"
                >
                  <div class="flex items-center">
                    <div class="p-3 bg-indigo-500 rounded-lg group-hover:bg-indigo-600 transition-colors">
                      <Icon name="chart-bar" class="w-6 h-6 text-white" />
                    </div>
                    <div class="ml-4">
                      <p class="font-bold text-indigo-900 dark:text-indigo-100 text-lg">Estadísticas</p>
                      <p class="text-sm text-indigo-600 dark:text-indigo-400">Ver métricas</p>
                    </div>
                  </div>
                </NuxtLink>

                <button 
                  @click="refreshStats"
                  :disabled="refreshing"
                  class="group p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-xl hover:from-emerald-100 hover:to-emerald-200 dark:hover:from-emerald-900/30 dark:hover:to-emerald-800/30 transition-all duration-300 border border-emerald-200 dark:border-emerald-800 disabled:opacity-50"
                >
                  <div class="flex items-center">
                    <div class="p-3 bg-emerald-500 rounded-lg group-hover:bg-emerald-600 transition-colors">
                      <Icon name="arrow-path" :class="['w-6 h-6 text-white', refreshing && 'animate-spin']" />
                    </div>
                    <div class="ml-4">
                      <p class="font-bold text-emerald-900 dark:text-emerald-100 text-lg">Actualizar</p>
                      <p class="text-sm text-emerald-600 dark:text-emerald-400">Refrescar datos</p>
                    </div>
                  </div>
                </button>
              </div>

              <div v-show="activeQuickTab === 'management'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <NuxtLink 
                  to="/admin/comments" 
                  class="group p-4 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl hover:from-orange-100 hover:to-orange-200 dark:hover:from-orange-900/30 dark:hover:to-orange-800/30 transition-all duration-300 border border-orange-200 dark:border-orange-800"
                >
                  <div class="flex items-center">
                    <div class="p-3 bg-orange-500 rounded-lg group-hover:bg-orange-600 transition-colors">
                      <Icon name="chat-bubble-left-right" class="w-6 h-6 text-white" />
                    </div>
                    <div class="ml-4">
                      <p class="font-bold text-orange-900 dark:text-orange-100 text-lg">Comentarios</p>
                      <p class="text-sm text-orange-600 dark:text-orange-400">Moderar y revisar</p>
                    </div>
                  </div>
                </NuxtLink>
                
                <NuxtLink 
                  v-if="user?.is_superuser"
                  to="/admin/users" 
                  class="group p-4 bg-gradient-to-r from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/20 rounded-xl hover:from-rose-100 hover:to-rose-200 dark:hover:from-rose-900/30 dark:hover:to-rose-800/30 transition-all duration-300 border border-rose-200 dark:border-rose-800"
                >
                  <div class="flex items-center">
                    <div class="p-3 bg-rose-500 rounded-lg group-hover:bg-rose-600 transition-colors">
                      <Icon name="users" class="w-6 h-6 text-white" />
                    </div>
                    <div class="ml-4">
                      <p class="font-bold text-rose-900 dark:text-rose-100 text-lg">Usuarios</p>
                      <p class="text-sm text-rose-600 dark:text-rose-400">Administrar cuentas</p>
                    </div>
                  </div>
                </NuxtLink>

                <NuxtLink 
                  to="/" 
                  target="_blank"
                  class="group p-4 bg-gradient-to-r from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 rounded-xl hover:from-teal-100 hover:to-teal-200 dark:hover:from-teal-900/30 dark:hover:to-teal-800/30 transition-all duration-300 border border-teal-200 dark:border-teal-800"
                >
                  <div class="flex items-center">
                    <div class="p-3 bg-teal-500 rounded-lg group-hover:bg-teal-600 transition-colors">
                      <Icon name="globe-alt" class="w-6 h-6 text-white" />
                    </div>
                    <div class="ml-4">
                      <p class="font-bold text-teal-900 dark:text-teal-100 text-lg">Ver Sitio</p>
                      <p class="text-sm text-teal-600 dark:text-teal-400">Abrir en nueva pestaña</p>
                    </div>
                  </div>
                </NuxtLink>

                <button 
                  @click="showSystemInfo = !showSystemInfo"
                  class="group p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/20 dark:to-slate-800/20 rounded-xl hover:from-slate-100 hover:to-slate-200 dark:hover:from-slate-900/30 dark:hover:to-slate-800/30 transition-all duration-300 border border-slate-200 dark:border-slate-800"
                >
                  <div class="flex items-center">
                    <div class="p-3 bg-slate-500 rounded-lg group-hover:bg-slate-600 transition-colors">
                      <Icon name="cog-6-tooth" class="w-6 h-6 text-white" />
                    </div>
                    <div class="ml-4">
                      <p class="font-bold text-slate-900 dark:text-slate-100 text-lg">Sistema</p>
                      <p class="text-sm text-slate-600 dark:text-slate-400">Información técnica</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <!-- Activity Feed -->
          <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Actividad Reciente
            </h3>
            <div class="space-y-4">
              <div v-for="activity in recentActivity" :key="activity.id" class="flex items-start space-x-3">
                <div :class="[
                  'p-2 rounded-full',
                  activity.type === 'post' ? 'bg-blue-100 dark:bg-blue-900/20' :
                  activity.type === 'comment' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                  activity.type === 'user' ? 'bg-green-100 dark:bg-green-900/20' :
                  'bg-gray-100 dark:bg-gray-900/20'
                ]">
                  <Icon 
                    :name="activity.icon" 
                    :class="[
                      'w-4 h-4',
                      activity.type === 'post' ? 'text-blue-600 dark:text-blue-400' :
                      activity.type === 'comment' ? 'text-yellow-600 dark:text-yellow-400' :
                      activity.type === 'user' ? 'text-green-600 dark:text-green-400' :
                      'text-gray-600 dark:text-gray-400'
                    ]" 
                  />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ activity.title }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ activity.time }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- System Info Panel -->
        <div v-if="showSystemInfo" class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-bold text-gray-900 dark:text-white">
              Información del Sistema
            </h3>
            <button @click="showSystemInfo = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <Icon name="x-mark" class="w-5 h-5" />
            </button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Aplicación</h4>
              <div class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <p>Versión: 1.0.0</p>
                <p>Entorno: {{ import.meta.dev ? 'Desarrollo' : 'Producción' }}</p>
                <p>Framework: Nuxt 3</p>
              </div>
            </div>
            <div>
              <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Usuario</h4>
              <div class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <p>Rol: {{ user?.is_superuser ? 'Superusuario' : user?.is_staff ? 'Staff' : 'Usuario' }}</p>
                <p>Email: {{ user?.email || 'No disponible' }}</p>
                <p>ID: {{ user?.id || 'N/A' }}</p>
              </div>
            </div>
            <div>
              <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Rendimiento</h4>
              <div class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <p>Tiempo de carga: {{ loadTime }}ms</p>
                <p>Memoria: {{ memoryUsage }}</p>
                <p>Estado: <span class="text-green-600 dark:text-green-400">Óptimo</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: 'admin-check'
})

const { user } = useAuth()

// State
const activeQuickTab = ref('posts')
const showSystemInfo = ref(false)
const refreshing = ref(false)
const loadTime = ref(0)
const memoryUsage = ref('N/A')

// Stats with animation
const stats = ref({
  totalPosts: 0,
  totalUsers: 0,
  totalComments: 0,
  totalViews: 0
})

const animatedStats = ref({
  totalPosts: 0,
  totalUsers: 0,
  totalComments: 0,
  totalViews: 0
})

// Recent activity mock data
const recentActivity = ref([
  {
    id: 1,
    type: 'post',
    icon: 'document-text',
    title: 'Nuevo post "Tecnología 2025" publicado',
    time: 'Hace 2 horas'
  },
  {
    id: 2,
    type: 'comment',
    icon: 'chat-bubble-left-right',
    title: '3 nuevos comentarios pendientes de moderación',
    time: 'Hace 4 horas'
  },
  {
    id: 3,
    type: 'user',
    icon: 'users',
    title: 'Nuevo usuario registrado: juan.perez',
    time: 'Hace 6 horas'
  },
  {
    id: 4,
    type: 'system',
    icon: 'cog-6-tooth',
    title: 'Backup automático completado',
    time: 'Hace 12 horas'
  },
  {
    id: 5,
    type: 'post',
    icon: 'document-text',
    title: 'Post "Deportes Hoy" editado',
    time: 'Hace 1 día'
  }
])

// Computed
const userInitials = computed(() => {
  if (!user.value) return 'U'
  const firstName = user.value.first_name || user.value.username || ''
  const lastName = user.value.last_name || ''
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U'
})

// Methods
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const animateStats = () => {
  const duration = 2000 // 2 seconds
  const steps = 60
  const stepDuration = duration / steps
  
  const startValues = { ...animatedStats.value }
  const targetValues = { ...stats.value }
  
  let currentStep = 0
  
  const animate = () => {
    currentStep++
    const progress = currentStep / steps
    const easeProgress = 1 - Math.pow(1 - progress, 3) // Ease out cubic
    
    animatedStats.value = {
      totalPosts: Math.round(startValues.totalPosts + (targetValues.totalPosts - startValues.totalPosts) * easeProgress),
      totalUsers: Math.round(startValues.totalUsers + (targetValues.totalUsers - startValues.totalUsers) * easeProgress),
      totalComments: Math.round(startValues.totalComments + (targetValues.totalComments - startValues.totalComments) * easeProgress),
      totalViews: Math.round(startValues.totalViews + (targetValues.totalViews - startValues.totalViews) * easeProgress)
    }
    
    if (currentStep < steps) {
      setTimeout(animate, stepDuration)
    }
  }
  
  animate()
}

const refreshStats = async () => {
  refreshing.value = true
  
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Update stats with some random variation
    const variation = () => Math.floor(Math.random() * 10) - 5
    stats.value = {
      totalPosts: Math.max(0, 15 + variation()),
      totalUsers: Math.max(0, 8 + variation()),
      totalComments: Math.max(0, 42 + variation()),
      totalViews: Math.max(0, 1250 + variation() * 50)
    }
    
    animateStats()
    
    // Add new activity
    recentActivity.value.unshift({
      id: Date.now(),
      type: 'system',
      icon: 'arrow-path',
      title: 'Estadísticas actualizadas',
      time: 'Ahora mismo'
    })
    
    // Keep only last 5 activities
    if (recentActivity.value.length > 5) {
      recentActivity.value = recentActivity.value.slice(0, 5)
    }
    
  } catch (error) {
    console.error('Error refreshing stats:', error)
  } finally {
    refreshing.value = false
  }
}

const measurePerformance = () => {
  if (typeof window !== 'undefined' && window.performance) {
    loadTime.value = Math.round(window.performance.now())
    
    // Mock memory usage
    if ('memory' in window.performance) {
      const memory = (window.performance as any).memory
      const used = Math.round(memory.usedJSHeapSize / 1048576)
      const total = Math.round(memory.totalJSHeapSize / 1048576)
      memoryUsage.value = `${used}MB / ${total}MB`
    } else {
      memoryUsage.value = 'No disponible'
    }
  }
}

// Load initial data
onMounted(async () => {
  const startTime = Date.now()
  
  try {
    // Simulate loading time
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Load stats
    stats.value = {
      totalPosts: 15,
      totalUsers: 8,
      totalComments: 42,
      totalViews: 1250
    }
    
    // Animate stats on load
    setTimeout(() => {
      animateStats()
    }, 300)
    
    // Measure performance
    measurePerformance()
    
  } catch (error) {
    console.error('Error loading admin dashboard:', error)
  }
})

// SEO
useHead({
  title: 'Panel de Administración - Blog de Noticias',
  meta: [
    { name: 'description', content: 'Panel de administración avanzado para gestionar el blog' }
  ]
})
</script>

<style scoped>
/* Custom animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out;
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Gradient text */
.bg-clip-text {
  -webkit-background-clip: text;
  background-clip: text;
}

/* Custom scrollbar for activity feed */
.activity-scroll::-webkit-scrollbar {
  width: 4px;
}

.activity-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.activity-scroll::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.5);
  border-radius: 2px;
}

.activity-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.7);
}
</style>