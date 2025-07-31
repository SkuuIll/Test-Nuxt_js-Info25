import { createDirectFetch } from '~/utils/directFetch'
import type {
  Post,
  Category,
  Comment,
  User,
  ApiResponse,
  LoginCredentials,
  RegisterData,
  AuthTokens,
  PostsParams,
  CommentParams,
  CreateCommentData,
  SearchFilters
} from '~/types'

// Enhanced API response types to match backend standardization
interface StandardApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  errors?: Record<string, string[]>
  timestamp?: string
}

interface PaginatedApiResponse<T = any> extends StandardApiResponse<T[]> {
  pagination: {
    count: number
    next: string | null
    previous: string | null
    page_size: number
    current_page: number
    total_pages: number
    has_next: boolean
    has_previous: boolean
    start_index: number
    end_index: number
  }
  meta?: {
    timestamp: string
    version: string
  }
}

interface SearchMetadata {
  query: string
  terms?: string[]
  total_results: number
  search_time: string
  filters_applied: boolean
}

interface SearchResponse<T = any> extends PaginatedApiResponse<T> {
  search_metadata?: SearchMetadata
  filters?: Record<string, any>
}

export const useApi = () => {
  const config = useRuntimeConfig()

  // Independent error handling - NO dependency on useErrorHandler to avoid circular imports
  const handleApiError = (error: any, context?: string) => {
    console.error('🚨 API Error:', context || 'Unknown context', error)

    // Extract meaningful error message
    const message = error?.data?.message || error?.data?.error || error?.message || error?.statusMessage || 'Error desconocido'

    // Log detailed error info for debugging
    console.error('Error details:', {
      status: error?.statusCode || error?.status,
      message,
      context,
      url: error?.data?.url,
      timestamp: new Date().toISOString()
    })
  }

  const handleAuthError = (error: any, context?: string) => {
    console.error('🔐 Auth Error:', context || 'Unknown context', error)

    // Handle auth errors independently
    if (import.meta.client) {
      // Clear any stored tokens on auth error
      try {
        localStorage.removeItem('auth_tokens')
      } catch (e) {
        // Ignore localStorage errors
      }

      // Redirect to login if we're on a protected route
      const currentPath = window.location.pathname
      if (currentPath.startsWith('/dashboard') || currentPath.startsWith('/profile')) {
        console.log('🔄 Redirecting to login due to auth error')
        window.location.href = '/login'
      }
    }
  }

  const handleNetworkError = (error: any, context?: string) => {
    console.error('🌐 Network Error:', context || 'Unknown context', error)

    // Could implement retry logic or offline handling here
    if (import.meta.client && navigator.onLine === false) {
      console.warn('🔌 Device appears to be offline')
    }
  }

  // Helper function to clean undefined/null params
  const cleanParams = (params: Record<string, any>) => {
    const cleaned: Record<string, any> = {}
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        cleaned[key] = value
      }
    }
    return cleaned
  }

  // Helper function to extract error message from response
  const extractErrorMessage = (errorData: any): string | null => {
    if (!errorData) return null

    // Try different error message formats
    if (errorData.error) return errorData.error
    if (errorData.message) return errorData.message
    if (errorData.detail) return errorData.detail
    if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
      return errorData.non_field_errors[0]
    }
    if (typeof errorData === 'string') return errorData

    return null
  }

  // Helper function to transform paginated response to legacy format
  const transformPaginatedResponse = <T>(response: PaginatedApiResponse<T>): ApiResponse<T> => {
    return {
      count: response.pagination?.count || 0,
      next: response.pagination?.next || undefined,
      previous: response.pagination?.previous || undefined,
      results: response.data || []
    }
  }

  // Helper function to check if token is expired
  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const currentTime = Math.floor(Date.now() / 1000)
      return payload.exp < currentTime
    } catch {
      return true
    }
  }

  // Helper function to get time until token expires
  const getTokenExpiryTime = (token: string): number => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.exp * 1000 // Convert to milliseconds
    } catch {
      return 0
    }
  }

  // Enhanced token management functions
  const getTokens = (): AuthTokens | null => {
    if (import.meta.client) {
      const stored = localStorage.getItem('auth_tokens')
      if (stored) {
        try {
          const tokens = JSON.parse(stored)
          // Check if access token is expired
          if (tokens.access && isTokenExpired(tokens.access)) {
            console.log('🔄 Access token expired, will need refresh')
          }
          return tokens
        } catch {
          localStorage.removeItem('auth_tokens')
        }
      }
    }
    return null
  }

  const setTokens = (tokens: AuthTokens) => {
    if (import.meta.client) {
      const tokenData = {
        ...tokens,
        stored_at: Date.now(),
        expires_at: getTokenExpiryTime(tokens.access)
      }
      localStorage.setItem('auth_tokens', JSON.stringify(tokenData))

      // Set up automatic token refresh
      scheduleTokenRefresh(tokens.access)
    }
  }

  const clearTokens = () => {
    if (import.meta.client) {
      localStorage.removeItem('auth_tokens')
      clearTokenRefreshTimer()
    }
  }

  // Enhanced token refresh scheduling with loop prevention
  let refreshTimer: NodeJS.Timeout | null = null
  let isRefreshing = false
  let refreshPromise: Promise<AuthTokens> | null = null

  const scheduleTokenRefresh = (accessToken: string) => {
    clearTokenRefreshTimer()

    const expiryTime = getTokenExpiryTime(accessToken)
    const currentTime = Date.now()
    const timeUntilExpiry = expiryTime - currentTime

    // Schedule refresh 5 minutes before expiry, but at least 1 minute
    const refreshTime = Math.max(timeUntilExpiry - (5 * 60 * 1000), 60000)

    if (refreshTime > 0 && refreshTime < timeUntilExpiry) {
      refreshTimer = setTimeout(async () => {
        const tokens = getTokens()
        if (tokens?.refresh && !isRefreshing) {
          try {
            console.log('🔄 Auto-refreshing token...')
            const newTokens = await performTokenRefresh(tokens.refresh)
            setTokens(newTokens)
            console.log('✅ Token auto-refreshed successfully')
          } catch (error) {
            console.error('❌ Auto-refresh failed:', error)
            clearTokens()
            // Redirect to login after failed auto-refresh
            await navigateTo('/login')
          }
        }
      }, refreshTime)
    }
  }

  const clearTokenRefreshTimer = () => {
    if (refreshTimer) {
      clearTimeout(refreshTimer)
      refreshTimer = null
    }
  }

  // Centralized token refresh with concurrency control
  const performTokenRefresh = async (refreshToken: string): Promise<AuthTokens> => {
    // Prevent multiple concurrent refresh attempts
    if (isRefreshing && refreshPromise) {
      console.log('🔄 Token refresh already in progress, waiting...')
      return await refreshPromise
    }

    isRefreshing = true
    refreshPromise = (async () => {
      try {
        const response = await $fetch('/users/auth/refresh/', {
          baseURL: getApiBaseUrl(),
          method: 'POST',
          body: { refresh: refreshToken },
          headers: {
            'Content-Type': 'application/json'
          }
        }) as StandardApiResponse<AuthTokens> | AuthTokens

        // Handle both standardized and direct response formats
        let tokens: AuthTokens
        if ('data' in response && response.data) {
          tokens = response.data
        } else if ('access' in response && 'refresh' in response) {
          tokens = response as AuthTokens
        } else {
          throw new Error('Invalid response format from refresh endpoint')
        }

        console.log('✅ Token refresh successful')
        return tokens
      } catch (error) {
        console.error('❌ Token refresh failed:', error)
        throw error
      } finally {
        isRefreshing = false
        refreshPromise = null
      }
    })()

    return await refreshPromise
  }

  // API Configuration with validation
  const getApiBaseUrl = (): string => {
    const baseUrl = config.public.apiBase
    if (!baseUrl) {
      console.error('❌ API_BASE_URL not configured')
      throw new Error('API base URL is not configured')
    }

    // Ensure URL doesn't end with slash to avoid double slashes
    const cleanUrl = baseUrl.replace(/\/$/, '')
    return `${cleanUrl}/api/v1`
  }

  // Enhanced logging utility
  const logApiCall = (method: string, url: string, data?: any, response?: any, error?: any) => {
    if (!import.meta.dev) return

    const timestamp = new Date().toISOString()
    const logData = {
      timestamp,
      method,
      url,
      ...(data && { requestData: data }),
      ...(response && { response }),
      ...(error && { error })
    }

    try {
      const { $logger } = useNuxtApp()
      if (error) {
        $logger.error('API Error', logData)
      } else {
        $logger.api(method, url, logData)
      }
    } catch (e) {
      // Fallback to console logging
      if (error) {
        console.error('🚨 API Error:', logData)
      } else {
        console.log('🔗 API Call:', logData)
      }
    }
  }

  // Create base API instance using direct fetch (bypasses interceptors)
  const baseFetch = createDirectFetch(getApiBaseUrl())

  // Create wrapper function that adds authentication and logging
  const api = async (endpoint: string, options: any = {}) => {
    try {
      // Add JWT token to requests
      const tokens = getTokens()
      const headers = { ...options.headers }

      if (tokens?.access && !isTokenExpired(tokens.access)) {
        headers['Authorization'] = `Bearer ${tokens.access}`
      }

      // Add request ID for tracking
      const requestId = Math.random().toString(36).substr(2, 9)
      headers['X-Request-ID'] = requestId

      // Prepare options for our fetch wrapper
      const fetchOptions = {
        ...options,
        headers,
      }

      // Enhanced logging for development
      logApiCall(
        options.method || 'GET',
        endpoint,
        options.body,
        undefined,
        undefined
      )

      // Make the request
      const response = await baseFetch(endpoint, fetchOptions)

      // Log successful response
      logApiCall(
        options.method || 'GET',
        endpoint,
        options.body,
        response,
        undefined
      )

      // Handle standardized API responses
      if (response && typeof response === 'object') {
        // Check if it's a standardized response format
        if ('success' in response) {
          // If success is false, throw an error
          if (!response.success) {
            throw new Error(response.error || response.message || 'API Error')
          }

          // For successful responses, return the appropriate data
          if ('data' in response) {
            // Keep pagination and metadata if present
            if ('pagination' in response) {
              return response // Keep full paginated response
            } else {
              return response.data // Return just the data for simple responses
            }
          }
        }
      }

      // Return response as-is if not standardized format
      return response

    } catch (error) {
      // Enhanced logging for errors
      logApiCall(
        options.method || 'GET',
        endpoint,
        options.body,
        undefined,
        error
      )

      throw error
    }
  }



  // Enhanced auth endpoints
  const login = async (credentials: LoginCredentials): Promise<AuthTokens> => {
    try {
      const response = await api('/users/auth/login/', {
        method: 'POST',
        body: credentials
      }) as StandardApiResponse<AuthTokens> | AuthTokens

      // Handle both standardized and direct response formats
      let tokens: AuthTokens
      if ('data' in response && response.data) {
        tokens = response.data
      } else if ('access' in response && 'refresh' in response) {
        tokens = response as AuthTokens
      } else {
        throw new Error('Invalid response format from login endpoint')
      }

      setTokens(tokens)
      console.log('✅ Login successful')
      return tokens
    } catch (error) {
      console.error('❌ Login failed:', error)
      throw error
    }
  }

  const register = async (userData: RegisterData): Promise<AuthTokens> => {
    try {
      const response = await api('/users/auth/register/', {
        method: 'POST',
        body: userData
      }) as StandardApiResponse<AuthTokens> | AuthTokens

      // Handle both standardized and direct response formats
      let tokens: AuthTokens
      if ('data' in response && response.data) {
        tokens = response.data
      } else if ('access' in response && 'refresh' in response) {
        tokens = response as AuthTokens
      } else {
        throw new Error('Invalid response format from register endpoint')
      }

      setTokens(tokens)
      console.log('✅ Registration successful')
      return tokens
    } catch (error) {
      console.error('❌ Registration failed:', error)
      throw error
    }
  }

  const refreshTokens = async (refreshToken: string): Promise<AuthTokens> => {
    return await performTokenRefresh(refreshToken)
  }

  const logout = async (): Promise<void> => {
    const tokens = getTokens()
    clearTokenRefreshTimer()

    if (tokens?.refresh) {
      try {
        await api('/users/auth/logout/', {
          method: 'POST',
          body: { refresh: tokens.refresh }
        })
        console.log('✅ Logout successful')
      } catch (error) {
        // Ignore logout errors but log them
        console.warn('⚠️ Logout error (ignored):', error)
      }
    }

    clearTokens()
  }

  const getCurrentUser = async (): Promise<User> => {
    return await api('/auth/user/')
  }

  const getProfile = async (): Promise<User> => {
    return await api('/users/auth/profile/')
  }

  const updateProfile = async (data: Partial<User>): Promise<User> => {
    return await api('/users/auth/profile/update/', {
      method: 'PATCH',
      body: data
    })
  }

  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    return await api('/users/auth/change-password/', {
      method: 'POST',
      body: {
        current_password: currentPassword,
        new_password: newPassword
      }
    })
  }

  const requestPasswordReset = async (email: string): Promise<void> => {
    return await api('/users/auth/password-reset/', {
      method: 'POST',
      body: { email }
    })
  }

  const resetPassword = async (token: string, newPassword: string): Promise<void> => {
    return await api('/users/auth/password-reset/confirm/', {
      method: 'POST',
      body: {
        token,
        new_password: newPassword
      }
    })
  }

  // Enhanced posts endpoints
  const getPosts = async (params?: PostsParams): Promise<ApiResponse<Post>> => {
    try {
      const response = await api('/posts/', {
        method: 'GET',
        params: params ? cleanParams(params) : undefined
      }) as PaginatedApiResponse<Post>

      return transformPaginatedResponse(response)
    } catch (error) {
      console.error('❌ Error fetching posts:', error)
      throw error
    }
  }

  const getPost = async (id: string | number): Promise<Post> => {
    try {
      const response = await api(`/posts/${id}/`) as StandardApiResponse<Post> | Post

      // Handle both standardized and direct response formats
      if ('data' in response && response.data) {
        return response.data
      } else if ('id' in response && 'title' in response) {
        return response as Post
      } else {
        throw new Error('Invalid response format from post endpoint')
      }
    } catch (error) {
      console.error(`❌ Error fetching post ${id}:`, error)
      throw error
    }
  }

  const searchPosts = async (query: string, filters?: SearchFilters): Promise<SearchResponse<Post>> => {
    try {
      const searchParams = { q: query, ...filters }
      const response = await api('/posts/search/', {
        params: cleanParams(searchParams)
      }) as SearchResponse<Post>

      console.log('🔍 Search completed:', response.search_metadata)
      return response
    } catch (error) {
      console.error('❌ Search error:', error)
      throw error
    }
  }

  const advancedSearch = async (params: Record<string, any>): Promise<SearchResponse<Post>> => {
    try {
      const response = await api('/posts/search/advanced/', {
        params: cleanParams(params)
      }) as SearchResponse<Post>

      console.log('🔍 Advanced search completed:', response.search_metadata)
      return response
    } catch (error) {
      console.error('❌ Advanced search error:', error)
      throw error
    }
  }

  const getFeaturedPosts = async (): Promise<Post[]> => {
    try {
      const response = await api('/posts/featured/') as StandardApiResponse<Post[]> | Post[]

      // Handle both standardized and direct response formats
      if ('data' in response && response.data) {
        return response.data
      } else if (Array.isArray(response)) {
        return response
      } else {
        throw new Error('Invalid response format from featured posts endpoint')
      }
    } catch (error) {
      console.error('❌ Error fetching featured posts:', error)
      throw error
    }
  }

  const getSearchSuggestions = async (query: string): Promise<any[]> => {
    try {
      const response = await api('/posts/search/suggestions/', {
        params: { q: query }
      }) as StandardApiResponse<{ suggestions: any[] }>

      return response.data?.suggestions || []
    } catch (error) {
      console.error('❌ Error fetching search suggestions:', error)
      return [] // Return empty array on error
    }
  }

  const getPopularSearches = async (): Promise<any[]> => {
    try {
      const response = await api('/posts/search/popular/') as StandardApiResponse<{ popular_searches: any[] }>
      return response.data?.popular_searches || []
    } catch (error) {
      console.error('❌ Error fetching popular searches:', error)
      return []
    }
  }

  const getSearchFilters = async (): Promise<any> => {
    try {
      const response = await api('/posts/search/filters/') as StandardApiResponse<any>
      return response.data || {}
    } catch (error) {
      console.error('❌ Error fetching search filters:', error)
      return {}
    }
  }

  const getSearchStats = async (): Promise<any> => {
    try {
      const response = await api('/posts/search/stats/') as StandardApiResponse<any>
      return response.data || {}
    } catch (error) {
      console.error('❌ Error fetching search stats:', error)
      return {}
    }
  }

  // Enhanced categories endpoints
  const getCategories = async (params?: Record<string, any>): Promise<Category[]> => {
    try {
      const response = await api('/categories/', {
        params: params ? cleanParams(params) : undefined
      }) as StandardApiResponse<Category[]> | Category[]

      // Handle both standardized and direct response formats
      if ('data' in response && response.data) {
        return response.data
      } else if (Array.isArray(response)) {
        return response
      } else {
        throw new Error('Invalid response format from categories endpoint')
      }
    } catch (error) {
      console.error('❌ Error fetching categories:', error)
      throw error
    }
  }

  const getCategory = async (id: string | number): Promise<Category> => {
    try {
      const response = await api(`/categories/${id}/`) as StandardApiResponse<Category> | Category

      // Handle both standardized and direct response formats
      if ('data' in response && response.data) {
        return response.data
      } else if ('id' in response && 'name' in response) {
        return response as Category
      } else {
        throw new Error('Invalid response format from category endpoint')
      }
    } catch (error) {
      console.error(`❌ Error fetching category ${id}:`, error)
      throw error
    }
  }

  const getCategoryPosts = async (id: string | number, params?: PostsParams): Promise<ApiResponse<Post>> => {
    try {
      const response = await api(`/categories/${id}/posts/`, {
        params: params ? cleanParams(params) : undefined
      }) as PaginatedApiResponse<Post>

      return transformPaginatedResponse(response)
    } catch (error) {
      console.error(`❌ Error fetching posts for category ${id}:`, error)
      throw error
    }
  }

  // Tags endpoints
  const getTags = async (): Promise<any[]> => {
    return await api('/tags/')
  }

  // Enhanced comments endpoints
  const getComments = async (postId: number, params?: CommentParams): Promise<ApiResponse<Comment>> => {
    try {
      const response = await api(`/posts/${postId}/comments/`, {
        params: params ? cleanParams(params) : undefined
      }) as PaginatedApiResponse<Comment>

      return transformPaginatedResponse(response)
    } catch (error) {
      console.error(`❌ Error fetching comments for post ${postId}:`, error)
      throw error
    }
  }

  const createComment = async (postId: number, comment: CreateCommentData): Promise<Comment> => {
    try {
      const response = await api(`/posts/${postId}/comments/`, {
        method: 'POST',
        body: comment
      }) as StandardApiResponse<Comment> | Comment

      // Handle both standardized and direct response formats
      let result: Comment
      if ('data' in response && response.data) {
        result = response.data
      } else if ('id' in response && 'content' in response) {
        result = response as Comment
      } else {
        throw new Error('Invalid response format from create comment endpoint')
      }

      console.log('✅ Comment created successfully')
      return result
    } catch (error) {
      console.error('❌ Error creating comment:', error)
      throw error
    }
  }

  const updateComment = async (commentId: number, content: string): Promise<Comment> => {
    try {
      const response = await api(`/comments/${commentId}/`, {
        method: 'PATCH',
        body: { contenido: content }
      }) as StandardApiResponse<Comment> | Comment

      // Handle both standardized and direct response formats
      let result: Comment
      if ('data' in response && response.data) {
        result = response.data
      } else if ('id' in response && 'content' in response) {
        result = response as Comment
      } else {
        throw new Error('Invalid response format from update comment endpoint')
      }

      console.log('✅ Comment updated successfully')
      return result
    } catch (error) {
      console.error(`❌ Error updating comment ${commentId}:`, error)
      throw error
    }
  }

  const deleteComment = async (commentId: number): Promise<void> => {
    try {
      await api(`/comments/${commentId}/`, {
        method: 'DELETE'
      })
      console.log('✅ Comment deleted successfully')
    } catch (error) {
      console.error(`❌ Error deleting comment ${commentId}:`, error)
      throw error
    }
  }

  // Media endpoints
  const uploadImage = async (file: File): Promise<{ url: string }> => {
    const formData = new FormData()
    formData.append('file', file)

    return await api('/api/media/upload/', {
      method: 'POST',
      body: formData
      // Don't set Content-Type header - let browser set it with boundary
    })
  }

  const uploadFile = async (file: File, type: 'image' | 'document' = 'image'): Promise<any> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    return await api('/media/upload/', {
      method: 'POST',
      body: formData
    })
  }

  // Newsletter endpoint
  const subscribeNewsletter = async (email: string): Promise<void> => {
    return await api('/newsletter/subscribe/', {
      method: 'POST',
      body: { email }
    })
  }

  // Contact form endpoint
  const sendContactMessage = async (data: {
    name: string
    email: string
    subject: string
    message: string
  }): Promise<void> => {
    return await api('/contact/', {
      method: 'POST',
      body: data
    })
  }

  // Enhanced request wrapper with intelligent retry logic
  const apiRequest = async <T>(
    endpoint: string,
    options: any = {},
    maxRetries: number = 2
  ): Promise<T> => {
    let lastError: any
    let tokenRefreshed = false

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await api(endpoint, options)

        // Log successful retry if applicable
        if (attempt > 0) {
          console.log(`✅ Request succeeded on attempt ${attempt + 1}`)
        }

        return response as T
      } catch (error: any) {
        lastError = error

        // Handle token refresh scenario (only once per request)
        if (error?.data?.token_refreshed && !tokenRefreshed && attempt < maxRetries) {
          console.log(`🔄 Retrying request after token refresh (attempt ${attempt + 1}/${maxRetries + 1})`)
          tokenRefreshed = true

          // Wait a bit before retrying to ensure token is properly set
          await new Promise(resolve => setTimeout(resolve, 500))
          continue
        }

        // Don't retry on client errors (except 401 which is handled above)
        const statusCode = error?.statusCode || error?.status
        if (statusCode === 400 || statusCode === 403 || statusCode === 404 || statusCode === 422) {
          console.log(`❌ Not retrying client error: ${statusCode}`)
          throw error
        }

        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          console.log(`❌ Max retries (${maxRetries}) reached for ${endpoint}`)
          throw error
        }

        // Only retry on server errors or network issues
        if (statusCode >= 500 || statusCode === 408 || statusCode === 429) {
          // Exponential backoff with jitter
          const baseDelay = 1000 * Math.pow(2, attempt)
          const jitter = Math.random() * 500
          const delay = Math.min(baseDelay + jitter, 10000)

          console.log(`⏳ Retrying request in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries + 1})`)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }

        // For other errors, don't retry
        if (statusCode >= 500) {
          handleNetworkError(error, 'API Server Error')
        } else {
          handleApiError(error, 'API Request Failed')
        }

        throw error
      }
    }

    throw lastError
  }

  // API health check
  const healthCheck = async (): Promise<boolean> => {
    try {
      await api('/health/', { method: 'GET' })
      return true
    } catch (error) {
      console.warn('⚠️ API health check failed:', error)
      return false
    }
  }

  // Get API status and version info
  const getApiInfo = async (): Promise<any> => {
    try {
      return await api('/info/', { method: 'GET' })
    } catch (error) {
      console.warn('⚠️ Could not fetch API info:', error)
      return null
    }
  }

  // Validate API connection and configuration
  const validateApiConnection = async (): Promise<{
    connected: boolean
    baseUrl: string
    version?: string
    error?: string
  }> => {
    const baseUrl = getApiBaseUrl()

    try {
      const isHealthy = await healthCheck()
      const info = await getApiInfo()

      return {
        connected: isHealthy,
        baseUrl,
        version: info?.version,
      }
    } catch (error: any) {
      return {
        connected: false,
        baseUrl,
        error: error.message || 'Connection failed'
      }
    }
  }

  // Enhanced error handling utilities
  const errorUtils = {
    extractErrorMessage,
    isRetryableError: (error: any): boolean => {
      const statusCode = error?.statusCode || error?.status
      return [408, 429, 500, 502, 503, 504].includes(statusCode)
    },
    isAuthError: (error: any): boolean => {
      const statusCode = error?.statusCode || error?.status
      return statusCode === 401
    },
    isValidationError: (error: any): boolean => {
      const statusCode = error?.statusCode || error?.status
      return statusCode === 422 || statusCode === 400
    },
    isNetworkError: (error: any): boolean => {
      const statusCode = error?.statusCode || error?.status
      return statusCode >= 500 || !statusCode
    }
  }

  // Token management utilities
  const tokenUtils = {
    getTokens,
    setTokens,
    clearTokens,
    isTokenExpired,
    getTokenExpiryTime,
    scheduleTokenRefresh,
    clearTokenRefreshTimer,
    isRefreshing: () => isRefreshing,
    forceRefresh: async () => {
      const tokens = getTokens()
      if (tokens?.refresh) {
        return await performTokenRefresh(tokens.refresh)
      }
      throw new Error('No refresh token available')
    }
  }

  // Request utilities
  const requestUtils = {
    cleanParams,
    transformPaginatedResponse,
    logApiCall,
    getApiBaseUrl,
    validateApiConnection,
    healthCheck,
    getApiInfo
  }

  return {
    // Auth
    login,
    register,
    refreshTokens,
    logout,
    getCurrentUser,
    getProfile,
    updateProfile,
    changePassword,
    requestPasswordReset,
    resetPassword,

    // Posts
    getPosts,
    getPost,
    searchPosts,
    advancedSearch,
    getFeaturedPosts,
    getSearchSuggestions,
    getPopularSearches,
    getSearchFilters,
    getSearchStats,

    // Categories
    getCategories,
    getCategory,
    getCategoryPosts,

    // Tags
    getTags,

    // Comments
    getComments,
    createComment,
    updateComment,
    deleteComment,

    // Media
    uploadImage,
    uploadFile,

    // Other
    subscribeNewsletter,
    sendContactMessage,

    // Enhanced utilities
    apiRequest,
    tokenUtils,
    errorUtils,
    requestUtils,

    // Legacy support (deprecated, use requestUtils instead)
    cleanParams
  }
}