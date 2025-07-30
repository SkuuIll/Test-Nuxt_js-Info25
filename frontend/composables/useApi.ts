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

  // Token management functions
  const getTokens = () => {
    if (process.client) {
      const stored = localStorage.getItem('auth_tokens')
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch {
          localStorage.removeItem('auth_tokens')
        }
      }
    }
    return null
  }

  const setTokens = (tokens: AuthTokens) => {
    if (process.client) {
      localStorage.setItem('auth_tokens', JSON.stringify(tokens))
    }
  }

  const clearTokens = () => {
    if (process.client) {
      localStorage.removeItem('auth_tokens')
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
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${tokens.access}`
        } as Record<string, string>
      }

      // Log API requests in development
      if (process.dev) {
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
        // Check if it's a standardized response format
        if ('success' in response._data) {
          // If success is false, throw an error to trigger onResponseError
          if (!response._data.success) {
            throw createError({
              statusCode: response.status,
              statusMessage: response._data.error || response._data.message || 'API Error',
              data: response._data
            })
          }
          // For successful responses, return the data field if it exists
          if ('data' in response._data) {
            response._data = response._data.data
          }
        }
      }
    },
    async onResponseError({ request, response }) {
      // Log API errors in development
      if (process.dev) {
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
        if (tokens?.refresh) {
          try {
            console.log('🔄 Token expirado, intentando renovar...')
            const newTokens = await refreshTokens(tokens.refresh)
            setTokens(newTokens)
            console.log('✅ Token renovado exitosamente')
            // Let the request retry with new token
            return
          } catch (error) {
            console.error('❌ Error renovando token:', error)
            // Refresh failed, handle as auth error
            clearTokens()
            handleAuthError(error, 'Token Refresh Failed')
            throw error
          }
        } else {
          console.log('🚫 No hay refresh token disponible')
          clearTokens()
          const authError = createError({
            statusCode: 401,
            statusMessage: 'Sesión expirada',
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

  // Auth endpoints
  const login = async (credentials: LoginCredentials): Promise<AuthTokens> => {
    const response = await api('/users/auth/login/', {
      method: 'POST',
      body: credentials
    })
    return response
  }

  const register = async (userData: RegisterData): Promise<AuthTokens> => {
    const response = await api('/users/auth/register/', {
      method: 'POST',
      body: userData
    })
    return response
  }

  const refreshTokens = async (refreshToken: string): Promise<AuthTokens> => {
    const response = await api('/users/auth/refresh/', {
      method: 'POST',
      body: { refresh: refreshToken }
    })
    return response
  }

  const logout = async (): Promise<void> => {
    const tokens = getTokens()
    if (tokens?.refresh) {
      try {
        await api('/users/auth/logout/', {
          method: 'POST',
          body: { refresh: tokens.refresh }
        })
      } catch (error) {
        // Ignore logout errors
        console.warn('Logout error:', error)
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

  // Posts endpoints
  const getPosts = async (params?: PostsParams): Promise<ApiResponse<Post>> => {
    return await api('/posts/', {
      params: params ? cleanParams(params) : undefined
    })
  }

  const getPost = async (id: string | number): Promise<Post> => {
    return await api(`/posts/${id}/`)
  }

  const searchPosts = async (query: string, filters?: SearchFilters): Promise<ApiResponse<Post>> => {
    const searchParams = { q: query, ...filters }
    return await api('/posts/search/', {
      params: cleanParams(searchParams)
    })
  }

  const getFeaturedPosts = async (): Promise<Post[]> => {
    return await api('/posts/featured/')
  }

  const getSearchSuggestions = async (query: string): Promise<any[]> => {
    return await api('/search/suggestions/', {
      params: { q: query }
    })
  }

  // Categories endpoints
  const getCategories = async (): Promise<Category[]> => {
    return await api('/categories/')
  }

  const getCategory = async (id: string | number): Promise<Category> => {
    return await api(`/categories/${id}/`)
  }

  const getCategoryPosts = async (id: string | number, params?: PostsParams): Promise<ApiResponse<Post>> => {
    return await api(`/categories/${id}/posts/`, {
      params: params ? cleanParams(params) : undefined
    })
  }

  // Tags endpoints
  const getTags = async (): Promise<any[]> => {
    return await api('/tags/')
  }

  // Comments endpoints
  const getComments = async (postId: number, params?: CommentParams): Promise<ApiResponse<Comment>> => {
    return await api(`/posts/${postId}/comments/`, { params })
  }

  const createComment = async (postId: number, comment: CreateCommentData): Promise<Comment> => {
    return await api(`/posts/${postId}/comments/`, {
      method: 'POST',
      body: comment
    })
  }

  const updateComment = async (commentId: number, content: string): Promise<Comment> => {
    return await api(`/comments/${commentId}/`, {
      method: 'PATCH',
      body: { contenido: content }
    })
  }

  const deleteComment = async (commentId: number): Promise<void> => {
    return await api(`/comments/${commentId}/`, {
      method: 'DELETE'
    })
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
    getFeaturedPosts,
    getSearchSuggestions,

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
    cleanParams
  }
}