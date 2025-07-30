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

      // Handle token refresh on 401 (but not for login/register/refresh endpoints)
      if (response.status === 401 &&
        !request.toString().includes('/auth/login') &&
        !request.toString().includes('/auth/register') &&
        !request.toString().includes('/auth/refresh')) {

        const tokens = getTokens()
        if (tokens?.refresh) {
          try {
            console.log('🔄 Token expirado, intentando renovar...')
            const newTokens = await refreshTokens(tokens.refresh)
            setTokens(newTokens)
            console.log('✅ Token renovado exitosamente')
            // Don't throw error here - let the request retry with new token
            return
          } catch (error) {
            console.error('❌ Error renovando token:', error)
            // Refresh failed, clear tokens and stop the loop
            clearTokens()
            // Force logout to prevent infinite loops
            if (process.client) {
              window.location.href = '/login'
            }
            throw error
          }
        } else {
          console.log('🚫 No hay refresh token disponible')
          clearTokens()
          if (process.client) {
            window.location.href = '/login'
          }
        }
      }
    }
  })

  // Auth endpoints
  const login = async (credentials: LoginCredentials): Promise<AuthTokens> => {
    return await api('/users/auth/login/', {
      method: 'POST',
      body: credentials
    })
  }

  const register = async (userData: RegisterData): Promise<AuthTokens> => {
    return await api('/users/auth/register/', {
      method: 'POST',
      body: userData
    })
  }

  const refreshTokens = async (refreshToken: string): Promise<AuthTokens> => {
    return await api('/users/auth/refresh/', {
      method: 'POST',
      body: { refresh: refreshToken }
    })
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
    return await api('/posts/', { params })
  }

  const getPost = async (slug: string): Promise<Post> => {
    return await api(`/posts/${slug}/`)
  }

  const searchPosts = async (query: string, filters?: SearchFilters): Promise<ApiResponse<Post>> => {
    return await api('/posts/search/', {
      params: { q: query, ...filters }
    })
  }

  const getFeaturedPosts = async (): Promise<Post[]> => {
    return await api('/posts/featured/')
  }

  // Categories endpoints
  const getCategories = async (): Promise<Category[]> => {
    return await api('/categories/')
  }

  const getCategory = async (slug: string): Promise<Category> => {
    return await api(`/categories/${slug}/`)
  }

  const getCategoryPosts = async (slug: string, params?: PostsParams): Promise<ApiResponse<Post>> => {
    return await api(`/categories/${slug}/posts/`, { params })
  }

  // Tags endpoints
  const getTags = async (): Promise<any[]> => {
    return await api('/tags/')
  }

  const getTag = async (slug: string): Promise<any> => {
    return await api(`/tags/${slug}/`)
  }

  const getTagPosts = async (slug: string, params?: PostsParams): Promise<ApiResponse<Post>> => {
    return await api(`/tags/${slug}/posts/`, { params })
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
      body: { content }
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
    formData.append('image', file)

    return await api('/media/upload/', {
      method: 'POST',
      body: formData,
      headers: {
        // Remove Content-Type header to let browser set it with boundary
      }
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

    // Categories
    getCategories,
    getCategory,
    getCategoryPosts,

    // Tags
    getTags,
    getTag,
    getTagPosts,

    // Comments
    getComments,
    createComment,
    updateComment,
    deleteComment,

    // Media
    uploadImage,

    // Other
    subscribeNewsletter,
    sendContactMessage
  }
}