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
        to="/admin/posts"
        class="btn btn-secondary"
      >
        <Icon name="arrow-left" class="w-4 h-4 mr-2" />
        Volver
      </NuxtLink>
    </div>

    <!-- Simplified Form -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <SimpleForm
        :initial-data="initialFormData"
        :validation-rules="validationRules"
        submit-text="Publicar Post"
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

              <!-- Content with Preview -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Contenido <span class="text-red-500">*</span>
                  </label>
                  <div class="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
                      type="button"
                      @click="activeTab = 'editor'"
                      :class="[
                        'px-3 py-1 text-sm rounded-md transition-colors',
                        activeTab === 'editor' 
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      ]"
                    >
                      Editor
                    </button>
                    <button
                      type="button"
                      @click="activeTab = 'preview'"
                      :class="[
                        'px-3 py-1 text-sm rounded-md transition-colors',
                        activeTab === 'preview' 
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      ]"
                    >
                      Vista Previa
                    </button>
                  </div>
                </div>
                
                <div v-show="activeTab === 'editor'">
                  <MarkdownEditor
                    :model-value="form.content"
                    @update:model-value="setField('content', $event)"
                    label=""
                    :required="true"
                    :error="hasError('content') ? getError('content') : ''"
                    placeholder="Escribe el contenido del post..."
                    :rows="15"
                  />
                </div>
                
                <div v-show="activeTab === 'preview'" class="min-h-[400px]">
                  <MarkdownPreview :content="form.content" />
                </div>
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
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                  placeholder="Breve descripción del post (opcional)"
                ></textarea>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Resumen que aparecerá en las listas de posts
                </p>
              </div>
            </div>

            <!-- Sidebar -->
            <div class="space-y-6">
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

// State
const categories = ref([])
const activeTab = ref('editor')

// Form configuration
const initialFormData = {
  title: '',
  content: '',
  excerpt: '',
  status: 'draft',
  category: '',
  featured: false
}

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
const handleSubmit = async (formData: any) => {
  await submitPost(formData, 'published')
}

const handleDraft = async (formData: any) => {
  await submitPost(formData, 'draft')
}

const handleCancel = () => {
  router.push('/admin/posts')
}

const submitPost = async (formData: any, status: string) => {
  try {
    // Get auth token from main auth system
    const { token } = useAuth()
    
    if (!token.value) {
      handleError('No se encontró token de autenticación. Por favor, inicia sesión nuevamente.', 'submitPost')
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

    await $fetch('/api/v1/dashboard/api/posts/', {
      method: 'POST',
      body: postData,
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })

    handleSuccess(`Post ${status === 'published' ? 'publicado' : 'guardado como borrador'} exitosamente`)
    router.push('/admin/posts')

  } catch (error) {
    handleError(error, 'submitPost')
    throw error // Re-throw to let SimpleForm handle loading state
  }
}

const fetchCategories = async () => {
  try {
    // For development, use mock categories
    if (import.meta.dev) {
      categories.value = [
        { id: 1, name: 'Tecnología', slug: 'tecnologia' },
        { id: 2, name: 'Deportes', slug: 'deportes' },
        { id: 3, name: 'Política', slug: 'politica' },
        { id: 4, name: 'Entretenimiento', slug: 'entretenimiento' },
        { id: 5, name: 'Ciencia', slug: 'ciencia' },
        { id: 6, name: 'Salud', slug: 'salud' },
        { id: 7, name: 'Economía', slug: 'economia' },
        { id: 8, name: 'Cultura', slug: 'cultura' }
      ]
      return
    }

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
      // Final fallback to mock data
      categories.value = [
        { id: 1, name: 'General', slug: 'general' },
        { id: 2, name: 'Noticias', slug: 'noticias' }
      ]
    }
  }
}

// Initialize
onMounted(() => {
  fetchCategories()
})

// SEO
useHead({
  title: 'Crear Post - Administración',
  meta: [
    { name: 'description', content: 'Crear nuevo post para el blog' }
  ]
})
</script>

<style scoped>
.input {
  @apply px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white;
}

.btn {
  @apply inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors;
}

.btn-secondary {
  @apply text-gray-700 bg-white border-gray-300 hover:bg-gray-50 focus:ring-primary-500;
}
</style>