<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="text-center">
          <div class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200 mb-4">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Tag
          </div>
          <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4 capitalize">
            {{ tagName }}
          </h1>
          <p class="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Explora todos los artículos relacionados con {{ tagName }}
          </p>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <!-- Loading State -->
      <div v-if="pending" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div v-for="i in 6" :key="i" class="animate-pulse">
          <div class="bg-gray-200 dark:bg-gray-700 rounded-lg h-48 mb-4"></div>
          <div class="space-y-2">
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-12">
        <div class="max-w-md mx-auto">
          <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Error al cargar el contenido
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            No pudimos cargar los artículos para este tag.
          </p>
          <button 
            @click="refresh()"
            class="btn btn-primary"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!posts || posts.length === 0" class="text-center py-12">
        <div class="max-w-md mx-auto">
          <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No hay artículos disponibles
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            Aún no hay artículos publicados con el tag "{{ tagName }}".
          </p>
          <NuxtLink to="/" class="btn btn-primary">
            Explorar otros artículos
          </NuxtLink>
        </div>
      </div>

      <!-- Posts Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <article 
          v-for="post in posts" 
          :key="post.id"
          class="card hover:shadow-lg transition-all duration-300"
        >
          <NuxtLink :to="`/posts/${post.slug}`" class="block">
            <!-- Image -->
            <div class="aspect-video bg-gray-200 dark:bg-gray-700 rounded-t-lg overflow-hidden">
              <NuxtImg
                v-if="post.imagen"
                :src="post.imagen"
                :alt="post.titulo"
                class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            <!-- Content -->
            <div class="p-6">
              <!-- Category -->
              <div v-if="post.categoria" class="mb-3">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                  {{ post.categoria.nombre }}
                </span>
              </div>

              <!-- Title -->
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-3 line-clamp-2 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                {{ post.titulo }}
              </h2>

              <!-- Excerpt -->
              <p class="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                {{ post.excerpt || post.contenido.substring(0, 150) + '...' }}
              </p>

              <!-- Meta -->
              <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <div class="flex items-center space-x-4">
                  <span class="flex items-center">
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-1 12a2 2 0 002 2h6a2 2 0 002-2L15 7" />
                    </svg>
                    {{ formatDate(post.fecha_publicacion) }}
                  </span>
                  <span class="flex items-center">
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {{ post.autor?.username || 'Anónimo' }}
                  </span>
                </div>
                
                <!-- Featured badge -->
                <div v-if="post.featured" class="flex items-center text-yellow-500">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </NuxtLink>
        </article>
      </div>

      <!-- Load More Button -->
      <div v-if="posts && posts.length > 0 && hasMore" class="text-center mt-12">
        <button 
          @click="loadMore"
          :disabled="loadingMore"
          class="btn btn-secondary"
        >
          <svg v-if="loadingMore" class="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ loadingMore ? 'Cargando...' : 'Cargar más artículos' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const tagSlug = route.params.slug as string
const tagName = tagSlug.replace(/-/g, ' ')

// Reactive data
const posts = ref([])
const pending = ref(true)
const error = ref(null)
const hasMore = ref(false)
const loadingMore = ref(false)
const page = ref(1)

// Meta tags
useHead({
  title: `Tag: ${tagName} - Blog de Noticias`,
  meta: [
    {
      name: 'description',
      content: `Explora todos los artículos relacionados con ${tagName} en nuestro blog de noticias.`
    },
    {
      name: 'robots',
      content: 'index, follow'
    }
  ]
})

// Structured data
useJsonld({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: `Tag: ${tagName}`,
  description: `Artículos relacionados con ${tagName}`,
  url: `https://tu-sitio.com/tag/${tagSlug}`,
  inLanguage: 'es-ES'
})

// Fetch posts for tag
const fetchPosts = async (pageNum = 1, append = false) => {
  try {
    if (!append) {
      pending.value = true
      error.value = null
    } else {
      loadingMore.value = true
    }

    // Simular llamada a API (reemplazar con llamada real)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock data - reemplazar con llamada real a la API
    const mockPosts = []
    
    if (!append) {
      posts.value = mockPosts
    } else {
      posts.value.push(...mockPosts)
    }
    
    hasMore.value = mockPosts.length === 12 // Assuming 12 posts per page
    
  } catch (err) {
    error.value = err
    console.error('Error fetching posts:', err)
  } finally {
    pending.value = false
    loadingMore.value = false
  }
}

// Load more posts
const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return
  
  page.value++
  await fetchPosts(page.value, true)
}

// Refresh data
const refresh = async () => {
  page.value = 1
  await fetchPosts()
}

// Format date helper
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Initialize
onMounted(() => {
  fetchPosts()
})

// Watch for route changes
watch(() => route.params.slug, () => {
  page.value = 1
  fetchPosts()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>