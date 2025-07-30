<template>
  <div>
    <!-- Page header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">
        Gestión de Comentarios
      </h1>
      <p class="mt-1 text-sm text-gray-600">
        Modera y administra todos los comentarios del blog
      </p>
    </div>

    <!-- Stats cards -->
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      <DashboardStatCard
        title="Total Comentarios"
        :value="totalCount"
        icon="ChatBubbleLeftRightIcon"
        color="blue"
      />
      <DashboardStatCard
        title="Aprobados"
        :value="approvedCommentsCount"
        icon="CheckCircleIcon"
        color="green"
      />
      <DashboardStatCard
        title="Pendientes"
        :value="pendingCommentsCount"
        icon="ClockIcon"
        color="yellow"
        :link="pendingCommentsCount > 0 ? '/dashboard/comments?filter=pending' : undefined"
      />
      <DashboardStatCard
        title="Rechazados"
        :value="rejectedCommentsCount"
        icon="XCircleIcon"
        color="red"
      />
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
              placeholder="Contenido, autor o post..."
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
              v-model="filters.approved"
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              @change="loadComments"
            >
              <option value="">Todos</option>
              <option :value="true">Aprobados</option>
              <option :value="false">Pendientes</option>
            </select>
          </div>

          <!-- Post filter -->
          <div>
            <label for="post" class="block text-sm font-medium text-gray-700 mb-1">
              Post
            </label>
            <select
              id="post"
              v-model="filters.post"
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              @change="loadComments"
            >
              <option value="">Todos los posts</option>
              <option
                v-for="post in posts"
                :key="post.id"
                :value="post.id"
              >
                {{ post.titulo || post.title }}
              </option>
            </select>
          </div>

          <!-- Ordering -->
          <div>
            <label for="ordering" class="block text-sm font-medium text-gray-700 mb-1">
              Ordenar por
            </label>
            <select
              id="ordering"
              v-model="filters.ordering"
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              @change="loadComments"
            >
              <option value="-fecha_creacion">Más recientes</option>
              <option value="fecha_creacion">Más antiguos</option>
              <option value="-approved">Pendientes primero</option>
              <option value="approved">Aprobados primero</option>
            </select>
          </div>
        </div>

        <!-- Bulk actions -->
        <div v-if="selectedComments.length > 0" class="mt-4 flex items-center space-x-4">
          <span class="text-sm text-gray-700">
            {{ selectedComments.length }} comentario(s) seleccionado(s)
          </span>
          <button
            class="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            @click="handleBulkApprove"
          >
            <CheckIcon class="h-4 w-4 mr-1" />
            Aprobar
          </button>
          <button
            class="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            @click="handleBulkDelete"
          >
            <TrashIcon class="h-4 w-4 mr-1" />
            Eliminar
          </button>
        </div>
      </div>
    </div>

    <!-- Comments list -->
    <div class="bg-white shadow overflow-hidden sm:rounded-md">
      <div v-if="loading" class="p-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-2 text-sm text-gray-500">Cargando comentarios...</p>
      </div>

      <div v-else-if="error" class="p-8 text-center">
        <ExclamationTriangleIcon class="h-12 w-12 text-red-400 mx-auto" />
        <p class="mt-2 text-sm text-red-600">{{ error }}</p>
        <button
          class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          @click="loadComments"
        >
          Reintentar
        </button>
      </div>

      <div v-else-if="comments.length === 0" class="p-8 text-center">
        <ChatBubbleLeftRightIcon class="h-12 w-12 text-gray-400 mx-auto" />
        <h3 class="mt-2 text-sm font-medium text-gray-900">No hay comentarios</h3>
        <p class="mt-1 text-sm text-gray-500">
          No se encontraron comentarios con los filtros aplicados.
        </p>
      </div>

      <ul v-else role="list" class="divide-y divide-gray-200">
        <li
          v-for="comment in comments"
          :key="comment.id"
          :class="[
            'hover:bg-gray-50 transition-colors',
            { 'bg-yellow-50': !comment.approved }
          ]"
        >
          <div class="px-4 py-6">
            <div class="flex items-start space-x-4">
              <!-- Checkbox -->
              <input
                :id="`comment-${comment.id}`"
                v-model="selectedComments"
                :value="comment.id"
                type="checkbox"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
              />

              <!-- Avatar -->
              <div class="flex-shrink-0">
                <div class="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <span class="text-sm font-medium text-gray-700">
                    {{ getUserInitials(comment.usuario || comment.author) }}
                  </span>
                </div>
              </div>

              <!-- Comment content -->
              <div class="min-w-0 flex-1">
                <!-- Header -->
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-2">
                    <h4 class="text-sm font-medium text-gray-900">
                      {{ getUserDisplayName(comment.usuario || comment.author) }}
                    </h4>
                    <span class="text-sm text-gray-500">
                      @{{ (comment.usuario || comment.author).username }}
                    </span>
                    <span
                      :class="[
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        comment.approved 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      ]"
                    >
                      {{ comment.approved ? 'Aprobado' : 'Pendiente' }}
                    </span>
                  </div>
                  <time class="text-sm text-gray-500">
                    {{ formatDate(comment.fecha_creacion || comment.created_at) }}
                  </time>
                </div>

                <!-- Comment text -->
                <div class="mt-2">
                  <p class="text-sm text-gray-900 leading-relaxed">
                    {{ comment.contenido || comment.content }}
                  </p>
                </div>

                <!-- Reply indicator -->
                <div v-if="comment.parent" class="mt-2 p-3 bg-gray-100 rounded-lg">
                  <p class="text-xs text-gray-600 mb-1">
                    Respuesta a @{{ comment.parent.usuario.username }}:
                  </p>
                  <p class="text-sm text-gray-700 italic">
                    "{{ comment.parent.contenido.substring(0, 100) }}..."
                  </p>
                </div>

                <!-- Post info -->
                <div class="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                  <span class="flex items-center">
                    <DocumentTextIcon class="h-4 w-4 mr-1" />
                    {{ comment.post.titulo || comment.post.title }}
                  </span>
                  <span v-if="comment.replies_count" class="flex items-center">
                    <ChatBubbleLeftIcon class="h-4 w-4 mr-1" />
                    {{ comment.replies_count }} respuesta(s)
                  </span>
                </div>

                <!-- Actions -->
                <div class="mt-4 flex items-center space-x-3">
                  <button
                    v-if="!comment.approved"
                    class="inline-flex items-center text-sm text-green-600 hover:text-green-500 font-medium"
                    @click="approveComment(comment)"
                  >
                    <CheckIcon class="h-4 w-4 mr-1" />
                    Aprobar
                  </button>
                  <button
                    v-if="comment.approved"
                    class="inline-flex items-center text-sm text-yellow-600 hover:text-yellow-500 font-medium"
                    @click="rejectComment(comment)"
                  >
                    <XMarkIcon class="h-4 w-4 mr-1" />
                    Rechazar
                  </button>
                  <NuxtLink
                    :to="`/posts/${comment.post.id}`"
                    target="_blank"
                    class="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 font-medium"
                  >
                    <EyeIcon class="h-4 w-4 mr-1" />
                    Ver post
                  </NuxtLink>
                  <button
                    class="inline-flex items-center text-sm text-red-600 hover:text-red-500 font-medium"
                    @click="confirmDelete(comment)"
                  >
                    <TrashIcon class="h-4 w-4 mr-1" />
                    Eliminar
                  </button>
                </div>
              </div>
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
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
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
      type="danger"
      @close="showDeleteModal = false"
    >
      <p class="text-sm text-gray-500">
        ¿Estás seguro de que quieres eliminar este comentario? Esta acción no se puede deshacer.
      </p>
      
      <template #actions>
        <button
          type="button"
          class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
          @click="deleteComment"
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
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  XMarkIcon,
  TrashIcon,
  EyeIcon,
  DocumentTextIcon,
  ChatBubbleLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/vue/24/outline'
