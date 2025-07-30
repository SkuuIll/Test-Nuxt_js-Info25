interface DashboardUser {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    is_active: boolean
    is_staff: boolean
    is_superuser: boolean
    date_joined: string
    last_login: string | null
    posts_count?: number
    comments_count?: number
    permissions?: {
        can_manage_posts: boolean
        can_manage_users: boolean
        can_manage_comments: boolean
        can_view_stats: boolean
    }
}

interface UsersResponse {
    count: number
    next: string | null
    previous: string | null
    results: DashboardUser[]
}

export const useDashboardUsers = () => {
    const config = useRuntimeConfig()
    const apiBase = config.public.apiBase
    const { apiCall, isAuthenticated } = useDashboardAuth()

    // State
    const users = ref<DashboardUser[]>([])
    const currentUser = ref<DashboardUser | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)
    const totalCount = ref(0)

    // Fetch users list
    const fetchUsers = async (params: {
        page?: number
        page_size?: number
        search?: string
        is_active?: boolean
        is_staff?: boolean
        ordering?: string
    } = {}) => {
        loading.value = true
        error.value = null

        try {
            const queryParams = new URLSearchParams()

            if (params.page) queryParams.append('page', params.page.toString())
            if (params.page_size) queryParams.append('page_size', params.page_size.toString())
            if (params.search) queryParams.append('search', params.search)
            if (params.is_active !== undefined) queryParams.append('is_active', params.is_active.toString())
            if (params.is_staff !== undefined) queryParams.append('is_staff', params.is_staff.toString())
            if (params.ordering) queryParams.append('ordering', params.ordering)

            const url = `${apiBase}/api/v1/dashboard/api/users/?${queryParams.toString()}`
            const response = await apiCall(url)

            if (response && response.results) {
                users.value = response.results
                totalCount.value = response.count || 0
                return response
            } else if (response && Array.isArray(response)) {
                // Handle direct array response
                users.value = response
                totalCount.value = response.length
                return { results: response, count: response.length }
            } else {
                error.value = 'Error al cargar usuarios'
            }
        } catch (err: any) {
            console.error('Users fetch error:', err)
            error.value = err.statusMessage || err.message || 'Error de conexión'
        } finally {
            loading.value = false
        }
    }

    // Fetch single user
    const fetchUser = async (id: number) => {
        if (!id) return

        loading.value = true
        error.value = null

        try {
            const response = await apiCall(`${apiBase}/api/v1/dashboard/api/users/${id}/`)

            if (response) {
                currentUser.value = response
                return response
            } else {
                error.value = 'Error al cargar usuario'
            }
        } catch (err: any) {
            console.error('User fetch error:', err)
            error.value = err.statusMessage || err.message || 'Error de conexión'
        } finally {
            loading.value = false
        }
    }

    // Create user
    const createUser = async (userData: Partial<DashboardUser>) => {
        loading.value = true
        error.value = null

        try {
            const response = await apiCall(`${apiBase}/api/v1/dashboard/api/users/`, {
                method: 'POST',
                body: userData
            })

            if (response) {
                // Add to users list
                users.value.unshift(response)
                return response
            } else {
                throw new Error('No response data')
            }
        } catch (err: any) {
            console.error('User create error:', err)
            error.value = err.statusMessage || err.message || 'Error creando usuario'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Update user
    const updateUser = async (id: number, userData: Partial<DashboardUser>) => {
        if (!id) return

        loading.value = true
        error.value = null

        try {
            const response = await apiCall(`${apiBase}/api/v1/dashboard/api/users/${id}/`, {
                method: 'PATCH',
                body: userData
            })

            if (response) {
                // Update in users list
                const index = users.value.findIndex(u => u.id === id)
                if (index !== -1) {
                    users.value[index] = response
                }
                currentUser.value = response
                return response
            } else {
                throw new Error('No response data')
            }
        } catch (err: any) {
            console.error('User update error:', err)
            error.value = err.statusMessage || err.message || 'Error actualizando usuario'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Delete user
    const deleteUser = async (id: number) => {
        if (!id) return false

        try {
            await apiCall(`${apiBase}/api/v1/dashboard/api/users/${id}/`, {
                method: 'DELETE'
            })

            // Remove from users list
            users.value = users.value.filter(u => u.id !== id)

            // Clear current user if it was deleted
            if (currentUser.value?.id === id) {
                currentUser.value = null
            }

            return true
        } catch (err: any) {
            console.error('User delete error:', err)
            error.value = err.statusMessage || err.message || 'Error eliminando usuario'
            return false
        }
    }

    // Toggle user active status
    const toggleUserActive = async (id: number) => {
        if (!id) return

        try {
            const user = users.value.find(u => u.id === id)
            if (!user) return

            const response = await apiCall(`${apiBase}/api/v1/dashboard/api/users/${id}/`, {
                method: 'PATCH',
                body: { is_active: !user.is_active }
            })

            if (response) {
                // Update in users list
                const index = users.value.findIndex(u => u.id === id)
                if (index !== -1) {
                    users.value[index] = response
                }
                return response.is_active
            }
        } catch (err: any) {
            console.error('Toggle user active error:', err)
            error.value = err.statusMessage || err.message || 'Error cambiando estado del usuario'
        }
    }

    // Bulk update users
    const bulkUpdateUsers = async (userIds: number[], action: string) => {
        if (!userIds.length) return 0

        try {
            const response = await apiCall(`${apiBase}/api/v1/dashboard/api/users/bulk-action/`, {
                method: 'POST',
                body: {
                    user_ids: userIds,
                    action: action
                }
            })

            if (response && response.updated_count !== undefined) {
                // Refresh users list to get updated data
                await fetchUsers()
                return response.updated_count
            }

            return 0
        } catch (err: any) {
            console.error('Bulk update users error:', err)
            error.value = err.statusMessage || err.message || 'Error en actualización masiva'
            return 0
        }
    }

    return {
        users: readonly(users),
        currentUser: readonly(currentUser),
        loading: readonly(loading),
        error: readonly(error),
        totalCount: readonly(totalCount),
        fetchUsers,
        fetchUser,
        createUser,
        updateUser,
        deleteUser,
        toggleUserActive,
        bulkUpdateUsers
    }
}