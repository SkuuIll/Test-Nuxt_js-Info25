import type { User, ApiResponse } from '~/types'

interface DashboardUser extends User {
    posts_count: number
    comments_count: number
    last_activity: string
    profile_completion: number
    permissions: {
        can_manage_posts: boolean
        can_manage_users: boolean
        can_manage_comments: boolean
        can_view_stats: boolean
        can_moderate_content: boolean
    }
}

interface UserFilters {
    page?: number
    page_size?: number
    search?: string
    is_active?: boolean
    is_staff?: boolean
    is_superuser?: boolean
    ordering?: string
    date_joined_from?: string
    date_joined_to?: string
    last_login_from?: string
    last_login_to?: string
}

interface BulkUserAction {
    action: 'activate' | 'deactivate' | 'make_staff' | 'remove_staff' | 'delete'
    user_ids: number[]
}

interface UserStats {
    total_users: number
    active_users: number
    staff_users: number
    new_users_this_month: number
    users_by_role: {
        regular: number
        staff: number
        superuser: number
    }
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

    // Computed
    const hasSelectedUsers = computed(() => selectedUsers.value.length > 0)
    const activeUsers = computed(() => users.value.filter(u => u.is_active))
    const inactiveUsers = computed(() => users.value.filter(u => !u.is_active))
    const staffUsers = computed(() => users.value.filter(u => u.is_staff))
    const regularUsers = computed(() => users.value.filter(u => !u.is_staff && !u.is_superuser))

    // Helper function to clean filters
    const cleanFilters = (filters: UserFilters) => {
        const cleaned: Record<string, any> = {}
        for (const [key, value] of Object.entries(filters)) {
            if (value !== undefined && value !== null && value !== '') {
                cleaned[key] = value
            }
        }
        return cleaned
    }

    // Fetch users list
    const fetchUsers = async (filters: UserFilters = {}) => {
        return await dashboardLoading.withLoading(async () => {
            try {
                error.value = null
                console.log('📡 Fetching dashboard users with filters:', filters)

                // Require permission to manage users
                await requirePermission('can_manage_users')

                // Store current filters
                currentFilters.value = { ...filters }

                const response = await dashboardApiCall<ApiResponse<DashboardUser>>('/dashboard/users/', {
                    params: cleanFilters(filters)
                })

                users.value = response.results || []
                totalCount.value = response.count || 0

                console.log('✅ Dashboard users fetched successfully:', {
                    count: users.value.length,
                    total: totalCount.value
                })

                return response
            } catch (err: any) {
                console.error('❌ Dashboard users fetch error:', err)

                const errorInfo = handleApiError(err, 'Dashboard Users Fetch Failed')
                error.value = errorInfo.message

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

                // Require permission to manage users
                await requirePermission('can_manage_users')

                const response = await dashboardApiCall<DashboardUser>(`/dashboard/users/${id}/`)

                currentUser.value = response
                console.log('✅ Dashboard user fetched successfully:', response.username)

                return response
            } catch (err: any) {
                console.error('❌ Dashboard user fetch error:', err)

                const errorInfo = handleApiError(err, 'Dashboard User Fetch Failed')
                error.value = errorInfo.message

                throw err
            }
        })
    }