import { debounce } from 'lodash-es'

// Layout
definePageMeta({
  layout: 'dashboard'
})

// Composables
const { 
  comments, 
  loading, 
  error, 
  totalCount, 
  fetchComments, 
  approveComment: approveCommentApi,
  rejectComment: rejectCommentApi,
  deleteComment: deleteCommentApi,
  bulkApproveComments
} = useDashboardComments()
const { success, error: showError } = useToast()

// State
const selectedComments = ref([])
const showDeleteModal = ref(false)
const commentToDelete = ref(null)
const posts = ref([])
const currentPage = ref(1)
const pageSize = ref(10)

// Filters
const filters = reactive({
  search: '',
  approved: '',
  post: '',
  ordering: '-fecha_creacion'
})

// Check URL params for filter
const route = useRoute()
if (route.query.filter === 'pending') {
  filters.approved = false
}

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

const approvedCommentsCount = computed(() => {
  return comments.value.filter(comment => comment.approved).length
})

const pendingCommentsCount = computed(() => {
  return comments.value.filter(comment => !comment.approved).length
})

const rejectedCommentsCount = computed(() => {
  // In a real app, this would be a separate status
  return 0
})

// Methods
const loadComments = async () => {
  const params = {
    page: currentPage.value,
    page_size: pageSize.value,
    ...filters
  }
  
  await fetchComments(params)
}

