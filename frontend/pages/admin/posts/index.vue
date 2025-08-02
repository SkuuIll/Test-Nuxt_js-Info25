<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="container mx-auto px-4 py-8">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="flex items-center justify-between mb-8">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              Gestionar Posts
            </h1>
            <p class="text-gray-600 dark:text-gray-400 mt-2">
              Administra todos los posts del blog
            </p>
          </div>
          
          <NuxtLink
            to="/admin/posts/create"
            class="btn btn-primary"
          >
            <Icon name="plus" class="w-4 h-4 mr-2" />
            Crear Post
          </NuxtLink>
        </div>

        <!-- Filters -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Buscar
              </label>
              <input
                v-model="filters.search"
                type="text"
                class="input w-full"
                placeholder="Buscar posts..."
                @input="debouncedSearch"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estado
              </label>
              <select
                v-model="filters.status"
                class="input w-full"
                @change="loadPosts"
              >
                <option value="">Todos</option>
                <option value="published">Publicados</option>
                <option value="draft">Borradores</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Categoría
              </label>
              <select
                v-model="filters.category"
                class="input w-full"
                @change="loadPosts"
              >
                <option value="">Todas</option>
                <option v-for="category in categories" :key="category.id" :value="category.id">
                  {{ category.name }}
                </option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ordenar por
              </label>
              <select
                v-model="filters.ordering"
                class="input w-full"
                @change="loadPosts"
              >
                <option value="-created_at">Más recientes</option>
                <option value="created_at">Más antiguos</option>
                <option value="title">Título A-Z</option>
                <option value="-title">Título Z-A</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Posts Table -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <!-- Loading State -->
          <div v-if="loading" class="p-8 text-center">
            <Icon name="loading" class="w-8 h-8 animate-spin mx-auto mb-4 text-primary-600" />
            <p class="text-gray-600 dark:text-gray-400">Cargando posts...</p>
          </div>

          <!-- Posts List -->
          <div v-else-if="posts.length > 0">
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Post
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Estado
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                  <tr v-for="post in posts" :key="post.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td class="px-6 py-4">
                      <div class="flex items-center">
                        <div class="flex-shrink-0 h-12 w-12">
                          <img
                            v-if="post.image"
                            :src="post.image"
                            :alt="post.title"
                            class="h-12 w-12 rounded-lg object-cover"
                          />
                          <div
                            v-else
                            class="h-12 w-12 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center"
                          >
                            <Icon name="document-text" class="w-6 h-6 text-gray-400" />
                          </div>
                        </div>
                        <div class="ml-4">
                          <div class="text-sm font-medium text-gray-900 dark:text-white">
                            {{ post.title }}
                          </div>
                          <div class="text-sm text-gray-500 dark:text-gray-400">
                            {{ post.excerpt || 'Sin extracto' }}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {{ post.category?.name || 'Sin categoría' }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span
                        :class="[
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          post.status === 'published'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        ]"
                      >
                        {{ post.status === 'published' ? 'Publicado' : 'Borrador' }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {{ formatDate(post.created_at) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div class="flex items-center space-x-2">
                        <NuxtLink
                          :to="`/posts/${post.slug}`"
                          class="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                          title="Ver post"
                        >
                          <Icon name="eye" class="w-4 h-4" />
                        </NuxtLink>
                        <button
                          @click="editPost(post)"
                          class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Editar post"
                        >
                          <Icon name="pencil" class="w-4 h-4" />
                        </button>
                        <button
                          @click="deletePost(post)"
                          class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Eliminar post"
                        >
                          <Icon name="trash" class="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
            <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div class="flex items-center justify-between">
                <div class="text-sm text-gray-700 dark:text-gray-300">
                  Mostrando {{ posts.length }} de {{ totalPosts }} posts
                </div>
                <div class="flex space-x-2">
                  <button
                    @click="previousPage"
                    :disabled="!hasPrevious"
                    class="btn btn-secondary btn-sm"
                    :class="{ 'opacity-50 cursor-not-allowed': !hasPrevious }"
                  >
                    Anterior
                  </button>
                  <button
                    @click="nextPage"
                    :disabled="!hasNext"
                    class="btn btn-secondary btn-sm"
                    :class="{ 'opacity-50 cursor-not-allowed': !hasNext }"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="p-8 text-center">
            <Icon name="document-text" class="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No hay posts
            </h3>
            <p class="text-gray-600 dark:text-gray-400 mb-4">
              {{ filters.search ? 'No se encontraron posts con esos criterios' : 'Aún no has creado ningún post' }}
            </p>
            <NuxtLink
              to="/admin/posts/create"
              class="btn btn-primary"
            >
              <Icon name="plus" class="w-4 h-4 mr-2" />
              Crear Primer Post
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
const { $toast } = useNuxtApp()

// Check if user is staff
if (!user.value?.is_staff) {
  throw createError({
    statusCode: 403,
    statusMessage: 'Acceso denegado'
  })
}

// State
const loading = ref(false)
const posts = ref([])
const categories = ref([])
const totalPosts = ref(0)
const currentPage = ref(1)
const hasNext = ref(false)
const hasPrevious = ref(false)

// Filters
const filters = reactive({
  search: '',
  status: '',
  category: '',
  ordering: '-created_at'
})

// Methods
const loadPosts = async () => {
  loading.value = true
  
  try {
    // Simulate API call - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Mock data
    posts.value = [
      {
        id: 1,
        title: 'Introducción a Vue.js 3',
        slug: 'introduccion-vue-js-3',
        excerpt: 'Aprende los conceptos básicos de Vue.js 3 y sus nuevas características',
        content: 'Contenido del post...',
        image: '/images/post-placeholder.svg',
        status: 'published',
        category: { id: 1, name: 'Tecnología' },
        author: { username: 'admin' },
        created_at: '2025-01-15T10:00:00Z',
        comments_count: 5
      },
      {
        id: 2,
        title: 'Guía de Tailwind CSS',
        slug: 'guia-tailwind-css',
        excerpt: 'Todo lo que necesitas saber sobre Tailwind CSS',
        content: 'Contenido del post...',
        image: null,
        status: 'draft',
        category: { id: 1, name: 'Tecnología' },
        author: { username: 'admin' },
        created_at: '2025-01-14T15:30:00Z',
        comments_count: 0
      }
    ]
    
    totalPosts.value = posts.value.length
    hasNext.value = false
    hasPrevious.value = false
    
  } catch (error) {
    console.error('Error loading posts:', error)
    $toast.error('Error al cargar los posts')
  } finally {
    loading.value = false
  }
}

const loadCategories = async () => {
  try {
    categories.value = [
      { id: 1, name: 'Tecnología' },
      { id: 2, name: 'Deportes' },
      { id: 3, name: 'Entretenimiento' },
      { id: 4, name: 'Opinión' }
    ]
  } catch (error) {
    console.error('Error loading categories:', error)
  }
}

const debouncedSearch = debounce(() => {
  loadPosts()
}, 300)

const editPost = (post) => {
  // Navigate to edit page or open modal
  navigateTo(`/admin/posts/${post.id}/edit`)
}

const deletePost = async (post) => {
  if (!confirm(`¿Estás seguro de que quieres eliminar "${post.title}"?`)) {
    return
  }
  
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    
    posts.value = posts.value.filter(p => p.id !== post.id)
    totalPosts.value--
    
    $toast.success('Post eliminado exitosamente')
  } catch (error) {
    console.error('Error deleting post:', error)
    $toast.error('Error al eliminar el post')
  }
}

const nextPage = () => {
  if (hasNext.value) {
    currentPage.value++
    loadPosts()
  }
}

const previousPage = () => {
  if (hasPrevious.value) {
    currentPage.value--
    loadPosts()
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Debounce utility
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Initialize
onMounted(() => {
  loadCategories()
  loadPosts()
})

// SEO
useHead({
  title: 'Gestionar Posts - Admin',
  meta: [
    { name: 'description', content: 'Administra todos los posts del blog' }
  ]
})
</script>