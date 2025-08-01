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

// Base API configuration
const API_BASE_URL = 'http://localhost:8000/api/v1'

// Token utilities
const tokenUtils = {
  getTokens(): { access: string | null; refresh: string | null } {
    if (process.client) {
      return {
        access: localStorage.getItem('access_token'),
        refresh: localStorage.getItem('refresh_token')
      }
    }
    return { access: null, refresh: null }
  },

  setTokens(tokens: { access: string; refresh: string }) {
    if (process.client) {
      localStorage.setItem('access_token', tokens.access)
      localStorage.setItem('refresh_token', tokens.refresh)
    }
  },

  clearTokens() {
    if (process.client) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    }
  },

  isTokenExpired(token: string): boolean {
    if (!token) return true
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return Date.now() >= payload.exp * 1000
    } catch {
      return true
    }
  },

  getTokenExpiryTime(token: string): number {
    if (!token) return 0
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.exp * 1000
    } catch {
      return 0
    }
  }
}

// Simple API response types
interface StandardApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  errors?: Record<string, string[]>
}

interface PaginatedApiResponse<T = any> extends StandardApiResponse<T[]> {
  pagination?: {
    count: number
    next: string | null
    previous: string | null
    page_size: number
    current_page: number
    total_pages: number
  }
  // Legacy support
  count?: number
  results?: T[]
  next?: string | null
  previous?: string | null
}

// Data transformation utilities
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

