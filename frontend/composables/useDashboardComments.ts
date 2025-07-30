interface DashboardComment {
    id: number
    contenido: string
    content?: string
    approved: boolean
    fecha_creacion: string
    created_at?: string
    fecha_actualizacion: string
    updated_at?: string
    usuario: {
        id: number
        username: string
        email: string
        first_name: string
        last_name: string
    }
    author?: {
        id: number
        username: string
        email: string
        first_name: string
        last_name: string
    }
    post: {
        id: number
        titulo: string
        title?: string
    }
    parent?: {
        id: number
        contenido: string
        usuario: {
            username: string
        }
    }
    replies_count?: number
}

interface CommentsResponse {
    count: number
    next: string | null
    previous: string | null
    results: DashboardComment[]
}

export const useDashboardComments = () => {
    const config = useRuntimeConfig()
    const apiBase = config.public.apiBase
    const { apiCall, isAuthenticated } = useDashboardAuth()

    // State
    const comments = ref<DashboardComment[]>([])
    const currentComment = ref<DashboardComment | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)
    const totalCount = ref(0)

    // Fetch comments list
    const fetchComments = async (params: {
        page?: number
        page_size?: number
        search?: string
        approved?: boolean
        post?: number
        ordering?: string
    } = {}) => {
        loading.value = true
        error.value = null

        try {
            const queryParams = new URLSearchParams()

            if (params.page) queryParams.append('page', params.page.toString())
            if (params.page_size) queryParams.append('page_size', params.page_size.toString())
            if (params.search) queryParams.append('search', params.search)
            if (params.approved !== undefined) queryParams.append('approved', params.approved.toString())
            if (params.post) queryParams.append('post', params.post.toString())
            if (params.ordering) queryParams.append('ordering', params.ordering)

            const url = `${apiBase}/api/v1/dashboard/api/comments/?${queryParams.toString()}`
            const response = await apiCall(url)

            if (response && response.results) {
                comments.value = response.results
                totalCount.value = response.count || 0
                return response
            } else if (response && Array.isArray(response)) {
                // Handle direct array response
                comments.value = response
                totalCount.value = response.length
                return { results: response, count: response.length }
            } else {
                error.value = 'Error al cargar comentarios'
            }
        } catch (err: any) {
            console.error('Comments fetch error:', err)
            error.value = err.statusMessage || err.message || 'Error de conexión'
        } finally {
            loading.value = false
        }
    }

    // Fetch single comment
    const fetchComment = async (id: number) => {
        if (!id) return

        loading.value = true
        error.value = null

        try {
            const response = await apiCall(`${apiBase}/api/v1/dashboard/api/comments/${id}/`)

            if (response) {
                currentComment.value = response
                return response
            } else {
                error.value = 'Error al cargar comentario'
            }
        } catch (err: any) {
            console.error('Comment fetch error:', err)
            error.value = err.statusMessage || err.message || 'Error de conexión'
        } finally {
            loading.value = false
        }
    }

    // Approve comment
    const approveComment = async (id: number) => {
        try {
            const response = await apiCall(`${apiBase}/api/v1/dashboard/api/comments/${id}/`, {
                method: 'PATCH',
                body: { approved: true }
            })

            if (response) {
                // Update in comments list
                const index = comments.value.findIndex(c => c.id === id)
                if (index !== -1) {
                    comments.value[index] = response
                }
                return true
            }
        } catch (err: any) {
            console.error('Approve comment error:', err)
            error.value = err.statusMessage || err.message || 'Error aprobando comentario'
        }
    }

    // Reject comment
    const rejectComment = async (id: number) => {
        try {
            const response = await apiCall(`${apiBase}/api/v1/dashboard/api/comments/${id}/`, {
                method: 'PATCH',
                body: { approved: false }
            })

            if (response) {
                // Update in comments list
                const index = comments.value.findIndex(c => c.id === id)
                if (index !== -1) {
                    comments.value[index] = response
                }
                return true
            }
        } catch (err: any) {
            console.error('Reject comment error:', err)
            error.value = err.statusMessage || err.message || 'Error rechazando comentario'
        }
    }

    // Delete comment
    const deleteComment = async (id: number) => {
        try {
            await apiCall(`${apiBase}/api/v1/dashboard/api/comments/${id}/`, {
                method: 'DELETE'
            })

            // Remove from comments list
            comments.value = comments.value.filter(c => c.id !== id)

            // Clear current comment if it was deleted
            if (currentComment.value?.id === id) {
                currentComment.value = null
            }

            return true
        } catch (err: any) {
            console.error('Delete comment error:', err)
            error.value = err.statusMessage || err.message || 'Error eliminando comentario'
            return false
        }
    }

    // Update comment
    const updateComment = async (id: number, commentData: Partial<DashboardComment>) => {
        if (!id) return

        loading.value = true
        error.value = null

        try {
            const response = await apiCall(`${apiBase}/api/v1/dashboard/api/comments/${id}/`, {
                method: 'PATCH',
                body: commentData
            })

            if (response) {
                // Update in comments list
                const index = comments.value.findIndex(c => c.id === id)
                if (index !== -1) {
                    comments.value[index] = response
                }
                currentComment.value = response
                return response
            } else {
                throw new Error('No response data')
            }
        } catch (err: any) {
            console.error('Comment update error:', err)
            error.value = err.statusMessage || err.message || 'Error actualizando comentario'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Bulk moderate comments
    const bulkModerateComments = async (commentIds: number[], action: string) => {
        if (!commentIds.length) return 0

        try {
            const response = await apiCall(`${apiBase}/api/v1/dashboard/api/comments/bulk-action/`, {
                method: 'POST',
                body: {
                    comment_ids: commentIds,
                    action: action
                }
            })

            if (response && response.updated_count !== undefined) {
                // Refresh comments list to get updated data
                await fetchComments()
                return response.updated_count
            }

            return 0
        } catch (err: any) {
            console.error('Bulk moderate error:', err)
            error.value = err.statusMessage || err.message || 'Error en moderación masiva'
            return 0
        }
    }

    // Get moderation queue
    const getModerationQueue = async () => {
        try {
            const response = await apiCall(`${apiBase}/api/v1/dashboard/comments/moderation-queue/`)
            return response || []
        } catch (err: any) {
            console.error('Moderation queue error:', err)
            error.value = err.statusMessage || err.message || 'Error obteniendo cola de moderación'
            return []
        }
    }

    return {
        comments: readonly(comments),
        currentComment: readonly(currentComment),
        loading: readonly(loading),
        error: readonly(error),
        totalCount: readonly(totalCount),
        fetchComments,
        fetchComment,
        approveComment,
        rejectComment,
        deleteComment,
        updateComment,
        bulkModerateComments,
        getModerationQueue
    }
}