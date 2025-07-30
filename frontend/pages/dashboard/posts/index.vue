<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Gestión de Posts
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Administra todos los artículos del blog
        </p>
      </div>
      
      <NuxtLink
        to="/dashboard/posts/create"
        class="btn btn-primary"
      >
        <Icon name="plus" class="w-4 h-4 mr-2" />
        Nuevo Post
      </NuxtLink>
    </div>

    <!-- Filters and Search -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Search -->
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Buscar posts
          </label>
          <div class="relative">
            <Icon name="search" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              v-model="filters.search"
              type="text"
              placeholder="Buscar por título, contenido o autor..."
              class="input pl-10 w-full"
              @input="debouncedSearch"
            />
          </div>
        </div>

        <!-- Status Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Estado
          </label>
          <select
            v-model="filters.status"
            class="input w-full"
            @change="applyFilters"
          >
            <option value="">Todos los estados</option>
            <option value="published">Publicado</option>
            <option value="draft">Borrador</option>
            <option value="archived">Archivado</option>
          </select>
        </div>

        <!-- Category Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Categoría
          </label>
          <select
            v-model="filters.category"
            class="input w-full"
            @change="applyFilters"
          >
            <option value="">Todas las categorías</option>
            <option
              v-for="category in categories"
              :key="category.id"
              :value="category.id"
            >
              {{ category.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Bulk Actions -->
      <div v-if="selectedPosts.length > 0" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-600 dark:text-gray-400">
            {{ selectedPosts.length }} post(s) seleccionado(s)
          </span>
          
          <div class="flex space-x-2">
            <button
              @click="bulkAction('publish')"
              class="btn btn-sm btn-secondary"
            >
              Publicar
            </button>
            <button
              @click="bulkAction('draft')"
              class="btn btn-sm btn-secondary"
            >
              Borrador
            </button>
            <button
              @click="bulkAction('archive')"
              class="btn btn-sm btn-secondary"
            >
              Archivar
            </button>
            <button
              @click="bulkAction('delete')"
              class="btn btn-sm btn-danger"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Posts Table -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th class="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  :checked="allSelected"
                  @change="toggleSelectAll"
                  class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Post
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Autor
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Estado
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Fecha
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="post in posts"
              :key="post.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <td class="px-6 py-4">
                <input
                  type="checkbox"
                  :value="post.id"
                  v-model="selectedPosts"
                  class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center">
                  <img
                    v-if="post.featured_image"
                    :src="post.featured_image"
                    :alt="post.title"
                    class="h-10 w-10 rounded object-cover mr-3"
                  />
                  <div class="h-10 w-10 bg-gray-200 dark:bg-gray-600 rounded mr-3 flex items-center justify-center" v-else>
                    <Icon name="image" class="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <div class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ post.title }}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      {{ post.category?.name }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-gray-900 dark:text-white">
                {{ post.author?.username || 'Sin autor' }}
              </td>
              <td class="px-6 py-4">
                <span
                  class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                  :class="getStatusClass(post.status)"
                >
                  {{ getStatusText(post.status) }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                {{ formatDate(post.created_at) }}
              </td>
              <td class="px-6 py-4 text-sm font-medium space-x-2">
                <NuxtLink
                  :to="`/dashboard/posts/${post.id}/edit`"
                  class="text-primary-600 hover:text-primary-900"
                >
                  Editar
                </NuxtLink>
                <button
                  @click="togglePostStatus(post)"
                  class="text-blue-600 hover:text-blue-900"
                >
                  {{ post.status === 'published' ? 'Despublicar' : 'Publicar' }}
                </button>
                <button
                  @click="deletePost(post)"
                  class="text-red-600 hover:text-red-900"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-700 dark:text-gray-300">
            Mostrando {{ ((currentPage - 1) * pageSize) + 1 }} a {{ Math.min(currentPage * pageSize, totalPosts) }} de {{ totalPosts }} posts
          </div>
          
          <div class="flex space-x-2">
            <button
              @click="changePage(currentPage - 1)"
              :disabled="currentPage <= 1"
              class="btn btn-sm btn-secondary"
              :class="{ 'opacity-50 cursor-not-allowed': currentPage <= 1 }"
            >
              Anterior
            </button>
            
            <span class="flex items-center px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
              Página {{ currentPage }} de {{ totalPages }}
            </span>
            
            <button
              @click="changePage(currentPage + 1)"
              :disabled="currentPage >= totalPages"
              class="btn btn-sm btn-secondary"
              :class="{ 'opacity-50 cursor-not-allowed': currentPage >= totalPages }"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-8">
      <Icon name="loading" class="w-8 h-8 animate-spin text-primary-600" />
    </div>

    <!-- Empty State -->
    <div v-if="!loading && posts.length === 0" class="text-center py-12">
      <Icon name="document" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        No hay posts
      </h3>
      <p class="text-gray-500 dark:text-gray-400 mb-4">
        {{ filters.search || filters.status || filters.category ? 'No se encontraron posts con los filtros aplicados.' : 'Comienza creando tu primer post.' }}
      </p>
      <NuxtLink
        to="/dashboard/posts/create"
        class="btn btn-primary"
      >
        Crear Post
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'dashboard',
  middleware: 'dashboard-auth'
})

// Composables
const { handleSuccess, handleError } = useErrorHandler()

// State
const posts = ref([])
const categories = ref([])
const selectedPosts = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const totalPosts = ref(0)

const filters = reactive({
  search: '',
  status: '',
  category: ''
})

// Computed
const totalPages = computed(() => Math.ceil(totalPosts.value / pageSize.value))
const allSelected = computed(() => posts.value.length > 0 && selectedPosts.value.length === posts.value.length)

// Methods
const fetchPosts = async () => {
  try {
    loading.value = true
    
    const params = {
      page: currentPage.value,
      page_size: pageSize.value,
      ...filters
    }
    
    // Remove empty filters
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key]
      }
    })
    
    const response = await $fetch('/api/v1/dashboard/posts/', {
      params,
      headers: {
        'Authorization': `Bearer ${useDashboardAuth().getAccessToken()}`
      }
    })
    
    posts.value = response.results || response
    totalPosts.value = response.count || posts.value.length
    
  } catch (error) {
    handleError(error, 'fetchPosts')
  } finally {
    loading.value = false
  }
}

