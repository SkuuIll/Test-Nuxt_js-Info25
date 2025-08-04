<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Gestionar Posts
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
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
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div class="flex flex-wrap gap-4">
        <div class="flex-1 min-w-64">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar posts..."
            class="input w-full"
            @input="debouncedSearch"
          />
        </div>
        
        <select v-model="statusFilter" class="input">
          <option value="">Todos los estados</option>
          <option value="published">Publicados</option>
          <option value="draft">Borradores</option>
          <option value="archived">Archivados</option>
        </select>
        
        <select v-model="categoryFilter" class="input">
          <option value="">Todas las categorías</option>
          <option
            v-for="category in categories"
            :key="category.id"
            :value="category.id"
          >
            {{ category.name || category.nombre }}
          </option>
        </select>
      </div>
    </div>

    <!-- Posts List -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div v-if="loading" class="p-8 text-center">
        <Icon name="loading" class="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
        <p class="text-gray-600 dark:text-gray-400">Cargando posts...</p>
      </div>
      
      <div v-else-if="posts.length === 0" class="p-8 text-center">
        <Icon name="document-text" class="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No hay posts
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          {{ searchQuery || statusFilter || categoryFilter ? 'No se encontraron posts con los filtros aplicados.' : 'Aún no has creado ningún post.' }}
        </p>
        <NuxtLink
          v-if="!searchQuery && !statusFilter && !categoryFilter"
          to="/admin/posts/create"
          class="btn btn-primary"
        >
          Crear tu primer post
        </NuxtLink>
      </div>
      
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Título
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Estado
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Categoría
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Fecha
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="post in posts"
              :key="post.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <td class="px-6 py-4">
                <div class="flex items-center">
                  <div>
                    <div class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ post.titulo || post.title }}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      {{ post.excerpt || (post.contenido || post.content)?.substring(0, 100) + '...' }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="{
                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': post.status === 'published',
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200': post.status === 'draft',
                    'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200': post.status === 'archived'
                  }"
                  class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                >
                  {{ getStatusLabel(post.status) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ post.categoria_nombre || post.category_name || 'Sin categoría' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {{ formatDate(post.fecha_creacion || post.created_at) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex items-center justify-end space-x-2">
                  <NuxtLink
                    :to="`/posts/${post.slug}`"
                    target="_blank"
                    class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Ver post"
                  >
                    <Icon name="eye" class="w-4 h-4" />
                  </NuxtLink>
                  
                  <button
                    @click="editPost(post)"
                    class="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                    title="Editar"
                  >
                    <Icon name="pencil" class="w-4 h-4" />
                  </button>
                  
                  <button
                    @click="togglePostStatus(post)"
                    :class="{
                      'text-green-600 hover:text-green-900': post.status !== 'published',
                      'text-yellow-600 hover:text-yellow-900': post.status === 'published'
                    }"
                    :title="post.status === 'published' ? 'Despublicar' : 'Publicar'"
                  >
                    <Icon :name="post.status === 'published' ? 'eye-slash' : 'eye'" class="w-4 h-4" />
                  </button>
                  
                  <button
                    @click="deletePost(post)"
                    class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    title="Eliminar"
                  >
                    <Icon name="trash" class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex justify-center">
      <nav class="flex space-x-2">
        <button
          v-for="page in totalPages"
          :key="page"
          @click="currentPage = page"
          :class="{
            'bg-primary-600 text-white': page === currentPage,
            'bg-white text-gray-700 hover:bg-gray-50': page !== currentPage
          }"
          class="px-3 py-2 text-sm font-medium rounded-md border border-gray-300"
        >
          {{ page }}
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: 'admin-check'
})

// Composables
const { handleSuccess, handleError } = useErrorHandler()

// State
const loading = ref(false)
const posts = ref([])
const categories = ref([])
const searchQuery = ref('')
const statusFilter = ref('')
const categoryFilter = ref('')
const currentPage = ref(1)
const totalPages = ref(1)

// Methods
const getStatusLabel = (status: string) => {
  const labels = {
    published: 'Publicado',
    draft: 'Borrador',
    archived: 'Archivado'
  }
  return labels[status] || status
}

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const fetchPosts = async () => {
  try {
    loading.value = true
    
    const { token } = useAuth()
    if (!token.value) {
      handleError('No se encontró token de autenticación', 'fetchPosts')
      return
    }

    const params = new URLSearchParams()
    if (searchQuery.value) params.append('search', searchQuery.value)
    if (statusFilter.value) params.append('status', statusFilter.value)
    if (categoryFilter.value) params.append('categoria', categoryFilter.value)
    params.append('page', currentPage.value.toString())

    const response = await $fetch(`/api/v1/dashboard/api/posts/?${params}`, {
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })

    posts.value = response.results || response
    totalPages.value = Math.ceil((response.count || posts.value.length) / 10)

  } catch (error) {
    console.error('Error fetching posts:', error)
    handleError('Error al cargar los posts', 'fetchPosts')
  } finally {
    loading.value = false
  }
}

const fetchCategories = async () => {
  try {
    const { token } = useAuth()
    if (!token.value) return

    const response = await $fetch('/api/v1/dashboard/api/categories/', {
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })
    
    categories.value = response.results || response
  } catch (error) {
    console.error('Error fetching categories:', error)
  }
}

const editPost = (post: any) => {
  // Navigate to edit page (to be implemented)
  navigateTo(`/admin/posts/${post.id}/edit`)
}

const togglePostStatus = async (post: any) => {
  try {
    const newStatus = post.status === 'published' ? 'draft' : 'published'
    
    const { token } = useAuth()
    if (!token.value) {
      handleError('No se encontró token de autenticación', 'togglePostStatus')
      return
    }

    await $fetch(`/api/v1/dashboard/api/posts/${post.id}/`, {
      method: 'PATCH',
      body: { status: newStatus },
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })

    post.status = newStatus
    handleSuccess(`Post ${newStatus === 'published' ? 'publicado' : 'despublicado'} exitosamente`)

  } catch (error) {
    handleError('Error al cambiar el estado del post', 'togglePostStatus')
  }
}

const deletePost = async (post: any) => {
  if (!confirm(`¿Estás seguro de que quieres eliminar "${post.titulo || post.title}"?`)) {
    return
  }

  try {
    const { token } = useAuth()
    if (!token.value) {
      handleError('No se encontró token de autenticación', 'deletePost')
      return
    }

    await $fetch(`/api/v1/dashboard/api/posts/${post.id}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })

    posts.value = posts.value.filter(p => p.id !== post.id)
    handleSuccess('Post eliminado exitosamente')

  } catch (error) {
    handleError('Error al eliminar el post', 'deletePost')
  }
}

// Debounced search
const debouncedSearch = useDebounceFn(() => {
  currentPage.value = 1
  fetchPosts()
}, 500)

// Watchers
watch([statusFilter, categoryFilter, currentPage], () => {
  fetchPosts()
})

// Initialize
onMounted(() => {
  fetchPosts()
  fetchCategories()
})

// SEO
useHead({
  title: 'Gestionar Posts - Administración',
  meta: [
    { name: 'description', content: 'Administrar posts del blog' }
  ]
})
</script>