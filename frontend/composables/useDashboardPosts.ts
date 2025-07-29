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
    const { accessToken } = useDashboardAuth()

    // State
    const posts = ref<DashboardPost[]>([])
    const currentPost = ref<DashboardPost | null>(null)
    const loading = ref(false)
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

            // Use the public posts API for now
            const url = `${apiBase}/api/v1/posts/?${queryParams.toString()}`

            const response = await $fetch<PostsResponse>(url, {
                headers: accessToken.value ? {
                    'Authorization': `Bearer ${accessToken.value}`
                } : {}
            })

            if (response.results) {
                posts.value = response.results
                totalCount.value = response.count || 0
                return response
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
            const response = await $fetch<DashboardPost>(`${apiBase}/api/v1/posts/${id}/`, {
                headers: accessToken.value ? {
                    'Authorization': `Bearer ${accessToken.value}`
                } : {}
            })

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

    // Create post (placeholder - needs dashboard API implementation)
    const createPost = async (postData: Partial<DashboardPost>) => {
        loading.value = true
        error.value = null

        try {
            // For now, simulate post creation
            const newPost = {
                id: Date.now(),
                titulo: postData.titulo || '',
                contenido: postData.contenido || '',
                status: postData.status || 'draft',
                featured: postData.featured || false,
                fecha_creacion: new Date().toISOString(),
                fecha_publicacion: new Date().toISOString(),
                fecha_actualizacion: new Date().toISOString(),
                comments_count: 0,
                autor: {
                    id: 1,
                    username: 'admin',
                    email: 'admin@example.com'
                }
            } as DashboardPost

            // Add to posts list
            posts.value.unshift(newPost)
            return newPost
        } catch (err: any) {
            console.error('Post create error:', err)
            error.value = err.message || 'Error de conexión'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Update post (placeholder - needs dashboard API implementation)
    const updatePost = async (id: number, postData: Partial<DashboardPost>) => {
        if (!id) return

        loading.value = true
        error.value = null

        try {
            // For now, simulate post update
            const index = posts.value.findIndex(p => p.id === id)
            if (index !== -1) {
                posts.value[index] = {
                    ...posts.value[index],
                    ...postData,
                    fecha_actualizacion: new Date().toISOString()
                }
                currentPost.value = posts.value[index]
                return posts.value[index]
            }

            throw new Error('Post no encontrado')
        } catch (err: any) {
            console.error('Post update error:', err)
            error.value = err.message || 'Error de conexión'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Delete post (placeholder - needs dashboard API implementation)
    const deletePost = async (id: number) => {
        if (!id) return

        try {
            // For now, simulate post deletion
            posts.value = posts.value.filter(p => p.id !== id)
            return true
        } catch (err: any) {
            console.error('Post delete error:', err)
            error.value = err.message || 'Error de conexión'
            return false
        }
    }

    // Toggle featured status (placeholder - needs dashboard API implementation)
    const toggleFeatured = async (id: number) => {
        if (!id) return

        try {
            // For now, simulate toggle featured
            const index = posts.value.findIndex(p => p.id === id)
            if (index !== -1) {
                posts.value[index].featured = !posts.value[index].featured
                return posts.value[index].featured
            }
        } catch (err: any) {
            console.error('Toggle featured error:', err)
            error.value = err.message || 'Error de conexión'
        }
    }

    // Bulk update status (placeholder - needs dashboard API implementation)
    const bulkUpdateStatus = async (postIds: number[], status: string) => {
        if (!postIds.length) return

        try {
            // For now, simulate bulk update
            let updatedCount = 0
            postIds.forEach(id => {
                const index = posts.value.findIndex(p => p.id === id)
                if (index !== -1) {
                    posts.value[index].status = status as any
                    updatedCount++
                }
            })

            return updatedCount
        } catch (err: any) {
            console.error('Bulk update error:', err)
            error.value = err.message || 'Error de conexión'
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