const fetchCategories = async () => {
  try {
    const response = await $fetch('/api/v1/categories/')
    categories.value = response
  } catch (error) {
    console.error('Error fetching categories:', error)
  }
}

const applyFilters = () => {
  currentPage.value = 1
  selectedPosts.value = []
  fetchPosts()
}

const debouncedSearch = debounce(() => {
  applyFilters()
}, 500)

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    selectedPosts.value = []
    fetchPosts()
  }
}

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedPosts.value = []
  } else {
    selectedPosts.value = posts.value.map(post => post.id)
  }
}

const bulkAction = async (action) => {
  if (selectedPosts.value.length === 0) return
  
  try {
    const confirmMessage = {
      publish: '¿Publicar los posts seleccionados?',
      draft: '¿Cambiar a borrador los posts seleccionados?',
      archive: '¿Archivar los posts seleccionados?',
      delete: '¿Eliminar permanentemente los posts seleccionados?'
    }
    
    if (!confirm(confirmMessage[action])) return
    
    await $fetch('/api/v1/dashboard/posts/bulk-action/', {
      method: 'POST',
      body: {
        action,
        post_ids: selectedPosts.value
      },
      headers: {
        'Authorization': `Bearer ${useDashboardAuth().getAccessToken()}`
      }
    })
    
    handleSuccess(`Acción "${action}" aplicada a ${selectedPosts.value.length} posts`)
    selectedPosts.value = []
    await fetchPosts()
    
  } catch (error) {
    handleError(error, 'bulkAction')
  }
}

const togglePostStatus = async (post) => {
  try {
    const newStatus = post.status === 'published' ? 'draft' : 'published'
    
    await $fetch(`/api/v1/dashboard/posts/${post.id}/`, {
      method: 'PATCH',
      body: { status: newStatus },
      headers: {
        'Authorization': `Bearer ${useDashboardAuth().getAccessToken()}`
      }
    })
    
    post.status = newStatus
    handleSuccess(`Post ${newStatus === 'published' ? 'publicado' : 'despublicado'} exitosamente`)
    
  } catch (error) {
    handleError(error, 'togglePostStatus')
  }
}

const deletePost = async (post) => {
  if (!confirm(`¿Eliminar el post "${post.title}"?`)) return
  
  try {
    await $fetch(`/api/v1/dashboard/posts/${post.id}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${useDashboardAuth().getAccessToken()}`
      }
    })
    
    handleSuccess('Post eliminado exitosamente')
    await fetchPosts()
    
  } catch (error) {
    handleError(error, 'deletePost')
  }
}

const getStatusClass = (status) => {
  const classes = {
    published: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    archived: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }
  return classes[status] || classes.draft
}

const getStatusText = (status) => {
  const texts = {
    published: 'Publicado',
    draft: 'Borrador',
    archived: 'Archivado'
  }
  return texts[status] || 'Borrador'
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Utility function for debouncing
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
onMounted(async () => {
  await Promise.all([
    fetchPosts(),
    fetchCategories()
  ])
})

// SEO
useHead({
  title: 'Gestión de Posts - Dashboard'
})
</script>