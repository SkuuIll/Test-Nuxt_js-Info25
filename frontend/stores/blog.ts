import { defineStore } from 'pinia'
import type { Post, Category, Tag, ApiResponse, PostsParams, SearchFilters } from '~/types'

export const useBlogStore = defineStore('blog', () => {
  // State
  const posts = ref<Post[]>([])
  const currentPost = ref<Post | null>(null)
  const categories = ref<Category[]>([])
  const tags = ref<Tag[]>([])
  const featuredPosts = ref<Post[]>([])

  const loading = ref(false)
  const error = ref<string | null>(null)

  const pagination = ref({
    page: 1,
    hasNext: false,
    hasPrevious: false,
    total: 0,
    pageSize: 12
  })

  const searchQuery = ref('')
  const activeFilters = ref<SearchFilters>({})

  // Getters
  const publishedPosts = computed(() =>
    posts.value.filter(post => post.status === 'published')
  )

  const postsByCategory = computed(() => {
    const grouped: Record<string, Post[]> = {}
    publishedPosts.value.forEach(post => {
      const categorySlug = post.category.slug
      if (!grouped[categorySlug]) {
        grouped[categorySlug] = []
      }
      grouped[categorySlug].push(post)
    })
    return grouped
  })

  const recentPosts = computed(() =>
    publishedPosts.value
      .sort((a, b) => new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime())
      .slice(0, 5)
  )

  // Actions
  const fetchPosts = async (params: PostsParams = {}) => {
    try {
      loading.value = true
      error.value = null

      const api = useApi()
      const { handleError } = useErrorHandler()

      const response: ApiResponse<Post> = await api.getPosts({
        page_size: pagination.value.pageSize,
        ...params
      })

      if (params.page === 1 || !params.page) {
        posts.value = response.results
      } else {
        // Append for infinite scroll
        posts.value.push(...response.results)
      }

      // Update pagination
      pagination.value = {
        ...pagination.value,
        page: params.page || 1,
        hasNext: !!response.next,
        hasPrevious: !!response.previous,
        total: response.count
      }

    } catch (err: any) {
      const errorInfo = handleError(err, 'fetchPosts')
      error.value = errorInfo.message
      console.error('Error fetching posts:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchPost = async (slug: string) => {
    try {
      loading.value = true
      error.value = null

      // Validate slug
      if (!slug || slug === 'undefined' || slug === 'null') {
        console.error('❌ Intento de fetch con slug inválido:', slug)
        throw new Error('Slug de post inválido')
      }

      console.log('📖 Fetching post from store with slug:', slug)

      const api = useApi()
      const { handleError } = useErrorHandler()

      currentPost.value = await api.getPost(slug)

    } catch (err: any) {
      const errorInfo = handleError(err, 'fetchPost')
      error.value = errorInfo.message
      console.error('Error fetching post:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchCategories = async () => {
    try {
      const api = useApi()
      const { handleError } = useErrorHandler()

      console.log('📂 Cargando categorías...')
      categories.value = await api.getCategories()
      console.log('✅ Categorías cargadas:', categories.value.length)
    } catch (err: any) {
      console.error('❌ Error cargando categorías:', err)
      handleError(err, 'fetchCategories')
      // Set empty array as fallback
      categories.value = []
    }
  }

  const fetchFeaturedPosts = async () => {
    try {
      const api = useApi()
      const { handleError } = useErrorHandler()

      featuredPosts.value = await api.getFeaturedPosts()
    } catch (err: any) {
      handleError(err, 'fetchFeaturedPosts')
      console.error('Error fetching featured posts:', err)
    }
  }

  const searchPosts = async (query: string, filters: SearchFilters = {}) => {
    try {
      loading.value = true
      error.value = null
      searchQuery.value = query
      activeFilters.value = filters

      const api = useApi()
      const { handleError } = useErrorHandler()

      const response: ApiResponse<Post> = await api.searchPosts(query, filters)

      posts.value = response.results
      pagination.value = {
        ...pagination.value,
        page: 1,
        hasNext: !!response.next,
        hasPrevious: false,
        total: response.count
      }

    } catch (err: any) {
      const errorInfo = handleError(err, 'searchPosts')
      error.value = errorInfo.message
      console.error('Error searching posts:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchPostsByCategory = async (categorySlug: string, params: PostsParams = {}) => {
    try {
      loading.value = true
      error.value = null

      const api = useApi()
      const response: ApiResponse<Post> = await api.getCategoryPosts(categorySlug, {
        page_size: pagination.value.pageSize,
        ...params
      })

      if (params.page === 1 || !params.page) {
        posts.value = response.results
      } else {
        posts.value.push(...response.results)
      }

      pagination.value = {
        ...pagination.value,
        page: params.page || 1,
        hasNext: !!response.next,
        hasPrevious: !!response.previous,
        total: response.count
      }

    } catch (err: any) {
      error.value = err.message || 'Failed to fetch category posts'
      console.error('Error fetching category posts:', err)
    } finally {
      loading.value = false
    }
  }

  const loadMorePosts = async () => {
    if (!pagination.value.hasNext || loading.value) return

    const nextPage = pagination.value.page + 1

    if (searchQuery.value) {
      // Continue search with next page
      await searchPosts(searchQuery.value, { ...activeFilters.value })
    } else {
      // Continue regular posts fetch
      await fetchPosts({ page: nextPage })
    }
  }

  const clearSearch = () => {
    searchQuery.value = ''
    activeFilters.value = {}
    fetchPosts()
  }

  const resetState = () => {
    posts.value = []
    currentPost.value = null
    loading.value = false
    error.value = null
    pagination.value = {
      page: 1,
      hasNext: false,
      hasPrevious: false,
      total: 0,
      pageSize: 12
    }
    searchQuery.value = ''
    activeFilters.value = {}
  }

  return {
    // State
    posts: readonly(posts),
    currentPost: readonly(currentPost),
    categories: readonly(categories),
    tags: readonly(tags),
    featuredPosts: readonly(featuredPosts),
    loading: readonly(loading),
    error: readonly(error),
    pagination: readonly(pagination),
    searchQuery: readonly(searchQuery),
    activeFilters: readonly(activeFilters),

    // Getters
    publishedPosts,
    postsByCategory,
    recentPosts,

    // Actions
    fetchPosts,
    fetchPost,
    fetchCategories,
    fetchFeaturedPosts,
    searchPosts,
    fetchPostsByCategory,
    loadMorePosts,
    clearSearch,
    resetState
  }
})