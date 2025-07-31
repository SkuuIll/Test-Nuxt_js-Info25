import type { User, ApiResponse } from '~/types'

interface DashboardUser extends User {
    // Dashboard-specific fields
    posts_count?: number
    comments_count?: number
    last_login_date?: string
    registration_date?: string
    is_active?: boolean
    profile_completion?: number
    role?: string
    permissions?: string[]
    last_activity?: string
    login_count?: number
    avatar_url?: string
    social_links?: {
        twitter?: string
        linkedin?: string
        github?: string
        website?: string
    }
}

interface UserFilters {
    page?: number
    page_size?: number
    search?: string
    is_active?: boolean
    is_staff?: boolean
    is_superuser?: boolean
    role?: string
    date_joined_from?: string
    date_joined_to?: string
    last_login_from?: string
    last_login_to?: string
    ordering?: string
    has_posts?: boolean
    min_posts?: number
    max_posts?: number
}

interface BulkUserAction {
    action: 'activate' | 'deactivate' | 'delete' | 'change_role' | 'send_email' | 'reset_password'
    user_ids: number[]
    data?: {
        role?: string
        email_template?: string
        email_subject?: string
        email_message?: string
        [key: string]: any
    }
}

interface UserStats {
    total_users: number
    active_users: number
    inactive_users: number
    staff_users: number
    new_users_this_month: number
    new_users_this_week: number
    users_with_posts: number
    average_posts_per_user: number
    most_active_users: Array<{
        id: number
        username: string
        posts_count: number
        comments_count: number
    }>
    user_roles: Array<{
        role: string
        count: number
    }>
    registration_trends: Array<{
        date: string
        count: number
    }>
}

