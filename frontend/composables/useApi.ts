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

// Token utilities remain at the top level as they don't depend on Nuxt context
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

// The main composable function
export const useApi = () => {
  // This function is now safe to be called from anywhere,
  // as it only returns a set of functions.

  // The actual Nuxt-dependent logic is deferred into apiFetch.
  const apiFetch = async <T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    // *** THE FIX ***
    // useRuntimeConfig() is now called here, inside the async function,
    // ensuring it runs in a valid context when an API call is actually made.
    const runtimeConfig = useRuntimeConfig()
    const API_BASE_URL = `${runtimeConfig.public.apiBase}/api/v1`
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

      if (!response.ok) {
        // Try to parse error from response body
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.detail || errorData.message || `HTTP error! status: ${response.status}`
        throw new Error(errorMessage)
      }

      // Handle cases with empty response body (e.g., 204 No Content)
      if (response.status === 204) {
        return {} as T
      }

      return await response.json()
    } catch (error) {
      console.error('API fetch error:', error)
      throw error
    }
  }

  // Each of these functions will call the locally scoped, safe `apiFetch`
  const getPosts = async (params: PostsParams = {}) => {
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
    return apiFetch<ApiResponse<Post[]>>('/posts/featured/')
  }

  const getCategoryPosts = async (categorySlug: string, params: PostsParams = {}) => {
    const searchParams = new URLSearchParams()
    if (params.page) searchParams.append('page', params.page.toString())
    if (params.page_size) searchParams.append('page_size', params.page_size.toString())
    if (params.ordering) searchParams.append('ordering', params.ordering)
    const queryString = searchParams.toString()
    const endpoint = `/categories/${categorySlug}/posts/${queryString ? `?${queryString}` : ''}`
    return apiFetch<ApiResponse<Post[]>>(endpoint)
  }

  const createPost = async (postData: Partial<Post>) => {
    return apiFetch<ApiResponse<Post>>('/posts/', {
      method: 'POST',
      body: JSON.stringify(postData),
    })
  }

  const updatePost = async (id: number, postData: Partial<Post>) => {
    return apiFetch<ApiResponse<Post>>(`/posts/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(postData),
    })
  }

  const deletePost = async (id: number) => {
    return apiFetch<ApiResponse>(`/posts/${id}/`, {
      method: 'DELETE',
    })
  }

  const getCategories = async () => {
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
    return apiFetch<ApiResponse<Category>>(`/categories/${id}/`)
  }

  const getComments = async (params: CommentParams = {}) => {
    const searchParams = new URLSearchParams()
    if (params.post) searchParams.append('post', params.post.toString())
    if (params.page) searchParams.append('page', params.page.toString())
    if (params.page_size) searchParams.append('page_size', params.page_size.toString())
    const queryString = searchParams.toString()
    const endpoint = `/comments/${queryString ? `?${queryString}` : ''}`
    return apiFetch<ApiResponse<Comment[]>>(endpoint)
  }

  const createComment = async (commentData: CreateCommentData) => {
    return apiFetch<ApiResponse<Comment>>('/comments/', {
      method: 'POST',
      body: JSON.stringify(commentData),
    })
  }

  const searchPosts = async (filters: SearchFilters) => {
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
    return apiFetch<AuthTokens>('/users/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  }

  const register = async (userData: RegisterData) => {
    return apiFetch<ApiResponse<User>>('/users/auth/register/', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  const logout = async () => {
    return apiFetch<ApiResponse>('/users/auth/logout/', {
      method: 'POST',
    })
  }

  const getCurrentUser = async () => {
    return apiFetch<ApiResponse<User>>('/users/auth/profile/')
  }

  const getProfile = async () => {
    return apiFetch<ApiResponse<User>>('/users/auth/profile/')
  }

  const updateProfile = async (data: Partial<User>) => {
    return apiFetch<ApiResponse<User>>('/users/auth/profile/update/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    return apiFetch<ApiResponse>('/users/auth/change-password/', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    })
  }

  const refreshTokens = async (refreshToken: string) => {
    return apiFetch<AuthTokens>('/users/auth/refresh/', {
      method: 'POST',
      body: JSON.stringify({ refresh: refreshToken }),
    })
  }

  const requestPasswordReset = async (email: string) => {
    return apiFetch<ApiResponse>('/users/auth/password-reset/', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  const resetPassword = async (token: string, newPassword: string) => {
    return apiFetch<ApiResponse>('/users/auth/password-reset/confirm/', {
      method: 'POST',
      body: JSON.stringify({ token, new_password: newPassword }),
    })
  }

  const healthCheck = async () => {
    return apiFetch<ApiResponse>('/health/')
  }

  // Expose the generic fetch function as apiRequest
  const apiRequest = apiFetch

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
