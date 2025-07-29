<template>
  <div>
    <!-- Page header -->
    <div class="sm:flex sm:items-center sm:justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">
          Gestión de Posts
        </h1>
        <p class="mt-1 text-sm text-gray-600">
          Administra todos los artículos de tu blog
        </p>
      </div>
      <div class="mt-4 sm:mt-0">
        <NuxtLink
          to="/dashboard/posts/create"
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon class="h-4 w-4 mr-2" />
          Crear Post
        </NuxtLink>
      </div>
    </div>

    <!-- Filters and search -->
    <div class="bg-white shadow rounded-lg mb-6">
      <div class="p-6">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <!-- Search -->
          <div>
            <label for="search" class="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <input
              id="search"
              v-model="filters.search"
              type="text"
              placeholder="Título o contenido..."
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              @input="debouncedSearch"
            />
          </div>

          <!-- Status filter -->
          <div>
            <label for="status" class="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              id="status"
              v-model="filters.status"
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              @change="fetchPosts"
            >
              <option value="">Todos los estados</option>
              <option value="published">Publicado</option>
              <option value="draft">Borrador</option>
              <option value="archived">Archivado</option>
            </select>
          </div>

          <!-- Category filter -->
          <div>
            <label for="category" class="block text-sm font-medium text-gray-700 mb-1">
              Categoría
            </label>
            <select
              id="category"
              v-model="filters.categoria"
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              @change="fetchPosts"
            >
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

          <!-- Author filter -->
          <div>
            <label for="author" class="block text-sm font-medium text-gray-700 mb-1">
              Autor
            </label>
            <select
              id="author"
              v-model="filters.autor"
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              @change="fetchPosts"
            >
              <option value="">Todos los autores</option>
              <option
                v-for="author in authors"
                :key="author.id"
                :value="author.id"
              >
                {{ author.username }}
              </option>
            </select>
          </div>
        </div>

        <!-- Bulk actions -->
        <div v-if="selectedPosts.length > 0" class="mt-4 flex items-center space-x-4">
          <span class="text-sm text-gray-700">
            {{ selectedPosts.length }} post(s) seleccionado(s)
          </span>
          <select
            v-model="bulkAction"
            class="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">Acciones en lote</option>
            <option value="published">Publicar</option>
            <option value="draft">Marcar como borrador</option>
            <option value="archived">Archivar</option>
            <option value="delete">Eliminar</option>
          </select>
          <button
            :disabled="!bulkAction"
            class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            @click="handleBulkAction"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>

    <!-- Posts table -->
    <div class="bg-white shadow overflow-hidden sm:rounded-md">
      <div v-if="loading" class="p-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-2 text-sm text-gray-500">Cargando posts...</p>
      </div>

      <div v-else-if="error" class="p-8 text-center">
        <ExclamationTriangleIcon class="h-12 w-12 text-red-400 mx-auto" />
        <p class="mt-2 text-sm text-red-600">{{ error }}</p>
        <button
          class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          @click="fetchPosts"
        >
          Reintentar
        </button>
      </div>

      <div v-else-if="posts.length === 0" class="p-8 text-center">
        <DocumentTextIcon class="h-12 w-12 text-gray-400 mx-auto" />
        <h3 class="mt-2 text-sm font-medium text-gray-900">No hay posts</h3>
        <p class="mt-1 text-sm text-gray-500">
          Comienza creando tu primer post.
        </p>
        <div class="mt-6">
          <NuxtLink
            to="/dashboard/posts/create"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon class="h-4 w-4 mr-2" />
            Crear Post
          </NuxtLink>
        </div>
      </div>

      <ul v-else role="list" class="divide-y divide-gray-200">
        <li
          v-for="post in posts"
          :key="post.id"
          class="hover:bg-gray-50"
        >
          <div class="px-4 py-4 flex items-center justify-between">
            <div class="flex items-center">
              <!-- Checkbox -->
              <input
                :id="`post-${post.id}`"
                v-model="selectedPosts"
                :value="post.id"
                type="checkbox"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-4"
              />

              <!-- Post info -->
              <div class="min-w-0 flex-1">
                <div class="flex items-center space-x-3">
                  <h3 class="text-sm font-medium text-gray-900 truncate">
                    {{ post.titulo || post.title }}
                  </h3>
                  
                  <!-- Status badge -->
                  <span
                    :class="[
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      {
                        'bg-green-100 text-green-800': post.status === 'published',
                        'bg-yellow-100 text-yellow-800': post.status === 'draft',
                        'bg-gray-100 text-gray-800': post.status === 'archived'
                      }
                    ]"
                  >
                    {{ getStatusLabel(post.status) }}
                  </span>

                  <!-- Featured badge -->
                  <span
                    v-if="post.featured"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    <StarIcon class="h-3 w-3 mr-1" />
                    Destacado
                  </span>
                </div>

                <div class="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                  <span class="flex items-center">
                    <UserIcon class="h-4 w-4 mr-1" />
                    {{ post.author?.username || post.autor?.username }}
                  </span>
                  <span class="flex items-center">
                    <FolderIcon class="h-4 w-4 mr-1" />
                    {{ post.category?.name || post.categoria?.nombre || 'Sin categoría' }}
                  </span>
                  <span class="flex items-center">
                    <ChatBubbleLeftIcon class="h-4 w-4 mr-1" />
                    {{ post.comments_count || 0 }} comentarios
                  </span>
                  <span class="flex items-center">
                    <CalendarIcon class="h-4 w-4 mr-1" />
                    {{ formatDate(post.fecha_publicacion || post.published_at) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center space-x-2">
              <NuxtLink
                :to="`/dashboard/posts/${post.id}/edit`"
                class="text-blue-600 hover:text-blue-500 text-sm font-medium"
              >
                Editar
              </NuxtLink>
              <button
                class="text-red-600 hover:text-red-500 text-sm font-medium"
                @click="confirmDelete(post)"
              >
                Eliminar
              </button>
              <button
                class="text-gray-600 hover:text-gray-500"
                @click="toggleFeatured(post)"
              >
                <StarIcon
                  :class="[
                    'h-5 w-5',
                    post.featured ? 'text-yellow-400 fill-current' : 'text-gray-400'
                  ]"
                />
              </button>
            </div>
          </div>
        </li>
      </ul>

      <!-- Pagination -->
      <div v-if="totalCount > 0" class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div class="flex-1 flex justify-between sm:hidden">
          <button
            :disabled="currentPage <= 1"
            class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            @click="changePage(currentPage - 1)"
          >
            Anterior
          </button>
          <button
            :disabled="currentPage >= totalPages"
            class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            @click="changePage(currentPage + 1)"
          >
            Siguiente
          </button>
        </div>
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700">
              Mostrando
              <span class="font-medium">{{ (currentPage - 1) * pageSize + 1 }}</span>
              a
              <span class="font-medium">{{ Math.min(currentPage * pageSize, totalCount) }}</span>
              de
              <span class="font-medium">{{ totalCount }}</span>
              resultados
            </p>
          </div>
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                :disabled="currentPage <= 1"
                class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                @click="changePage(currentPage - 1)"
              >
                <ChevronLeftIcon class="h-5 w-5" />
              </button>
              
              <button
                v-for="page in visiblePages"
                :key="page"
                :class="[
                  'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                  page === currentPage
                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                ]"
                @click="changePage(page)"
              >
                {{ page }}
              </button>
              
              <button
                :disabled="currentPage >= totalPages"
                class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                @click="changePage(currentPage + 1)"
              >
                <ChevronRightIcon class="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete confirmation modal -->
    <DashboardModal
      v-if="showDeleteModal"
      title="Confirmar eliminación"
      @close="showDeleteModal = false"
    >
      <p class="text-sm text-gray-500">
        ¿Estás seguro de que quieres eliminar el post "{{ postToDelete?.titulo || postToDelete?.title }}"?
        Esta acción no se puede deshacer.
      </p>
      
      <template #actions>
        <button
          type="button"
          class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
          @click="deletePost"
        >
          Eliminar
        </button>
        <button
          type="button"
          class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          @click="showDeleteModal = false"
        >
          Cancelar
        </button>
      </template>
    </DashboardModal>
  </div>
