<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      Filtros
    </h3>
    
    <!-- Search Input -->
    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Buscar
      </label>
      <div class="relative">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar artículos..."
          class="input w-full pl-10"
          @input="debouncedSearch"
        >
        <Icon
          name="search"
          class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
        />
        <button
          v-if="searchQuery"
          class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          @click="clearSearch"
        >
          <Icon
            name="x"
            class="w-4 h-4"
          />
        </button>
      </div>
    </div>

    <!-- Categories -->
    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Categorías
      </label>
      <div class="space-y-2 max-h-48 overflow-y-auto">
        <label class="flex items-center">
          <input
            v-model="selectedCategories"
            type="checkbox"
            value=""
            class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          >
          <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
            Todas las categorías
          </span>
          <span
            v-if="totalPosts"
            class="ml-auto text-xs text-gray-500"
          >
            {{ totalPosts }}
          </span>
        </label>
        
        <label
          v-for="category in categories"
          :key="category.id"
          class="flex items-center"
        >
          <input
            v-model="selectedCategories"
            type="checkbox"
            :value="category.slug"
            class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          >
          <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
            {{ category.name }}
          </span>
          <span class="ml-auto text-xs text-gray-500">
            {{ category.posts_count }}
          </span>
        </label>
      </div>
    </div>

    <!-- Tags -->
    <div
      v-if="tags.length > 0"
      class="mb-6"
    >
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Etiquetas
      </label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="tag in tags"
          :key="tag.id"
          :class="[
            'px-3 py-1 rounded-full text-xs font-medium transition-colors',
            selectedTags.includes(tag.slug)
              ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          ]"
          @click="toggleTag(tag.slug)"
        >
          {{ tag.name }}
        </button>
      </div>
    </div>

    <!-- Date Range -->
    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Fecha
      </label>
      <select
        v-model="dateRange"
        class="input w-full"
        @change="updateDateRange"
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
        <option value="custom">
          Rango personalizado
        </option>
      </select>
      
      <!-- Custom Date Range -->
      <div
        v-if="dateRange === 'custom'"
        class="mt-3 space-y-2"
      >
        <div>
          <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            Desde
          </label>
          <input
            v-model="customDateFrom"
            type="date"
            class="input w-full"
            @change="applyFilters"
          >
        </div>
        <div>
          <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            Hasta
          </label>
          <input
            v-model="customDateTo"
            type="date"
            class="input w-full"
            @change="applyFilters"
          >
        </div>
      </div>
    </div>

    <!-- Sort Options -->
    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Ordenar por
      </label>
      <select
        v-model="sortBy"
        class="input w-full"
        @change="applyFilters"
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
        <option value="-reading_time">
          Más largos
        </option>
        <option value="reading_time">
          Más cortos
        </option>
      </select>
    </div>

    <!-- Actions -->
    <div class="flex space-x-3">
      <button
        class="btn btn-primary flex-1"
        @click="applyFilters"
      >
        Aplicar Filtros
      </button>
      <button
        class="btn btn-secondary"
        @click="clearAllFilters"
      >
        Limpiar
      </button>
    </div>

    <!-- Active Filters Summary -->
    <div
      v-if="hasActiveFilters"
      class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
    >
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Filtros activos
        </span>
        <button
          class="text-xs text-primary-600 hover:text-primary-700"
          @click="clearAllFilters"
        >
          Limpiar todo
        </button>
      </div>
      <div class="flex flex-wrap gap-1">
        <span
          v-if="searchQuery"
          class="inline-flex items-center px-2 py-1 rounded text-xs bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200"
        >
          "{{ searchQuery }}"
          <button
            class="ml-1 hover:text-primary-600"
            @click="clearSearch"
          >
            <Icon
              name="x"
              class="w-3 h-3"
            />
          </button>
        </span>
        
        <span
          v-for="category in selectedCategoryNames"
          :key="category"
          class="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
        >
          {{ category }}
        </span>
        
        <span
          v-for="tag in selectedTagNames"
          :key="tag"
          class="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
        >
          {{ tag }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Category, Tag, SearchFilters } from '~/types'

