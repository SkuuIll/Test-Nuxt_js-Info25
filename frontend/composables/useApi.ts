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
  const { handleApiError, handleAuthError, handleNetworkError } = useErrorHandler()

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

  // Token refresh scheduling
  let refreshTimer: NodeJS.Timeout | null = null

  const scheduleTokenRefresh = (accessToken: string) => {
    clearTokenRefreshTimer()

    const expiryTime = getTokenExpiryTime(accessToken)
    const currentTime = Date.now()
    const timeUntilExpiry = expiryTime - currentTime

    // Schedule refresh 5 minutes before expiry
    const refreshTime = Math.max(timeUntilExpiry - (5 * 60 * 1000), 60000) // At least 1 minute

    if (refreshTime > 0) {
      refreshTimer = setTimeout(async () => {
        const tokens = getTokens()
        if (tokens?.refresh) {
          try {
            console.log('🔄 Auto-refreshing token...')
            const newTokens = await refreshTokens(tokens.refresh)
            setTokens(newTokens)
            console.log('✅ Token auto-refreshed successfully')
          } catch (error) {
            console.error('❌ Auto-refresh failed:', error)
            clearTokens()
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

  // Create base API instance
  const api = $fetch.create({
    baseURL: config.public.apiBase + '/api/v1',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    onRequest({ request, options }) {
      // Add JWT token to requests
      const tokens = getTokens()
      if (tokens?.access) {
        if (!options.headers) {
          options.headers = {}
        }

        // Properly handle headers object
        const headers = options.headers as Record<string, string>
        headers['Authorization'] = `Bearer ${tokens.access}`
      }

      // Log API requests in development
      if (import.meta.dev) {
        try {
          const { $logger } = useNuxtApp()
          $logger.api(options.method || 'GET', request.toString(), options.body)
        } catch (e) {
          console.log('🔗 API Request:', options.method || 'GET', request.toString(), options.body)
        }
      }
    },
    onResponse({ response }) {
      // Handle standardized API responses
      if (response._data && typeof response._data === 'object') {
        const data = response._data as StandardApiResponse

        // Check if it's a standardized response format
        if ('success' in data) {
          // If success is false, throw an error to trigger onResponseError
          if (!data.success) {
            throw createError({
              statusCode: response.status,
              statusMessage: data.error || data.message || 'API Error',
              data: data
            })
          }

          // For successful responses, preserve the full response structure
          // but make data easily accessible
          if ('data' in data) {
            // Keep pagination and metadata if present
            if ('pagination' in data) {
              response._data = data // Keep full paginated response
            } else {
              response._data = data.data // Return just the data for simple responses
            }
          }
        }
      }

      // Log successful API responses in development
      if (import.meta.dev) {
        try {
          const { $logger } = useNuxtApp()
          $logger.api('Response', response.status.toString(), response._data)
        } catch (e) {
          console.log('✅ API Response:', response.status, response._data)
        }
      }
    },
    async onResponseError({ request, response }) {
      // Log API errors in development
      if (import.meta.dev) {
        try {
          const { $logger } = useNuxtApp()
          $logger.error('API Error', {
            url: request.toString(),
            status: response.status,
            statusText: response.statusText,
            data: response._data
          })
        } catch (e) {
          console.error('🚨 API Error:', response.status, response.statusText, request.toString(), response._data)
        }
      }

      const url = request.toString()
      const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh')

      // Handle token refresh on 401 (but not for auth endpoints)
      if (response.status === 401 && !isAuthEndpoint) {
        const tokens = getTokens()
        if (tokens?.refresh && !isTokenExpired(tokens.refresh)) {
          try {
            console.log('🔄 Token expired, attempting refresh...')
            const newTokens = await refreshTokens(tokens.refresh)
            setTokens(newTokens)
            console.log('✅ Token refreshed successfully')

            // Don't retry automatically to prevent infinite loops
            // Let the calling code handle the retry
            console.log('🔄 Token refreshed, please retry the request')

            // Still throw the error but with a special flag
            const refreshedError = createError({
              statusCode: 401,
              statusMessage: 'Token refreshed, retry required',
              data: { ...response._data, token_refreshed: true }
            })
            throw refreshedError
          } catch (refreshError) {
            console.error('❌ Token refresh failed:', refreshError)
            // Refresh failed, handle as auth error
            clearTokens()
            handleAuthError(refreshError, 'Token Refresh Failed')
            throw refreshError
          }
        } else {
          console.log('🚫 No valid refresh token available')
          clearTokens()
          const authError = createError({
            statusCode: 401,
            statusMessage: 'Session expired',
            data: response._data
          })
          handleAuthError(authError, 'No Refresh Token')
          throw authError
        }
      }

      // Create enhanced error object
      const errorData = response._data
      const enhancedError = createError({
        statusCode: response.status,
        statusMessage: errorData?.error || errorData?.message || response.statusText,
        data: errorData
      })

      // Handle different types of errors
      if (response.status === 401) {
        handleAuthError(enhancedError, 'API Authentication Error')
      } else if (response.status >= 500) {
        handleNetworkError(enhancedError, 'API Server Error')
      } else {
        handleApiError(enhancedError, 'API Error')
      }

      throw enhancedError
    }
  })

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
    try {
      const response = await api('/users/auth/refresh/', {
        method: 'POST',
        body: { refresh: refreshToken }
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
      clearTokens()
      throw error
    }
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

  // Enhanced request wrapper with retry logic
  const apiRequest = async <T>(
    endpoint: string,
    options: any = {},
    maxRetries: number = 2
  ): Promise<T> => {
    let lastError: any

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await api(endpoint, options)
        return response as T
      } catch (error: any) {
        lastError = error

        // Check if this is a token refresh scenario
        if (error?.data?.token_refreshed && attempt < maxRetries) {
          console.log(`🔄 Retrying request after token refresh (attempt ${attempt + 1}/${maxRetries + 1})`)
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 500))
          continue
        }

        // Don't retry on certain errors
        if (error?.statusCode === 400 || error?.statusCode === 404 || error?.statusCode === 403) {
          throw error
        }

        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          throw error
        }

        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000)
        console.log(`⏳ Retrying request in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError
  }

  // Token management utilities
  const tokenUtils = {
    getTokens,
    setTokens,
    clearTokens,
    isTokenExpired,
    getTokenExpiryTime,
    scheduleTokenRefresh,
    clearTokenRefreshTimer
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

    // Utils
    cleanParams,
    apiRequest,
    tokenUtils
  }
}