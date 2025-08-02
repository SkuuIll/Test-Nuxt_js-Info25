# Pinia Store Patterns

## Overview

This document outlines the safe initialization patterns and best practices for Pinia stores in the application, focusing on preventing readonly property warnings and ensuring proper SSR/client hydration.

## Common Issues Resolved

### Readonly Property Warnings
The application was experiencing warnings about readonly properties being modified during store initialization. This was resolved by implementing proper initialization patterns.

### SSR Hydration Mismatches
Stores needed to handle server-side rendering and client-side hydration safely without causing mismatches.

## Store Architecture

### Base Store Pattern
```typescript
// stores/base.ts
export const useBaseStore = defineStore('base', () => {
  // State
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // Safe initialization flag
  const initialized = ref(false)
  
  // Actions
  const initialize = async () => {
    if (initialized.value) return
    
    try {
      loading.value = true
      error.value = null
      
      // Initialization logic here
      await performInitialization()
      
      initialized.value = true
    } catch (err) {
      error.value = err.message
      console.error('Store initialization failed:', err)
    } finally {
      loading.value = false
    }
  }
  
  // Reset store state
  const reset = () => {
    loading.value = false
    error.value = null
    initialized.value = false
  }
  
  return {
    // State (wrapped in readonly for external access)
    loading: readonly(loading),
    error: readonly(error),
    initialized: readonly(initialized),
    
    // Actions
    initialize,
    reset
  }
})
```

### Auth Store Implementation
```typescript
// stores/auth.ts
export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const tokens = ref<AuthTokens | null>(null)
  const isAuthenticated = computed(() => !!user.value && !!tokens.value)
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // Client-side only state
  const clientInitialized = ref(false)
  
  // Safe initialization
  const initializeAuth = async () => {
    // Only run on client side
    if (!process.client) return
    
    // Prevent multiple initializations
    if (clientInitialized.value) return
    
    try {
      loading.value = true
      error.value = null
      
      // Check for stored tokens
      const storedTokens = getStoredTokens()
      if (storedTokens) {
        tokens.value = storedTokens
        
        // Validate tokens and get user info
        const userData = await validateTokens(storedTokens)
        if (userData) {
          user.value = userData
        } else {
          // Invalid tokens, clear them
          clearStoredTokens()
          tokens.value = null
        }
      }
      
      clientInitialized.value = true
    } catch (err) {
      error.value = err.message
      console.error('Auth initialization failed:', err)
    } finally {
      loading.value = false
    }
  }
  
  // Login action
  const login = async (credentials: LoginCredentials) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await authApi.login(credentials)
      
      // Store tokens
      tokens.value = response.tokens
      user.value = response.user
      
      // Persist tokens (client-side only)
      if (process.client) {
        storeTokens(response.tokens)
      }
      
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // Logout action
  const logout = async () => {
    try {
      loading.value = true
      
      // Call logout API if tokens exist
      if (tokens.value) {
        await authApi.logout(tokens.value.refresh)
      }
    } catch (err) {
      console.warn('Logout API call failed:', err)
    } finally {
      // Always clear local state
      user.value = null
      tokens.value = null
      
      // Clear stored tokens (client-side only)
      if (process.client) {
        clearStoredTokens()
      }
      
      loading.value = false
      error.value = null
    }
  }
  
  return {
    // State (readonly for external access)
    user: readonly(user),
    tokens: readonly(tokens),
    isAuthenticated,
    loading: readonly(loading),
    error: readonly(error),
    clientInitialized: readonly(clientInitialized),
    
    // Actions
    initializeAuth,
    login,
    logout
  }
})
```

### UI Store Implementation
```typescript
// stores/ui.ts
export const useUIStore = defineStore('ui', () => {
  // Theme state
  const theme = ref<'light' | 'dark'>('light')
  const sidebarOpen = ref(false)
  
  // Window size state (client-side only)
  const windowSize = ref({ width: 1024, height: 768 })
  const scrollPosition = ref({ x: 0, y: 0 })
  
  // Initialization flags
  const themeInitialized = ref(false)
  const windowInitialized = ref(false)
  
  // Theme initialization
  const initializeTheme = () => {
    if (!process.client || themeInitialized.value) return
    
    try {
      // Check for stored theme preference
      const storedTheme = localStorage.getItem('theme')
      if (storedTheme && ['light', 'dark'].includes(storedTheme)) {
        theme.value = storedTheme as 'light' | 'dark'
      } else {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        theme.value = prefersDark ? 'dark' : 'light'
      }
      
      // Apply theme to document
      document.documentElement.setAttribute('data-theme', theme.value)
      
      themeInitialized.value = true
    } catch (err) {
      console.warn('Theme initialization failed:', err)
    }
  }
  
  // Window size initialization
  const initializeWindowSize = () => {
    if (!process.client || windowInitialized.value) return
    
    try {
      // Set initial window size
      windowSize.value = {
        width: window.innerWidth,
        height: window.innerHeight
      }
      
      // Listen for resize events
      const handleResize = () => {
        windowSize.value = {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }
      
      window.addEventListener('resize', handleResize)
      
      // Listen for scroll events
      const handleScroll = () => {
        scrollPosition.value = {
          x: window.scrollX,
          y: window.scrollY
        }
      }
      
      window.addEventListener('scroll', handleScroll, { passive: true })
      
      windowInitialized.value = true
    } catch (err) {
      console.warn('Window size initialization failed:', err)
    }
  }
  
  // Set theme
  const setTheme = (newTheme: 'light' | 'dark') => {
    theme.value = newTheme
    
    if (process.client) {
      localStorage.setItem('theme', newTheme)
      document.documentElement.setAttribute('data-theme', newTheme)
    }
  }
  
  // Toggle sidebar
  const toggleSidebar = () => {
    sidebarOpen.value = !sidebarOpen.value
  }
  
  return {
    // State (readonly for external access)
    theme: readonly(theme),
    sidebarOpen: readonly(sidebarOpen),
    windowSize: readonly(windowSize),
    scrollPosition: readonly(scrollPosition),
    themeInitialized: readonly(themeInitialized),
    windowInitialized: readonly(windowInitialized),
    
    // Actions
    initializeTheme,
    initializeWindowSize,
    setTheme,
    toggleSidebar
  }
})
```