</template>

<script setup lang="ts">
import {
  PlusIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  UserIcon,
  FolderIcon,
  ChatBubbleLeftIcon,
  CalendarIcon,
  StarIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/vue/24/outline'
import { debounce } from 'lodash-es'

// Layout
definePageMeta({
  layout: 'dashboard'
})

// Composables
const { fetchPosts, deletePost: deletePostApi, toggleFeatured: toggleFeaturedApi, bulkUpdateStatus } = useDashboardPosts()
const { success, error: showError } = useToast()

// State
const posts = ref([])
const categories = ref([])
const authors = ref([])
const loading = ref(false)
const error = ref<string | null>(null)
const selectedPosts = ref([])
const bulkAction = ref('')
const showDeleteModal = ref(false)
const postToDelete = ref(null)

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)
const totalCount = ref(0)

// Filters
const filters = reactive({
  search: '',
  status: '',
  categoria: '',
  autor: ''
})

// Computed
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value))

const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, currentPage.value + 2)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

// Methods
const loadPosts = async () => {
  loading.value = true
  error.value = null
  
  try {
    const params = {
      page: currentPage.value,
      page_size: pageSize.value,
      ...filters
    }
    
    const response = await fetchPosts(params)
    if (response) {
      posts.value = response.results || []
      totalCount.value = response.count || 0
    }
  } catch (err: any) {
    error.value = err.message || 'Error al cargar posts'
    showError('Error', 'No se pudieron cargar los posts')
  } finally {
    loading.value = false
  }
}

