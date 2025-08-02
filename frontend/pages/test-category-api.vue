<template>
  <div class="container mx-auto p-8">
    <h1 class="text-3xl font-bold mb-8">Test de API de Categorías</h1>
    
    <div class="space-y-8">
      <!-- Test de carga de categorías -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">Categorías Disponibles</h2>
        
        <div v-if="loadingCategories" class="text-gray-600">
          Cargando categorías...
        </div>
        
        <div v-else-if="categoriesError" class="text-red-600">
          Error: {{ categoriesError }}
        </div>
        
        <div v-else-if="categories.length === 0" class="text-gray-600">
          No hay categorías disponibles
        </div>
        
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="category in categories"
            :key="category.id"
            class="border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <h3 class="font-semibold">{{ category.name }}</h3>
            <p class="text-sm text-gray-600 mb-2">{{ category.description }}</p>
            <div class="text-xs text-gray-500 mb-3">
              {{ category.posts_count }} posts
            </div>
            <NuxtLink
              :to="`/category/${category.slug}`"
              class="inline-block bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
            >
              Ver categoría
            </NuxtLink>
          </div>
        </div>
      </div>
      
      <!-- Test de navegación directa -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">Test de Navegación Directa</h2>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Slug de categoría:
            </label>
            <div class="flex space-x-2">
              <input
                v-model="testSlug"
                type="text"
                placeholder="Ej: tecnologia"
                class="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
              <button
                @click="navigateToCategory"
                class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
              >
                Ir a categoría
              </button>
            </div>
          </div>
          
          <div class="text-sm text-gray-600">
            <p>Prueba con slugs como: tecnologia, deportes, politica, economia, cultura, ciencia</p>
          </div>
        </div>
      </div>
      
      <!-- Estado de la aplicación -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">Estado de la Aplicación</h2>
        
        <div class="space-y-2 text-sm">
          <div><strong>API Base URL:</strong> {{ apiBaseUrl }}</div>
          <div><strong>Autenticado:</strong> {{ isAuthenticated ? 'Sí' : 'No' }}</div>
          <div><strong>Toast System:</strong> {{ toastAvailable ? 'Disponible' : 'No disponible' }}</div>
        </div>
        
        <div class="mt-4 space-x-2">
          <button
            @click="testToast"
            class="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600 transition-colors"
          >
            Test Toast
          </button>
          <button
            @click="refreshCategories"
            class="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600 transition-colors"
          >
            Recargar Categorías
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Category } from '~/types'

// Estado reactivo
const categories = ref<Category[]>([])
const loadingCategories = ref(false)
const categoriesError = ref<string | null>(null)
const testSlug = ref('tecnologia')

// Composables
const { $api } = useNuxtApp()
const { success, error: showError } = useToast()
const authStore = useAuthStore()
const runtimeConfig = useRuntimeConfig()

// Computed
const apiBaseUrl = computed(() => runtimeConfig.public.apiBase)
const isAuthenticated = computed(() => authStore.isAuthenticated)
const toastAvailable = computed(() => !!success)

// Métodos
const loadCategories = async () => {
  try {
    loadingCategories.value = true
    categoriesError.value = null
    
    console.log('🔄 Cargando categorías desde API...')
    const response = await $api.getCategories()
    
    console.log('📦 Respuesta de categorías:', response)
    
    if (response.data) {
      categories.value = response.data
    } else if (response.results) {
      categories.value = response.results
    } else if (Array.isArray(response)) {
      categories.value = response
    } else {
      categories.value = []
    }
    
    console.log('✅ Categorías cargadas:', categories.value.length)
    
  } catch (err: any) {
    console.error('❌ Error cargando categorías:', err)
    categoriesError.value = err.message || 'Error desconocido'
    showError('Error al cargar categorías', err.message)
  } finally {
    loadingCategories.value = false
  }
}

const navigateToCategory = () => {
  if (!testSlug.value.trim()) {
    showError('Por favor ingresa un slug de categoría')
    return
  }
  
  const slug = testSlug.value.trim().toLowerCase()
  console.log('🔗 Navegando a categoría:', slug)
  
  navigateTo(`/category/${slug}`)
}

const refreshCategories = () => {
  loadCategories()
}

const testToast = () => {
  success('¡Sistema de toast funcionando correctamente!', 'Test exitoso')
}

// Inicialización
onMounted(() => {
  loadCategories()
})

// Meta tags
useHead({
  title: 'Test API Categorías - Blog de Noticias',
  meta: [
    {
      name: 'description',
      content: 'Página de prueba para verificar la API de categorías'
    }
  ]
})
</script>