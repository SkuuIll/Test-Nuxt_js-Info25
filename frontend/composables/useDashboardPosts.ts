import type { Post, Category, User, ApiResponse } from '~/types'

interface DashboardPost extends Post {
    // Dashboard-specific fields
    views_count?: number
    last_edited_by?: User
    seo_score?: number
    reading_time?: number
    word_count?: number
    comments_count?: number
    is_trending?: boolean
    last_comment_date?: string
    edit_history?: Array<{
        user: User
        date: string
        action: string
    }>
}

interface PostFilters {
    page?: number
    page_size?: number
    search?: string
    status?: 'draft' | 'published' | 'archived'
    category?: string | number
    author?: string | number
    ordering?: string
    featured?: boolean
    date_from?: string
    date_to?: string
}

interface BulkAction {
    action: 'publish' | 'draft' | 'archive' | 'delete' | 'feature' | 'unfeature' | 'change_category' | 'change_author'
    post_ids: number[]
    data?: {
        category_id?: number
        author_id?: number
        publish_date?: string
        [key: string]: any
    }
}

interface PostStats {
    total_posts: number
    published_posts: number
    draft_posts: number
    archived_posts: number
    featured_posts: number
    trending_posts: number
    posts_this_month: number
    posts_this_week: number
    total_views: number
    total_comments: number
    avg_reading_time: number
    top_categories: Array<{
        name: string
        count: number
    }>
    recent_activity: Array<{
        action: string
        post_title: string
        user: string
        date: string
    }>
}

