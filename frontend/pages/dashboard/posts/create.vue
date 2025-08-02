<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Crear Nuevo Post
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Crea un nuevo artículo para el blog
        </p>
      </div>
      
      <NuxtLink
        to="/dashboard/posts"
        class="btn btn-secondary"
      >
        <Icon name="arrow-left" class="w-4 h-4 mr-2" />
        Volver
      </NuxtLink>
    </div>

    <!-- Form -->
    <form @submit.prevent="savePost" class="space-y-6">
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
              @input="generateSlug"
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
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Puedes usar Markdown para formatear el contenido
            </p>
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
                {{ loading ? 'Guardando...' : 'Publicar' }}
              </button>
              
              <button
                type="button"
                @click="saveDraft"
                :disabled="loading"
                class="btn btn-secondary w-full"
              >
                Guardar Borrador
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
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'default',
  middleware: 'simple-admin'
})

// Composables
const { handleSuccess, handleError } = useErrorHandler()
const router = useRouter()

// State
const loading = ref(false)
const showPreview = ref(false)
const categories = ref([])
const newTag = ref('')

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
  // Simple markdown to HTML conversion (you might want to use a proper markdown library)
  return form.content
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
})

// Methods
const generateSlug = () => {
  if (!form.slug) {
    form.slug = form.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
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
    loading.value = true
    
    console.log('🖼️ Starting image upload:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    })
    
    // Get auth tokens from main auth system
    const { token } = useAuth()
    
    console.log('🔑 Auth token:', {
      hasToken: !!token.value
    })
    
    if (!token.value) {
      handleError('No se encontró token de autenticación. Por favor, inicia sesión nuevamente.', 'handleImageUpload')
      return
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      handleError('Tipo de archivo no permitido. Solo se permiten imágenes (JPG, PNG, GIF, WebP)', 'handleImageUpload')
      return
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      handleError('El archivo es demasiado grande. Máximo 10MB permitido', 'handleImageUpload')
      return
    }

    console.log('✅ File validation passed')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('alt_text', `Imagen para ${form.title || 'post'}`)
    formData.append('is_public', 'true')

    console.log('📤 Sending upload request to /api/v1/media/upload/')

    const response = await $fetch('/api/v1/media/upload/', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })

    console.log('📥 Upload response received:', response)

    // Check if upload was successful
    if (response.error === false && response.data?.file_url) {
      form.featured_image = response.data.file_url
      handleSuccess('Imagen subida exitosamente')
      console.log('✅ Image upload successful, URL:', response.data.file_url)
    } else {
      const errorMsg = response.message || 'Error en la respuesta del servidor al subir la imagen'
      console.error('❌ Upload failed:', errorMsg)
      handleError(errorMsg, 'handleImageUpload')
    }

  } catch (error) {
    console.error('❌ Error uploading image:', error)
    
    // Handle different types of errors
    if (error.data?.message) {
      handleError(error.data.message, 'handleImageUpload')
    } else if (error.data?.errors) {
      const errorMessages = Object.values(error.data.errors).flat().join(', ')
      handleError(`Errores de validación: ${errorMessages}`, 'handleImageUpload')
    } else {
      handleError(error.message || 'Error al subir la imagen', 'handleImageUpload')
    }
  } finally {
    loading.value = false
  }
}

const savePost = async () => {
  await submitPost('published')
}

const saveDraft = async () => {
  await submitPost('draft')
}

const submitPost = async (status) => {
  try {
    loading.value = true

    // Get auth token from main auth system
    const { token } = useAuth()
    
    if (!token.value) {
      handleError('No se encontró token de autenticación. Por favor, inicia sesión nuevamente.', 'submitPost')
      return
    }

    const postData = {
      titulo: form.title,
      contenido: form.content,
      status,
      featured: form.featured,
      imagen: form.featured_image,
      categoria: form.category,
      meta_title: form.title,
      meta_description: form.excerpt
    }

    await $fetch('/api/v1/dashboard/api/posts/', {
      method: 'POST',
      body: postData,
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })

    handleSuccess(`Post ${status === 'published' ? 'publicado' : 'guardado como borrador'} exitosamente`)
    router.push('/dashboard/posts')

  } catch (error) {
    handleError(error, 'submitPost')
  } finally {
    loading.value = false
  }
}

const fetchCategories = async () => {
  try {
    const { token } = useAuth()
    
    if (!token.value) {
      console.error('No auth token available for fetching categories')
      return
    }
    
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
  fetchCategories()
})

// SEO
useHead({
  title: 'Crear Post - Dashboard'
})
</script>