const debouncedSearch = debounce(() => {
  currentPage.value = 1
  loadComments()
}, 500)

const changePage = (page: number) => {
  currentPage.value = page
  loadComments()
}

const getUserInitials = (user: any) => {
  if (!user) return '?'
  const firstName = user.first_name || user.username
  const lastName = user.last_name || ''
  return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase()
}

const getUserDisplayName = (user: any) => {
  if (!user) return 'Usuario desconocido'
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`
  }
  return user.username
}

const formatDate = (dateString: string) => {
  if (!dateString) return 'Sin fecha'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const approveComment = async (comment: any) => {
  try {
    await approveCommentApi(comment.id)
    success('Comentario aprobado', 'El comentario ha sido aprobado exitosamente')
  } catch (err: any) {
    showError('Error', 'No se pudo aprobar el comentario')
  }
}

const rejectComment = async (comment: any) => {
  try {
    await rejectCommentApi(comment.id)
    success('Comentario rechazado', 'El comentario ha sido rechazado')
  } catch (err: any) {
    showError('Error', 'No se pudo rechazar el comentario')
  }
}

const confirmDelete = (comment: any) => {
  commentToDelete.value = comment
  showDeleteModal.value = true
}

const deleteComment = async () => {
  if (!commentToDelete.value) return
  
  try {
    await deleteCommentApi(commentToDelete.value.id)
    success('Comentario eliminado', 'El comentario ha sido eliminado exitosamente')
    showDeleteModal.value = false
    commentToDelete.value = null
    await loadComments()
  } catch (err: any) {
    showError('Error', 'No se pudo eliminar el comentario')
  }
}

const handleBulkApprove = async () => {
  try {
    const approvedCount = await bulkApproveComments(selectedComments.value)
    success('Comentarios aprobados', `${approvedCount} comentarios aprobados exitosamente`)
    selectedComments.value = []
  } catch (err: any) {
    showError('Error', 'No se pudieron aprobar los comentarios')
  }
}

const handleBulkDelete = async () => {
  try {
    for (const commentId of selectedComments.value) {
      await deleteCommentApi(commentId)
    }
    success('Comentarios eliminados', `${selectedComments.value.length} comentarios eliminados exitosamente`)
    selectedComments.value = []
    await loadComments()
  } catch (err: any) {
    showError('Error', 'No se pudieron eliminar los comentarios')
  }
}

// Load data on mount
onMounted(async () => {
  await loadComments()
  
  // Load posts for filter
  try {
    const postsResponse = await $fetch('/api/v1/posts/')
    posts.value = postsResponse.results || []
  } catch (err) {
    console.error('Error loading posts:', err)
  }
})

// Watch filters
watch(filters, () => {
  currentPage.value = 1
  loadComments()
}, { deep: true })

// SEO
useHead({
  title: 'Comentarios - Dashboard'
})
</script>