interface Props {
  categories: Category[]
  tags?: Tag[]
  totalPosts?: number
  initialFilters?: SearchFilters
}

interface Emits {
  (e: 'filter-change', filters: SearchFilters): void
}

const props = withDefaults(defineProps<Props>(), {
  tags: () => [],
  totalPosts: 0,
  initialFilters: () => ({})
})

const emit = defineEmits<Emits>()

// Reactive state
const searchQuery = ref(props.initialFilters.search || '')
const selectedCategories = ref<string[]>(
  props.initialFilters.category ? [props.initialFilters.category] : []
)
const selectedTags = ref<string[]>(props.initialFilters.tags || [])
const dateRange = ref('')
const customDateFrom = ref('')
const customDateTo = ref('')
const sortBy = ref(props.initialFilters.ordering || '-published_at')

// Computed properties
const selectedCategoryNames = computed(() => {
  return selectedCategories.value
    .map(slug => props.categories.find(cat => cat.slug === slug)?.name)
    .filter(Boolean) as string[]
})

const selectedTagNames = computed(() => {
  return selectedTags.value
    .map(slug => props.tags.find(tag => tag.slug === slug)?.name)
    .filter(Boolean) as string[]
})

const hasActiveFilters = computed(() => {
  return searchQuery.value ||
         selectedCategories.value.length > 0 ||
         selectedTags.value.length > 0 ||
         dateRange.value ||
         sortBy.value !== '-published_at'
})

// Methods
const toggleTag = (tagSlug: string) => {
  const index = selectedTags.value.indexOf(tagSlug)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tagSlug)
  }
  applyFilters()
}

const updateDateRange = () => {
  const now = new Date()
  
  switch (dateRange.value) {
    case 'today':
      customDateFrom.value = now.toISOString().split('T')[0]
      customDateTo.value = now.toISOString().split('T')[0]
      break
    case 'week':
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      customDateFrom.value = weekAgo.toISOString().split('T')[0]
      customDateTo.value = now.toISOString().split('T')[0]
      break
    case 'month':
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
      customDateFrom.value = monthAgo.toISOString().split('T')[0]
      customDateTo.value = now.toISOString().split('T')[0]
      break
    case 'year':
      const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
      customDateFrom.value = yearAgo.toISOString().split('T')[0]
      customDateTo.value = now.toISOString().split('T')[0]
      break
    case '':
      customDateFrom.value = ''
      customDateTo.value = ''
      break
  }
  
  if (dateRange.value !== 'custom') {
    applyFilters()
  }
}

const applyFilters = () => {
  const filters: SearchFilters = {
    search: searchQuery.value || undefined,
    category: selectedCategories.value.length === 1 ? selectedCategories.value[0] : undefined,
    tags: selectedTags.value.length > 0 ? selectedTags.value : undefined,
    ordering: sortBy.value,
    date_from: customDateFrom.value || undefined,
    date_to: customDateTo.value || undefined
  }
  
  // Remove undefined values
  Object.keys(filters).forEach(key => {
    if (filters[key as keyof SearchFilters] === undefined) {
      delete filters[key as keyof SearchFilters]
    }
  })
  
  emit('filter-change', filters)
}

const clearSearch = () => {
  searchQuery.value = ''
  applyFilters()
}

const clearAllFilters = () => {
  searchQuery.value = ''
  selectedCategories.value = []
  selectedTags.value = []
  dateRange.value = ''
  customDateFrom.value = ''
  customDateTo.value = ''
  sortBy.value = '-published_at'
  applyFilters()
}

// Debounced search
const debouncedSearch = useDebounceFn(() => {
  applyFilters()
}, 500)

// Watch for category changes
watch(selectedCategories, () => {
  applyFilters()
})
</script>