<template>
  <div class="relative">
    <div class="relative">
      <Icon
        name="search"
        class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
      />
      <input
        v-model="query"
        type="text"
        placeholder="Buscar artículos..."
        class="input pl-10 pr-10"
        @input="handleInput"
        @focus="showResults = true"
        @keydown.escape="clearSearch"
        @keydown.enter="performSearch"
      >
      <button
        v-if="query"
        class="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        @click="clearSearch"
      >
        <Icon
          name="x"
          class="w-4 h-4 text-gray-400"
        />
      </button>
    </div>

    <!-- Search Results Dropdown -->
    <Transition name="search-results">
      <div
        v-if="showResults && (suggestions.length > 0 || loading)"
        class="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto z-50"
      >
        <!-- Loading State -->
        <div
          v-if="loading"
          class="p-4"
        >
          <div class="flex items-center space-x-2">
            <div class="animate-spin w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full" />
            <span class="text-sm text-gray-600 dark:text-gray-400">Buscando...</span>
          </div>
        </div>

        <!-- Search Suggestions -->
        <div
          v-else-if="suggestions.length > 0"
          class="py-2"
        >
          <div class="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Resultados ({{ suggestions.length }})
          </div>
          
          <NuxtLink
            v-for="post in suggestions"
            :key="post.id"
            :to="`/posts/${post.slug}`"
            class="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            @click="selectResult(post)"
          >
            <div class="flex items-start space-x-3">
              <div
                v-if="post.image"
                class="flex-shrink-0"
              >
                <NuxtImg
                  :src="post.image"
                  :alt="post.title"
                  class="w-12 h-12 object-cover rounded"
                  loading="lazy"
                />
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {{ post.title }}
                </h4>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {{ post.excerpt }}
                </p>
                <div class="flex items-center space-x-2 mt-2">
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                    {{ post.category.name }}
                  </span>
                  <span class="text-xs text-gray-400">
                    {{ formatDate(post.published_at || post.created_at) }}
                  </span>
                </div>
              </div>
            </div>
          </NuxtLink>

          <!-- View All Results -->
          <div
            v-if="suggestions.length >= 5"
            class="border-t border-gray-200 dark:border-gray-700 px-4 py-2"
          >
            <button
              class="w-full text-left text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
              @click="viewAllResults"
            >
              Ver todos los resultados para "{{ query }}"
            </button>
          </div>
        </div>

        <!-- No Results -->
        <div
          v-else-if="query && !loading"
          class="p-4 text-center"
        >
          <Icon
            name="search"
            class="w-8 h-8 text-gray-400 mx-auto mb-2"
          />
          <p class="text-sm text-gray-600 dark:text-gray-400">
            No se encontraron resultados para "{{ query }}"
          </p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { Post } from '~/types'

// Props
interface Props {
  placeholder?: string
  autoFocus?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Buscar artículos...',
  autoFocus: false
})

// State
const query = ref('')
const suggestions = ref<Post[]>([])
const loading = ref(false)
const showResults = ref(false)

// Debounced search
const debouncedSearch = useDebounceFn(async (searchQuery: string) => {
  if (!searchQuery.trim()) {
    suggestions.value = []
    return
  }

  try {
    loading.value = true
    const api = useApi()
    const response = await api.searchPosts(searchQuery)
    suggestions.value = response.results.slice(0, 5) // Show max 5 suggestions
  } catch (error) {
    console.error('Search error:', error)
    suggestions.value = []
  } finally {
    loading.value = false
  }
}, 300)

// Methods
const handleInput = () => {
  debouncedSearch(query.value)
}

const performSearch = () => {
  if (query.value.trim()) {
    navigateTo(`/search?q=${encodeURIComponent(query.value)}`)
    showResults.value = false
  }
}

const selectResult = (post: Post) => {
  showResults.value = false
  query.value = ''
}

const viewAllResults = () => {
  performSearch()
}

const clearSearch = () => {
  query.value = ''
  suggestions.value = []
  showResults.value = false
}

// Utility function
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Close results when clicking outside
// onClickOutside will be implemented when needed

// Auto focus if requested
onMounted(() => {
  if (props.autoFocus) {
    nextTick(() => {
      const input = document.querySelector('input[type="text"]') as HTMLInputElement
      input?.focus()
    })
  }
})
</script>

<style scoped>
.search-results-enter-active,
.search-results-leave-active {
  transition: all 0.2s ease;
}

.search-results-enter-from,
.search-results-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>