<template>
  <div class="container mx-auto px-4 py-8">
    <Breadcrumbs :items="[{ name: 'Búsqueda' }]" />
    
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Buscar Artículos
      </h1>
      
      <!-- Search Form -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <form @submit.prevent="performSearch">
          <div class="flex gap-4 mb-4">
            <div class="flex-1">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Buscar artículos..."
                class="input w-full"
                autofocus
              >
            </div>
            <button
              type="submit"
              :disabled="!searchQuery.trim() || loading"
              class="btn btn-primary px-6"
            >
              <Icon
                v-if="loading"
                name="loading"
                class="w-4 h-4 animate-spin mr-2"
              />
              Buscar
            </button>
          </div>
          
          <!-- Filters -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Categoría
              </label>
              <select
                v-model="filters.category"
                class="input w-full"
              >
                <option value="">
                  Todas las categorías
                </option>
                <option
                  v-for="category in categories"
                  :key="category.id"
                  :value="category.slug"
                >
                  {{ category.name }}
                </option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ordenar por
              </label>
              <select
                v-model="filters.ordering"
                class="input w-full"
              >
                <option value="-published_at">
                  Más recientes
                </option>
                <option value="published_at">
                  Más antiguos
                </option>
                <option value="title">
                  Título A-Z
                </option>
                <option value="-title">
                  Título Z-A
                </option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha
              </label>
              <select
                v-model="dateFilter"
                class="input w-full"
                @change="updateDateFilter"
              >
                <option value="">
                  Cualquier fecha
                </option>
                <option value="today">
                  Hoy
                </option>
                <option value="week">
                  Esta semana
                </option>
                <option value="month">
                  Este mes
                </option>
                <option value="year">
                  Este año
                </option>
              </select>
            </div>
          </div>
        </form>
      </div>
      
      <!-- Search Results -->
      <div v-if="hasSearched">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            Resultados de búsqueda
            <span
              v-if="searchQuery"
              class="text-gray-600 dark:text-gray-400 font-normal"
            >
              para "{{ searchQuery }}"
            </span>
          </h2>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ pagination.total }} resultado{{ pagination.total !== 1 ? 's' : '' }}
          </p>
        </div>
        
        <div
          v-if="posts.length > 0"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <PostCard
            v-for="post in posts"
            :key="post.id"
            :post="post"
            :show-excerpt="true"
            :show-category="true"
            :show-author="true"
            :show-date="true"
          />
        </div>
        
        <div
          v-else-if="!loading"
          class="text-center py-12"
        >
          <Icon
            name="search"
            class="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4"
          />
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No se encontraron resultados
          </h3>
          <p class="text-gray-600 dark:text-gray-400">
            Intenta con otros términos de búsqueda o ajusta los filtros.
          </p>
        </div>
        
        <!-- Pagination -->
        <div
          v-if="pagination.total > pagination.pageSize"
          class="mt-8 flex justify-center"
        >
          <button
            v-if="pagination.hasPrevious"
            class="btn btn-secondary mr-2"
            @click="loadPage(pagination.page - 1)"
          >
            Anterior
          </button>
          <button
            v-if="pagination.hasNext"
            class="btn btn-secondary"
            @click="loadPage(pagination.page + 1)"
          >
            Siguiente
          </button>
        </div>
      </div>
      
      <!-- Loading State -->
      <div
        v-if="loading"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <PostCardSkeleton
          v-for="i in 6"
          :key="i"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const blogStore = useBlogStore()
const route = useRoute()

const searchQuery = ref(route.query.q as string || '')
const hasSearched = ref(false)
const dateFilter = ref('')

const filters = reactive({
  category: route.query.category as string || '',
  ordering: route.query.ordering as string || '-published_at'
})

const posts = computed(() => blogStore.posts)
const categories = computed(() => blogStore.categories)
const loading = computed(() => blogStore.loading)
const pagination = computed(() => blogStore.pagination)

const performSearch = async () => {
  if (!searchQuery.value.trim()) return
  
  hasSearched.value = true
  
  // Update URL
  await navigateTo({
    path: '/search',
    query: {
      q: searchQuery.value,
      ...filters
    }
  })
  
  // Perform search
  await blogStore.searchPosts(searchQuery.value, filters)
}

const updateDateFilter = () => {
  const now = new Date()
  
  switch (dateFilter.value) {
    case 'today':
      filters.date_from = now.toISOString().split('T')[0]
      break
    case 'week':
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      filters.date_from = weekAgo.toISOString().split('T')[0]
      break
    case 'month':
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
      filters.date_from = monthAgo.toISOString().split('T')[0]
      break
    case 'year':
      const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
      filters.date_from = yearAgo.toISOString().split('T')[0]
      break
    default:
      delete filters.date_from
  }
}

const loadPage = async (page: number) => {
  await blogStore.searchPosts(searchQuery.value, { ...filters, page })
}

// Initialize search if query params exist
onMounted(async () => {
  await blogStore.fetchCategories()
  
  if (route.query.q) {
    hasSearched.value = true
    await blogStore.searchPosts(searchQuery.value, filters)
  }
})

// SEO
useHead({
  title: searchQuery.value 
    ? `Búsqueda: ${searchQuery.value} - Blog de Noticias`
    : 'Buscar Artículos - Blog de Noticias',
  meta: [
    { 
      name: 'description', 
      content: searchQuery.value 
        ? `Resultados de búsqueda para "${searchQuery.value}" en nuestro blog de noticias.`
        : 'Busca artículos y noticias en nuestro blog. Encuentra contenido relevante y actualizado.'
    },
    { name: 'robots', content: searchQuery.value ? 'noindex, follow' : 'index, follow' }
  ]
})
</script>