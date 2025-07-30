interface DashboardPost {
    id: number
    titulo: string
    contenido: string
    status: 'draft' | 'published' | 'archived'
    featured: boolean
    imagen?: string
    categoria?: {
        id: number
        nombre: string
    }
    autor: {
        id: number
        username: string
        email: string
    }
    fecha_creacion: string
    fecha_publicacion: string
    fecha_actualizacion: string
    comments_count: number
}

interface PostsResponse {
    count: number
    next: string | null
    previous: string | null
    results: DashboardPost[]
}

interface PostResponse {
    error: boolean
    data: DashboardPost
}

export const useDashboardPosts = () => {
    const config = useRuntimeConfig()
    const apiBase = config.public.apiBase
    const { apiCall, isAuthenticated } = useDashboardAuth()
    const { createLoadingWrapper } = useLoading()
    const { handleApiError } = useErrorHandler()

    // Create loading wrapper for posts operations
    const postsLoading = createLoadingWrapper('dashboard-posts', false)

    // State
    const posts = ref<DashboardPost[]>([])
    const currentPost = ref<DashboardPost | null>(null)
    const loading = computed(() => postsLoading.loading.value)
    const error = ref<string | null>(null)
    const totalCount = ref(0)

    // Fetch posts list
    const fetchPosts = async (params: {
        page?: number
        page_size?: number
        search?: string
        status?: string
        categoria?: string
        autor?: string
        ordering?: string
    } = {}) => {
        loading.value = true
        error.value = null

        try {
            const queryParams = new URLSearchParams()

            if (params.page) queryParams.append('page', params.page.toString())
            if (params.page_size) queryParams.append('page_size', params.page_size.toString())
            if (params.search) queryParams.append('search', params.search)
            if (params.status) queryParams.append('status', params.status)
            if (params.categoria) queryParams.append('categoria', params.categoria)
            if (params.autor) queryParams.append('autor', params.autor)
            if (params.ordering) queryParams.append('ordering', params.ordering)

            // Use the dashboard posts API
            const url = `${apiBase}/api/v1/dashboard/api/posts/?${queryParams.toString()}`

            const response = await apiCall(url)

            if (response && response.results) {
                posts.value = response.results
                totalCount.value = response.count || 0
                return response
            } else if (response && Array.isArray(response)) {
                // Handle direct array response
                posts.value = response
                totalCount.value = response.length
                return { results: response, count: response.length }
            } else {
                error.value = 'Error al cargar posts'
            }
        } catch (err: any) {
            console.error('Posts fetch error:', err)
            error.value = err.data?.message || 'Error de conexión'
        } finally {
            loading.value = false
        }
    }

    // Fetch single post
    const fetchPost = async (id: number) => {
        if (!id) return

        loading.value = true
        error.value = null

        try {
            const response = await apiCall(`${apiBase}/api/v1/dashboard/api/posts/${id}/`)

            if (response) {
                currentPost.value = response
                return response
            } else {
                error.value = 'Error al cargar post'
            }
        } catch (err: any) {
            console.error('Post fetch error:', err)
            error.value = err.data?.message || 'Error de conexión'
        } finally {
            loading.value = false
        }
    }

    // Create post
    const createPost = async (postData: Partial<DashboardPost>) => {
        loading.value = true
        error.value = null

        try {
            const response = await apiCall(`${apiBase}/api/v1/dashboard/api/posts/`, {
                method: 'POST',
                body: postData
            })

            if (response) {
                // Add to posts list
                posts.value.unshift(response)
                return response
            } else {
                throw new Error('No response data')
            }
        } catch (err: any) {
            console.error('Post create error:', err)
            error.value = err.statusMessage || err.message || 'Error creando post'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Update post
    const updatePost = async (id: number, postData: Partial<DashboardPost>) => {
        if (!id) return

        loading.value = true
        error.value = null

        try {
            const response = await apiCall(`${apiBase}/api/v1/dashboard/api/posts/${id}/`, {
                method: 'PATCH',
                body: postData
            })

            if (response) {
                // Update in posts list
                const index = posts.value.findIndex(p => p.id === id)
                if (index !== -1) {
                    posts.value[index] = response
                }
                currentPost.value = response
                return response
            } else {
                throw new Error('No response data')
            }
        } catch (err: any) {
            console.error('Post update error:', err)
            error.value = err.statusMessage || err.message || 'Error actualizando post'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Delete post
    const deletePost = async (id: number) => {
        if (!id) return false

        try {
            await apiCall(`${apiBase}/api/v1/dashboard/api/posts/${id}/`, {
                method: 'DELETE'
            })

            // Remove from posts list
            posts.value = posts.value.filter(p => p.id !== id)

            // Clear current post if it was deleted
            if (currentPost.value?.id === id) {
                currentPost.value = null
            }

            return true
        } catch (err: any) {
            console.error('Post delete error:', err)
            error.value = err.statusMessage || err.message || 'Error eliminando post'
            return false
        }
    }

    // Toggle featured status
    const toggleFeatured = async (id: number) => {
        if (!id) return

        try {
            const post = posts.value.find(p => p.id === id)
            if (!post) return

            const response = await apiCall(`${apiBase}/api/v1/dashboard/api/posts/${id}/`, {
                method: 'PATCH',
                body: { featured: !post.featured }
            })

            if (response) {
                // Update in posts list
                const index = posts.value.findIndex(p => p.id === id)
                if (index !== -1) {
                    posts.value[index] = response
                }
                return response.featured
            }
        } catch (err: any) {
            console.error('Toggle featured error:', err)
            error.value = err.statusMessage || err.message || 'Error cambiando estado destacado'
        }
    }

    // Bulk update status
    const bulkUpdateStatus = async (postIds: number[], status: string) => {
        if (!postIds.length) return 0

        try {
            const response = await apiCall(`${apiBase}/api/v1/dashboard/api/posts/bulk-action/`, {
                method: 'POST',
                body: {
                    post_ids: postIds,
                    action: status
                }
            })

            if (response && response.updated_count !== undefined) {
                // Refresh posts list to get updated data
                await fetchPosts()
                return response.updated_count
            }

            return 0
        } catch (err: any) {
            console.error('Bulk update error:', err)
            error.value = err.statusMessage || err.message || 'Error en actualización masiva'
            return 0
        }
    }

    return {
        posts: readonly(posts),
        currentPost: readonly(currentPost),
        loading: readonly(loading),
        error: readonly(error),
        totalCount: readonly(totalCount),
        fetchPosts,
        fetchPost,
        createPost,
        updatePost,
        deletePost,
        toggleFeatured,
        bulkUpdateStatus
    }
}