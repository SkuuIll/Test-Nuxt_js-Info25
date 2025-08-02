# Category Pages System

## Overview

The category pages system provides dynamic routing and content display for blog post categories, with proper error handling, SEO optimization, and responsive design.

## Architecture

### Page Component

#### Category Page
Dynamic page component for displaying posts by category.

**Location**: `pages/category/[slug].vue`

**Features**:
- Dynamic route parameters
- Server-side rendering support
- SEO meta tag generation
- Pagination support
- Search functionality
- Error state handling
- Loading states
- Empty state display

### Route Structure
```
/category/[slug]
├── /category/technology
├── /category/science
├── /category/health
└── /category/sports
```

### Query Parameters
```typescript
interface CategoryQuery {
  page?: string        // Pagination
  search?: string      // Search within category
  sort?: string        // Sort order
  limit?: string       // Posts per page
}
```

## Implementation

### Page Component Structure
```vue
<template>
  <div class="category-page">
    <!-- Category Header -->
    <CategoryHeader 
      :category="currentCategory"
      :post-count="totalPosts"
    />
    
    <!-- Search and Filters -->
    <CategoryFilters
      v-model:search="searchQuery"
      v-model:sort="sortOrder"
      @update="handleFiltersUpdate"
    />
    
    <!-- Loading State -->
    <LoadingSpinner v-if="loading" />
    
    <!-- Error State -->
    <ErrorMessage 
      v-else-if="error"
      :error="error"
      @retry="fetchPosts"
    />
    
    <!-- Empty State -->
    <EmptyState 
      v-else-if="posts.length === 0"
      message="No posts found in this category"
    />
    
    <!-- Posts Grid -->
    <PostsGrid 
      v-else
      :posts="posts"
      :loading="loading"
    />
    
    <!-- Pagination -->
    <Pagination
      v-if="totalPages > 1"
      :current-page="currentPage"
      :total-pages="totalPages"
      @page-change="handlePageChange"
    />
  </div>
</template>

<script setup>
// Component implementation
</script>
```

### Data Fetching
```typescript
// Composable usage
const route = useRoute()
const blogStore = useBlogStore()

const categorySlug = computed(() => route.params.slug as string)
const currentPage = computed(() => parseInt(route.query.page as string) || 1)
const searchQuery = computed(() => route.query.search as string || '')

// Fetch posts when route changes
watch([categorySlug, currentPage, searchQuery], async () => {
  await fetchCategoryPosts()
}, { immediate: true })

const fetchCategoryPosts = async () => {
  try {
    loading.value = true
    error.value = null
    
    const response = await blogStore.fetchPostsByCategory(categorySlug.value, {
      page: currentPage.value,
      page_size: 12,
      search: searchQuery.value
    })
    
    posts.value = response.results
    totalPosts.value = response.count
    totalPages.value = Math.ceil(response.count / 12)
  } catch (err) {
    error.value = err.message
    handleError(err)
  } finally {
    loading.value = false
  }
}
```

## SEO Optimization

### Meta Tags
```typescript
// SEO setup
const currentCategory = computed(() => 
  blogStore.categories.value.find(cat => cat.slug === categorySlug.value)
)

useHead({
  title: computed(() => 
    currentCategory.value 
      ? `${currentCategory.value.nombre} - Blog`
      : 'Category - Blog'
  ),
  meta: [
    {
      name: 'description',
      content: computed(() => 
        currentCategory.value?.descripcion || 
        `Posts in ${categorySlug.value} category`
      )
    }
  ]
})

useSeoMeta({
  title: computed(() => currentCategory.value?.nombre),
  description: computed(() => currentCategory.value?.descripcion),
  ogTitle: computed(() => currentCategory.value?.nombre),
  ogDescription: computed(() => currentCategory.value?.descripcion),
  ogType: 'website',
  twitterCard: 'summary'
})
```

### Structured Data
```typescript
// JSON-LD structured data
const structuredData = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: currentCategory.value?.nombre,
  description: currentCategory.value?.descripcion,
  url: `${$config.public.siteUrl}/category/${categorySlug.value}`,
  mainEntity: {
    '@type': 'ItemList',
    numberOfItems: totalPosts.value,
    itemListElement: posts.value.map((post, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'BlogPosting',
        headline: post.titulo,
        url: `${$config.public.siteUrl}/posts/${post.slug}`
      }
    }))
  }
}))

useJsonld(structuredData)
```

