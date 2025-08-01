// Complete and robust API composable using native fetch
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

// Enhanced token utilities with better error handling
const tokenUtils = {
  getTokens(): { access: string | null; refresh: string | null } {
    if (process.client) {
      try {
        return {
          access: localStorage.getItem('access_token'),
          refresh: localStorage.getItem('refresh_token')
        }
      } catch (error) {
        console.error('Error retrieving tokens from localStorage:', error)
        return { access: null, refresh: null }
      }
    }
    return { access: null, refresh: null }
  },

  setTokens(tokens: { access: string; refresh: string }) {
    if (process.client) {
      try {
        if (!tokens.access || !tokens.refresh) {
          console.error('Invalid tokens provided:', tokens)
          return false
        }

        localStorage.setItem('access_token', tokens.access)
        localStorage.setItem('refresh_token', tokens.refresh)
        console.log('✅ Tokens stored successfully')
        return true
      } catch (error) {
        console.error('Error storing tokens in localStorage:', error)
        return false
      }
    }
    return false
  },

  clearTokens() {
    if (process.client) {
      try {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        console.log('✅ Tokens cleared successfully')
        return true
      } catch (error) {
        console.error('Error clearing tokens from localStorage:', error)
        return false
      }
    }
    return false
  },

  isTokenExpired(token: string): boolean {
    if (!token) return true
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const isExpired = Date.now() >= payload.exp * 1000
      if (isExpired) {
        console.log('🕐 Token is expired')
      }
      return isExpired
    } catch (error) {
      console.error('Error checking token expiration:', error)
      return true
    }
  },

  getTokenExpiryTime(token: string): number {
    if (!token) return 0
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.exp * 1000
    } catch (error) {
      console.error('Error getting token expiry time:', error)
      return 0
    }
  },

  validateTokenStructure(token: string): boolean {
    if (!token) return false
    try {
      const parts = token.split('.')
      if (parts.length !== 3) return false

      // Try to parse the payload
      JSON.parse(atob(parts[1]))
      return true
    } catch (error) {
      console.error('Invalid token structure:', error)
      return false
    }
  },

  getTokenTimeUntilExpiry(token: string): number {
    if (!token) return 0
    try {
      const expiryTime = this.getTokenExpiryTime(token)
      return Math.max(0, expiryTime - Date.now())
    } catch (error) {
      console.error('Error calculating time until expiry:', error)
      return 0
    }
  },

  shouldRefreshToken(token: string, thresholdMinutes: number = 5): boolean {
    if (!token) return false
    try {
      const timeUntilExpiry = this.getTokenTimeUntilExpiry(token)
      const thresholdMs = thresholdMinutes * 60 * 1000
      return timeUntilExpiry < thresholdMs && timeUntilExpiry > 0
    } catch (error) {
      console.error('Error checking if token should be refreshed:', error)
      return false
    }
  }
}

// Data transformation utilities also remain at the top level
const transformPost = (apiPost: any): Post => {
  return {
    id: apiPost.id,
    title: apiPost.titulo || apiPost.title,
    slug: apiPost.slug,
    content: apiPost.contenido || apiPost.content,
    excerpt: apiPost.excerpt,
    image: apiPost.image_url || apiPost.image,
    author: apiPost.author,
    category: {
      id: apiPost.category.id,
      name: apiPost.category.nombre || apiPost.category.name,
      slug: apiPost.category.slug,
      description: apiPost.category.descripcion || apiPost.category.description,
      posts_count: apiPost.category.posts_count,
      created_at: apiPost.category.created_at
    },
    tags: apiPost.tags || [],
    meta_title: apiPost.meta_title,
    meta_description: apiPost.meta_description,
    status: apiPost.status,
    created_at: apiPost.created_at,
    updated_at: apiPost.updated_at,
    published_at: apiPost.published_at,
    comments_count: apiPost.comments_count,
    reading_time: apiPost.reading_time
  }
}

const transformCategory = (apiCategory: any): Category => {
  return {
    id: apiCategory.id,
    name: apiCategory.nombre || apiCategory.name,
    slug: apiCategory.slug,
    description: apiCategory.descripcion || apiCategory.description,
    posts_count: apiCategory.posts_count,
    created_at: apiCategory.created_at
  }
}

// Enhanced API error class for better error handling
class ApiError extends Error {
  status: number
  data: any

