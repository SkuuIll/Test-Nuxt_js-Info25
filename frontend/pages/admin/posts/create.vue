<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="container mx-auto px-4 py-8">
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="flex items-center justify-between mb-8">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              Crear Nuevo Post
            </h1>
            <p class="text-gray-600 dark:text-gray-400 mt-2">
              Crea un nuevo artículo para el blog
            </p>
          </div>
          
          <NuxtLink
            to="/admin/posts"
            class="btn btn-secondary"
          >
            <Icon name="arrow-left" class="w-4 h-4 mr-2" />
            Volver a Posts
          </NuxtLink>
        </div>

        <!-- Form -->
        <form @submit.prevent="createPost" class="space-y-6">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <!-- Title -->
            <div class="mb-6">
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
            <div class="mb-6">
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

            <!-- Category -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Categoría *
              </label>
              <select
                v-model="form.category"
                required
                class="input w-full"
              >
                <option value="">Selecciona una categoría</option>
                <option v-for="category in categories" :key="category.id" :value="category.id">
                  {{ category.name }}
                </option>
              </select>
            </div>

            <!-- Excerpt -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Extracto
              </label>
              <textarea
                v-model="form.excerpt"
                rows="3"
                class="input w-full resize-none"
                placeholder="Breve descripción del post..."
              />
            </div>

            <!-- Content -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contenido *
              </label>
              <textarea
                v-model="form.content"
                rows="12"
                required
                class="input w-full resize-none font-mono text-sm"
                placeholder="Escribe el contenido del post en HTML o Markdown..."
              />
            </div>

            <!-- Image URL -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                URL de Imagen Destacada
              </label>
              <input
                v-model="form.image"
                type="url"
                class="input w-full"
                placeholder="https://ejemplo.com/imagen.jpg"
              />
            </div>

            <!-- Status -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estado
              </label>
              <select
                v-model="form.status"
                class="input w-full"
              >
                <option value="draft">Borrador</option>
                <option value="published">Publicado</option>
              </select>
            </div>

            <!-- Meta Title -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Meta Título (SEO)
              </label>
              <input
                v-model="form.meta_title"
                type="text"
                class="input w-full"
                placeholder="Título para SEO (opcional)"
              />
            </div>

            <!-- Meta Description -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Meta Descripción (SEO)
              </label>
              <textarea
                v-model="form.meta_description"
                rows="2"
                class="input w-full resize-none"
                placeholder="Descripción para SEO (opcional)"
              />
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-between">
            <div class="text-sm text-gray-500 dark:text-gray-400">
              * Campos requeridos
            </div>
            
            <div class="flex space-x-3">
              <button
                type="button"
                @click="saveDraft"
                :disabled="loading"
                class="btn btn-secondary"
              >
                <Icon name="document" class="w-4 h-4 mr-2" />
                Guardar Borrador
              </button>
              
              <button
                type="submit"
                :disabled="loading"
                class="btn btn-primary"
              >
                <Icon v-if="loading" name="loading" class="w-4 h-4 mr-2 animate-spin" />
                <Icon v-else name="check" class="w-4 h-4 mr-2" />
                {{ form.status === 'published' ? 'Publicar Post' : 'Crear Post' }}
              </button>
            </div>
          </div>
        </form>
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
const categories = ref([])

// Form data
const form = reactive({
  title: '',
  slug: '',
  content: '',
  excerpt: '',
  category: '',
  image: '',
  status: 'draft',
  meta_title: '',
  meta_description: ''
})

// Methods
const generateSlug = () => {
  if (form.title && !form.slug) {
    form.slug = form.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }
}

const saveDraft = async () => {
  form.status = 'draft'
  await createPost()
}

const createPost = async () => {
  if (!form.title || !form.content || !form.category) {
    $toast.error('Por favor completa todos los campos requeridos')
    return
  }

  loading.value = true

  try {
    // Simulate API call - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    $toast.success(`Post ${form.status === 'published' ? 'publicado' : 'guardado'} exitosamente`)
    
    // Reset form
    Object.keys(form).forEach(key => {
      form[key] = key === 'status' ? 'draft' : ''
    })
    
    // Redirect to posts list
    await navigateTo('/admin/posts')
    
  } catch (error) {
    console.error('Error creating post:', error)
    $toast.error('Error al crear el post')
  } finally {
    loading.value = false
  }
}

// Load categories
const loadCategories = async () => {
  try {
    // Simulate loading categories - replace with actual API call
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

// Initialize
onMounted(() => {
  loadCategories()
})

// SEO
useHead({
  title: 'Crear Post - Admin',
  meta: [
    { name: 'description', content: 'Crear un nuevo post para el blog' }
  ]
})
</script>