const debouncedSearch = debounce(() => {
  currentPage.value = 1
  loadPosts()
}, 500)

const changePage = (page: number) => {
  currentPage.value = page
  loadPosts()
}

const getStatusLabel = (status: string) => {
  const labels = {
    published: 'Publicado',
    draft: 'Borrador',
    archived: 'Archivado'
  }
  return labels[status] || status
}

const formatDate = (dateString: string) => {
  if (!dateString) return 'Sin fecha'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const confirmDelete = (post: any) => {
  postToDelete.value = post
  showDeleteModal.value = true
}

const deletePost = async () => {
  if (!postToDelete.value) return
  
  try {
    await deletePostApi(postToDelete.value.id)
    success('Post eliminado', 'El post ha sido eliminado exitosamente')
    showDeleteModal.value = false
    postToDelete.value = null
    await loadPosts()
  } catch (err: any) {
    showError('Error', 'No se pudo eliminar el post')
  }
}

const toggleFeatured = async (post: any) => {
  try {
    const newFeaturedStatus = await toggleFeaturedApi(post.id)
    post.featured = newFeaturedStatus
    success(
      post.featured ? 'Post destacado' : 'Post no destacado',
      `El post ha sido ${post.featured ? 'marcado como destacado' : 'removido de destacados'}`
    )
  } catch (err: any) {
    showError('Error', 'No se pudo actualizar el estado destacado')
  }
}

const handleBulkAction = async () => {
  if (!bulkAction.value || selectedPosts.value.length === 0) return
  
  try {
    if (bulkAction.value === 'delete') {
      // Handle bulk delete
      for (const postId of selectedPosts.value) {
        await deletePostApi(postId)
      }
      success('Posts eliminados', `${selectedPosts.value.length} posts eliminados exitosamente`)
    } else {
      // Handle bulk status update
      await bulkUpdateStatus(selectedPosts.value, bulkAction.value)
      success('Posts actualizados', `${selectedPosts.value.length} posts actualizados exitosamente`)
    }
    
    selectedPosts.value = []
    bulkAction.value = ''
    await loadPosts()
  } catch (err: any) {
    showError('Error', 'No se pudo completar la acción en lote')
  }
}

// Load data on mount
onMounted(async () => {
  await loadPosts()
  
  // Load categories and authors for filters
  try {
    const [categoriesResponse, authorsResponse] = await Promise.all([
      $fetch('/api/v1/categories/'),
      $fetch('/api/v1/dashboard/api/users/')
    ])
    
    categories.value = categoriesResponse || []
    authors.value = authorsResponse?.results || []
  } catch (err) {
    console.error('Error loading filters data:', err)
  }
})

// Watch filters
watch(filters, () => {
  currentPage.value = 1
  loadPosts()
}, { deep: true })

// SEO
useHead({
  title: 'Posts - Dashboard'
})
</script>