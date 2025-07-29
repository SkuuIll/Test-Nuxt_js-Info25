<template>
  <div>
    <!-- Loading state -->
    <div v-if="loadingPost" class="min-h-screen flex items-center justify-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <!-- Error state -->
    <div v-else-if="loadError" class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <ExclamationTriangleIcon class="h-12 w-12 text-red-400 mx-auto" />
        <h3 class="mt-2 text-sm font-medium text-gray-900">Error al cargar el post</h3>
        <p class="mt-1 text-sm text-gray-500">{{ loadError }}</p>
        <div class="mt-6">
          <NuxtLink
            to="/dashboard/posts"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Volver a posts
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Edit form -->
    <div v-else>
      <!-- Page header -->
      <div class="mb-8">
        <div class="flex items-center space-x-4">
          <NuxtLink
            to="/dashboard/posts"
            class="text-gray-400 hover:text-gray-500"
          >
            <ArrowLeftIcon class="h-6 w-6" />
          </NuxtLink>
          <div>
            <h1 class="text-2xl font-bold text-gray-900">
              Editar Post
            </h1>
            <p class="mt-1 text-sm text-gray-600">
              Modifica tu artículo y guarda los cambios
            </p>
          </div>
        </div>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Main content -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Title -->
            <div class="bg-white shadow rounded-lg p-6">
              <div>
                <label for="title" class="block text-sm font-medium text-gray-700 mb-2">
                  Título *
                </label>
                <input
                  id="title"
                  v-model="form.titulo"
                  type="text"
                  required
                  class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Escribe el título de tu post..."
                  :class="{ 'border-red-300': errors.titulo }"
                />
                <p v-if="errors.titulo" class="mt-1 text-sm text-red-600">
                  {{ errors.titulo }}
                </p>
              </div>
            </div>

            <!-- Content -->
            <div class="bg-white shadow rounded-lg p-6">
              <div>
                <label for="content" class="block text-sm font-medium text-gray-700 mb-2">
                  Contenido *
                </label>
                <textarea
                  id="content"
                  v-model="form.contenido"
                  rows="20"
                  required
                  class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Escribe el contenido de tu post..."
                  :class="{ 'border-red-300': errors.contenido }"
                />
                <p v-if="errors.contenido" class="mt-1 text-sm text-red-600">
                  {{ errors.contenido }}
                </p>
                <p class="mt-2 text-sm text-gray-500">
                  Puedes usar HTML básico para formatear tu contenido.
                </p>
              </div>
            </div>

            <!-- SEO Settings -->
            <div class="bg-white shadow rounded-lg p-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">
                Configuración SEO
              </h3>
              <div class="space-y-4">
                <div>
                  <label for="meta_title" class="block text-sm font-medium text-gray-700 mb-1">
                    Título SEO
                  </label>
                  <input
                    id="meta_title"
                    v-model="form.meta_title"
                    type="text"
                    maxlength="60"
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Título optimizado para motores de búsqueda"
                  />
                  <p class="mt-1 text-sm text-gray-500">
                    {{ form.meta_title?.length || 0 }}/60 caracteres
                  </p>
                </div>
                
                <div>
                  <label for="meta_description" class="block text-sm font-medium text-gray-700 mb-1">
                    Descripción SEO
                  </label>
                  <textarea
                    id="meta_description"
                    v-model="form.meta_description"
                    rows="3"
                    maxlength="160"
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Descripción que aparecerá en los resultados de búsqueda"
                  />
                  <p class="mt-1 text-sm text-gray-500">
                    {{ form.meta_description?.length || 0 }}/160 caracteres
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="space-y-6">
            <!-- Publish settings -->
            <div class="bg-white shadow rounded-lg p-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">
                Publicación
              </h3>
              <div class="space-y-4">
                <!-- Status -->
                <div>
                  <label for="status" class="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    id="status"
                    v-model="form.status"
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="draft">Borrador</option>
                    <option value="published">Publicado</option>
                    <option value="archived">Archivado</option>
                  </select>
                </div>

                <!-- Featured -->
                <div class="flex items-center">
                  <input
                    id="featured"
                    v-model="form.featured"
                    type="checkbox"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label for="featured" class="ml-2 block text-sm text-gray-900">
                    Marcar como destacado
                  </label>
                </div>

                <!-- Publication date -->
                <div>
                  <label for="fecha_publicacion" class="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de publicación
                  </label>
                  <input
                    id="fecha_publicacion"
                    v-model="form.fecha_publicacion"
                    type="datetime-local"
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            <!-- Category -->
            <div class="bg-white shadow rounded-lg p-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">
                Categoría
              </h3>
              <div>
                <select
                  v-model="form.categoria"
                  class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
              </div>
            </div>

            <!-- Featured image -->
            <div class="bg-white shadow rounded-lg p-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">
                Imagen destacada
              </h3>
              <div>
                <div
                  v-if="imagePreview || currentImage"
                  class="mb-4"
                >
                  <img
                    :src="imagePreview || currentImage"
                    alt="Preview"
                    class="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    class="mt-2 text-sm text-red-600 hover:text-red-500"
                    @click="removeImage"
                  >
                    Eliminar imagen
                  </button>
                </div>
                
                <div
                  v-else
                  class="border-2 border-gray-300 border-dashed rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                  @click="$refs.fileInput.click()"
                  @drop.prevent="handleDrop"
                  @dragover.prevent
                  @dragenter.prevent
                >
                  <PhotoIcon class="mx-auto h-12 w-12 text-gray-400" />
                  <div class="mt-4">
                    <p class="text-sm text-gray-600">
                      Haz clic para subir o arrastra una imagen aquí
                    </p>
                    <p class="text-xs text-gray-500 mt-1">
                      PNG, JPG, GIF hasta 5MB
                    </p>
                  </div>
                </div>
                
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleFileSelect"
                />
              </div>
            </div>

            <!-- Actions -->
            <div class="bg-white shadow rounded-lg p-6">
              <div class="flex flex-col space-y-3">
                <button
                  type="submit"
                  :disabled="loading"
                  class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <span v-if="loading" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  {{ loading ? 'Guardando...' : 'Actualizar Post' }}
                </button>
                
                <NuxtLink
                  to="/dashboard/posts"
                  class="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowLeftIcon,
  PhotoIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'

