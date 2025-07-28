<template>
  <div class="container mx-auto px-4 py-8">
    <Breadcrumbs :items="[{ name: 'Artículos' }]" />
    
    <div class="flex flex-col lg:flex-row gap-8">
      <!-- Sidebar with Filters -->
      <aside class="lg:w-80 flex-shrink-0">
        <div class="sticky top-24">
          <CategoryFilter
            :categories="categories"
            :tags="tags"
            :total-posts="pagination.total"
            :initial-filters="currentFilters"
            @filter-change="handleFilterChange"
          />
        </div>
      </aside>
      
      <!-- Main Content -->
      <main class="flex-1">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              {{ pageTitle }}
            </h1>
            <p class="text-gray-600 dark:text-gray-400 mt-1">
              {{ pagination.total }} artículo{{ pagination.total !== 1 ? 's' : '' }}
              {{ currentFilters.search ? `para "${currentFilters.search}"` : '' }}
            </p>
          </div>
          
          <!-- Mobile Filter Toggle -->
          <button
            class="lg:hidden btn btn-secondary"
            @click="showMobileFilters = !showMobileFilters"
          >
            <Icon
              name="filter"
              class="w-4 h-4 mr-2"
            />
            Filtros
          </button>
        </div>
        
        <!-- Mobile Filters -->
        <div
          v-if="showMobileFilters"
          class="lg:hidden mb-6"
        >
          <CategoryFilter
            :categories="categories"
            :tags="tags"
            :total-posts="pagination.total"
            :initial-filters="currentFilters"
            @filter-change="handleFilterChange"
          />
        </div>
        
        <!-- Active Filters Summary -->
        <div
          v-if="hasActiveFilters"
          class="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
              Filtros activos:
            </span>
            <button
              class="text-sm text-primary-600 hover:text-primary-700"
              @click="clearAllFilters"
            >
              Limpiar todo
            </button>
          </div>
          <div class="flex flex-wrap gap-2">
            <span
              v-if="currentFilters.search"
              class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200"
            >
              Búsqueda: "{{ currentFilters.search }}"
              <button
                class="ml-2 hover:text-primary-600"
                @click="clearFilter('search')"
              >
                <Icon
                  name="x"
                  class="w-3 h-3"
                />
              </button>
            </span>
            
            <span
              v-if="currentFilters.category"
              class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            >
              Categoría: {{ getCategoryName(currentFilters.category) }}
              <button
                class="ml-2 hover:text-blue-600"
                @click="clearFilter('category')"
              >
                <Icon
                  name="x"
                  class="w-3 h-3"
                />
              </button>
            </span>
          </div>
        </div>
        
        <!-- Posts Grid -->
        <PostGrid
          :posts="posts"
          :loading="loading"
          :has-more="pagination.hasNext"
          :infinite-scroll="true"
          empty-title="No se encontraron artículos"
          empty-message="Intenta ajustar los filtros o buscar otros términos."
          @load-more="loadMorePosts"
        />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SearchFilters } from '~/types'

const blogStore = useBlogStore()
const route = useRoute()
const router = useRouter()

// Reactive state
const showMobileFilters = ref(false)
const currentFilters = ref<SearchFilters>({})

// Computed properties
const posts = computed(() => blogStore.posts)
const categories = computed(() => blogStore.categories)
const tags = computed(() => blogStore.tags || [])
const loading = computed(() => blogStore.loading)
const pagination = computed(() => blogStore.pagination)

const pageTitle = computed(() => {
  if (currentFilters.value.category) {
    const category = categories.value.find(cat => cat.slug === currentFilters.value.category)
    return `Artículos en ${category?.name || 'Categoría'}`
  }
  if (currentFilters.value.search) {
    return `Resultados de búsqueda`
  }
  return 'Todos los Artículos'
})

const hasActiveFilters = computed(() => {
  return Object.keys(currentFilters.value).length > 0
})

// Methods
const handleFilterChange = async (filters: SearchFilters) => {
  currentFilters.value = filters
  
  // Update URL
  await router.push({
    path: '/posts',
    query: filters
  })
  
  // Apply filters
  if (filters.search) {
    await blogStore.searchPosts(filters.search, filters)
  } else {
    await blogStore.fetchPosts(filters)
  }
  
  // Hide mobile filters after applying
  showMobileFilters.value = false
}

const clearFilter = async (filterKey: keyof SearchFilters) => {
  const newFilters = { ...currentFilters.value }
  delete newFilters[filterKey]
  await handleFilterChange(newFilters)
}

const clearAllFilters = async () => {
  await handleFilterChange({})
}

const loadMorePosts = async () => {
  if (currentFilters.value.search) {
    // Continue search with next page
    await blogStore.searchPosts(currentFilters.value.search, {
      ...currentFilters.value,
      page: pagination.value.page + 1
    })
  } else {
    // Continue regular posts fetch
    await blogStore.fetchPosts({
      ...currentFilters.value,
      page: pagination.value.page + 1
    })
  }
}

const getCategoryName = (slug: string) => {
  return categories.value.find(cat => cat.slug === slug)?.name || slug
}

// Initialize filters from URL
const initializeFilters = () => {
  const filters: SearchFilters = {}
  
  if (route.query.search) filters.search = route.query.search as string
  if (route.query.category) filters.category = route.query.category as string
  if (route.query.tags) {
    filters.tags = Array.isArray(route.query.tags) 
      ? route.query.tags as string[]
      : [route.query.tags as string]
  }
  if (route.query.ordering) filters.ordering = route.query.ordering as string
  if (route.query.date_from) filters.date_from = route.query.date_from as string
  if (route.query.date_to) filters.date_to = route.query.date_to as string
  
  return filters
}

// Initialize on mount
onMounted(async () => {
  // Load categories and tags
  await Promise.all([
    blogStore.fetchCategories(),
    // blogStore.fetchTags() // Uncomment when tags endpoint is ready
  ])
  
  // Initialize filters from URL
  const initialFilters = initializeFilters()
  currentFilters.value = initialFilters
  
  // Load posts with initial filters
  if (initialFilters.search) {
    await blogStore.searchPosts(initialFilters.search, initialFilters)
  } else {
    await blogStore.fetchPosts(initialFilters)
  }
})

// SEO
useHead({
  title: computed(() => `${pageTitle.value} - Blog de Noticias`),
  meta: [
    { 
      name: 'description', 
      content: computed(() => 
        currentFilters.value.search 
          ? `Resultados de búsqueda para "${currentFilters.value.search}" en nuestro blog de noticias.`
          : 'Explora todos nuestros artículos y noticias. Encuentra contenido relevante y actualizado.'
      )
    }
  ]
})
</script>