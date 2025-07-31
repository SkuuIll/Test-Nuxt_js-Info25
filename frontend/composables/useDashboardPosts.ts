import type { Post, Category, User, ApiResponse } from '~/types'

interface DashboardPost extends Post {
    // Dashboard-specific fields
    views_count?: number
    last_edited_by?: User
    seo_score?: number
    reading_time?: number
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
    action: 'publish' | 'draft' | 'archive' | 'delete' | 'feature' | 'unfeature'
    post_ids: number[]
}

interface PostStats {
    total_posts: number
    published_posts: number
    draft_posts: number
    archived_posts: number
    featured_posts: number
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

    // Fetch posts list
    const fetchPosts = async (filters: PostFilters = {}) => {
        return await postsLoading.withLoading(async () => {
            try {
                error.value = null
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

                console.log('✅ Dashboard posts fetched successfully:', {
                    count: posts.value.length,
                    total: totalCount.value
                })

                return response
            } catch (err: any) {
                console.error('❌ Dashboard posts fetch error:', err)

                const errorInfo = handleApiError(err, 'Dashboard Posts Fetch Failed')
                error.value = errorInfo.message

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
                console.log('📝 Creating dashboard post:', postData.title)

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

                console.log('✅ Dashboard post created successfully:', response.title)
                return response
            } catch (err: any) {
                console.error('❌ Dashboard post create error:', err)

                // Handle validation errors specifically
                if (err.data?.errors) {
                    const errorInfo = handleValidationError(err, 'Post Creation Validation Failed')
                    error.value = errorInfo.message
                } else {
                    const errorInfo = handleApiError(err, 'Dashboard Post Create Failed')
                    error.value = errorInfo.message
                }

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
                console.log('📝 Updating dashboard post:', id, postData.title)

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

                console.log('✅ Dashboard post updated successfully:', response.title)
                return response
            } catch (err: any) {
                console.error('❌ Dashboard post update error:', err)

                // Handle validation errors specifically
                if (err.data?.errors) {
                    const errorInfo = handleValidationError(err, 'Post Update Validation Failed')
                    error.value = errorInfo.message
                } else {
                    const errorInfo = handleApiError(err, 'Dashboard Post Update Failed')
                    error.value = errorInfo.message
                }

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

        // Bulk Operations
        bulkAction,
        bulkPublish,
        bulkDraft,
        bulkArchive,
        bulkDelete,
        bulkFeature,
        bulkUnfeature,

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

        // Utilities
        cleanFilters
    }
}