### Blog Store Implementation
```typescript
// stores/blog.ts
export const useBlogStore = defineStore('blog', () => {
  // State
  const posts = ref<Post[]>([])
  const categories = ref<Category[]>([])
  const currentPost = ref<Post | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // Pagination state
  const pagination = ref({
    page: 1,
    pageSize: 12,
    total: 0,
    totalPages: 0
  })
  
  // Cache for performance
  const cache = new Map<string, { data: any; timestamp: number }>()
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
  
  // Helper to check cache
  const getCachedData = (key: string) => {
    const cached = cache.get(key)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data
    }
    return null
  }
  
  // Helper to set cache
  const setCachedData = (key: string, data: any) => {
    cache.set(key, { data, timestamp: Date.now() })
  }
  
  // Fetch posts
  const fetchPosts = async (params: PostsParams = {}) => {
    const cacheKey = `posts-${JSON.stringify(params)}`
    const cached = getCachedData(cacheKey)
    
    if (cached) {
      posts.value = cached.results
      pagination.value = {
        page: params.page || 1,
        pageSize: params.page_size || 12,
        total: cached.count,
        totalPages: Math.ceil(cached.count / (params.page_size || 12))
      }
      return cached
    }
    
    try {
      loading.value = true
      error.value = null
      
      const api = useApi()
      const response = await api.getPosts(params)
      
      posts.value = response.data.results
      pagination.value = {
        page: params.page || 1,
        pageSize: params.page_size || 12,
        total: response.data.count,
        totalPages: Math.ceil(response.data.count / (params.page_size || 12))
      }
      
      setCachedData(cacheKey, response.data)
      return response.data
    } catch (err) {
      error.value = err.message
      console.error('Failed to fetch posts:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // Fetch posts by category
  const fetchPostsByCategory = async (categorySlug: string, params: PostsParams = {}) => {
    const cacheKey = `category-${categorySlug}-${JSON.stringify(params)}`
    const cached = getCachedData(cacheKey)
    
    if (cached) {
      posts.value = cached.results
      return cached
    }
    
    try {
      loading.value = true
      error.value = null
      
      const api = useApi()
      const response = await api.getCategoryPosts(categorySlug, params)
      
      posts.value = response.data.results
      setCachedData(cacheKey, response.data)
      
      return response.data
    } catch (err) {
      error.value = err.message
      console.error('Failed to fetch category posts:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // Fetch categories
  const fetchCategories = async () => {
    const cached = getCachedData('categories')
    if (cached) {
      categories.value = cached
      return cached
    }
    
    try {
      const api = useApi()
      const response = await api.getCategories()
      
      categories.value = response.data
      setCachedData('categories', response.data)
      
      return response.data
    } catch (err) {
      console.error('Failed to fetch categories:', err)
      throw err
    }
  }
  
  return {
    // State (readonly for external access)
    posts: readonly(posts),
    categories: readonly(categories),
    currentPost: readonly(currentPost),
    loading: readonly(loading),
    error: readonly(error),
    pagination: readonly(pagination),
    
    // Actions
    fetchPosts,
    fetchPostsByCategory,
    fetchCategories
  }
})
```

## Store Initialization Plugin

### Client-Side Plugin
```typescript
// plugins/stores.client.ts
export default defineNuxtPlugin(async () => {
  // Initialize stores that need client-side setup
  const authStore = useAuthStore()
  const uiStore = useUIStore()
  
  // Initialize auth store
  await authStore.initializeAuth()
  
  // Initialize UI store
  uiStore.initializeTheme()
  uiStore.initializeWindowSize()
  
  // Initialize other client-only features
  const notificationsStore = useNotificationsStore()
  if (authStore.isAuthenticated) {
    await notificationsStore.initializeNotifications()
  }
})
```

## Safe Composable Patterns