## Error Handling

### Error States
```typescript
interface CategoryError {
  type: 'not-found' | 'network' | 'server' | 'validation'
  message: string
  statusCode?: number
  recoverable: boolean
}

const handleError = (error: Error) => {
  const errorRecovery = useErrorRecovery()
  
  if (error.statusCode === 404) {
    // Category not found
    throw createError({
      statusCode: 404,
      statusMessage: 'Category not found'
    })
  } else {
    // Other errors - show recovery options
    errorRecovery.handleError(error, 'network', {
      operation: 'fetchCategoryPosts',
      category: categorySlug.value,
      retryAction: fetchCategoryPosts
    })
  }
}
```

### Fallback Strategies
```typescript
// Graceful degradation
const handleCategoryNotFound = () => {
  // Redirect to categories index
  navigateTo('/categories')
  
  // Show helpful message
  const toast = useToast()
  toast.warning('Category not found. Showing all categories instead.')
}

// Offline support
const handleOfflineError = () => {
  // Show cached posts if available
  const cachedPosts = getCachedPosts(categorySlug.value)
  if (cachedPosts.length > 0) {
    posts.value = cachedPosts
    showOfflineNotice()
  }
}
```

## Pagination

### Implementation
```typescript
const handlePageChange = (page: number) => {
  navigateTo({
    path: route.path,
    query: {
      ...route.query,
      page: page.toString()
    }
  })
}

// URL-based pagination
const currentPage = computed(() => {
  const page = parseInt(route.query.page as string)
  return isNaN(page) || page < 1 ? 1 : page
})

// Pagination info
const paginationInfo = computed(() => ({
  currentPage: currentPage.value,
  totalPages: totalPages.value,
  totalPosts: totalPosts.value,
  postsPerPage: 12,
  hasNextPage: currentPage.value < totalPages.value,
  hasPrevPage: currentPage.value > 1
}))
```

### Pagination Component
```vue
<template>
  <nav class="pagination" aria-label="Category posts pagination">
    <button
      :disabled="!hasPrevPage"
      @click="$emit('page-change', currentPage - 1)"
      class="pagination-btn"
    >
      Previous
    </button>
    
    <div class="pagination-pages">
      <button
        v-for="page in visiblePages"
        :key="page"
        :class="{ active: page === currentPage }"
        @click="$emit('page-change', page)"
        class="pagination-page"
      >
        {{ page }}
      </button>
    </div>
    
    <button
      :disabled="!hasNextPage"
      @click="$emit('page-change', currentPage + 1)"
      class="pagination-btn"
    >
      Next
    </button>
  </nav>
</template>
```

## Search Functionality

### Search Implementation
```typescript
const searchQuery = ref('')
const searchDebounced = debounce(searchQuery, 500)

// Watch for search changes
watch(searchDebounced, (newQuery) => {
  navigateTo({
    path: route.path,
    query: {
      ...route.query,
      search: newQuery || undefined,
      page: undefined // Reset to first page
    }
  })
})

// Search within category
const performSearch = async (query: string) => {
  const response = await blogStore.fetchPostsByCategory(categorySlug.value, {
    page: 1,
    page_size: 12,
    search: query
  })
  
  posts.value = response.results
  totalPosts.value = response.count
  
  // Update URL
  navigateTo({
    path: route.path,
    query: {
      ...route.query,
      search: query,
      page: undefined
    }
  })
}
```

### Search UI
```vue
<template>
  <div class="search-container">
    <div class="search-input-wrapper">
      <input
        v-model="searchQuery"
        type="search"
        placeholder="Search posts in this category..."
        class="search-input"
        @input="handleSearchInput"
      />
      <Icon name="search" class="search-icon" />
    </div>
    
    <div v-if="searchQuery" class="search-info">
      Found {{ totalPosts }} posts for "{{ searchQuery }}"
      <button @click="clearSearch" class="clear-search">
        Clear
      </button>
    </div>
  </div>
</template>
```

## Performance Optimization

### Caching Strategy
```typescript
// Cache category data
const categoryCache = new Map()

const getCachedCategory = (slug: string) => {
  const cached = categoryCache.get(slug)
  if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
    return cached.data
  }
  return null
}

const setCachedCategory = (slug: string, data: any) => {
  categoryCache.set(slug, {
    data,
    timestamp: Date.now()
  })
}
```