export const useDashboardUsers = () => {
    const { dashboardApiCall, requirePermission } = useDashboardAuth()
    const { handleApiError, handleValidationError } = useErrorHandler()
    const { dashboardLoading } = useLoading()

    // State
    const users = ref<DashboardUser[]>([])
    const currentUser = ref<DashboardUser | null>(null)
    const userStats = ref<UserStats | null>(null)
    const loading = computed(() => dashboardLoading.loading.value)
    const error = ref<string | null>(null)
    const totalCount = ref(0)
    const currentFilters = ref<UserFilters>({})
    const selectedUsers = ref<number[]>([])
    const validationErrors = ref<Record<string, string[]>>({})
    const operationHistory = ref<Array<{
        action: string
        userId?: number
        username?: string
        timestamp: Date
        success: boolean
        error?: string
    }>>([])

    // Computed
    const hasSelectedUsers = computed(() => selectedUsers.value.length > 0)
    const activeUsers = computed(() => users.value.filter(u => u.is_active))
    const inactiveUsers = computed(() => users.value.filter(u => !u.is_active))
    const staffUsers = computed(() => users.value.filter(u => u.is_staff))
    const regularUsers = computed(() => users.value.filter(u => !u.is_staff))

    // Helper functions
    const cleanFilters = (filters: UserFilters) => {
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
        userId?: number
        username?: string
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

    const validateUserData = (userData: Partial<DashboardUser>): boolean => {
        clearValidationErrors()
        let isValid = true

        // Username validation
        if (userData.username !== undefined) {
            if (!userData.username?.trim()) {
                validationErrors.value.username = ['Username is required']
                isValid = false
            } else if (userData.username.length < 3) {
                validationErrors.value.username = ['Username must be at least 3 characters']
                isValid = false
            } else if (!/^[a-zA-Z0-9_]+$/.test(userData.username)) {
                validationErrors.value.username = ['Username can only contain letters, numbers, and underscores']
                isValid = false
            }
        }

        // Email validation
        if (userData.email !== undefined) {
            if (!userData.email?.trim()) {
                validationErrors.value.email = ['Email is required']
                isValid = false
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
                validationErrors.value.email = ['Please enter a valid email address']
                isValid = false
            }
        }

        // Password validation (for new users)
        if (userData.password !== undefined) {
            if (!userData.password?.trim()) {
                validationErrors.value.password = ['Password is required']
                isValid = false
            } else if (userData.password.length < 8) {
                validationErrors.value.password = ['Password must be at least 8 characters']
                isValid = false
            }
        }

        // First name validation
        if (userData.first_name !== undefined && userData.first_name && userData.first_name.length > 30) {
            validationErrors.value.first_name = ['First name must be less than 30 characters']
            isValid = false
        }

        // Last name validation
        if (userData.last_name !== undefined && userData.last_name && userData.last_name.length > 30) {
            validationErrors.value.last_name = ['Last name must be less than 30 characters']
            isValid = false
        }

        return isValid
    }

    const handleUserError = (error: any, operation: string, userId?: number, username?: string) => {
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
            errorMessage = 'User not found'
        } else if (error.status === 409) {
            errorMessage = 'Username or email already exists'
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
            userId,
            username,
            success: false,
            error: errorMessage
        })

        return { message: errorMessage, validationErrors: validationErrs }
    }

    // Fetch users list
    const fetchUsers = async (filters: UserFilters = {}) => {
        return await dashboardLoading.withLoading(async () => {
            try {
                error.value = null
                clearValidationErrors()
                console.log('📡 Fetching dashboard users with filters:', filters)

                // Require permission to view users
                await requirePermission('can_manage_users')

                // Store current filters
                currentFilters.value = { ...filters }

                const response = await dashboardApiCall<ApiResponse<DashboardUser>>('/dashboard/users/', {
                    params: cleanFilters(filters)
                })

                users.value = response.results || []
                totalCount.value = response.count || 0

                // Add to history
                addToHistory({
                    action: 'Fetch Users',
                    success: true
                })

                console.log('✅ Dashboard users fetched successfully:', {
                    count: users.value.length,
                    total: totalCount.value,
                    filters: Object.keys(cleanFilters(filters))
                })

                return response
            } catch (err: any) {
                const errorInfo = handleUserError(err, 'Fetch Users')
                throw err
            }
        })
    }

    // Fetch single user
    const fetchUser = async (id: number | string) => {
        if (!id) {
            throw new Error('User ID is required')
        }

        return await dashboardLoading.withLoading(async () => {
            try {
                error.value = null
                console.log('📡 Fetching dashboard user:', id)

                // Require permission to view users
                await requirePermission('can_manage_users')

                const response = await dashboardApiCall<DashboardUser>(`/dashboard/users/${id}/`)

                currentUser.value = response
                console.log('✅ Dashboard user fetched successfully:', response.username)

                return response
            } catch (err: any) {
                const errorInfo = handleUserError(err, 'Fetch User', Number(id))
                throw err
            }
        })
    }

    // Create user
    const createUser = async (userData: Partial<DashboardUser>) => {
        return await dashboardLoading.withLoading(async () => {
            try {
                error.value = null
                clearValidationErrors()
                console.log('📝 Creating dashboard user:', userData.username)

                // Validate user data
                if (!validateUserData(userData)) {
                    throw new Error('Validation failed')
                }

                // Require permission to create users
                await requirePermission('can_manage_users')

                const response = await dashboardApiCall<DashboardUser>('/dashboard/users/', {
                    method: 'POST',
                    body: userData
                })

                // Add to users list at the beginning
                users.value.unshift(response)
                totalCount.value += 1
                currentUser.value = response

                // Add to history
                addToHistory({
                    action: 'Create User',
                    userId: response.id,
                    username: response.username,
                    success: true
                })

                // Show success message
                const { success } = useToast()
                success('User Created', `User "${response.username}" has been created successfully`)

                console.log('✅ Dashboard user created successfully:', response.username)
                return response
            } catch (err: any) {
                const errorInfo = handleUserError(err, 'Create User', undefined, userData.username)
                throw err
            }
        })
    }

    // Update user
    const updateUser = async (id: number | string, userData: Partial<DashboardUser>) => {
        if (!id) {
            throw new Error('User ID is required')
        }

        return await dashboardLoading.withLoading(async () => {
            try {
                error.value = null
                clearValidationErrors()
                console.log('📝 Updating dashboard user:', id, userData.username)

                // Validate user data (only validate fields that are being updated)
                const fieldsToValidate = Object.keys(userData).reduce((acc, key) => {
                    acc[key] = userData[key as keyof DashboardUser]
                    return acc
                }, {} as Partial<DashboardUser>)

                if (Object.keys(fieldsToValidate).length > 0 && !validateUserData(fieldsToValidate)) {
                    throw new Error('Validation failed')
                }

                // Require permission to update users
                await requirePermission('can_manage_users')

                const response = await dashboardApiCall<DashboardUser>(`/dashboard/users/${id}/`, {
                    method: 'PATCH',
                    body: userData
                })

                // Update in users list
                const index = users.value.findIndex(u => u.id === Number(id))
                if (index !== -1) {
                    users.value[index] = response
                }

                // Update current user if it's the same
                if (currentUser.value?.id === Number(id)) {
                    currentUser.value = response
                }

                // Add to history
                addToHistory({
                    action: 'Update User',
                    userId: response.id,
                    username: response.username,
                    success: true
                })

                // Show success message
                const { success } = useToast()
                success('User Updated', `User "${response.username}" has been updated successfully`)

                console.log('✅ Dashboard user updated successfully:', response.username)
                return response
            } catch (err: any) {
                const errorInfo = handleUserError(err, 'Update User', Number(id), userData.username)
                throw err
            }
        })
    }

    // Delete user
    const deleteUser = async (id: number | string) => {
        if (!id) {
            throw new Error('User ID is required')
        }

        return await dashboardLoading.withLoading(async () => {
            try {
                error.value = null
                console.log('🗑️ Deleting dashboard user:', id)

                // Require permission to delete users
                await requirePermission('can_manage_users')

                const userToDelete = users.value.find(u => u.id === Number(id))

                await dashboardApiCall(`/dashboard/users/${id}/`, {
                    method: 'DELETE'
                })

                // Remove from users list
                users.value = users.value.filter(u => u.id !== Number(id))
                totalCount.value = Math.max(0, totalCount.value - 1)

                // Clear current user if it was deleted
                if (currentUser.value?.id === Number(id)) {
                    currentUser.value = null
                }

                // Remove from selected users
                selectedUsers.value = selectedUsers.value.filter(userId => userId !== Number(id))

                // Add to history
                addToHistory({
                    action: 'Delete User',
                    userId: Number(id),
                    username: userToDelete?.username,
                    success: true
                })

                // Show success message
                const { success } = useToast()
                success('User Deleted', `User "${userToDelete?.username}" has been deleted successfully`)

                console.log('✅ Dashboard user deleted successfully')
                return true
            } catch (err: any) {
                const errorInfo = handleUserError(err, 'Delete User', Number(id))
                throw err
            }
        })
    }

    // Toggle user active status
    const toggleUserActive = async (id: number | string) => {
        if (!id) {
            throw new Error('User ID is required')
        }

        try {
            error.value = null
            const user = users.value.find(u => u.id === Number(id))
            if (!user) {
                throw new Error('User not found in current list')
            }

            console.log('🔄 Toggling active status for user:', id, !user.is_active)

            // Require permission to manage users
            await requirePermission('can_manage_users')

            const response = await dashboardApiCall<DashboardUser>(`/dashboard/users/${id}/`, {
                method: 'PATCH',
                body: { is_active: !user.is_active }
            })

            // Update in users list
            const index = users.value.findIndex(u => u.id === Number(id))
            if (index !== -1) {
                users.value[index] = response
            }

            // Update current user if it's the same
            if (currentUser.value?.id === Number(id)) {
                currentUser.value = response
            }

            // Add to history
            addToHistory({
                action: response.is_active ? 'Activate User' : 'Deactivate User',
                userId: response.id,
                username: response.username,
                success: true
            })

            console.log('✅ User active status toggled successfully:', response.is_active)
            return response.is_active
        } catch (err: any) {
            const errorInfo = handleUserError(err, 'Toggle User Active Status', Number(id))
            throw err
        }
    }

    // Bulk actions
    const bulkUserAction = async (action: BulkUserAction) => {
        if (!action.user_ids.length) {
            throw new Error('No users selected for bulk action')
        }

        return await dashboardLoading.withLoading(async () => {
            try {
                error.value = null
                console.log('📦 Performing bulk user action:', action.action, 'on', action.user_ids.length, 'users')

                // Require permission to manage users
                await requirePermission('can_manage_users')

                const response = await dashboardApiCall<{ updated_count: number, message: string }>('/dashboard/users/bulk-action/', {
                    method: 'POST',
                    body: action
                })

                // Refresh users list to get updated data
                await fetchUsers(currentFilters.value)

                // Clear selected users
                selectedUsers.value = []

                // Add to history
                addToHistory({
                    action: `Bulk ${action.action}`,
                    success: true
                })

                // Show success message
                const { success } = useToast()
                success('Bulk Action Completed', `${response.updated_count} users updated successfully`)

                console.log('✅ Bulk user action completed successfully:', response.updated_count, 'users updated')
                return response
            } catch (err: any) {
                const errorInfo = handleUserError(err, 'Bulk User Action')
                throw err
            }
        })
    }

    // Convenience methods for bulk actions
    const bulkActivate = (userIds: number[]) => bulkUserAction({ action: 'activate', user_ids: userIds })
    const bulkDeactivate = (userIds: number[]) => bulkUserAction({ action: 'deactivate', user_ids: userIds })
    const bulkDelete = (userIds: number[]) => bulkUserAction({ action: 'delete', user_ids: userIds })
    const bulkChangeRole = (userIds: number[], role: string) =>
        bulkUserAction({ action: 'change_role', user_ids: userIds, data: { role } })
    const bulkSendEmail = (userIds: number[], emailData: { subject: string, message: string, template?: string }) =>
        bulkUserAction({ action: 'send_email', user_ids: userIds, data: emailData })
    const bulkResetPassword = (userIds: number[]) => bulkUserAction({ action: 'reset_password', user_ids: userIds })

    // Fetch user statistics
    const fetchUserStats = async () => {
        try {
            console.log('📊 Fetching user statistics')

            const response = await dashboardApiCall<UserStats>('/dashboard/users/stats/')
            userStats.value = response

            console.log('✅ User statistics fetched successfully')
            return response
        } catch (err: any) {
            const errorInfo = handleUserError(err, 'Fetch User Statistics')
            throw err
        }
    }

    // User selection management
    const toggleUserSelection = (userId: number) => {
        const index = selectedUsers.value.indexOf(userId)
        if (index > -1) {
            selectedUsers.value.splice(index, 1)
        } else {
            selectedUsers.value.push(userId)
        }
    }

    const selectAllUsers = () => {
        selectedUsers.value = users.value.map(u => u.id)
    }

    const clearSelection = () => {
        selectedUsers.value = []
    }

    const isUserSelected = (userId: number) => {
        return selectedUsers.value.includes(userId)
    }

    // Search and filter helpers
    const searchUsers = async (query: string) => {
        return await fetchUsers({ ...currentFilters.value, search: query, page: 1 })
    }

    const filterByStatus = async (is_active: boolean) => {
        return await fetchUsers({ ...currentFilters.value, is_active, page: 1 })
    }

    const filterByRole = async (role: string) => {
        return await fetchUsers({ ...currentFilters.value, role, page: 1 })
    }

    const sortUsers = async (ordering: string) => {
        return await fetchUsers({ ...currentFilters.value, ordering })
    }

    const resetFilters = async () => {
        currentFilters.value = {}
        return await fetchUsers()
    }

    // Send password reset email
    const sendPasswordReset = async (id: number | string) => {
        try {
            console.log('📧 Sending password reset email to user:', id)

            await requirePermission('can_manage_users')

            const response = await dashboardApiCall<{ message: string }>(`/dashboard/users/${id}/send-password-reset/`, {
                method: 'POST'
            })

            // Add to history
            const user = users.value.find(u => u.id === Number(id))
            addToHistory({
                action: 'Send Password Reset',
                userId: Number(id),
                username: user?.username,
                success: true
            })

            // Show success message
            const { success } = useToast()
            success('Password Reset Sent', 'Password reset email has been sent successfully')

            console.log('✅ Password reset email sent successfully')
            return response
        } catch (err: any) {
            const errorInfo = handleUserError(err, 'Send Password Reset', Number(id))
            throw err
        }
    }

    // Get user activity log
    const getUserActivity = async (id: number | string) => {
        try {
            console.log('📋 Fetching user activity log:', id)

            const response = await dashboardApiCall<Array<{
                action: string
                timestamp: string
                ip_address: string
                user_agent: string
                details?: any
            }>>(`/dashboard/users/${id}/activity/`)

            console.log('✅ User activity log fetched successfully')
            return response
        } catch (err: any) {
            const errorInfo = handleUserError(err, 'Get User Activity', Number(id))
            throw err
        }
    }

    // Cleanup function
    const cleanup = () => {
        clearSelection()
        clearValidationErrors()
        error.value = null
    }

    return {
        // State
        users: readonly(users),
        currentUser: readonly(currentUser),
        userStats: readonly(userStats),
        loading: readonly(loading),
        error: readonly(error),
        totalCount: readonly(totalCount),
        currentFilters: readonly(currentFilters),
        selectedUsers: readonly(selectedUsers),
        validationErrors: readonly(validationErrors),
        operationHistory: readonly(operationHistory),

        // Computed
        hasSelectedUsers: readonly(hasSelectedUsers),
        activeUsers: readonly(activeUsers),
        inactiveUsers: readonly(inactiveUsers),
        staffUsers: readonly(staffUsers),
        regularUsers: readonly(regularUsers),

        // CRUD Operations
        fetchUsers,
        fetchUser,
        createUser,
        updateUser,
        deleteUser,

        // User Management
        toggleUserActive,
        sendPasswordReset,
        getUserActivity,

        // Bulk Operations
        bulkUserAction,
        bulkActivate,
        bulkDeactivate,
        bulkDelete,
        bulkChangeRole,
        bulkSendEmail,
        bulkResetPassword,

        // Selection Management
        toggleUserSelection,
        selectAllUsers,
        clearSelection,
        isUserSelected,

        // Search and Filter
        searchUsers,
        filterByStatus,
        filterByRole,
        sortUsers,
        resetFilters,

        // Statistics
        fetchUserStats,

        // Validation
        validateUserData,
        clearValidationErrors,

        // Utilities
        cleanFilters,
        addToHistory,
        handleUserError,
        cleanup
    }
}