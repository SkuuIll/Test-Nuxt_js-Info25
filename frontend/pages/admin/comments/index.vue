<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Moderar Comentarios
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Gestiona los comentarios del blog
        </p>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div class="flex flex-wrap gap-4">
        <select v-model="statusFilter" class="input">
          <option value="">Todos los comentarios</option>
          <option value="pending">Pendientes</option>
          <option value="approved">Aprobados</option>
          <option value="rejected">Rechazados</option>
        </select>
        
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar comentarios..."
          class="input flex-1 min-w-64"
          @input="debouncedSearch"
        />
      </div>
    </div>

    <!-- Comments List -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div v-if="loading" class="p-8 text-center">
        <Icon name="loading" class="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
        <p class="text-gray-600 dark:text-gray-400">Cargando comentarios...</p>
      </div>
      
      <div v-else-if="comments.length === 0" class="p-8 text-center">
        <Icon name="chat-bubble-left-right" class="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No hay comentarios
        </h3>
        <p class="text-gray-600 dark:text-gray-400">
          {{ searchQuery || statusFilter ? 'No se encontraron comentarios con los filtros aplicados.' : 'Aún no hay comentarios para moderar.' }}
        </p>
      </div>
      
      <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
        <div
          v-for="comment in comments"
          :key="comment.id"
          class="p-6 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <!-- Comment Header -->
              <div class="flex items-center space-x-2 mb-2">
                <div class="flex items-center space-x-2">
                  <div class="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {{ getInitials(comment.autor_nombre || comment.author_name || 'Anónimo') }}
                    </span>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ comment.autor_nombre || comment.author_name || 'Anónimo' }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      {{ comment.email || 'Sin email' }}
                    </p>
                  </div>
                </div>
                
                <span
                  :class="{
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200': comment.status === 'pending',
                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': comment.status === 'approved',
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': comment.status === 'rejected'
                  }"
                  class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                >
                  {{ getStatusLabel(comment.status) }}
                </span>
              </div>

              <!-- Comment Content -->
              <div class="mb-3">
                <p class="text-sm text-gray-900 dark:text-white">
                  {{ comment.contenido || comment.content }}
                </p>
              </div>

              <!-- Comment Meta -->
              <div class="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                <span>
                  Post: {{ comment.post_titulo || comment.post_title || 'Desconocido' }}
                </span>
                <span>
                  {{ formatDate(comment.fecha_creacion || comment.created_at) }}
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center space-x-2 ml-4">
              <button
                v-if="comment.status !== 'approved'"
                @click="moderateComment(comment, 'approved')"
                class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                title="Aprobar"
              >
                <Icon name="check" class="w-4 h-4" />
              </button>
              
              <button
                v-if="comment.status !== 'rejected'"
                @click="moderateComment(comment, 'rejected')"
                class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                title="Rechazar"
              >
                <Icon name="x" class="w-4 h-4" />
              </button>
              
              <button
                @click="deleteComment(comment)"
                class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                title="Eliminar"
              >
                <Icon name="trash" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
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
const comments = ref([])
const searchQuery = ref('')
const statusFilter = ref('pending') // Default to pending comments
const currentPage = ref(1)
const totalPages = ref(1)

// Methods
const getStatusLabel = (status: string) => {
  const labels = {
    pending: 'Pendiente',
    approved: 'Aprobado',
    rejected: 'Rechazado'
  }
  return labels[status] || status
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const fetchComments = async () => {
  try {
    loading.value = true
    
    const { token } = useAuth()
    if (!token.value) {
      handleError('No se encontró token de autenticación', 'fetchComments')
      return
    }

    const params = new URLSearchParams()
    if (searchQuery.value) params.append('search', searchQuery.value)
    if (statusFilter.value) params.append('status', statusFilter.value)
    params.append('page', currentPage.value.toString())

    const response = await $fetch(`/api/v1/dashboard/api/comments/?${params}`, {
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })

    comments.value = response.results || response
    totalPages.value = Math.ceil((response.count || comments.value.length) / 10)

  } catch (error) {
    console.error('Error fetching comments:', error)
    handleError('Error al cargar los comentarios', 'fetchComments')
  } finally {
    loading.value = false
  }
}

const moderateComment = async (comment: any, status: string) => {
  try {
    const { token } = useAuth()
    if (!token.value) {
      handleError('No se encontró token de autenticación', 'moderateComment')
      return
    }

    await $fetch(`/api/v1/dashboard/api/comments/${comment.id}/`, {
      method: 'PATCH',
      body: { status },
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })

    comment.status = status
    handleSuccess(`Comentario ${status === 'approved' ? 'aprobado' : 'rechazado'} exitosamente`)

  } catch (error) {
    handleError('Error al moderar el comentario', 'moderateComment')
  }
}

const deleteComment = async (comment: any) => {
  if (!confirm('¿Estás seguro de que quieres eliminar este comentario?')) {
    return
  }

  try {
    const { token } = useAuth()
    if (!token.value) {
      handleError('No se encontró token de autenticación', 'deleteComment')
      return
    }

    await $fetch(`/api/v1/dashboard/api/comments/${comment.id}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })

    comments.value = comments.value.filter(c => c.id !== comment.id)
    handleSuccess('Comentario eliminado exitosamente')

  } catch (error) {
    handleError('Error al eliminar el comentario', 'deleteComment')
  }
}

// Debounced search
const debouncedSearch = useDebounceFn(() => {
  currentPage.value = 1
  fetchComments()
}, 500)

// Watchers
watch([statusFilter, currentPage], () => {
  fetchComments()
})

// Initialize
onMounted(() => {
  fetchComments()
})

// SEO
useHead({
  title: 'Moderar Comentarios - Administración',
  meta: [
    { name: 'description', content: 'Moderar comentarios del blog' }
  ]
})
</script>