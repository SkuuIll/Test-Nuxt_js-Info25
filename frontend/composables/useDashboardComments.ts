import type { Comment, Post, User, ApiResponse } from '~/types'
import { handleApiError, handleValidationError } from '~/utils/errorHandling'

interface DashboardComment extends Comment {
    // Dashboard-specific fields
    post_title?: string
    author_name?: string
    author_email?: string
    author_ip?: string
    spam_score?: number
    moderation_notes?: string
    moderated_by?: User
    moderated_at?: string
    replies_count?: number
    is_flagged?: boolean
    flag_reasons?: string[]
    sentiment_score?: number
    word_count?: number
}

interface CommentFilters {
    page?: number
    page_size?: number
    search?: string
    status?: 'pending' | 'approved' | 'rejected' | 'spam'
    post?: string | number
    author?: string | number
    date_from?: string
    date_to?: string
    ordering?: string
    is_flagged?: boolean
    min_spam_score?: number
    max_spam_score?: number
    has_replies?: boolean
    sentiment?: 'positive' | 'negative' | 'neutral'
}

interface BulkCommentAction {
    action: 'approve' | 'reject' | 'spam' | 'delete' | 'move_to_trash' | 'restore'
    comment_ids: number[]
    data?: {
        moderation_note?: string
        notify_author?: boolean
        [key: string]: any
    }
}

interface CommentStats {
    total_comments: number
    approved_comments: number
    pending_comments: number
    rejected_comments: number
    spam_comments: number
    flagged_comments: number
    comments_this_month: number
    comments_this_week: number
    comments_today: number
    average_comments_per_post: number
    top_commenters: Array<{
        id: number
        name: string
        email: string
        comments_count: number
    }>
    comment_trends: Array<{
        date: string
        count: number
        approved: number
        rejected: number
    }>
    spam_detection_accuracy: number
    moderation_queue_size: number
}

interface ModerationAction {
    comment_id: number
    action: 'approve' | 'reject' | 'spam'
    note?: string
    notify_author?: boolean
}