    // Create user
    const createUser = async (userData: Partial<DashboardUser>) => {
        return await dashboardLoading.withLoading(async () => {
            try {
                error.value = null
                console.log('📝 Creating dashboard user:', userData.username)

                // Require permission to manage users
                await requirePermission('can_manage_users')

                const response = await dashboardApiCall<DashboardUser>('/dashboard/users/', {
                    method: 'POST',
                    body: userData
                })

                // Add to users list at the beginning
                users.value.unshift(response)
                totalCount.value += 1
                currentUser.value = response

                console.log('✅ Dashboard user created successfully:', response.username)
                return response
            } catch (err: any) {
                console.error('❌ Dashboard user create error:', err)

                // Handle validation errors specifically
                if (err.data?.errors) {
                    const errorInfo = handleValidationError(err, 'User Creation Validation Failed')
                    error.value = errorInfo.message
                } else {
                    const errorInfo = handleApiError(err, 'Dashboard User Create Failed')
                    error.value = errorInfo.message
                }

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
                console.log('📝 Updating dashboard user:', id, userData.username)

                // Require permission to manage users
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

                console.log('✅ Dashboard user updated successfully:', response.username)
                return response
            } catch (err: any) {
                console.error('❌ Dashboard user update error:', err)

                // Handle validation errors specifically
                if (err.data?.errors) {
                    const errorInfo = handleValidationError(err, 'User Update Validation Failed')
                    error.value = errorInfo.message
                } else {
                    const errorInfo = handleApiError(err, 'Dashboard User Update Failed')
                    error.value = errorInfo.message
                }

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

                // Require permission to manage users
                await requirePermission('can_manage_users')

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

                console.log('✅ Dashboard user deleted successfully')
                return true
            } catch (err: any) {
                console.error('❌ Dashboard user delete error:', err)

                const errorInfo = handleApiError(err, 'Dashboard User Delete Failed')
                error.value = errorInfo.message

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

            console.log('🔄 Toggling user active status:', id, !user.is_active)

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

            console.log('✅ User active status toggled successfully:', response.is_active)
            return response.is_active
        } catch (err: any) {
            console.error('❌ Toggle user active error:', err)

            const errorInfo = handleApiError(err, 'Toggle User Active Status Failed')
            error.value = errorInfo.message

            throw err
        }
    }

    // Bulk actions
    const bulkAction = async (action: BulkUserAction) => {
        if (!action.user_ids.length) {
            throw new Error('No users selected for bulk action')
        }

        return await dashboardLoading.withLoading(async () => {
            try {
                error.value = null
                console.log('📦 Performing bulk action:', action.action, 'on', action.user_ids.length, 'users')

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

                console.log('✅ Bulk action completed successfully:', response.updated_count, 'users updated')
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
    const bulkActivate = (userIds: number[]) => bulkAction({ action: 'activate', user_ids: userIds })
    const bulkDeactivate = (userIds: number[]) => bulkAction({ action: 'deactivate', user_ids: userIds })
    const bulkMakeStaff = (userIds: number[]) => bulkAction({ action: 'make_staff', user_ids: userIds })
    const bulkRemoveStaff = (userIds: number[]) => bulkAction({ action: 'remove_staff', user_ids: userIds })
    const bulkDelete = (userIds: number[]) => bulkAction({ action: 'delete', user_ids: userIds })

    // Fetch user statistics
    const fetchUserStats = async () => {
        try {
            console.log('📊 Fetching user statistics')

            const response = await dashboardApiCall<UserStats>('/dashboard/users/stats/')
            userStats.value = response

            console.log('✅ User statistics fetched successfully')
            return response
        } catch (err: any) {
            console.error('❌ User statistics fetch error:', err)

            const errorInfo = handleApiError(err, 'User Statistics Fetch Failed')
            error.value = errorInfo.message

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

    const filterByStatus = async (isActive: boolean) => {
        return await fetchUsers({ ...currentFilters.value, is_active: isActive, page: 1 })
    }

    const filterByRole = async (isStaff: boolean) => {
        return await fetchUsers({ ...currentFilters.value, is_staff: isStaff, page: 1 })
    }

    const sortUsers = async (ordering: string) => {
        return await fetchUsers({ ...currentFilters.value, ordering })
    }

    // Reset filters
    const resetFilters = async () => {
        currentFilters.value = {}
        return await fetchUsers()
    }

    // Toggle user staff status
    const toggleUserStaff = async (id: number | string) => {
        if (!id) {
            throw new Error('User ID is required')
        }

        try {
            const user = users.value.find(u => u.id === Number(id))
            if (!user) {
                throw new Error('User not found in current list')
            }

            console.log('👑 Toggling user staff status:', id, !user.is_staff)

            // Require permission to manage users
            await requirePermission('can_manage_users')

            const response = await dashboardApiCall<DashboardUser>(`/dashboard/users/${id}/`, {
                method: 'PATCH',
                body: { is_staff: !user.is_staff }
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

            console.log('✅ User staff status toggled successfully:', response.is_staff)
            return response.is_staff
        } catch (err: any) {
            console.error('❌ Toggle user staff error:', err)

            const errorInfo = handleApiError(err, 'Toggle User Staff Status Failed')
            error.value = errorInfo.message

            throw err
        }
    }

    // Reset user password
    const resetUserPassword = async (id: number | string) => {
        if (!id) {
            throw new Error('User ID is required')
        }

        try {
            console.log('🔐 Resetting user password:', id)

            // Require permission to manage users
            await requirePermission('can_manage_users')

            const response = await dashboardApiCall<{ new_password: string }>(`/dashboard/users/${id}/reset-password/`, {
                method: 'POST'
            })

            console.log('✅ User password reset successfully')
            return response.new_password
        } catch (err: any) {
            console.error('❌ Reset user password error:', err)

            const errorInfo = handleApiError(err, 'Reset User Password Failed')
            error.value = errorInfo.message

            throw err
        }
    }

    // Send user activation email
    const sendActivationEmail = async (id: number | string) => {
        if (!id) {
            throw new Error('User ID is required')
        }

        try {
            console.log('📧 Sending activation email to user:', id)

            // Require permission to manage users
            await requirePermission('can_manage_users')

            await dashboardApiCall(`/dashboard/users/${id}/send-activation/`, {
                method: 'POST'
            })

            console.log('✅ Activation email sent successfully')
            return true
        } catch (err: any) {
            console.error('❌ Send activation email error:', err)

            const errorInfo = handleApiError(err, 'Send Activation Email Failed')
            error.value = errorInfo.message

            throw err
        }
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

        // Status Management
        toggleUserActive,
        toggleUserStaff,

        // Bulk Operations
        bulkAction,
        bulkActivate,
        bulkDeactivate,
        bulkMakeStaff,
        bulkRemoveStaff,
        bulkDelete,

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

        // Additional Operations
        resetUserPassword,
        sendActivationEmail,

        // Statistics
        fetchUserStats,

        // Utilities
        cleanFilters
    }
}