// Simple fetch wrapper with error handling
async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const tokens = tokenUtils.getTokens()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  }

  // Add auth token if available
  if (tokens.access && !tokenUtils.isTokenExpired(tokens.access)) {
    headers['Authorization'] = `Bearer ${tokens.access}`
  }

  try {
    const response = await fetch(url, {
      headers,
      ...options,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('API fetch error:', error)
    throw error
  }
}

export const useApi = () => {
  // Posts endpoints
  const getPosts = async (params: PostsParams = {}): Promise<PaginatedApiResponse<Post>> => {
    const searchParams = new URLSearchParams()

    if (params.page) searchParams.append('page', params.page.toString())
    if (params.page_size) searchParams.append('page_size', params.page_size.toString())
    if (params.category) searchParams.append('category', params.category)
    if (params.search) searchParams.append('search', params.search)
    if (params.ordering) searchParams.append('ordering', params.ordering)

    const queryString = searchParams.toString()
    const endpoint = `/posts/${queryString ? `?${queryString}` : ''}`

    const response = await apiFetch<any>(endpoint)

    // Transform the response
    if (response.success && response.data) {
      return {
        success: response.success,
        data: response.data.map(transformPost),
        results: response.data.map(transformPost),
        pagination: response.pagination,
        count: response.pagination?.count || 0,
        next: response.pagination?.next,
        previous: response.pagination?.previous
      }
    }

    return response
  }

  const getPost = async (id: number | string): Promise<StandardApiResponse<Post>> => {
    const response = await apiFetch<any>(`/posts/${id}/`)

    // Transform the response
    if (response.success && response.data) {
      return {
        success: response.success,
        data: transformPost(response.data),
        message: response.message
      }
    }

    return response
  }

  const getFeaturedPosts = async (): Promise<StandardApiResponse<Post[]>> => {
    return apiFetch<StandardApiResponse<Post[]>>('/posts/featured/')
  }

  const getCategoryPosts = async (categorySlug: string, params: PostsParams = {}): Promise<PaginatedApiResponse<Post>> => {
    const searchParams = new URLSearchParams()

    if (params.page) searchParams.append('page', params.page.toString())
    if (params.page_size) searchParams.append('page_size', params.page_size.toString())
    if (params.ordering) searchParams.append('ordering', params.ordering)

    const queryString = searchParams.toString()
    const endpoint = `/categories/${categorySlug}/posts/${queryString ? `?${queryString}` : ''}`

    return apiFetch<PaginatedApiResponse<Post>>(endpoint)
  }

  const createPost = async (postData: Partial<Post>): Promise<StandardApiResponse<Post>> => {
    return apiFetch<StandardApiResponse<Post>>('/posts/', {
      method: 'POST',
      body: JSON.stringify(postData),
    })
  }

  const updatePost = async (id: number, postData: Partial<Post>): Promise<StandardApiResponse<Post>> => {
    return apiFetch<StandardApiResponse<Post>>(`/posts/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(postData),
    })
  }

  const deletePost = async (id: number): Promise<StandardApiResponse> => {
    return apiFetch<StandardApiResponse>(`/posts/${id}/`, {
      method: 'DELETE',
    })
  }

  // Categories endpoints
  const getCategories = async (): Promise<StandardApiResponse<Category[]>> => {
    const response = await apiFetch<any>('/categories/')

    // Transform the response
    if (response.success && response.data) {
      return {
        success: response.success,
        data: response.data.map(transformCategory),
        message: response.message
      }
    }

    return response
  }

  const getCategory = async (id: number): Promise<StandardApiResponse<Category>> => {
    return apiFetch<StandardApiResponse<Category>>(`/categories/${id}/`)
  }

  // Comments endpoints
  const getComments = async (params: CommentParams = {}): Promise<PaginatedApiResponse<Comment>> => {
    const searchParams = new URLSearchParams()

    if (params.post) searchParams.append('post', params.post.toString())
    if (params.page) searchParams.append('page', params.page.toString())
    if (params.page_size) searchParams.append('page_size', params.page_size.toString())

    const queryString = searchParams.toString()
    const endpoint = `/comments/${queryString ? `?${queryString}` : ''}`

    return apiFetch<PaginatedApiResponse<Comment>>(endpoint)
  }

  const createComment = async (commentData: CreateCommentData): Promise<StandardApiResponse<Comment>> => {
    return apiFetch<StandardApiResponse<Comment>>('/comments/', {
      method: 'POST',
      body: JSON.stringify(commentData),
    })
  }

  // Search endpoints
  const searchPosts = async (filters: SearchFilters): Promise<PaginatedApiResponse<Post>> => {
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

    return apiFetch<PaginatedApiResponse<Post>>(endpoint)
  }

  // Auth endpoints
  const login = async (credentials: LoginCredentials): Promise<AuthTokens> => {
    return apiFetch<AuthTokens>('/users/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  }

  const register = async (userData: RegisterData): Promise<StandardApiResponse<User>> => {
    return apiFetch<StandardApiResponse<User>>('/users/auth/register/', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  const logout = async (): Promise<StandardApiResponse> => {
    return apiFetch<StandardApiResponse>('/users/auth/logout/', {
      method: 'POST',
    })
  }

  const getCurrentUser = async (): Promise<StandardApiResponse<User>> => {
    return apiFetch<StandardApiResponse<User>>('/users/auth/profile/')
  }

  const getProfile = async (): Promise<StandardApiResponse<User>> => {
    return apiFetch<StandardApiResponse<User>>('/users/auth/profile/')
  }

  const updateProfile = async (data: Partial<User>): Promise<StandardApiResponse<User>> => {
    return apiFetch<StandardApiResponse<User>>('/users/auth/profile/update/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  const changePassword = async (currentPassword: string, newPassword: string): Promise<StandardApiResponse> => {
    return apiFetch<StandardApiResponse>('/users/auth/change-password/', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    })
  }

  const refreshTokens = async (refreshToken: string): Promise<AuthTokens> => {
    return apiFetch<AuthTokens>('/users/auth/refresh/', {
      method: 'POST',
      body: JSON.stringify({ refresh: refreshToken }),
    })
  }

  const requestPasswordReset = async (email: string): Promise<StandardApiResponse> => {
    return apiFetch<StandardApiResponse>('/users/auth/password-reset/', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  const resetPassword = async (token: string, newPassword: string): Promise<StandardApiResponse> => {
    return apiFetch<StandardApiResponse>('/users/auth/password-reset/confirm/', {
      method: 'POST',
      body: JSON.stringify({ token, new_password: newPassword }),
    })
  }

  // Health check endpoint
  const healthCheck = async (): Promise<StandardApiResponse> => {
    return apiFetch<StandardApiResponse>('/health/')
  }

  return {
    // Posts
    getPosts,
    getPost,
    getFeaturedPosts,
    getCategoryPosts,
    createPost,
    updatePost,
    deletePost,

    // Categories
    getCategories,
    getCategory,

    // Comments
    getComments,
    createComment,

    // Search
    searchPosts,

    // Auth
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

    // Utils
    healthCheck,
    tokenUtils,
  }
}