### Store Access Helpers
```typescript
// composables/useStoreHelpers.ts
export const useStoreHelpers = () => {
  // Safe store access with error handling
  const safeStoreAccess = <T>(storeFactory: () => T): T | null => {
    try {
      return storeFactory()
    } catch (err) {
      console.warn('Store access failed:', err)
      return null
    }
  }
  
  // Check if store is initialized
  const isStoreInitialized = (store: any): boolean => {
    return store && typeof store.initialized !== 'undefined' 
      ? store.initialized.value 
      : true
  }
  
  // Wait for store initialization
  const waitForStoreInit = async (store: any, timeout = 5000): Promise<boolean> => {
    if (isStoreInitialized(store)) return true
    
    return new Promise((resolve) => {
      const checkInit = () => {
        if (isStoreInitialized(store)) {
          resolve(true)
          return
        }
        setTimeout(checkInit, 100)
      }
      
      checkInit()
      
      // Timeout fallback
      setTimeout(() => resolve(false), timeout)
    })
  }
  
  return {
    safeStoreAccess,
    isStoreInitialized,
    waitForStoreInit
  }
}
```

### Reactive Store Wrappers
```typescript
// composables/useReactiveStore.ts
export const useReactiveStore = <T extends Record<string, any>>(
  storeFactory: () => T
) => {
  const store = storeFactory()
  
  // Create reactive wrappers for store properties
  const reactiveStore = reactive({}) as T
  
  // Copy store properties to reactive wrapper
  Object.keys(store).forEach(key => {
    const value = store[key]
    
    if (isRef(value)) {
      // For refs, create computed that returns the value
      reactiveStore[key] = computed(() => value.value)
    } else if (typeof value === 'function') {
      // For functions, bind to original store
      reactiveStore[key] = value.bind(store)
    } else {
      // For other values, use as-is
      reactiveStore[key] = value
    }
  })
  
  return reactiveStore
}
```

## Error Handling in Stores

### Store Error Wrapper
```typescript
// utils/storeErrorHandler.ts
export const withStoreErrorHandling = <T extends any[], R>(
  action: (...args: T) => Promise<R>,
  errorContext: string
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await action(...args)
    } catch (error) {
      // Log error with context
      console.error(`Store action failed [${errorContext}]:`, error)
      
      // Handle specific error types
      if (error.name === 'NetworkError') {
        const toast = useToast()
        toast.error('Network error occurred. Please try again.')
      } else if (error.status === 401) {
        // Handle auth errors
        const authStore = useAuthStore()
        await authStore.logout()
        navigateTo('/login')
      }
      
      // Re-throw for caller to handle
      throw error
    }
  }
}

// Usage in store
const fetchPosts = withStoreErrorHandling(
  async (params: PostsParams) => {
    const api = useApi()
    return await api.getPosts(params)
  },
  'fetchPosts'
)
```

## Testing Store Patterns

### Store Testing Utilities
```typescript
// tests/utils/storeTestUtils.ts
export const createMockStore = <T>(initialState: Partial<T> = {}) => {
  const state = reactive(initialState)
  
  return {
    ...state,
    $patch: vi.fn((updates) => {
      Object.assign(state, updates)
    }),
    $reset: vi.fn(() => {
      Object.keys(state).forEach(key => {
        delete state[key]
      })
      Object.assign(state, initialState)
    })
  }
}

export const mockStoreActions = (store: any, actions: Record<string, any>) => {
  Object.keys(actions).forEach(actionName => {
    if (typeof store[actionName] === 'function') {
      store[actionName] = vi.fn(actions[actionName])
    }
  })
}
```

### Store Test Examples
```typescript
// tests/stores/auth.test.ts
describe('Auth Store', () => {
  let authStore: ReturnType<typeof useAuthStore>
  
  beforeEach(() => {
    setActivePinia(createPinia())
    authStore = useAuthStore()
  })
  
  it('initializes with default state', () => {
    expect(authStore.user).toBe(null)
    expect(authStore.isAuthenticated).toBe(false)
    expect(authStore.loading).toBe(false)
  })
  
  it('handles login successfully', async () => {
    const mockUser = { id: 1, username: 'testuser' }
    const mockTokens = { access: 'token', refresh: 'refresh' }
    
    // Mock API response
    mockApi.login.mockResolvedValue({
      user: mockUser,
      tokens: mockTokens
    })
    
    await authStore.login({ username: 'test', password: 'pass' })
    
    expect(authStore.user).toEqual(mockUser)
    expect(authStore.isAuthenticated).toBe(true)
  })
})
```

## Best Practices

### Do's
1. **Use readonly() for external state access**
2. **Initialize stores safely with error handling**
3. **Check process.client for client-only operations**
4. **Implement proper caching strategies**
5. **Use computed properties for derived state**
6. **Handle errors gracefully in actions**

### Don'ts
1. **Don't modify readonly properties directly**
2. **Don't access localStorage on server side**
3. **Don't initialize stores multiple times**
4. **Don't ignore error states**
5. **Don't forget to clean up event listeners**

### Performance Tips
1. **Use caching for expensive operations**
2. **Implement lazy loading for large datasets**
3. **Debounce frequent updates**
4. **Use computed properties instead of watchers when possible**
5. **Clean up subscriptions and listeners**