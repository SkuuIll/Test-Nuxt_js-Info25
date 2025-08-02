<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="text-center">
          <div class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200 mb-4">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Categoría
          </div>
          <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4 capitalize">
            {{ categoryData?.nombre || categoryName }}
          </h1>
          <p class="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {{ categoryData?.descripcion || `Explora todos los artículos de la categoría ${categoryName}` }}
          </p>
          <div v-if="categoryData" class="mt-4 text-sm text-gray-500 dark:text-gray-400">
            {{ totalPosts }} {{ totalPosts === 1 ? 'artículo' : 'artículos' }} en esta categoría
          </div>
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
            {{ error.statusCode === 404 ? 'Categoría no encontrada' : 'Error al cargar el contenido' }}
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            {{ error.statusCode === 404 
              ? 'La categoría que buscas no existe o ha sido eliminada.' 
              : 'No pudimos cargar los artículos para esta categoría.' 
            }}
          </p>
          <div class="space-x-4">
            <button 
              v-if="error.statusCode !== 404"
              @click="refresh()"
              class="btn btn-primary"
            >
              Intentar de nuevo
            </button>
            <NuxtLink to="/" class="btn btn-secondary">
              Ir al inicio
            </NuxtLink>
          </div>
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
            Aún no hay artículos publicados en la categoría "{{ categoryData?.nombre || categoryName }}".
          </p>
          <NuxtLink to="/" class="btn btn-primary">
            Explorar otros artículos
          </NuxtLink>
        </div>
      </div>

      <!-- Posts Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <PostCard 
          v-for="post in posts" 
          :key="post.id"
          :post="post"
          class="hover:shadow-lg transition-all duration-300"
        />
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
const { $api } = useNuxtApp()
const { success, error: showError } = useToast()

const categorySlug = route.params.slug as string
const categoryName = categorySlug.replace(/-/g, ' ')

// Reactive data
const categoryData = ref(null)
const posts = ref([])
const pending = ref(true)
const error = ref(null)
const hasMore = ref(false)
const loadingMore = ref(false)
const page = ref(1)
const totalPosts = ref(0)

// Meta tags
useHead({
  title: computed(() => `${categoryData.value?.nombre || categoryName} - Blog de Noticias`),
  meta: [
    {
      name: 'description',
      content: computed(() => categoryData.value?.descripcion || `Explora todos los artículos de la categoría ${categoryName} en nuestro blog de noticias.`)
    },
    {
      name: 'robots',
      content: 'index, follow'
    },
    {
      property: 'og:title',
      content: computed(() => `${categoryData.value?.nombre || categoryName} - Blog de Noticias`)
    },
    {
      property: 'og:description',
      content: computed(() => categoryData.value?.descripcion || `Explora todos los artículos de la categoría ${categoryName}`)
    },
    {
      property: 'og:type',
      content: 'website'
    }
  ]
})

// Structured data
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: computed(() => JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: categoryData.value?.nombre || categoryName,
        description: categoryData.value?.descripcion || `Artículos de la categoría ${categoryName}`,
        url: `${window.location.origin}/category/${categorySlug}`,
        inLanguage: 'es-ES',
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: totalPosts.value,
          itemListElement: posts.value.map((post, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
              '@type': 'Article',
              name: post.titulo,
              url: `${window.location.origin}/posts/${post.slug}`
            }
          }))
        }
      }))
    }
  ]
})

// Fetch category data and posts
const fetchCategoryData = async (pageNum = 1, append = false) => {
  try {
    if (!append) {
      pending.value = true
      error.value = null
    } else {
      loadingMore.value = true
    }

    // Fetch category info and posts
    const [categoryResponse, postsResponse] = await Promise.all([
      $api.get(`/categories/${categorySlug}/`).catch(() => null),
      $api.get('/posts/', {
        params: {
          category: categorySlug,
          page: pageNum,
          page_size: 12,
          ordering: '-fecha_publicacion'
        }
      })
    ])

    // Handle category data
    if (categoryResponse?.data) {
      categoryData.value = categoryResponse.data
    }

    // Handle posts data
    if (postsResponse?.data) {
      const newPosts = postsResponse.data.results || []
      
      if (!append) {
        posts.value = newPosts
      } else {
        posts.value.push(...newPosts)
      }
      
      totalPosts.value = postsResponse.data.count || 0
      hasMore.value = !!postsResponse.data.next
    }
    
  } catch (err: any) {
    error.value = err
    console.error('Error fetching category data:', err)
    
    // Show user-friendly error message
    if (err.response?.status === 404) {
      showError('Categoría no encontrada', 'La categoría que buscas no existe.')
    } else {
      showError('Error al cargar contenido', 'No se pudieron cargar los artículos de esta categoría.')
    }
  } finally {
    pending.value = false
    loadingMore.value = false
  }
}

// Load more posts
const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return
  
  page.value++
  await fetchCategoryData(page.value, true)
}

// Refresh data
const refresh = async () => {
  page.value = 1
  await fetchCategoryData()
}

// Initialize
onMounted(() => {
  fetchCategoryData()
})

// Watch for route changes
watch(() => route.params.slug, () => {
  page.value = 1
  fetchCategoryData()
})

// Handle 404 errors
onErrorCaptured((err) => {
  console.error('Category page error:', err)
  error.value = err
  return false
})
</script>

<style scoped>
.btn {
  @apply inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200;
}

.btn-primary {
  @apply text-white bg-primary-600 hover:bg-primary-700 focus:ring-primary-500;
}

.btn-secondary {
  @apply text-gray-700 bg-white border-gray-300 hover:bg-gray-50 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700;
}

.card {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden;
}
</style>