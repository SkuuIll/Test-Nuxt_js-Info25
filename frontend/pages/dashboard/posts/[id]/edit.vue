<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Loading State -->
    <div v-if="initialLoading" class="flex justify-center py-12">
      <Icon name="loading" class="w-8 h-8 animate-spin text-primary-600" />
    </div>

    <!-- Content -->
    <div v-else>
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Editar Post
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Modifica el contenido del artículo
          </p>
        </div>
        
        <div class="flex space-x-3">
          <NuxtLink
            :to="`/posts/${post.slug}`"
            target="_blank"
            class="btn btn-secondary"
          >
            <Icon name="external-link" class="w-4 h-4 mr-2" />
            Ver Post
          </NuxtLink>
          
          <NuxtLink
            to="/dashboard/posts"
            class="btn btn-secondary"
          >
            <Icon name="arrow-left" class="w-4 h-4 mr-2" />
            Volver
          </NuxtLink>
        </div>
      </div>

      <!-- Form -->
      <form @submit.prevent="updatePost" class="space-y-6">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Main Content -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Title -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Título *
              </label>
              <input
                v-model="form.title"
                type="text"
                required
                class="input w-full"
                placeholder="Ingresa el título del post"
              />
            </div>

            <!-- Slug -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                URL (Slug)
              </label>
              <div class="flex">
                <span class="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm">
                  /posts/
                </span>
                <input
                  v-model="form.slug"
                  type="text"
                  class="input rounded-l-none flex-1"
                  placeholder="url-del-post"
                />
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Cambiar la URL puede afectar los enlaces existentes
              </p>
            </div>

            <!-- Content -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contenido *
              </label>
              <div class="border border-gray-300 dark:border-gray-600 rounded-md">
                <div class="border-b border-gray-300 dark:border-gray-600 p-3 bg-gray-50 dark:bg-gray-700">
                  <div class="flex space-x-2">
                    <button
                      type="button"
                      @click="togglePreview"
                      class="btn btn-sm btn-secondary"
                    >
                      {{ showPreview ? 'Editar' : 'Vista Previa' }}
                    </button>
                  </div>
                </div>
                
                <div v-if="!showPreview" class="p-4">
                  <textarea
                    v-model="form.content"
                    rows="15"
                    required
                    class="w-full border-0 resize-none focus:ring-0 text-sm"
                    placeholder="Escribe el contenido del post en Markdown..."
                  ></textarea>
                </div>
                
                <div v-else class="p-4 prose dark:prose-invert max-w-none">
                  <div v-html="renderedContent"></div>
                </div>
              </div>
            </div>

            <!-- Excerpt -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Extracto
              </label>
              <textarea
                v-model="form.excerpt"
                rows="3"
                class="input w-full"
                placeholder="Breve descripción del post (opcional)"
              ></textarea>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="space-y-6">
            <!-- Actions -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Acciones
              </h3>
              
              <div class="space-y-3">
                <button
                  type="submit"
                  :disabled="loading"
                  class="btn btn-primary w-full"
                >
                  <Icon v-if="loading" name="loading" class="w-4 h-4 animate-spin mr-2" />
                  {{ loading ? 'Guardando...' : 'Actualizar Post' }}
                </button>
                
                <button
                  type="button"
                  @click="deletePost"
                  :disabled="loading"
                  class="btn btn-danger w-full"
                >
                  Eliminar Post
                </button>
              </div>
            </div>

            <!-- Status -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Estado
              </h3>
              
              <div class="space-y-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Estado de publicación
                  </label>
                  <select v-model="form.status" class="input w-full">
                    <option value="draft">Borrador</option>
                    <option value="published">Publicado</option>
                    <option value="archived">Archivado</option>
                  </select>
                </div>

                <div>
                  <label class="flex items-center">
                    <input
                      v-model="form.featured"
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

            <!-- Category -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Categoría
              </h3>
              
              <select v-model="form.category" class="input w-full" required>
                <option value="">Seleccionar categoría</option>
                <option
                  v-for="category in categories"
                  :key="category.id"
                  :value="category.id"
                >
                  {{ category.name }}
                </option>
              </select>
            </div>

            <!-- Tags -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Etiquetas
              </h3>
              
              <div class="space-y-3">
                <input
                  v-model="newTag"
                  type="text"
                  class="input w-full"
                  placeholder="Agregar etiqueta"
                  @keydown.enter.prevent="addTag"
                />
                
                <div v-if="form.tags.length > 0" class="flex flex-wrap gap-2">
                  <span
                    v-for="(tag, index) in form.tags"
                    :key="index"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200"
                  >
                    {{ tag }}
                    <button
                      type="button"
                      @click="removeTag(index)"
                      class="ml-1 text-primary-600 hover:text-primary-800"
                    >
                      <Icon name="x" class="w-3 h-3" />
                    </button>
                  </span>
                </div>
              </div>
            </div>

            <!-- Featured Image -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Imagen Destacada
              </h3>
              
              <div v-if="form.featured_image" class="mb-4">
                <img
                  :src="form.featured_image"
                  alt="Imagen destacada"
                  class="w-full h-32 object-cover rounded-md"
                />
                <button
                  type="button"
                  @click="form.featured_image = ''"
                  class="mt-2 text-sm text-red-600 hover:text-red-800"
                >
                  Eliminar imagen
                </button>
              </div>
              
              <div v-else>
                <input
                  type="file"
                  ref="imageInput"
                  accept="image/*"
                  @change="handleImageUpload"
                  class="hidden"
                />
                <button
                  type="button"
                  @click="$refs.imageInput.click()"
                  class="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md p-4 text-center hover:border-primary-500 transition-colors"
                >
                  <Icon name="image" class="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <span class="text-sm text-gray-600 dark:text-gray-400">
                    Subir imagen
                  </span>
                </button>
              </div>
            </div>

            <!-- Post Info -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Información
              </h3>
              
              <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div>
                  <strong>Creado:</strong> {{ formatDate(post.created_at) }}
                </div>
                <div>
                  <strong>Modificado:</strong> {{ formatDate(post.updated_at) }}
                </div>
                <div>
                  <strong>Autor:</strong> {{ post.author?.username || 'Sin autor' }}
                </div>
                <div v-if="post.views_count">
                  <strong>Vistas:</strong> {{ post.views_count }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'dashboard',
  middleware: 'dashboard-auth'
})

