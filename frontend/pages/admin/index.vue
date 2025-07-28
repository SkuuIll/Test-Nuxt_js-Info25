<template>
  <div class="container mx-auto px-4 py-8">
    <Breadcrumbs :items="[{ name: 'Administración' }]" />

    <div class="max-w-6xl mx-auto">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Panel de Administración</h1>
        <div class="flex items-center space-x-4">
          <span class="text-sm text-gray-600 dark:text-gray-400">
            Bienvenido, {{ user?.first_name || user?.username }}
          </span>
          <NuxtLink to="/profile" class="btn btn-secondary"> Mi Perfil </NuxtLink>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div
          class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <Icon name="newspaper" class="w-8 h-8 text-blue-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Posts</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ stats.totalPosts }}
              </p>
            </div>
          </div>
        </div>

        <div
          class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <Icon name="folder" class="w-8 h-8 text-green-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Categorías</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ stats.totalCategories }}
              </p>
            </div>
          </div>
        </div>

        <div
          class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <Icon name="users" class="w-8 h-8 text-purple-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Usuarios</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ stats.totalUsers }}
              </p>
            </div>
          </div>
        </div>

        <div
          class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <Icon name="message-circle" class="w-8 h-8 text-orange-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Comentarios</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ stats.totalComments }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div
          class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Acciones Rápidas</h2>
          <div class="space-y-3">
            <a
              href="http://127.0.0.1:8000/admin/"
              target="_blank"
              class="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Icon name="plus" class="w-5 h-5 text-blue-600 mr-3" />
              <div>
                <p class="font-medium text-gray-900 dark:text-white">Crear Nuevo Post</p>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Agregar un nuevo artículo al blog
                </p>
              </div>
            </a>

            <a
              href="http://127.0.0.1:8000/admin/"
              target="_blank"
              class="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Icon name="folder-plus" class="w-5 h-5 text-green-600 mr-3" />
              <div>
                <p class="font-medium text-gray-900 dark:text-white">Gestionar Categorías</p>
                <p class="text-sm text-gray-600 dark:text-gray-400">Crear y editar categorías</p>
              </div>
            </a>

            <a
              href="http://127.0.0.1:8000/admin/"
              target="_blank"
              class="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Icon name="users" class="w-5 h-5 text-purple-600 mr-3" />
              <div>
                <p class="font-medium text-gray-900 dark:text-white">Gestionar Usuarios</p>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Administrar cuentas de usuario
                </p>
              </div>
            </a>

            <a
              href="http://127.0.0.1:8000/admin/"
              target="_blank"
              class="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Icon name="message-circle" class="w-5 h-5 text-orange-600 mr-3" />
              <div>
                <p class="font-medium text-gray-900 dark:text-white">Moderar Comentarios</p>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Revisar y aprobar comentarios
                </p>
              </div>
            </a>
          </div>
        </div>

        <!-- Recent Activity -->
        <div
          class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Actividad Reciente
          </h2>
          <div class="space-y-4">
            <div v-if="recentPosts.length === 0" class="text-center py-8">
              <Icon name="newspaper" class="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p class="text-gray-600 dark:text-gray-400">No hay posts recientes</p>
            </div>

            <div
              v-for="post in recentPosts.slice(0, 5)"
              :key="post.id"
              class="flex items-start space-x-3"
            >
              <div class="flex-shrink-0">
                <Icon name="file-text" class="w-5 h-5 text-gray-400 mt-0.5" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {{ post.title }}
                </p>
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  {{ formatDate(post.created_at) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Django Admin Link -->
      <div
        class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800"
      >
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-blue-900 dark:text-blue-100">
              Panel de Administración Completo
            </h3>
            <p class="text-blue-700 dark:text-blue-300 mt-1">
              Accede al panel de administración completo de Django para gestión avanzada
            </p>
          </div>
          <a href="http://127.0.0.1:8000/admin/" target="_blank" class="btn btn-primary">
            <Icon name="external-link" class="w-4 h-4 mr-2" />
            Abrir Django Admin
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'admin',
})

const { user } = useAuth()
const blogStore = useBlogStore()

// Reactive data
const stats = reactive({
  totalPosts: 0,
  totalCategories: 0,
  totalUsers: 0,
  totalComments: 0,
})

const recentPosts = computed(() => blogStore.posts.slice(0, 5))

// Methods
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const loadStats = async () => {
  try {
    // Load basic stats from existing data
    await blogStore.fetchPosts()
    await blogStore.fetchCategories()

    stats.totalPosts = blogStore.pagination.total || blogStore.posts.length
    stats.totalCategories = blogStore.categories.length
    stats.totalUsers = 1 // Placeholder
    stats.totalComments = 0 // Placeholder
  } catch (error) {
    console.error('Error loading stats:', error)
  }
}

// Initialize data
onMounted(async () => {
  await loadStats()
})

// SEO
useHead({
  title: 'Panel de Administración - Blog de Noticias',
  meta: [
    { name: 'description', content: 'Panel de administración para gestionar el blog de noticias.' },
    { name: 'robots', content: 'noindex, nofollow' },
  ],
})
</script>