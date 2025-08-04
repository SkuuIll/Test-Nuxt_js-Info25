/**
 * Unified admin composable - Simple and direct
 * Consolidates all admin API operations
 */

interface PostData {
    titulo: string
    contenido: string
    status: string
    featured: boolean
    categoria: string
    meta_title: string
    meta_description: string
}

interface CommentModerationData {
    status: 'approved' | 'rejected'
}

interface UserUpdateData {
    is_active?: boolean
    is_staff?: boolean
}

export const useAdmin = () => {
    const { token } = useAuth()
    const { handleError } = useErrorHandler()

    // Helper to get auth headers
    const getAuthHeaders = () => {
        if (!token.value) {
            throw new Error('No authentication token available')
        }
        return {
            'Authorization': `Bearer ${token.value}`
        }
    }

    // Posts Management
    const createPost = async (data: PostData) => {
        try {
            const response = await $fetch('/api/v1/dashboard/api/posts/', {
                method: 'POST',
                body: data,
                headers: getAuthHeaders()
            })
            return response
        } catch (error) {
            handleError(error, 'createPost')
            throw error
        }
    }

    const updatePost = async (id: number, data: Partial<PostData>) => {
        try {
            const response = await $fetch(`/api/v1/dashboard/api/posts/${id}/`, {
                method: 'PATCH',
                body: data,
                headers: getAuthHeaders()
            })
            return response
        } catch (error) {
            handleError(error, 'updatePost')
            throw error
        }
    }

    const deletePost = async (id: number) => {
        try {
            await $fetch(`/api/v1/dashboard/api/posts/${id}/`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            })
        } catch (error) {
            handleError(error, 'deletePost')
            throw error
        }
    }

    const getPost = async (id: number) => {
        try {
            const response = await $fetch(`/api/v1/dashboard/api/posts/${id}/`, {
                headers: getAuthHeaders()
            })
            return response
        } catch (error) {
            handleError(error, 'getPost')
            throw error
        }
    }

    const getPosts = async (params: Record<string, any> = {}) => {
        try {
            const queryParams = new URLSearchParams()
            Object.entries(params).forEach(([key, value]) => {
                if (value) queryParams.append(key, value.toString())
            })

            const response = await $fetch(`/api/v1/dashboard/api/posts/?${queryParams}`, {
                headers: getAuthHeaders()
            })
            return response
        } catch (error) {
            handleError(error, 'getPosts')
            throw error
        }
    }

    // Comments Management
    const moderateComment = async (id: number, status: 'approved' | 'rejected') => {
        try {
            const response = await $fetch(`/api/v1/dashboard/api/comments/${id}/`, {
                method: 'PATCH',
                body: { status },
                headers: getAuthHeaders()
            })
            return response
        } catch (error) {
            handleError(error, 'moderateComment')
            throw error
        }
    }

    const deleteComment = async (id: number) => {
        try {
            await $fetch(`/api/v1/dashboard/api/comments/${id}/`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            })
        } catch (error) {
            handleError(error, 'deleteComment')
            throw error
        }
    }

    const getComments = async (params: Record<string, any> = {}) => {
        try {
            const queryParams = new URLSearchParams()
            Object.entries(params).forEach(([key, value]) => {
                if (value) queryParams.append(key, value.toString())
            })

            const response = await $fetch(`/api/v1/dashboard/api/comments/?${queryParams}`, {
                headers: getAuthHeaders()
            })
            return response
        } catch (error) {
            handleError(error, 'getComments')
            throw error
        }
    }

    // Users Management (Superuser only)
    const getUsers = async (params: Record<string, any> = {}) => {
        try {
            const queryParams = new URLSearchParams()
            Object.entries(params).forEach(([key, value]) => {
                if (value) queryParams.append(key, value.toString())
            })

            const response = await $fetch(`/api/v1/dashboard/api/users/?${queryParams}`, {
                headers: getAuthHeaders()
            })
            return response
        } catch (error) {
            handleError(error, 'getUsers')
            throw error
        }
    }

    const updateUser = async (id: number, data: UserUpdateData) => {
        try {
            const response = await $fetch(`/api/v1/dashboard/api/users/${id}/`, {
                method: 'PATCH',
                body: data,
                headers: getAuthHeaders()
            })
            return response
        } catch (error) {
            handleError(error, 'updateUser')
            throw error
        }
    }

    // Categories Management
    const getCategories = async () => {
        try {
            const response = await $fetch('/api/v1/dashboard/api/categories/', {
                headers: getAuthHeaders()
            })
            return response.results || response
        } catch (error) {
            // Fallback to public categories endpoint
            try {
                const response = await $fetch('/api/v1/categories/')
                return response.results || response
            } catch (fallbackError) {
                handleError(fallbackError, 'getCategories')
                throw fallbackError
            }
        }
    }

    // Stats and Analytics (Simple)
    const getAdminStats = async () => {
        try {
            // Mock stats for now - in real implementation, fetch from API
            return {
                totalPosts: 15,
                totalUsers: 8,
                totalComments: 42,
                totalViews: 1250,
                pendingComments: 5,
                draftPosts: 3
            }
        } catch (error) {
            handleError(error, 'getAdminStats')
            throw error
        }
    }

    // Utility functions
    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const formatDateTime = (dateString: string) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            published: 'Publicado',
            draft: 'Borrador',
            archived: 'Archivado',
            pending: 'Pendiente',
            approved: 'Aprobado',
            rejected: 'Rechazado'
        }
        return labels[status] || status
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2)
    }

    return {
        // Posts
        createPost,
        updatePost,
        deletePost,
        getPost,
        getPosts,

        // Comments
        moderateComment,
        deleteComment,
        getComments,

        // Users
        getUsers,
        updateUser,

        // Categories
        getCategories,

        // Stats
        getAdminStats,

        // Utilities
        formatDate,
        formatDateTime,
        getStatusLabel,
        getInitials
    }
}