// Layout
definePageMeta({
  layout: 'dashboard'
})

// Composables
const route = useRoute()
const { fetchPost, updatePost } = useDashboardPosts()
const { success, error: showError } = useToast()

// State
const loading = ref(false)
const loadingPost = ref(true)
const loadError = ref<string | null>(null)
const categories = ref([])
const imagePreview = ref<string | null>(null)
const currentImage = ref<string | null>(null)
const fileInput = ref<HTMLInputElement>()

// Form data
const form = reactive({
  titulo: '',
  contenido: '',
  status: 'draft',
  featured: false,
  categoria: '',
  fecha_publicacion: '',
  meta_title: '',
  meta_description: '',
  imagen: null as File | null
})

// Validation errors
const errors = reactive({
  titulo: '',
  contenido: ''
})

// Methods
const validateForm = () => {
  errors.titulo = ''
  errors.contenido = ''
  
  let isValid = true
  
  if (!form.titulo.trim()) {
    errors.titulo = 'El título es requerido'
    isValid = false
  } else if (form.titulo.length < 5) {
    errors.titulo = 'El título debe tener al menos 5 caracteres'
    isValid = false
  }
  
  if (!form.contenido.trim()) {
    errors.contenido = 'El contenido es requerido'
    isValid = false
  } else if (form.contenido.length < 20) {
    errors.contenido = 'El contenido debe tener al menos 20 caracteres'
    isValid = false
  }
  
  return isValid
}

const handleSubmit = async () => {
  if (!validateForm()) return
  
  loading.value = true
  
  try {
    const postData = {
      ...form,
      categoria: form.categoria || null
    }
    
    const updatedPost = await updatePost(Number(route.params.id), postData)
    
    if (updatedPost) {
      success('Post actualizado', 'El post ha sido actualizado exitosamente')
      
      // Redirect to posts list
      await navigateTo('/dashboard/posts')
    }
  } catch (err: any) {
    showError('Error', err.message || 'No se pudo actualizar el post')
  } finally {
    loading.value = false
  }
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file) {
    handleFile(file)
  }
}

const handleDrop = (event: DragEvent) => {
  const file = event.dataTransfer?.files[0]
  
  if (file) {
    handleFile(file)
  }
}

const handleFile = (file: File) => {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    showError('Error', 'Por favor selecciona un archivo de imagen válido')
    return
  }
  
  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    showError('Error', 'La imagen debe ser menor a 5MB')
    return
  }
  
  form.imagen = file
  
  // Create preview
  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

const removeImage = () => {
  form.imagen = null
  imagePreview.value = null
  currentImage.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// Load post data on mount
onMounted(async () => {
  try {
    const postId = Number(route.params.id)
    
    // Load post data
    const post = await fetchPost(postId)
    
    if (post) {
      // Populate form
      form.titulo = post.titulo || post.title || ''
      form.contenido = post.contenido || post.content || ''
      form.status = post.status || 'draft'
      form.featured = post.featured || false
      form.categoria = post.categoria?.id || post.category?.id || ''
      form.meta_title = post.meta_title || ''
      form.meta_description = post.meta_description || ''
      
      // Handle date
      if (post.fecha_publicacion || post.published_at) {
        const date = new Date(post.fecha_publicacion || post.published_at)
        form.fecha_publicacion = date.toISOString().slice(0, 16)
      }
      
      // Handle image
      if (post.imagen || post.image) {
        currentImage.value = post.imagen || post.image
      }
    }
    
    // Load categories
    const categoriesResponse = await $fetch('/api/v1/categories/')
    categories.value = categoriesResponse || []
    
  } catch (err: any) {
    loadError.value = err.message || 'No se pudo cargar el post'
  } finally {
    loadingPost.value = false
  }
})

// SEO
useHead({
  title: 'Editar Post - Dashboard'
})
</script>