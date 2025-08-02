<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="container mx-auto px-4 py-8">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            Estadísticas del Blog
          </h1>
          <p class="text-gray-600 dark:text-gray-400 mt-2">
            Resumen de la actividad y métricas del blog
          </p>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <Icon name="document-text" class="w-8 h-8 text-blue-600" />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Posts
                </p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ stats.totalPosts }}
                </p>
              </div>
            </div>
            <div class="mt-4">
              <div class="flex items-center text-sm">
                <span class="text-green-600 font-medium">+{{ stats.postsThisMonth }}</span>
                <span class="text-gray-600 dark:text-gray-400 ml-1">este mes</span>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <Icon name="users" class="w-8 h-8 text-green-600" />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Usuarios
                </p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ stats.totalUsers }}
                </p>
              </div>
            </div>
            <div class="mt-4">
              <div class="flex items-center text-sm">
                <span class="text-green-600 font-medium">+{{ stats.usersThisMonth }}</span>
                <span class="text-gray-600 dark:text-gray-400 ml-1">este mes</span>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <Icon name="chat" class="w-8 h-8 text-purple-600" />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Comentarios
                </p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ stats.totalComments }}
                </p>
              </div>
            </div>
            <div class="mt-4">
              <div class="flex items-center text-sm">
                <span class="text-green-600 font-medium">+{{ stats.commentsThisMonth }}</span>
                <span class="text-gray-600 dark:text-gray-400 ml-1">este mes</span>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <Icon name="eye" class="w-8 h-8 text-orange-600" />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Visitas Totales
                </p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ stats.totalViews.toLocaleString() }}
                </p>
              </div>
            </div>
            <div class="mt-4">
              <div class="flex items-center text-sm">
                <span class="text-green-600 font-medium">+{{ stats.viewsThisMonth.toLocaleString() }}</span>
                <span class="text-gray-600 dark:text-gray-400 ml-1">este mes</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Popular Posts -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Posts Más Populares
            </h3>
            <div class="space-y-4">
              <div v-for="post in popularPosts" :key="post.id" class="flex items-center justify-between">
                <div class="flex-1">
                  <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ post.title }}
                  </h4>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ post.category }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ post.views.toLocaleString() }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    visitas
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Comments -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Comentarios Recientes
            </h3>
            <div class="space-y-4">
              <div v-for="comment in recentComments" :key="comment.id" class="border-l-4 border-primary-500 pl-4">
                <div class="flex items-center justify-between mb-1">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ comment.author }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ formatDate(comment.created_at) }}
                  </p>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {{ comment.content }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  en "{{ comment.post_title }}"
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Acciones Rápidas
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <NuxtLink
              to="/admin/posts/create"
              class="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Icon name="plus" class="w-6 h-6 text-green-600 mr-3" />
              <div>
                <p class="font-medium text-gray-900 dark:text-white">Crear Post</p>
                <p class="text-sm text-gray-600 dark:text-gray-400">Escribir un nuevo artículo</p>
              </div>
            </NuxtLink>

            <NuxtLink
              to="/admin/comments"
              class="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Icon name="chat" class="w-6 h-6 text-purple-600 mr-3" />
              <div>
                <p class="font-medium text-gray-900 dark:text-white">Moderar Comentarios</p>
                <p class="text-sm text-gray-600 dark:text-gray-400">Revisar comentarios pendientes</p>
              </div>
            </NuxtLink>

            <NuxtLink
              to="/admin/users"
              class="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Icon name="users" class="w-6 h-6 text-blue-600 mr-3" />
              <div>
                <p class="font-medium text-gray-900 dark:text-white">Gestionar Usuarios</p>
                <p class="text-sm text-gray-600 dark:text-gray-400">Administrar cuentas de usuario</p>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Page meta
definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

// Composables
const { user } = useAuth()

// Check if user is staff
if (!user.value?.is_staff) {
  throw createError({
    statusCode: 403,
    statusMessage: 'Acceso denegado'
  })
}

// Mock data
const stats = ref({
  totalPosts: 24,
  postsThisMonth: 5,
  totalUsers: 156,
  usersThisMonth: 12,
  totalComments: 89,
  commentsThisMonth: 23,
  totalViews: 12450,
  viewsThisMonth: 2340
})

const popularPosts = ref([
  {
    id: 1,
    title: 'Introducción a Vue.js 3',
    category: 'Tecnología',
    views: 1250
  },
  {
    id: 2,
    title: 'Guía de Tailwind CSS',
    category: 'Tecnología',
    views: 980
  },
  {
    id: 3,
    title: 'Mejores Prácticas de JavaScript',
    category: 'Tecnología',
    views: 756
  },
  {
    id: 4,
    title: 'Diseño Responsive Moderno',
    category: 'Diseño',
    views: 623
  }
])

const recentComments = ref([
  {
    id: 1,
    author: 'Juan Pérez',
    content: 'Excelente artículo, muy útil para principiantes.',
    post_title: 'Introducción a Vue.js 3',
    created_at: '2025-02-02T10:30:00Z'
  },
  {
    id: 2,
    author: 'María García',
    content: '¿Podrías agregar más ejemplos prácticos?',
    post_title: 'Guía de Tailwind CSS',
    created_at: '2025-02-02T09:15:00Z'
  },
  {
    id: 3,
    author: 'Carlos López',
    content: 'Muy bien explicado, gracias por compartir.',
    post_title: 'Mejores Prácticas de JavaScript',
    created_at: '2025-02-01T16:45:00Z'
  }
])

// Methods
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// SEO
useHead({
  title: 'Estadísticas - Admin',
  meta: [
    { name: 'description', content: 'Estadísticas y métricas del blog' }
  ]
})
</script>