### Lazy Loading
```typescript
// Lazy load images in posts
const { $img } = useNuxtApp()

const optimizeImage = (src: string, options = {}) => {
  return $img(src, {
    width: 400,
    height: 300,
    fit: 'cover',
    format: 'webp',
    quality: 80,
    ...options
  })
}
```

### Prefetching
```typescript
// Prefetch next page
const prefetchNextPage = () => {
  if (hasNextPage.value) {
    blogStore.prefetchPostsByCategory(categorySlug.value, {
      page: currentPage.value + 1,
      page_size: 12
    })
  }
}

// Prefetch on scroll
const { y } = useWindowScroll()
watch(y, (scrollY) => {
  const threshold = document.body.scrollHeight * 0.8
  if (scrollY > threshold) {
    prefetchNextPage()
  }
})
```

## Accessibility

### ARIA Labels
```vue
<template>
  <main role="main" aria-labelledby="category-title">
    <h1 id="category-title">
      {{ currentCategory?.nombre }} Posts
    </h1>
    
    <div 
      role="region" 
      aria-label="Category posts"
      aria-live="polite"
      aria-busy="loading"
    >
      <!-- Posts content -->
    </div>
  </main>
</template>
```

### Keyboard Navigation
```typescript
// Handle keyboard navigation
const handleKeydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'ArrowLeft':
      if (hasPrevPage.value) {
        handlePageChange(currentPage.value - 1)
      }
      break
    case 'ArrowRight':
      if (hasNextPage.value) {
        handlePageChange(currentPage.value + 1)
      }
      break
    case '/':
      event.preventDefault()
      focusSearchInput()
      break
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
```

## Testing

### Page Testing
```typescript
describe('Category Page', () => {
  it('displays posts for valid category', async () => {
    const wrapper = mount(CategoryPage, {
      global: {
        mocks: {
          $route: {
            params: { slug: 'technology' },
            query: {}
          }
        }
      }
    })
    
    await flushPromises()
    
    expect(wrapper.find('[data-testid="category-header"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-testid="post-card"]').length).toBeGreaterThan(0)
  })
  
  it('handles category not found', async () => {
    // Mock 404 response
    mockApi.fetchPostsByCategory.mockRejectedValue(
      createError({ statusCode: 404 })
    )
    
    const wrapper = mount(CategoryPage, {
      global: {
        mocks: {
          $route: {
            params: { slug: 'nonexistent' },
            query: {}
          }
        }
      }
    })
    
    await flushPromises()
    
    expect(wrapper.find('[data-testid="error-message"]').exists()).toBe(true)
  })
})
```

### E2E Testing
```typescript
// Playwright test
test('category navigation works', async ({ page }) => {
  await page.goto('/category/technology')
  
  // Check page loads
  await expect(page.locator('h1')).toContainText('Technology')
  
  // Check posts display
  await expect(page.locator('[data-testid="post-card"]')).toHaveCount(12)
  
  // Test pagination
  await page.click('[data-testid="next-page"]')
  await expect(page).toHaveURL(/page=2/)
  
  // Test search
  await page.fill('[data-testid="search-input"]', 'AI')
  await expect(page.locator('[data-testid="search-info"]')).toBeVisible()
})
```

## Configuration

### Route Configuration
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  router: {
    options: {
      strict: true
    }
  },
  
  nitro: {
    prerender: {
      routes: [
        '/category/technology',
        '/category/science',
        '/category/health'
      ]
    }
  }
})
```

### Category Settings
```typescript
// Category configuration
interface CategoryConfig {
  postsPerPage: number
  enableSearch: boolean
  enablePagination: boolean
  cacheTimeout: number
  prefetchNextPage: boolean
}

const categoryConfig: CategoryConfig = {
  postsPerPage: 12,
  enableSearch: true,
  enablePagination: true,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
  prefetchNextPage: true
}
```

## Best Practices

### URL Structure
- Use SEO-friendly slugs
- Maintain consistent URL patterns
- Handle URL parameters properly
- Implement proper redirects

### Performance
- Implement proper caching
- Use lazy loading for images
- Prefetch next page content
- Optimize bundle size

### User Experience
- Show loading states
- Handle empty states gracefully
- Provide clear error messages
- Implement search functionality

### SEO
- Generate proper meta tags
- Implement structured data
- Use semantic HTML
- Optimize for Core Web Vitals