export const useDashboardPosts = () => {
    const { dashboardApiCall, requirePermission } = useDashboardAuth()
    const { handleApiError, handleValidationError } = useErrorHandler()
    const { dashboardLoading } = useLoading()

    // Create loading wrapper for posts operations
    const postsLoading = dashboardLoading

    // State
    const posts = ref<DashboardPost[]>([])
    const currentPost = ref<DashboardPost | null>(null)
    const categories = ref<Category[]>([])
    const postStats = ref<PostStats | null>(null)
    const loading = computed(() => postsLoading.loading.value)
    const error = ref<string | null>(null)
    const totalCount = ref(0)
    const currentFilters = ref<PostFilters>({})
    const selectedPosts = ref<number[]>([])
    const lastFetch = ref<Date | null>(null)
    const autoRefreshEnabled = ref(false)
    const autoRefreshInterval = ref<NodeJS.Timeout | null>(null)
    const operationHistory = ref<Array<{
        action: string
        postId?: number
        postTitle?: string
        timestamp: Date
        success: boolean
        error?: string
    }>>([])
    const validationErrors = ref<Record<string, string[]>>({})
    const isDirty = ref(false)

    // Computed
    const hasSelectedPosts = computed(() => selectedPosts.value.length > 0)
    const publishedPosts = computed(() => posts.value.filter(p => p.status === 'published'))
    const draftPosts = computed(() => posts.value.filter(p => p.status === 'draft'))
    const archivedPosts = computed(() => posts.value.filter(p => p.status === 'archived'))
    const featuredPosts = computed(() => posts.value.filter(p => p.featured))

    // Helper function to clean filters
    const cleanFilters = (filters: PostFilters) => {
        const cleaned: Record<string, any> = {}
        for (const [key, value] of Object.entries(filters)) {
            if (value !== undefined && value !== null && value !== '') {
                cleaned[key] = value
            }
        }
        return cleaned
    }

    // Add operation to history
    const addToHistory = (operation: {
        action: string
        postId?: number
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

    // Clear validation errors
    const clearValidationErrors = () => {
        validationErrors.value = {}
    }

    // Validate post data
    const validatePostData = (postData: Partial<DashboardPost>): boolean => {
        clearValidationErrors()
        let isValid = true

        // Title validation
        if (!postData.title?.trim()) {
            validationErrors.value.title = ['Title is required']
            isValid = false
        } else if (postData.title.length > 200) {
            validationErrors.value.title = ['Title must be less than 200 characters']
            isValid = false
        }

        // Content validation
        if (!postData.content?.trim()) {
            validationErrors.value.content = ['Content is required']
            isValid = false
        } else if (postData.content.length < 50) {
            validationErrors.value.content = ['Content must be at least 50 characters']
            isValid = false
        }

        // Category validation
        if (!postData.category_id && !postData.categoria) {
            validationErrors.value.category = ['Category is required']
            isValid = false
        }

        // Status validation
        if (postData.status && !['draft', 'published', 'archived'].includes(postData.status)) {
            validationErrors.value.status = ['Invalid status']
            isValid = false
        }

        // SEO validation
        if (postData.meta_title && postData.meta_title.length > 60) {
            validationErrors.value.meta_title = ['Meta title should be less than 60 characters for SEO']
            isValid = false
        }

        if (postData.meta_description && postData.meta_description.length > 160) {
            validationErrors.value.meta_description = ['Meta description should be less than 160 characters for SEO']
            isValid = false
        }

        return isValid
    }

    // Auto-refresh functionality
    const startAutoRefresh = (intervalMs: number = 30000) => {
        if (autoRefreshInterval.value) {
            clearInterval(autoRefreshInterval.value)
        }

        autoRefreshEnabled.value = true
        autoRefreshInterval.value = setInterval(async () => {
            if (!loading.value) {
                try {
                    await fetchPosts(currentFilters.value)
                    console.log('🔄 Auto-refreshed posts data')
                } catch (error) {
                    console.warn('⚠️ Auto-refresh failed:', error)
                }
            }
        }, intervalMs)

        console.log('✅ Auto-refresh enabled with interval:', intervalMs)
    }

    const stopAutoRefresh = () => {
        if (autoRefreshInterval.value) {
            clearInterval(autoRefreshInterval.value)
            autoRefreshInterval.value = null
        }
        autoRefreshEnabled.value = false
        console.log('🛑 Auto-refresh disabled')
    }

    // Enhanced error handling
    const handlePostError = (error: any, operation: string, postId?: number, postTitle?: string) => {
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
            errorMessage = 'Post not found'
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
            postId,
            postTitle,
            success: false,
            error: errorMessage
        })

        return { message: errorMessage, validationErrors: validationErrs }
    }

    // Fetch posts list
    const fetchPosts = async (filters: PostFilters = {}) => {
        return await postsLoading.withLoading(async () => {
            try {
                error.value = null
                clearValidationErrors()
                console.log('📡 Fetching dashboard posts with filters:', filters)

                // Require permission to view posts
                await requirePermission('can_manage_posts')

                // Store current filters
                currentFilters.value = { ...filters }

                const response = await dashboardApiCall<ApiResponse<DashboardPost>>('/dashboard/posts/', {
                    params: cleanFilters(filters)
                })

                posts.value = response.results || []
                totalCount.value = response.count || 0
                lastFetch.value = new Date()
                isDirty.value = false

                // Add to history
                addToHistory({
                    action: 'Fetch Posts',
                    success: true
                })

                console.log('✅ Dashboard posts fetched successfully:', {
                    count: posts.value.length,
                    total: totalCount.value,
                    filters: Object.keys(cleanFilters(filters))
                })

                return response
            } catch (err: any) {
                const errorInfo = handlePostError(err, 'Fetch Posts')
                throw err
            }
        })
    }

    // Fetch single post
    const fetchPost = async (id: number | string) => {
        if (!id) {
            throw new Error('Post ID is required')
        }

        return await postsLoading.withLoading(async () => {
            try {
                error.value = null
                console.log('📡 Fetching dashboard post:', id)

                // Require permission to view posts
                await requirePermission('can_manage_posts')

                const response = await dashboardApiCall<DashboardPost>(`/dashboard/posts/${id}/`)

                currentPost.value = response
                console.log('✅ Dashboard post fetched successfully:', response.title)

                return response
            } catch (err: any) {
                console.error('❌ Dashboard post fetch error:', err)

                const errorInfo = handleApiError(err, 'Dashboard Post Fetch Failed')
                error.value = errorInfo.message

                throw err
            }
        })
    }

    // Create post
    const createPost = async (postData: Partial<DashboardPost>) => {
        return await postsLoading.withLoading(async () => {
            try {
                error.value = null
                clearValidationErrors()
                console.log('📝 Creating dashboard post:', postData.title)

                // Validate post data
                if (!validatePostData(postData)) {
                    throw new Error('Validation failed')
                }

                // Require permission to create posts
                await requirePermission('can_manage_posts')

                const response = await dashboardApiCall<DashboardPost>('/dashboard/posts/', {
                    method: 'POST',
                    body: postData
                })

                // Add to posts list at the beginning
                posts.value.unshift(response)
                totalCount.value += 1
                currentPost.value = response
                isDirty.value = true

                // Add to history
                addToHistory({
                    action: 'Create Post',
                    postId: response.id,
                    postTitle: response.title,
                    success: true
                })

                // Show success message
                const { success } = useToast()
                success('Post Created', `"${response.title}" has been created successfully`)

                console.log('✅ Dashboard post created successfully:', response.title)
                return response
            } catch (err: any) {
                const errorInfo = handlePostError(err, 'Create Post', undefined, postData.title)
                throw err
            }
        })
    }

    // Update post
    const updatePost = async (id: number | string, postData: Partial<DashboardPost>) => {
        if (!id) {
            throw new Error('Post ID is required')
        }

        return await postsLoading.withLoading(async () => {
            try {
                error.value = null
                clearValidationErrors()
                console.log('📝 Updating dashboard post:', id, postData.title)

                // Get current post for comparison
                const currentPostData = posts.value.find(p => p.id === Number(id)) || currentPost.value

                // Validate post data (only validate fields that are being updated)
                const fieldsToValidate = Object.keys(postData).reduce((acc, key) => {
                    acc[key] = postData[key as keyof DashboardPost]
                    return acc
                }, {} as Partial<DashboardPost>)

                if (Object.keys(fieldsToValidate).length > 0 && !validatePostData(fieldsToValidate)) {
                    throw new Error('Validation failed')
                }

                // Require permission to update posts
                await requirePermission('can_manage_posts')

                const response = await dashboardApiCall<DashboardPost>(`/dashboard/posts/${id}/`, {
                    method: 'PATCH',
                    body: postData
                })

                // Update in posts list
                const index = posts.value.findIndex(p => p.id === Number(id))
                if (index !== -1) {
                    posts.value[index] = response
                }

                // Update current post if it's the same
                if (currentPost.value?.id === Number(id)) {
                    currentPost.value = response
                }

                isDirty.value = true

                // Add to history
                addToHistory({
                    action: 'Update Post',
                    postId: response.id,
                    postTitle: response.title,
                    success: true
                })

                // Show success message
                const { success } = useToast()
                success('Post Updated', `"${response.title}" has been updated successfully`)

                console.log('✅ Dashboard post updated successfully:', response.title)
                return response
            } catch (err: any) {
                const errorInfo = handlePostError(err, 'Update Post', Number(id), postData.title)
                throw err
            }
        })
    }

    // Delete post
    const deletePost = async (id: number | string) => {
        if (!id) {
            throw new Error('Post ID is required')
        }

        return await postsLoading.withLoading(async () => {
            try {
                error.value = null
                console.log('🗑️ Deleting dashboard post:', id)

                // Require permission to delete posts
                await requirePermission('can_manage_posts')

                await dashboardApiCall(`/dashboard/posts/${id}/`, {
                    method: 'DELETE'
                })

                // Remove from posts list
                posts.value = posts.value.filter(p => p.id !== Number(id))
                totalCount.value = Math.max(0, totalCount.value - 1)

                // Clear current post if it was deleted
                if (currentPost.value?.id === Number(id)) {
                    currentPost.value = null
                }

                // Remove from selected posts
                selectedPosts.value = selectedPosts.value.filter(postId => postId !== Number(id))

                console.log('✅ Dashboard post deleted successfully')
                return true
            } catch (err: any) {
                console.error('❌ Dashboard post delete error:', err)

                const errorInfo = handleApiError(err, 'Dashboard Post Delete Failed')
                error.value = errorInfo.message

                throw err
            }
        })
    }

    // Toggle featured status
    const toggleFeatured = async (id: number | string) => {
        if (!id) {
            throw new Error('Post ID is required')
        }

        try {
            error.value = null
            const post = posts.value.find(p => p.id === Number(id))
            if (!post) {
                throw new Error('Post not found in current list')
            }

            console.log('⭐ Toggling featured status for post:', id, !post.featured)

            // Require permission to manage posts
            await requirePermission('can_manage_posts')

            const response = await dashboardApiCall<DashboardPost>(`/dashboard/posts/${id}/`, {
                method: 'PATCH',
                body: { featured: !post.featured }
            })

            // Update in posts list
            const index = posts.value.findIndex(p => p.id === Number(id))
            if (index !== -1) {
                posts.value[index] = response
            }

            // Update current post if it's the same
            if (currentPost.value?.id === Number(id)) {
                currentPost.value = response
            }

            console.log('✅ Featured status toggled successfully:', response.featured)
            return response.featured
        } catch (err: any) {
            console.error('❌ Toggle featured error:', err)

            const errorInfo = handleApiError(err, 'Toggle Featured Status Failed')
            error.value = errorInfo.message

            throw err
        }
    }

    // Bulk actions
    const bulkAction = async (action: BulkAction) => {
        if (!action.post_ids.length) {
            throw new Error('No posts selected for bulk action')
        }

        return await postsLoading.withLoading(async () => {
            try {
                error.value = null
                console.log('📦 Performing bulk action:', action.action, 'on', action.post_ids.length, 'posts')

                // Require permission to manage posts
                await requirePermission('can_manage_posts')

                const response = await dashboardApiCall<{ updated_count: number, message: string }>('/dashboard/posts/bulk-action/', {
                    method: 'POST',
                    body: action
                })

                // Refresh posts list to get updated data
                await fetchPosts(currentFilters.value)

                // Clear selected posts
                selectedPosts.value = []

                console.log('✅ Bulk action completed successfully:', response.updated_count, 'posts updated')
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
    const bulkPublish = (postIds: number[]) => bulkAction({ action: 'publish', post_ids: postIds })
    const bulkDraft = (postIds: number[]) => bulkAction({ action: 'draft', post_ids: postIds })
    const bulkArchive = (postIds: number[]) => bulkAction({ action: 'archive', post_ids: postIds })
    const bulkDelete = (postIds: number[]) => bulkAction({ action: 'delete', post_ids: postIds })
    const bulkFeature = (postIds: number[]) => bulkAction({ action: 'feature', post_ids: postIds })
    const bulkUnfeature = (postIds: number[]) => bulkAction({ action: 'unfeature', post_ids: postIds })

    // Enhanced bulk actions
    const bulkChangeCategory = (postIds: number[], categoryId: number) =>
        bulkAction({ action: 'change_category', post_ids: postIds, data: { category_id: categoryId } })

    const bulkChangeAuthor = (postIds: number[], authorId: number) =>
        bulkAction({ action: 'change_author', post_ids: postIds, data: { author_id: authorId } })

    // Bulk action with confirmation
    const bulkActionWithConfirmation = async (action: BulkAction, confirmationMessage?: string) => {
        const defaultMessages = {
            delete: `Are you sure you want to delete ${action.post_ids.length} post(s)? This action cannot be undone.`,
            archive: `Are you sure you want to archive ${action.post_ids.length} post(s)?`,
            publish: `Are you sure you want to publish ${action.post_ids.length} post(s)?`
        }

        const message = confirmationMessage || defaultMessages[action.action as keyof typeof defaultMessages] ||
            `Are you sure you want to perform this action on ${action.post_ids.length} post(s)?`

        if (import.meta.client && !confirm(message)) {
            return null
        }

        return await bulkAction(action)
    }

    // Fetch categories for post creation/editing
    const fetchCategories = async () => {
        try {
            console.log('📡 Fetching categories for dashboard')

            const response = await dashboardApiCall<Category[]>('/dashboard/categories/')
            categories.value = response

            console.log('✅ Categories fetched successfully:', categories.value.length)
            return response
        } catch (err: any) {
            console.error('❌ Categories fetch error:', err)

            const errorInfo = handleApiError(err, 'Categories Fetch Failed')
            error.value = errorInfo.message

            throw err
        }
    }

    // Fetch post statistics
    const fetchPostStats = async () => {
        try {
            console.log('📊 Fetching post statistics')

            const response = await dashboardApiCall<PostStats>('/dashboard/posts/stats/')
            postStats.value = response

            console.log('✅ Post statistics fetched successfully')
            return response
        } catch (err: any) {
            console.error('❌ Post statistics fetch error:', err)

            const errorInfo = handleApiError(err, 'Post Statistics Fetch Failed')
            error.value = errorInfo.message

            throw err
        }
    }

    // Post selection management
    const togglePostSelection = (postId: number) => {
        const index = selectedPosts.value.indexOf(postId)
        if (index > -1) {
            selectedPosts.value.splice(index, 1)
        } else {
            selectedPosts.value.push(postId)
        }
    }

    const selectAllPosts = () => {
        selectedPosts.value = posts.value.map(p => p.id)
    }

    const clearSelection = () => {
        selectedPosts.value = []
    }

    const isPostSelected = (postId: number) => {
        return selectedPosts.value.includes(postId)
    }

    // Search and filter helpers
    const searchPosts = async (query: string) => {
        return await fetchPosts({ ...currentFilters.value, search: query, page: 1 })
    }

    const filterByStatus = async (status: 'draft' | 'published' | 'archived') => {
        return await fetchPosts({ ...currentFilters.value, status, page: 1 })
    }

    const filterByCategory = async (categoryId: number | string) => {
        return await fetchPosts({ ...currentFilters.value, category: categoryId, page: 1 })
    }

    const filterByAuthor = async (authorId: number | string) => {
        return await fetchPosts({ ...currentFilters.value, author: authorId, page: 1 })
    }

    const sortPosts = async (ordering: string) => {
        return await fetchPosts({ ...currentFilters.value, ordering })
    }

    // Reset filters
    const resetFilters = async () => {
        currentFilters.value = {}
        return await fetchPosts()
    }

    // Duplicate post
    const duplicatePost = async (id: number | string) => {
        if (!id) {
            throw new Error('Post ID is required')
        }

        try {
            console.log('📋 Duplicating post:', id)

            // Require permission to create posts
            await requirePermission('can_manage_posts')

            const response = await dashboardApiCall<DashboardPost>(`/dashboard/posts/${id}/duplicate/`, {
                method: 'POST'
            })

            // Add to posts list at the beginning
            posts.value.unshift(response)
            totalCount.value += 1

            console.log('✅ Post duplicated successfully:', response.title)
            return response
        } catch (err: any) {
            console.error('❌ Post duplicate error:', err)

            const errorInfo = handleApiError(err, 'Post Duplicate Failed')
            error.value = errorInfo.message

            throw err
        }
    }

    // Change post status
    const changePostStatus = async (id: number | string, status: 'draft' | 'published' | 'archived') => {
        return await updatePost(id, { status })
    }

    // Schedule post publication
    const schedulePost = async (id: number | string, publishDate: string) => {
        return await updatePost(id, {
            status: 'draft',
            scheduled_publish_date: publishDate
        })
    }

    // Get post analytics
    const getPostAnalytics = async (id: number | string) => {
        try {
            console.log('📊 Fetching post analytics:', id)

            const response = await dashboardApiCall<{
                views: number
                comments: number
                shares: number
                reading_time: number
                bounce_rate: number
                engagement_rate: number
                traffic_sources: Array<{ source: string; visits: number }>
                popular_sections: Array<{ section: string; time_spent: number }>
            }>(`/dashboard/posts/${id}/analytics/`)

            console.log('✅ Post analytics fetched successfully')
            return response
        } catch (err: any) {
            const errorInfo = handlePostError(err, 'Get Post Analytics', Number(id))
            throw err
        }
    }

    // Export posts
    const exportPosts = async (format: 'csv' | 'json' | 'xml' = 'csv', filters?: PostFilters) => {
        try {
            console.log('📤 Exporting posts in format:', format)

            await requirePermission('can_export_data')

            const params = {
                format,
                ...cleanFilters(filters || currentFilters.value)
            }

            const response = await dashboardApiCall<{ download_url: string }>('/dashboard/posts/export/', {
                params
            })

            // Trigger download
            if (import.meta.client && response.download_url) {
                const link = document.createElement('a')
                link.href = response.download_url
                link.download = `posts_export_${new Date().toISOString().split('T')[0]}.${format}`
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
            }

            addToHistory({
                action: 'Export Posts',
                success: true
            })

            console.log('✅ Posts exported successfully')
            return response
        } catch (err: any) {
            const errorInfo = handlePostError(err, 'Export Posts')
            throw err
        }
    }

    // Import posts
    const importPosts = async (file: File, options: {
        update_existing?: boolean
        skip_duplicates?: boolean
        default_status?: 'draft' | 'published'
    } = {}) => {
        try {
            console.log('📥 Importing posts from file:', file.name)

            await requirePermission('can_manage_posts')

            const formData = new FormData()
            formData.append('file', file)
            formData.append('options', JSON.stringify(options))

            const response = await dashboardApiCall<{
                imported_count: number
                updated_count: number
                skipped_count: number
                errors: Array<{ row: number; error: string }>
            }>('/dashboard/posts/import/', {
                method: 'POST',
                body: formData
            })

            // Refresh posts list
            await fetchPosts(currentFilters.value)

            addToHistory({
                action: 'Import Posts',
                success: true
            })

            const { success, warning } = useToast()
            if (response.errors.length > 0) {
                warning(
                    'Import Completed with Errors',
                    `Imported ${response.imported_count} posts, updated ${response.updated_count}, skipped ${response.skipped_count}. ${response.errors.length} errors occurred.`
                )
            } else {
                success(
                    'Import Successful',
                    `Imported ${response.imported_count} posts, updated ${response.updated_count}, skipped ${response.skipped_count}.`
                )
            }

            console.log('✅ Posts imported successfully:', response)
            return response
        } catch (err: any) {
            const errorInfo = handlePostError(err, 'Import Posts')
            throw err
        }
    }

    // SEO Analysis
    const getSEOAnalysis = async (id: number | string) => {
        try {
            console.log('🔍 Getting SEO analysis for post:', id)

            await requirePermission('can_view_analytics')

            const response = await dashboardApiCall<{
                seo_score: number
                title_analysis: {
                    length: number
                    optimal_length: boolean
                    keyword_presence: boolean
                    readability_score: number
                }
                meta_description_analysis: {
                    length: number
                    optimal_length: boolean
                    keyword_presence: boolean
                    call_to_action: boolean
                }
                content_analysis: {
                    word_count: number
                    reading_time: number
                    keyword_density: number
                    headings_structure: boolean
                    internal_links: number
                    external_links: number
                    images_with_alt: number
                    images_without_alt: number
                }
                recommendations: Array<{
                    type: 'critical' | 'warning' | 'suggestion'
                    message: string
                    impact: 'high' | 'medium' | 'low'
                }>
                keywords: Array<{
                    keyword: string
                    density: number
                    prominence: number
                    suggestions: string[]
                }>
            }>(`/dashboard/posts/${id}/seo-analysis/`)

            console.log('✅ SEO analysis completed')
            return response
        } catch (err: any) {
            const errorInfo = handlePostError(err, 'Get SEO Analysis', Number(id))
            throw err
        }
    }

    // Content Suggestions
    const getContentSuggestions = async (id: number | string) => {
        try {
            console.log('💡 Getting content suggestions for post:', id)

            await requirePermission('can_view_analytics')

            const response = await dashboardApiCall<{
                improvement_suggestions: Array<{
                    type: 'structure' | 'content' | 'seo' | 'engagement'
                    suggestion: string
                    priority: 'high' | 'medium' | 'low'
                    estimated_impact: string
                }>
                related_topics: Array<{
                    topic: string
                    relevance: number
                }>
                trending_keywords: Array<{
                    keyword: string
                    trend_score: number
                }>
                content_gaps: Array<{
                    gap: string
                    opportunity: string
                }>
                readability_suggestions: Array<{
                    issue: string
                    suggestion: string
                    examples: string[]
                }>
            }>(`/dashboard/posts/${id}/content-suggestions/`)

            console.log('✅ Content suggestions generated')
            return response
        } catch (err: any) {
            const errorInfo = handlePostError(err, 'Get Content Suggestions', Number(id))
            throw err
        } ported_count
    } posts, updated ${ response.updated_count }, skipped ${ response.skipped_count }.${ response.errors.length } errors occurred.`
                )
            } else {
                success(
                    'Import Successful',
                    `Imported ${ response.imported_count } posts, updated ${ response.updated_count }, skipped ${ response.skipped_count }.`
                )
            }

            console.log('✅ Posts imported successfully:', response)
            return response
        } catch (err: any) {
            const errorInfo = handlePostError(err, 'Import Posts')
            throw err
        }

        currentFilters.value = {}
        error.value = null
        isDirty.value = false
        lastFetch.value = null

        console.log('🧹 Dashboard posts composable cleaned up')
    }

    const { success, warning } = useToast()
    if (response.errors.length > 0) {
        warning(
            'Import Completed with Errors',
            `Imported ${ response.imported_count } posts, updated ${ response.updated_count }, skipped ${ response.skipped_count }. ${ response.errors.length } errors occurred.`
        )
    } else {
        success(
            'Import Successful',
            `Imported ${ response.imported_count } posts, updated ${ response.updated_count }, skipped ${ response.skipped_count }.`
        )
    }

    console.log('✅ Posts imported successfully:', response)
    return response
} catch (err: any) {
    const errorInfo = handlePostError(err, 'Import Posts')
    throw err
}
    }

// Get SEO analysis for post
const getSEOAnalysis = async (id: number | string) => {
    try {
        console.log('🔍 Getting SEO analysis for post:', id)

        const response = await dashboardApiCall<{
            score: number
            issues: Array<{
                type: 'error' | 'warning' | 'info'
                message: string
                suggestion: string
            }>
            recommendations: Array<{
                priority: 'high' | 'medium' | 'low'
                action: string
                description: string
            }>
            keywords: Array<{
                keyword: string
                density: number
                recommended_density: number
            }>
        }>(`/ dashboard / posts / ${ id } /seo-analysis/`)

        console.log('✅ SEO analysis completed')
        return response
    } catch (err: any) {
        const errorInfo = handlePostError(err, 'Get SEO Analysis', Number(id))
        throw err
    }
}

// Get content suggestions
const getContentSuggestions = async (id: number | string) => {
    try {
        console.log('💡 Getting content suggestions for post:', id)

        const response = await dashboardApiCall<{
            readability_score: number
            suggestions: Array<{
                type: 'structure' | 'content' | 'style'
                message: string
                example?: string
            }>
            related_topics: Array<{
                topic: string
                relevance: number
            }>
            trending_keywords: Array<{
                keyword: string
                trend_score: number
            }>
        }>(`/ dashboard / posts / ${ id } /content-suggestions/`)

        console.log('✅ Content suggestions generated')
        return response
    } catch (err: any) {
        const errorInfo = handlePostError(err, 'Get Content Suggestions', Number(id))
        throw err
    }
}

// Cleanup function
const cleanup = () => {
    // Stop auto-refresh
    stopAutoRefresh()

    // Clear selection
    clearSelection()
    clearValidationErrors()

    // Clear state
    posts.value = []
    currentPost.value = null
    categories.value = []
    postStats.value = null
    selectedPosts.value = []
    operationHistory.value = []
    validationErrors.value = {}
    currentFilters.value = {}
    error.value = null
    isDirty.value = false
    lastFetch.value = null

    console.log('🧹 Dashboard posts composable cleaned up')
}

// Auto-cleanup on unmount
if (import.meta.client) {
    onUnmounted(() => {
        cleanup()
    })
}

return {
    // State
    posts: readonly(posts),
    currentPost: readonly(currentPost),
    categories: readonly(categories),
    postStats: readonly(postStats),
    loading: readonly(loading),
    error: readonly(error),
    totalCount: readonly(totalCount),
    currentFilters: readonly(currentFilters),
    selectedPosts: readonly(selectedPosts),
    lastFetch: readonly(lastFetch),
    autoRefreshEnabled: readonly(autoRefreshEnabled),
    operationHistory: readonly(operationHistory),
    validationErrors: readonly(validationErrors),
    isDirty: readonly(isDirty),

    // Computed
    hasSelectedPosts: readonly(hasSelectedPosts),
    publishedPosts: readonly(publishedPosts),
    draftPosts: readonly(draftPosts),
    archivedPosts: readonly(archivedPosts),
    featuredPosts: readonly(featuredPosts),

    // CRUD Operations
    fetchPosts,
    fetchPost,
    createPost,
    updatePost,
    deletePost,
    duplicatePost,

    // Status Management
    changePostStatus,
    toggleFeatured,
    schedulePost,

    // Bulk Operations
    bulkAction,
    bulkActionWithConfirmation,
    bulkPublish,
    bulkDraft,
    bulkArchive,
    bulkDelete,
    bulkFeature,
    bulkUnfeature,
    bulkChangeCategory,
    bulkChangeAuthor,

    // Selection Management
    togglePostSelection,
    selectAllPosts,
    clearSelection,
    isPostSelected,

    // Search and Filter
    searchPosts,
    filterByStatus,
    filterByCategory,
    filterByAuthor,
    sortPosts,
    resetFilters,

    // Additional Data
    fetchCategories,
    fetchPostStats,

    // Analytics and Insights
    getPostAnalytics,
    getSEOAnalysis,
    getContentSuggestions,

    // Import/Export
    exportPosts,
    importPosts,

    // Auto-refresh
    startAutoRefresh,
    stopAutoRefresh,

    // Validation
    validatePostData,
    clearValidationErrors,

    // Utilities
    cleanFilters,
    addToHistory,
    handlePostError,
    cleanup
}
}