export const useDashboardComments = () => {
    const { dashboardApiCall, requirePermission } = useDashboardAuth()
    // Error handlers imported from utils to avoid circular dependencies
    const { dashboardLoading } = useLoading()

    // State
    const comments = ref<DashboardComment[]>([])
    const currentComment = ref<DashboardComment | null>(null)
    const commentStats = ref<CommentStats | null>(null)
    const loading = computed(() => dashboardLoading.loading.value)
    const error = ref<string | null>(null)
    const totalCount = ref(0)
    const currentFilters = ref<CommentFilters>({})
    const selectedComments = ref<number[]>([])
    const validationErrors = ref<Record<string, string[]>>({})
    const operationHistory = ref<Array<{
        action: string
        commentId?: number
        postTitle?: string
        timestamp: Date
        success: boolean
        error?: string
    }>>([])
    const moderationQueue = ref<DashboardComment[]>([])
    const autoModerationEnabled = ref(false)

    // Computed
    const hasSelectedComments = computed(() => selectedComments.value.length > 0)
    const pendingComments = computed(() => comments.value.filter(c => c.status === 'pending'))
    const approvedComments = computed(() => comments.value.filter(c => c.status === 'approved'))
    const rejectedComments = computed(() => comments.value.filter(c => c.status === 'rejected'))
    const spamComments = computed(() => comments.value.filter(c => c.status === 'spam'))
    const flaggedComments = computed(() => comments.value.filter(c => c.is_flagged))
    const moderationQueueSize = computed(() => moderationQueue.value.length)

    // Helper functions
    const cleanFilters = (filters: CommentFilters) => {
        const cleaned: Record<string, any> = {}
        for (const [key, value] of Object.entries(filters)) {
            if (value !== undefined && value !== null && value !== '') {
                cleaned[key] = value
            }
        }
        return cleaned
    }

    const addToHistory = (operation: {
        action: string
        commentId?: number
        postTitle?: string
        success: boolean
        error?: string
    }) => {
        operationHistory.value.unshift({
            ...operation,
            timestamp: new Date()
        })

        // Keep only last 50 operations
        if (operationHistory.value.length > 50) {
            operationHistory.value = operationHistory.value.slice(0, 50)
        }
    }

    const clearValidationErrors = () => {
        validationErrors.value = {}
    }

    const validateCommentData = (commentData: Partial<DashboardComment>): boolean => {
        clearValidationErrors()
        let isValid = true

        // Content validation
        if (commentData.content !== undefined) {
            if (!commentData.content?.trim()) {
                validationErrors.value.content = ['Comment content is required']
                isValid = false
            } else if (commentData.content.length < 10) {
                validationErrors.value.content = ['Comment must be at least 10 characters']
                isValid = false
            } else if (commentData.content.length > 5000) {
                validationErrors.value.content = ['Comment must be less than 5000 characters']
                isValid = false
            }
        }

        // Author name validation
        if (commentData.author_name !== undefined) {
            if (!commentData.author_name?.trim()) {
                validationErrors.value.author_name = ['Author name is required']
                isValid = false
            } else if (commentData.author_name.length > 100) {
                validationErrors.value.author_name = ['Author name must be less than 100 characters']
                isValid = false
            }
        }

        // Author email validation
        if (commentData.author_email !== undefined) {
            if (!commentData.author_email?.trim()) {
                validationErrors.value.author_email = ['Author email is required']
                isValid = false
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(commentData.author_email)) {
                validationErrors.value.author_email = ['Please enter a valid email address']
                isValid = false
            }
        }

        // Status validation
        if (commentData.status && !['pending', 'approved', 'rejected', 'spam'].includes(commentData.status)) {
            validationErrors.value.status = ['Invalid comment status']
            isValid = false
        }

        return isValid
    }

    const handleCommentError = (error: any, operation: string, commentId?: number, postTitle?: string) => {
        console.error(`❌ ${operation} error:`, error)

        let errorMessage = `${operation} failed`
        let validationErrs: Record<string, string[]> = {}

        // Handle different error types
        if (error.data?.errors) {
            validationErrs = error.data.errors
            errorMessage = 'Validation errors occurred'
        } else if (error.data?.message) {
            errorMessage = error.data.message
        } else if (error.message) {
            errorMessage = error.message
        } else if (error.status === 403) {
            errorMessage = 'You do not have permission to perform this action'
        } else if (error.status === 404) {
            errorMessage = 'Comment not found'
        } else if (error.status === 429) {
            errorMessage = 'Too many requests. Please wait before trying again'
        } else if (error.status >= 500) {
            errorMessage = 'Server error. Please try again later'
        }

        // Update state
        error.value = errorMessage
        validationErrors.value = validationErrs

        // Add to history
        addToHistory({
            action: operation,
            commentId,
            postTitle,
            success: false,
            error: errorMessage
        })

        return { message: errorMessage, validationErrors: validationErrs }
    }

    // Fetch comments list
    const fetchComments = async (filters: CommentFilters = {}) => {
        return await dashboardLoading.withLoading(async () => {
            try {
                error.value = null
                clearValidationErrors()
                console.log('📡 Fetching dashboard comments with filters:', filters)

                // Require permission to moderate comments
                await requirePermission('can_moderate_comments')

                // Store current filters
                currentFilters.value = { ...filters }

                const response = await dashboardApiCall<ApiResponse<DashboardComment>>('/dashboard/comments/', {
                    params: cleanFilters(filters)
                })

                comments.value = response.results || []
                totalCount.value = response.count || 0

                // Add to history
                addToHistory({
                    action: 'Fetch Comments',
                    success: true
                })

                console.log('✅ Dashboard comments fetched successfully:', {
                    count: comments.value.length,
                    total: totalCount.value,
                    filters: Object.keys(cleanFilters(filters))
                })

                return response
            } catch (err: any) {
                const errorInfo = handleCommentError(err, 'Fetch Comments')
                throw err
            }
        })
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

                // Require permission to moderate comments
                await requirePermission('can_moderate_comments')

                const response = await dashboardApiCall<DashboardComment>(`/dashboard/comments/${id}/`)

                currentComment.value = response
                console.log('✅ Dashboard comment fetched successfully')

                return response
            } catch (err: any) {
                const errorInfo = handleCommentError(err, 'Fetch Comment', Number(id))
                throw err
            }
        })
    }

    // Update comment
    const updateComment = async (id: number | string, commentData: Partial<DashboardComment>) => {
        if (!id) {
            throw new Error('Comment ID is required')
        }

        return await dashboardLoading.withLoading(async () => {
            try {
                error.value = null
                clearValidationErrors()
                console.log('📝 Updating dashboard comment:', id)

                // Validate comment data
                const fieldsToValidate = Object.keys(commentData).reduce((acc, key) => {
                    acc[key] = commentData[key as keyof DashboardComment]
                    return acc
                }, {} as Partial<DashboardComment>)

                if (Object.keys(fieldsToValidate).length > 0 && !validateCommentData(fieldsToValidate)) {
                    throw new Error('Validation failed')
                }

                // Require permission to moderate comments
                await requirePermission('can_moderate_comments')

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

                // Add to history
                addToHistory({
                    action: 'Update Comment',
                    commentId: response.id,
                    postTitle: response.post_title,
                    success: true
                })

                // Show success message
                const { success } = useToast()
                success('Comment Updated', 'Comment has been updated successfully')

                console.log('✅ Dashboard comment updated successfully')
                return response
            } catch (err: any) {
                const errorInfo = handleCommentError(err, 'Update Comment', Number(id))
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

                // Require permission to moderate comments
                await requirePermission('can_moderate_comments')

                const commentToDelete = comments.value.find(c => c.id === Number(id))

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

                // Add to history
                addToHistory({
                    action: 'Delete Comment',
                    commentId: Number(id),
                    postTitle: commentToDelete?.post_title,
                    success: true
                })

                // Show success message
                const { success } = useToast()
                success('Comment Deleted', 'Comment has been deleted successfully')

                console.log('✅ Dashboard comment deleted successfully')
                return true
            } catch (err: any) {
                const errorInfo = handleCommentError(err, 'Delete Comment', Number(id))
                throw err
            }
        })
    }

    // Moderate comment (approve, reject, spam)
    const moderateComment = async (action: ModerationAction) => {
        return await dashboardLoading.withLoading(async () => {
            try {
                error.value = null
                console.log('⚖️ Moderating comment:', action.comment_id, action.action)

                // Require permission to moderate comments
                await requirePermission('can_moderate_comments')

                const response = await dashboardApiCall<DashboardComment>(`/dashboard/comments/${action.comment_id}/moderate/`, {
                    method: 'POST',
                    body: {
                        action: action.action,
                        note: action.note,
                        notify_author: action.notify_author
                    }
                })

                // Update in comments list
                const index = comments.value.findIndex(c => c.id === action.comment_id)
                if (index !== -1) {
                    comments.value[index] = response
                }

                // Update current comment if it's the same
                if (currentComment.value?.id === action.comment_id) {
                    currentComment.value = response
                }

                // Remove from moderation queue if present
                moderationQueue.value = moderationQueue.value.filter(c => c.id !== action.comment_id)

                // Add to history
                addToHistory({
                    action: `${action.action.charAt(0).toUpperCase() + action.action.slice(1)} Comment`,
                    commentId: response.id,
                    postTitle: response.post_title,
                    success: true
                })

                // Show success message
                const { success } = useToast()
                const actionText = action.action === 'approve' ? 'approved' :
                    action.action === 'reject' ? 'rejected' : 'marked as spam'
                success('Comment Moderated', `Comment has been ${actionText}`)

                console.log('✅ Comment moderated successfully:', action.action)
                return response
            } catch (err: any) {
                const errorInfo = handleCommentError(err, 'Moderate Comment', action.comment_id)
                throw err
            }
        })
    }

    // Convenience methods for moderation
    const approveComment = (id: number, note?: string, notifyAuthor = true) =>
        moderateComment({ comment_id: id, action: 'approve', note, notify_author: notifyAuthor })

    const rejectComment = (id: number, note?: string, notifyAuthor = true) =>
        moderateComment({ comment_id: id, action: 'reject', note, notify_author: notifyAuthor })

    const markAsSpam = (id: number, note?: string) =>
        moderateComment({ comment_id: id, action: 'spam', note, notify_author: false })

    // Bulk comment actions
    const bulkCommentAction = async (action: BulkCommentAction) => {
        if (!action.comment_ids.length) {
            throw new Error('No comments selected for bulk action')
        }

        return await dashboardLoading.withLoading(async () => {
            try {
                error.value = null
                console.log('📦 Performing bulk comment action:', action.action, 'on', action.comment_ids.length, 'comments')

                // Require permission to moderate comments
                await requirePermission('can_moderate_comments')

                const response = await dashboardApiCall<{ updated_count: number, message: string }>('/dashboard/comments/bulk-action/', {
                    method: 'POST',
                    body: action
                })

                // Refresh comments list to get updated data
                await fetchComments(currentFilters.value)

                // Clear selected comments
                selectedComments.value = []

                // Add to history
                addToHistory({
                    action: `Bulk ${action.action}`,
                    success: true
                })

                // Show success message
                const { success } = useToast()
                success('Bulk Action Completed', `${response.updated_count} comments updated successfully`)

                console.log('✅ Bulk comment action completed successfully:', response.updated_count, 'comments updated')
                return response
            } catch (err: any) {
                const errorInfo = handleCommentError(err, 'Bulk Comment Action')
                throw err
            }
        })
    }

    // Convenience methods for bulk actions
    const bulkApprove = (commentIds: number[], note?: string) =>
        bulkCommentAction({ action: 'approve', comment_ids: commentIds, data: { moderation_note: note } })

    const bulkReject = (commentIds: number[], note?: string) =>
        bulkCommentAction({ action: 'reject', comment_ids: commentIds, data: { moderation_note: note } })

    const bulkSpam = (commentIds: number[], note?: string) =>
        bulkCommentAction({ action: 'spam', comment_ids: commentIds, data: { moderation_note: note } })

    const bulkDelete = (commentIds: number[]) =>
        bulkCommentAction({ action: 'delete', comment_ids: commentIds })

    // Fetch comment statistics
    const fetchCommentStats = async () => {
        try {
            console.log('📊 Fetching comment statistics')

            const response = await dashboardApiCall<CommentStats>('/dashboard/comments/stats/')
            commentStats.value = response

            console.log('✅ Comment statistics fetched successfully')
            return response
        } catch (err: any) {
            const errorInfo = handleCommentError(err, 'Fetch Comment Statistics')
            throw err
        }
    }

    // Fetch moderation queue
    const fetchModerationQueue = async () => {
        try {
            console.log('📋 Fetching moderation queue')

            const response = await dashboardApiCall<DashboardComment[]>('/dashboard/comments/moderation-queue/')
            moderationQueue.value = response

            console.log('✅ Moderation queue fetched successfully:', response.length, 'comments')
            return response
        } catch (err: any) {
            const errorInfo = handleCommentError(err, 'Fetch Moderation Queue')
            throw err
        }
    }

    // Auto-moderation based on spam score
    const enableAutoModeration = async (settings: {
        spam_threshold?: number
        auto_approve_threshold?: number
        auto_reject_threshold?: number
    } = {}) => {
        try {
            console.log('🤖 Enabling auto-moderation with settings:', settings)

            await requirePermission('can_moderate_comments')

            const response = await dashboardApiCall<{ message: string }>('/dashboard/comments/auto-moderation/', {
                method: 'POST',
                body: { enabled: true, ...settings }
            })

            autoModerationEnabled.value = true

            // Show success message
            const { success } = useToast()
            success('Auto-Moderation Enabled', 'Comments will be automatically moderated based on spam scores')

            console.log('✅ Auto-moderation enabled successfully')
            return response
        } catch (err: any) {
            const errorInfo = handleCommentError(err, 'Enable Auto-Moderation')
            throw err
        }
    }

    const disableAutoModeration = async () => {
        try {
            console.log('🛑 Disabling auto-moderation')

            await requirePermission('can_moderate_comments')

            const response = await dashboardApiCall<{ message: string }>('/dashboard/comments/auto-moderation/', {
                method: 'POST',
                body: { enabled: false }
            })

            autoModerationEnabled.value = false

            // Show success message
            const { success } = useToast()
            success('Auto-Moderation Disabled', 'Comments will require manual moderation')

            console.log('✅ Auto-moderation disabled successfully')
            return response
        } catch (err: any) {
            const errorInfo = handleCommentError(err, 'Disable Auto-Moderation')
            throw err
        }
    }

    // Flag comment
    const flagComment = async (id: number | string, reasons: string[], note?: string) => {
        try {
            console.log('🚩 Flagging comment:', id, reasons)

            const response = await dashboardApiCall<DashboardComment>(`/dashboard/comments/${id}/flag/`, {
                method: 'POST',
                body: { reasons, note }
            })

            // Update in comments list
            const index = comments.value.findIndex(c => c.id === Number(id))
            if (index !== -1) {
                comments.value[index] = response
            }

            // Add to history
            addToHistory({
                action: 'Flag Comment',
                commentId: Number(id),
                postTitle: response.post_title,
                success: true
            })

            console.log('✅ Comment flagged successfully')
            return response
        } catch (err: any) {
            const errorInfo = handleCommentError(err, 'Flag Comment', Number(id))
            throw err
        }
    }

    // Unflag comment
    const unflagComment = async (id: number | string) => {
        try {
            console.log('🏳️ Unflagging comment:', id)

            const response = await dashboardApiCall<DashboardComment>(`/dashboard/comments/${id}/unflag/`, {
                method: 'POST'
            })

            // Update in comments list
            const index = comments.value.findIndex(c => c.id === Number(id))
            if (index !== -1) {
                comments.value[index] = response
            }

            // Add to history
            addToHistory({
                action: 'Unflag Comment',
                commentId: Number(id),
                postTitle: response.post_title,
                success: true
            })

            console.log('✅ Comment unflagged successfully')
            return response
        } catch (err: any) {
            const errorInfo = handleCommentError(err, 'Unflag Comment', Number(id))
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
        return await fetchComments({ ...currentFilters.value, status, page: 1 })
    }

    const filterByPost = async (postId: number | string) => {
        return await fetchComments({ ...currentFilters.value, post: postId, page: 1 })
    }

    const sortComments = async (ordering: string) => {
        return await fetchComments({ ...currentFilters.value, ordering })
    }

    const resetFilters = async () => {
        currentFilters.value = {}
        return await fetchComments()
    }

    // Get comment replies
    const getCommentReplies = async (id: number | string) => {
        try {
            console.log('💬 Fetching comment replies:', id)

            const response = await dashboardApiCall<DashboardComment[]>(`/dashboard/comments/${id}/replies/`)

            console.log('✅ Comment replies fetched successfully:', response.length)
            return response
        } catch (err: any) {
            const errorInfo = handleCommentError(err, 'Get Comment Replies', Number(id))
            throw err
        }
    }

    // Cleanup function
    const cleanup = () => {
        clearSelection()
        clearValidationErrors()
        error.value = null
        autoModerationEnabled.value = false
    }

    return {
        // State
        comments: readonly(comments),
        currentComment: readonly(currentComment),
        commentStats: readonly(commentStats),
        loading: readonly(loading),
        error: readonly(error),
        totalCount: readonly(totalCount),
        currentFilters: readonly(currentFilters),
        selectedComments: readonly(selectedComments),
        validationErrors: readonly(validationErrors),
        operationHistory: readonly(operationHistory),
        moderationQueue: readonly(moderationQueue),
        autoModerationEnabled: readonly(autoModerationEnabled),

        // Computed
        hasSelectedComments: readonly(hasSelectedComments),
        pendingComments: readonly(pendingComments),
        approvedComments: readonly(approvedComments),
        rejectedComments: readonly(rejectedComments),
        spamComments: readonly(spamComments),
        flaggedComments: readonly(flaggedComments),
        moderationQueueSize: readonly(moderationQueueSize),

        // CRUD Operations
        fetchComments,
        fetchComment,
        updateComment,
        deleteComment,

        // Moderation
        moderateComment,
        approveComment,
        rejectComment,
        markAsSpam,
        flagComment,
        unflagComment,

        // Bulk Operations
        bulkCommentAction,
        bulkApprove,
        bulkReject,
        bulkSpam,
        bulkDelete,

        // Selection Management
        toggleCommentSelection,
        selectAllComments,
        clearSelection,
        isCommentSelected,

        // Search and Filter
        searchComments,
        filterByStatus,
        filterByPost,
        sortComments,
        resetFilters,

        // Statistics and Queue
        fetchCommentStats,
        fetchModerationQueue,

        // Auto-Moderation
        enableAutoModeration,
        disableAutoModeration,

        // Additional Features
        getCommentReplies,

        // Validation
        validateCommentData,
        clearValidationErrors,

        // Utilities
        cleanFilters,
        addToHistory,
        handleCommentError,
        cleanup
    }
}