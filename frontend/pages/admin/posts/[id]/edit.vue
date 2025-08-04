<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Editar Post
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Modifica el artículo del blog
        </p>
      </div>
      
      <div class="flex items-center space-x-3">
        <NuxtLink
          :to="`/posts/${post?.slug}`"
          target="_blank"
          class="btn btn-outline"
        >
          <Icon name="eye" class="w-4 h-4 mr-2" />
          Ver Post
        </NuxtLink>
        
        <NuxtLink
          to="/admin/posts"
          class="btn btn-secondary"
        >
          <Icon name="arrow-left" class="w-4 h-4 mr-2" />
          Volver
        </NuxtLink>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loadingPost" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
      <Icon name="loading" class="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
      <p class="text-gray-600 dark:text-gray-400">Cargando post...</p>
    </div>

    <!-- Edit Form -->
    <div v-else-if="post" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <SimpleForm
        :initial-data="formData"
        :validation-rules="validationRules"
        submit-text="Actualizar Post"
        draft-text="Guardar Borrador"
        :show-draft="true"
        :is-draftable="true"
        @submit="handleSubmit"
        @draft="handleDraft"
        @cancel="handleCancel"
      >
        <template #default="{ form, setField, getError, hasError }">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Main Content -->
            <div class="lg:col-span-2 space-y-6">
              <!-- Title -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título *
                </label>
                <input
                  :value="form.title"
                  @input="setField('title', $event.target.value)"
                  type="text"
                  class="input w-full"
                  :class="{ 'border-red-500': hasError('title') }"
                  placeholder="Ingresa el título del post"
                />
                <p v-if="hasError('title')" class="text-red-500 text-sm mt-1">
                  {{ getError('title') }}
                </p>
              </div>

              <!-- Content -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contenido *
                </label>
                <textarea
                  :value="form.content"
                  @input="setField('content', $event.target.value)"
                  rows="15"
                  class="input w-full resize-none"
                  :class="{ 'border-red-500': hasError('content') }"
                  placeholder="Escribe el contenido del post..."
                ></textarea>
                <p v-if="hasError('content')" class="text-red-500 text-sm mt-1">
                  {{ getError('content') }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Puedes usar Markdown para formatear el contenido
                </p>
              </div>

              <!-- Excerpt -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Extracto
                </label>
                <textarea
                  :value="form.excerpt"
                  @input="setField('excerpt', $event.target.value)"
                  rows="3"
                  class="input w-full"
                  placeholder="Breve descripción del post (opcional)"
                ></textarea>
              </div>
            </div>

            <!-- Sidebar -->
            <div class="space-y-6">
              <!-- Post Info -->
              <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Información del Post
                </h3>
                <div class="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <p>Creado: {{ formatDate(post.fecha_creacion || post.created_at) }}</p>
                  <p>Actualizado: {{ formatDate(post.fecha_actualizacion || post.updated_at) }}</p>
                  <p>Autor: {{ post.autor_username || post.author_username || 'Desconocido' }}</p>
                </div>
              </div>

              <!-- Category -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Categoría *
                </label>
                <select 
                  :value="form.category"
                  @change="setField('category', $event.target.value)"
                  class="input w-full"
                  :class="{ 'border-red-500': hasError('category') }"
                >
                  <option value="">Seleccionar categoría</option>
                  <option
                    v-for="category in categories"
                    :key="category.id"
                    :value="category.id"
                  >
                    {{ category.name || category.nombre }}
                  </option>
                </select>
                <p v-if="hasError('category')" class="text-red-500 text-sm mt-1">
                  {{ getError('category') }}
                </p>
              </div>

              <!-- Status -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado
                </label>
                <select 
                  :value="form.status"
                  @change="setField('status', $event.target.value)"
                  class="input w-full"
                >
                  <option value="draft">Borrador</option>
                  <option value="published">Publicado</option>
                  <option value="archived">Archivado</option>
                </select>
              </div>

              <!-- Featured -->
              <div>
                <label class="flex items-center">
                  <input
                    :checked="form.featured"
                    @change="setField('featured', $event.target.checked)"
                    type="checkbox"
                    class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Post destacado
                  </span>
                </label>
              </div>
            </div>
          </div>
        </template>
      </SimpleForm>
    </div>

    <!-- Error State -->
    <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
      <Icon name="exclamation-triangle" class="w-12 h-12 mx-auto mb-4 text-red-400" />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Post no encontrado
      </h3>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        El post que intentas editar no existe o no tienes permisos para acceder a él.
      </p>
      <NuxtLink to="/admin/posts" class="btn btn-primary">
        Volver a Posts
      </NuxtLink>
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
const router = useRouter()
const route = useRoute()

// State
const loadingPost = ref(true)
const post = ref(null)
const categories = ref([])

// Computed
const formData = computed(() => {
  if (!post.value) return {}
  
  return {
    title: post.value.titulo || post.value.title || '',
    content: post.value.contenido || post.value.content || '',
    excerpt: post.value.meta_description || post.value.excerpt || '',
    status: post.value.status || 'draft',
    category: post.value.categoria || post.value.category_id || '',
    featured: post.value.featured || false
  }
})

const validationRules = {
  title: (value: string) => {
    if (!value || value.trim().length < 5) {
      return 'El título debe tener al menos 5 caracteres'
    }
    return null
  },
  content: (value: string) => {
    if (!value || value.trim().length < 20) {
      return 'El contenido debe tener al menos 20 caracteres'
    }
    return null
  },
  category: (value: string) => {
    if (!value) {
      return 'Debes seleccionar una categoría'
    }
    return null
  }
}

// Methods
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleSubmit = async (formData: any) => {
  await updatePost(formData, 'published')
}

const handleDraft = async (formData: any) => {
  await updatePost(formData, 'draft')
}

const handleCancel = () => {
  router.push('/admin/posts')
}

const updatePost = async (formData: any, status: string) => {
  try {
    const { token } = useAuth()
    
    if (!token.value) {
      handleError('No se encontró token de autenticación', 'updatePost')
      return
    }

    const postData = {
      titulo: formData.title,
      contenido: formData.content,
      status,
      featured: formData.featured,
      categoria: formData.category,
      meta_title: formData.title,
      meta_description: formData.excerpt
    }

    await $fetch(`/api/v1/dashboard/api/posts/${route.params.id}/`, {
      method: 'PATCH',
      body: postData,
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })

    handleSuccess(`Post ${status === 'published' ? 'actualizado y publicado' : 'guardado como borrador'} exitosamente`)
    router.push('/admin/posts')

  } catch (error) {
    handleError(error, 'updatePost')
    throw error
  }
}

const fetchPost = async () => {
  try {
    loadingPost.value = true
    
    const { token } = useAuth()
    if (!token.value) {
      handleError('No se encontró token de autenticación', 'fetchPost')
      return
    }

    const response = await $fetch(`/api/v1/dashboard/api/posts/${route.params.id}/`, {
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })

    post.value = response

  } catch (error) {
    console.error('Error fetching post:', error)
    handleError('Error al cargar el post', 'fetchPost')
  } finally {
    loadingPost.value = false
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
    // Fallback to public categories endpoint
    try {
      const response = await $fetch('/api/v1/categories/')
      categories.value = response.results || response
    } catch (fallbackError) {
      console.error('Error fetching categories from fallback:', fallbackError)
    }
  }
}

// Initialize
onMounted(() => {
  fetchPost()
  fetchCategories()
})

// SEO
useHead({
  title: 'Editar Post - Administración',
  meta: [
    { name: 'description', content: 'Editar post del blog' }
  ]
})
</script>