  constructor(message: string, status: number, data?: any) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

// Response transformation utilities
const transformAuthResponse = (response: any): AuthTokens => {
  // Handle Django API response format
  if (response.success && response.data) {
    return {
      access: response.data.access,
      refresh: response.data.refresh
    }
  }

  // Handle direct response format
  if (response.access && response.refresh) {
    return {
      access: response.access,
      refresh: response.refresh
    }
  }

  throw new Error('Invalid authentication response format')
}

const transformUserResponse = (response: any): User => {
  // Handle Django API response format
  if (response.success && response.data) {
    return response.data
  }

  // Handle direct response format
  if (response.id || response.username) {
    return response
  }

  throw new Error('Invalid user response format')
}

const transformApiResponse = <T>(response: any): ApiResponse<T> => {
  // If already in correct format, return as-is
  if (response.success !== undefined) {
    return response
  }

  // Transform to standard format
  return {
    success: true,
    data: response,
    message: 'Success'
  }
}

const handleApiError = (error: any): never => {
  let errorMessage = 'Unknown error occurred'
  let errorData: any = {}

  if (error instanceof ApiError) {
    errorMessage = error.message
    errorData = error.data

    // Handle Django API error format
    if (error.data?.success === false) {
      errorMessage = error.data.message || error.data.error || errorMessage
      errorData.errors = error.data.errors
    }
  } else if (error.message) {
    errorMessage = error.message
  }

  // Create standardized error
  const standardError = new ApiError(errorMessage, error.status || 500, {
    ...errorData,
    originalError: error
  })

  throw standardError
}

// The main composable function
export const useApi = () => {
  // Create API request function that properly handles runtime config
  const createApiRequest = () => {
    try {
      const runtimeConfig = useRuntimeConfig()
      const API_BASE_URL = `${runtimeConfig.public.apiBase}/api/v1`

      return async <T = any>(
        endpoint: string,
        options: RequestInit = {}
      ): Promise<T> => {
        const url = `${API_BASE_URL}${endpoint}`
        const tokens = tokenUtils.getTokens()

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(options.headers as Record<string, string>),
        }

        if (tokens.access && !tokenUtils.isTokenExpired(tokens.access)) {
          headers['Authorization'] = `Bearer ${tokens.access}`
        }

        try {
          const response = await fetch(url, {
            headers,
            ...options,
          })

          let responseData: any = {}

          // Try to parse JSON response
          try {
            responseData = await response.json()
          } catch (parseError) {
            // If JSON parsing fails, handle based on status
            if (response.status === 204) {
              responseData = {}
            } else {
              responseData = { message: 'Invalid response format' }
            }
          }

          if (!response.ok) {
            // Create structured error with response data
            const errorMessage = responseData.error ||
              responseData.message ||
              responseData.detail ||
              `HTTP error! status: ${response.status}`

            throw new ApiError(errorMessage, response.status, responseData)
          }

          return responseData
        } catch (error) {
          console.error('API fetch error:', error)

          // Re-throw ApiError as-is
          if (error instanceof ApiError) {
            throw error
          }

          // Wrap other errors
          throw new ApiError(
            error instanceof Error ? error.message : 'Network error',
            0,
            { originalError: error }
          )
        }
      }
    } catch (configError) {
      console.error('Runtime config error:', configError)

      // Return a fallback function that throws an error
      return async <T = any>(): Promise<T> => {
        throw new ApiError('Configuration error: Unable to access runtime config', 500, { configError })
      }
    }
  }

  // Each of these functions will call the locally scoped, safe `apiFetch`
  const getPosts = async (params: PostsParams = {}) => {
    const apiFetch = createApiRequest()
    const searchParams = new URLSearchParams()
    if (params.page) searchParams.append('page', params.page.toString())
    if (params.page_size) searchParams.append('page_size', params.page_size.toString())
    if (params.category) searchParams.append('category', params.category)
    if (params.search) searchParams.append('search', params.search)
    if (params.ordering) searchParams.append('ordering', params.ordering)
    const queryString = searchParams.toString()
    const endpoint = `/posts/${queryString ? `?${queryString}` : ''}`
    const response = await apiFetch<any>(endpoint)
    if (response.success && response.data) {
      return {
        ...response,
        data: response.data.map(transformPost),
        results: response.data.map(transformPost),
      }
    }
    return response
  }

  const getPost = async (id: number | string) => {
    const apiFetch = createApiRequest()
    const response = await apiFetch<any>(`/posts/${id}/`)
    if (response.success && response.data) {
      return {
        ...response,
        data: transformPost(response.data),
      }
    }
    return response
  }

  const getFeaturedPosts = async () => {
    const apiFetch = createApiRequest()
    return apiFetch<ApiResponse<Post[]>>('/posts/featured/')
  }

  const getCategoryPosts = async (categorySlug: string, params: PostsParams = {}) => {
    const apiFetch = createApiRequest()
    const searchParams = new URLSearchParams()
    if (params.page) searchParams.append('page', params.page.toString())
    if (params.page_size) searchParams.append('page_size', params.page_size.toString())
    if (params.ordering) searchParams.append('ordering', params.ordering)
    const queryString = searchParams.toString()
    const endpoint = `/categories/${categorySlug}/posts/${queryString ? `?${queryString}` : ''}`
    return apiFetch<ApiResponse<Post[]>>(endpoint)
  }

  const createPost = async (postData: Partial<Post>) => {
    const apiFetch = createApiRequest()
    return apiFetch<ApiResponse<Post>>('/posts/', {
      method: 'POST',
      body: JSON.stringify(postData),
    })
  }

