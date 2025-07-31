import type { Comment, User, Post, ApiResponse } from '~/types'

interface DashboardComment extends Comment {
    // Dashboard-specific fields
    ip_address?: string
    user_agent?: string
    moderation_status: 'pending' | 'approved' | 'rejected' | 'spam'
    moderated_by?: User
    moderated_at?: string
    spam_score?: number
    replies_count: number
}

interface CommentFilters {
    page?: number
    page_size?: number
    search?: string
    moderation_status?: 'pending' | 'approved' | 'rejected' | 'spam'
    post?: number | string
    author?: number | string
    ordering?: string
    date_from?: string
    date_to?: string
    has_replies?: boolean
}

interface BulkCommentAction {
    action: 'approve' | 'reject' | 'spam' | 'delete' | 'restore'
    comment_ids: number[]
}

interface CommentStats {
    total_comments: number
    pending_comments: number
    approved_comments: number
    rejected_comments: number
    spam_comments: number
    comments_today: number
}

interface ModerationQueue {
    pending: DashboardComment[]
    spam_detected: DashboardComment[]
    reported: DashboardComment[]
}

export const useDashboardComments = () => {
    const { dashboardApiCall, requirePermission } = useDashboardAuth()
    const { handleApiError, handleValidationError } = useErrorHandler()
    const { dashboardLoading } = useLoading()

    // State
    const comments = ref<DashboardComment[]>([])
    const currentComment = ref<DashboardComment | null>(null)
    const commentStats = ref<CommentStats | null>(null)
    const moderationQueue = ref<ModerationQueue | null>(null)
    const loading = computed(() => dashboardLoading.loading.value)
    const error = ref<string | null>(null)
    const totalCount = ref(0)
    const currentFilters = ref<CommentFilters>({})
    const selectedComments = ref<number[]>([])

    // Computed
    const hasSelectedComments = computed(() => selectedComments.value.length > 0)
    const pendingComments = computed(() => comments.value.filter(c => c.moderation_status === 'pending'))
    const approvedComments = computed(() => comments.value.filter(c => c.moderation_status === 'approved'))
    const rejectedComments = computed(() => comments.value.filter(c => c.moderation_status === 'rejected'))
    const spamComments = computed(() => comments.value.filter(c => c.moderation_status === 'spam'))

    // Helper function to clean filters
    const cleanFilters = (filters: CommentFilters) => {
        const cleaned: Record<string, any> = {}
        for (const [key, value] of Object.entries(filters)) {
            if (value !== undefined && value !== null && value !== '') {
                cleaned[key] = value
            }
        }
        return cleaned
    }

    // Fetch comments list
    const fetchComments = async (filters: CommentFilters = {}) => {
        return await dashboardLoading.withLoading(async () => {
            try {
                error.value = null
                console.log('📡 Fetching dashboard comments with filters:', filters)

                // Require permission to manage comments
                await requirePermission('can_manage_comments')

                // Store current filters
                currentFilters.value = { ...filters }

                const response = await dashboardApiCall<ApiResponse<DashboardComment>>('/dashboard/comments/', {
                    params: cleanFilters(filters)
                })

                comments.value = response.results || []
                totalCount.value = response.count || 0

                console.log('✅ Dashboard comments fetched successfully:', {
                    count: comments.value.length,
                    total: totalCount.value
                })

                return response
            } catch (err: any) {
                console.error('❌ Dashboard comments fetch error:', err)

                const errorInfo = handleApiError(err, 'Dashboard Comments Fetch Failed')
                error.value = errorInfo.message

                throw err
            }
        })
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

    // Fetch single comment
    const fetchComment = async (id: number | string) => {
        if (!id) {
            throw new Error('Comment ID is required')
        }

        return await dashboardLoading.withLoading(async () => {
            try {
                error.value = null
                console.log('📡 Fetching dashboard comment:', id)

                // Require permission to manage comments
                await requirePermission('can_manage_comments')

                const response = await dashboardApiCall<DashboardComment>(`/dashboard/comments/${id}/`)

                currentComment.value = response
                console.log('✅ Dashboard comment fetched successfully')

                return response
            } catch (err: any) {
                console.error('❌ Dashboard comment fetch error:', err)

                const errorInfo = handleApiError(err, 'Dashboard Comment Fetch Failed')
                error.value = errorInfo.message

                throw err
            }
        })
    }

    // Approve comment
    const approveComment = async (id: number | string) => {
        return await moderateComment(id, 'approved')
    }

    // Reject comment
    const rejectComment = async (id: number | string) => {
        return await moderateComment(id, 'rejected')
    }

    // Mark comment as spam
    const markAsSpam = async (id: number | string) => {
        return await moderateComment(id, 'spam')
    }

    // Moderate comment (generic function)
    const moderateComment = async (id: number | string, status: 'pending' | 'approved' | 'rejected' | 'spam') => {
        if (!id) {
            throw new Error('Comment ID is required')
        }

        try {
            error.value = null
            console.log('🔍 Moderating comment:', id, 'to status:', status)

            // Require permission to manage comments
            await requirePermission('can_manage_comments')

            const response = await dashboardApiCall<DashboardComment>(`/dashboard/comments/${id}/`, {
                method: 'PATCH',
                body: { moderation_status: status }
            })

            // Update in comments list
            const index = comments.value.findIndex(c => c.id === Number(id))
            if (index !== -1) {
                comments.value[index] = response
            }

            // Update current comment if it's the same
            if (currentComment.value?.id === Number(id)) {
                currentComment.value = response
            }

            console.log('✅ Comment moderated successfully:', status)
            return response
        } catch (err: any) {
            console.error('❌ Comment moderation error:', err)

            const errorInfo = handleApiError(err, 'Comment Moderation Failed')
            error.value = errorInfo.message

            throw err
        }
    }

    // Update comment
    const updateComment = async (id: number | string, commentData: Partial<DashboardComment>) => {
        if (!id) {
            throw new Error('Comment ID is required')
        }

        return await dashboardLoading.withLoading(async () => {
            try {
                error.value = null
                console.log('📝 Updating dashboard comment:', id)

                // Require permission to manage comments
                await requirePermission('can_manage_comments')

                const response = await dashboardApiCall<DashboardComment>(`/dashboard/comments/${id}/`, {
                    method: 'PATCH',
                    body: commentData
                })

                // Update in comments list
                const index = comments.value.findIndex(c => c.id === Number(id))
                if (index !== -1) {
                    comments.value[index] = response
                }

                // Update current comment if it's the same
                if (currentComment.value?.id === Number(id)) {
                    currentComment.value = response
                }

                console.log('✅ Dashboard comment updated successfully')
                return response
            } catch (err: any) {
                console.error('❌ Dashboard comment update error:', err)

                // Handle validation errors specifically
                if (err.data?.errors) {
                    const errorInfo = handleValidationError(err, 'Comment Update Validation Failed')
                    error.value = errorInfo.message
                } else {
                    const errorInfo = handleApiError(err, 'Dashboard Comment Update Failed')
                    error.value = errorInfo.message
                }

                throw err
            }
        })
    }

    // Delete comment
    const deleteComment = async (id: number | string) => {
        if (!id) {
            throw new Error('Comment ID is required')
        }

        return await dashboardLoading.withLoading(async () => {
            try {
                error.value = null
                console.log('🗑️ Deleting dashboard comment:', id)

                // Require permission to manage comments
                await requirePermission('can_manage_comments')

                await dashboardApiCall(`/dashboard/comments/${id}/`, {
                    method: 'DELETE'
                })

                // Remove from comments list
                comments.value = comments.value.filter(c => c.id !== Number(id))
                totalCount.value = Math.max(0, totalCount.value - 1)

                // Clear current comment if it was deleted
                if (currentComment.value?.id === Number(id)) {
                    currentComment.value = null
                }

                // Remove from selected comments
                selectedComments.value = selectedComments.value.filter(commentId => commentId !== Number(id))

                console.log('✅ Dashboard comment deleted successfully')
                return true
            } catch (err: any) {
                console.error('❌ Dashboard comment delete error:', err)

                const errorInfo = handleApiError(err, 'Dashboard Comment Delete Failed')
                error.value = errorInfo.message

                throw err
            }
        })
    }

    // Bulk actions
    const bulkAction = async (action: BulkCommentAction) => {
        if (!action.comment_ids.length) {
            throw new Error('No comments selected for bulk action')
        }

        return await dashboardLoading.withLoading(async () => {
            try {
                error.value = null
                console.log('📦 Performing bulk action:', action.action, 'on', action.comment_ids.length, 'comments')

                // Require permission to manage comments
                await requirePermission('can_manage_comments')

                const response = await dashboardApiCall<{ updated_count: number, message: string }>('/dashboard/comments/bulk-action/', {
                    method: 'POST',
                    body: action
                })

                // Refresh comments list to get updated data
                await fetchComments(currentFilters.value)

                // Clear selected comments
                selectedComments.value = []

                console.log('✅ Bulk action completed successfully:', response.updated_count, 'comments updated')
                return response
            } catch (err: any) {
                console.error('❌ Bulk action error:', err)

                const errorInfo = handleApiError(err, 'Bulk Action Failed')
                error.value = errorInfo.message

                throw err
            }
        })
    }

    // Convenience methods for bulk actions
    const bulkApprove = (commentIds: number[]) => bulkAction({ action: 'approve', comment_ids: commentIds })
    const bulkReject = (commentIds: number[]) => bulkAction({ action: 'reject', comment_ids: commentIds })
    const bulkSpam = (commentIds: number[]) => bulkAction({ action: 'spam', comment_ids: commentIds })
    const bulkDelete = (commentIds: number[]) => bulkAction({ action: 'delete', comment_ids: commentIds })
    const bulkRestore = (commentIds: number[]) => bulkAction({ action: 'restore', comment_ids: commentIds })

    // Get moderation queue
    const getModerationQueue = async () => {
        try {
            console.log('📋 Fetching moderation queue')

            const response = await dashboardApiCall<ModerationQueue>('/dashboard/comments/moderation-queue/')
            moderationQueue.value = response

            console.log('✅ Moderation queue fetched successfully')
            return response
        } catch (err: any) {
            console.error('❌ Moderation queue fetch error:', err)

            const errorInfo = handleApiError(err, 'Moderation Queue Fetch Failed')
            error.value = errorInfo.message

            throw err
        }
    }

    // Fetch comment statistics
    const fetchCommentStats = async () => {
        try {
            console.log('📊 Fetching comment statistics')

            const response = await dashboardApiCall<CommentStats>('/dashboard/comments/stats/')
            commentStats.value = response

            console.log('✅ Comment statistics fetched successfully')
            return response
        } catch (err: any) {
            console.error('❌ Comment statistics fetch error:', err)

            const errorInfo = handleApiError(err, 'Comment Statistics Fetch Failed')
            error.value = errorInfo.message

            throw err
        }
    }

    // Comment selection management
    const toggleCommentSelection = (commentId: number) => {
        const index = selectedComments.value.indexOf(commentId)
        if (index > -1) {
            selectedComments.value.splice(index, 1)
        } else {
            selectedComments.value.push(commentId)
        }
    }

    const selectAllComments = () => {
        selectedComments.value = comments.value.map(c => c.id)
    }

    const clearSelection = () => {
        selectedComments.value = []
    }

    const isCommentSelected = (commentId: number) => {
        return selectedComments.value.includes(commentId)
    }

    // Search and filter helpers
    const searchComments = async (query: string) => {
        return await fetchComments({ ...currentFilters.value, search: query, page: 1 })
    }

    const filterByStatus = async (status: 'pending' | 'approved' | 'rejected' | 'spam') => {
        return await fetchComments({ ...currentFilters.value, moderation_status: status, page: 1 })
    }

    const filterByPost = async (postId: number | string) => {
        return await fetchComments({ ...currentFilters.value, post: postId, page: 1 })
    }

    const filterByAuthor = async (authorId: number | string) => {
        return await fetchComments({ ...currentFilters.value, author: authorId, page: 1 })
    }

    const sortComments = async (ordering: string) => {
        return await fetchComments({ ...currentFilters.value, ordering })
    }

    // Reset filters
    const resetFilters = async () => {
        currentFilters.value = {}
        return await fetchComments()
    }

    return {
        // State
        comments: readonly(comments),
        currentComment: readonly(currentComment),
        commentStats: readonly(commentStats),
        moderationQueue: readonly(moderationQueue),
        loading: readonly(loading),
        error: readonly(error),
        totalCount: readonly(totalCount),
        currentFilters: readonly(currentFilters),
        selectedComments: readonly(selectedComments),

        // Computed
        hasSelectedComments: readonly(hasSelectedComments),
        pendingComments: readonly(pendingComments),
        approvedComments: readonly(approvedComments),
        rejectedComments: readonly(rejectedComments),
        spamComments: readonly(spamComments),

        // CRUD Operations
        fetchComments,
        fetchComment,
        updateComment,
        deleteComment,

        // Moderation Operations
        approveComment,
        rejectComment,
        markAsSpam,
        moderateComment,

        // Bulk Operations
        bulkAction,
        bulkApprove,
        bulkReject,
        bulkSpam,
        bulkDelete,
        bulkRestore,

        // Selection Management
        toggleCommentSelection,
        selectAllComments,
        clearSelection,
        isCommentSelected,

        // Search and Filter
        searchComments,
        filterByStatus,
        filterByPost,
        filterByAuthor,
        sortComments,
        resetFilters,

        // Additional Data
        getModerationQueue,
        fetchCommentStats,

        // Utilities
        cleanFilters
    }
}