// Composables
const route = useRoute()
const router = useRouter()
const { handleSuccess, handleError } = useErrorHandler()

// State
const initialLoading = ref(true)
const loading = ref(false)
const showPreview = ref(false)
const categories = ref([])
const newTag = ref('')
const post = ref({})

const form = reactive({
  title: '',
  slug: '',
  content: '',
  excerpt: '',
  status: 'draft',
  category: '',
  tags: [],
  featured: false,
  featured_image: ''
})

// Computed
const renderedContent = computed(() => {
  // Simple markdown to HTML conversion
  return form.content
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
})

// Methods
const fetchPost = async () => {
  try {
    const response = await $fetch(`/api/v1/dashboard/posts/${route.params.id}/`, {
      headers: {
        'Authorization': `Bearer ${useDashboardAuth().getAccessToken()}`
      }
    })
    
    post.value = response
    
    // Populate form
    form.title = response.title
    form.slug = response.slug
    form.content = response.content
    form.excerpt = response.excerpt || ''
    form.status = response.status
    form.category = response.category?.id || ''
    form.tags = response.tags ? response.tags.split(',').filter(tag => tag.trim()) : []
    form.featured = response.featured || false
    form.featured_image = response.featured_image || ''
    
  } catch (error) {
    handleError(error, 'fetchPost')
    router.push('/dashboard/posts')
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

const togglePreview = () => {
  showPreview.value = !showPreview.value
}

const addTag = () => {
  if (newTag.value.trim() && !form.tags.includes(newTag.value.trim())) {
    form.tags.push(newTag.value.trim())
    newTag.value = ''
  }
}

const removeTag = (index) => {
  form.tags.splice(index, 1)
}

const handleImageUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  try {
    const formData = new FormData()
    formData.append('image', file)

    const response = await $fetch('/api/v1/media/upload/', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${useDashboardAuth().getAccessToken()}`
      }
    })

    form.featured_image = response.url
    handleSuccess('Imagen subida exitosamente')

  } catch (error) {
    handleError(error, 'handleImageUpload')
  }
}

const updatePost = async () => {
  try {
    loading.value = true

    const postData = {
      ...form,
      tags: form.tags.join(',')
    }

    await $fetch(`/api/v1/dashboard/posts/${route.params.id}/`, {
      method: 'PATCH',
      body: postData,
      headers: {
        'Authorization': `Bearer ${useDashboardAuth().getAccessToken()}`
      }
    })

    handleSuccess('Post actualizado exitosamente')
    router.push('/dashboard/posts')

  } catch (error) {
    handleError(error, 'updatePost')
  } finally {
    loading.value = false
  }
}

const deletePost = async () => {
  if (!confirm(`¿Eliminar el post "${post.value.title}"? Esta acción no se puede deshacer.`)) return
  
  try {
    loading.value = true

    await $fetch(`/api/v1/dashboard/posts/${route.params.id}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${useDashboardAuth().getAccessToken()}`
      }
    })

    handleSuccess('Post eliminado exitosamente')
    router.push('/dashboard/posts')

  } catch (error) {
    handleError(error, 'deletePost')
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Initialize
onMounted(async () => {
  try {
    await Promise.all([
      fetchPost(),
      fetchCategories()
    ])
  } finally {
    initialLoading.value = false
  }
})

// SEO
useHead({
  title: `Editar: ${post.value.title || 'Post'} - Dashboard`
})
</script>