  const updatePost = async (id: number, postData: Partial<Post>) => {
    const apiFetch = createApiRequest()
    return apiFetch<ApiResponse<Post>>(`/posts/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(postData),
    })
  }

  const deletePost = async (id: number) => {
    const apiFetch = createApiRequest()
    return apiFetch<ApiResponse>(`/posts/${id}/`, {
      method: 'DELETE',
    })
  }

  const getCategories = async () => {
    const apiFetch = createApiRequest()
    const response = await apiFetch<any>('/categories/')
    if (response.success && response.data) {
      return {
        ...response,
        data: response.data.map(transformCategory),
      }
    }
    return response
  }

  const getCategory = async (id: number) => {
    const apiFetch = createApiRequest()
    return apiFetch<ApiResponse<Category>>(`/categories/${id}/`)
  }

  const getComments = async (params: CommentParams = {}) => {
    const apiFetch = createApiRequest()
    const searchParams = new URLSearchParams()
    if (params.post) searchParams.append('post', params.post.toString())
    if (params.page) searchParams.append('page', params.page.toString())
    if (params.page_size) searchParams.append('page_size', params.page_size.toString())
    const queryString = searchParams.toString()
    const endpoint = `/comments/${queryString ? `?${queryString}` : ''}`
    return apiFetch<ApiResponse<Comment[]>>(endpoint)
  }

  const createComment = async (commentData: CreateCommentData) => {
    const apiFetch = createApiRequest()
    return apiFetch<ApiResponse<Comment>>('/comments/', {
      method: 'POST',
      body: JSON.stringify(commentData),
    })
  }

  const searchPosts = async (filters: SearchFilters) => {
    const apiFetch = createApiRequest()
    const searchParams = new URLSearchParams()
    if (filters.query) searchParams.append('search', filters.query)
    if (filters.category) searchParams.append('category', filters.category)
    if (filters.author) searchParams.append('author', filters.author)
    if (filters.date_from) searchParams.append('date_from', filters.date_from)
    if (filters.date_to) searchParams.append('date_to', filters.date_to)
    if (filters.page) searchParams.append('page', filters.page.toString())
    if (filters.page_size) searchParams.append('page_size', filters.page_size.toString())
    const queryString = searchParams.toString()
    const endpoint = `/posts/search/${queryString ? `?${queryString}` : ''}`
    return apiFetch<ApiResponse<Post[]>>(endpoint)
  }

  const login = async (credentials: LoginCredentials) => {
    const apiFetch = createApiRequest()
    const response = await apiFetch<any>('/users/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
    return transformAuthResponse(response)
  }

  const register = async (userData: RegisterData) => {
    const apiFetch = createApiRequest()
    const response = await apiFetch<any>('/users/auth/register/', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
    return transformApiResponse<User>(response)
  }

  const logout = async () => {
    const apiFetch = createApiRequest()
    return apiFetch<ApiResponse>('/users/auth/logout/', {
      method: 'POST',
    })
  }

  const getCurrentUser = async () => {
    const apiFetch = createApiRequest()
    return apiFetch<ApiResponse<User>>('/users/auth/profile/')
  }

  const getProfile = async () => {
    const apiFetch = createApiRequest()
    const response = await apiFetch<any>('/users/auth/profile/')
    return transformUserResponse(response)
  }

  const updateProfile = async (data: Partial<User>) => {
    const apiFetch = createApiRequest()
    return apiFetch<ApiResponse<User>>('/users/auth/profile/update/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const apiFetch = createApiRequest()
    return apiFetch<ApiResponse>('/users/auth/change-password/', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    })
  }

  const refreshTokens = async (refreshToken: string) => {
    const apiFetch = createApiRequest()
    const response = await apiFetch<any>('/users/auth/refresh/', {
      method: 'POST',
      body: JSON.stringify({ refresh: refreshToken }),
    })
    return transformAuthResponse(response)
  }

  const requestPasswordReset = async (email: string) => {
    const apiFetch = createApiRequest()
    return apiFetch<ApiResponse>('/users/auth/password-reset/', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  const resetPassword = async (token: string, newPassword: string) => {
    const apiFetch = createApiRequest()
    return apiFetch<ApiResponse>('/users/auth/password-reset/confirm/', {
      method: 'POST',
      body: JSON.stringify({ token, new_password: newPassword }),
    })
  }

  const healthCheck = async () => {
    const apiFetch = createApiRequest()
    return apiFetch<ApiResponse>('/health/')
  }

  // Expose the generic fetch function as apiRequest
  const apiRequest = createApiRequest()

  return {
    apiRequest, // Generic request function
    getPosts,
    getPost,
    getFeaturedPosts,
    getCategoryPosts,
    createPost,
    updatePost,
    deletePost,
    getCategories,
    getCategory,
    getComments,
    createComment,
    searchPosts,
    login,
    register,
    logout,
    getCurrentUser,
    getProfile,
    updateProfile,
    changePassword,
    refreshTokens,
    requestPasswordReset,
    resetPassword,
    healthCheck,
    tokenUtils, // Expose token utilities as well
  }
}
