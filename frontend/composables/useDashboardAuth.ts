interface DashboardUser {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    is_superuser: boolean
    permissions: DashboardPermissions
}

interface DashboardPermissions {
    can_manage_posts: boolean
    can_manage_users: boolean
    can_manage_comments: boolean
    can_view_stats: boolean
}

interface LoginCredentials {
    username: string
    password: string
}

interface LoginResponse {
    error: boolean
    message: string
    data?: {
        access: string
        refresh: string
        user: DashboardUser
    }
}

export const useDashboardAuth = () => {
    const config = useRuntimeConfig()
    const apiBase = config.public.apiBase

    // State
    const user = ref<DashboardUser | null>(null)
    const permissions = ref<DashboardPermissions | null>(null)
    const accessToken = ref<string | null>(null)
    const refreshToken = ref<string | null>(null)

    // Initialize state
    const initialized = ref(false)

    // Initialize from localStorage on client side
    const initializeAuth = () => {
        if (process.client && !initialized.value) {
            const storedUser = localStorage.getItem('dashboard_user')
            const storedAccessToken = localStorage.getItem('dashboard_access_token')
            const storedRefreshToken = localStorage.getItem('dashboard_refresh_token')

            if (storedUser && storedAccessToken) {
                try {
                    user.value = JSON.parse(storedUser)
                    permissions.value = user.value?.permissions || null
                    accessToken.value = storedAccessToken
                    refreshToken.value = storedRefreshToken
                } catch (error) {
                    console.error('Error parsing stored user data:', error)
                    // Clear corrupted data
                    localStorage.removeItem('dashboard_user')
                    localStorage.removeItem('dashboard_access_token')
                    localStorage.removeItem('dashboard_refresh_token')
                }
            }
            initialized.value = true
        }
    }

    // Initialize immediately if on client
    if (process.client) {
        initializeAuth()
    }

    onMounted(() => {
        initializeAuth()
    })

    // Login function
    const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
        try {
            const response = await $fetch<LoginResponse>(`${apiBase}/api/v1/dashboard/auth/login/`, {
                method: 'POST',
                body: credentials
            })

            if (!response.error && response.data) {
                // Store user data and tokens
                user.value = response.data.user
                permissions.value = response.data.user.permissions
                accessToken.value = response.data.access
                refreshToken.value = response.data.refresh

                // Store in localStorage
                if (process.client) {
                    localStorage.setItem('dashboard_user', JSON.stringify(response.data.user))
                    localStorage.setItem('dashboard_access_token', response.data.access)
                    localStorage.setItem('dashboard_refresh_token', response.data.refresh)
                }
            }

            return response
        } catch (error: any) {
            console.error('Login error:', error)
            return {
                error: true,
                message: error.data?.message || 'Error de conexión'
            }
        }
    }

    // Logout function
    const logout = async (showNotification = true) => {
        try {
            if (refreshToken.value) {
                await $fetch(`${apiBase}/api/v1/dashboard/auth/logout/`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken.value}`
                    },
                    body: {
                        refresh: refreshToken.value
                    }
                })
            }
        } catch (error) {
            console.error('Logout error:', error)
        } finally {
            // Clear state
            user.value = null
            permissions.value = null
            accessToken.value = null
            refreshToken.value = null

            // Clear localStorage
            if (process.client) {
                localStorage.removeItem('dashboard_user')
                localStorage.removeItem('dashboard_access_token')
                localStorage.removeItem('dashboard_refresh_token')

                // Show logout notification
                if (showNotification) {
                    const { success } = useToast()
                    success('Sesión cerrada', 'Has cerrado sesión exitosamente')
                }
            }
        }
    }

    // Refresh token function
    const refreshAccessToken = async (): Promise<boolean> => {
        if (!refreshToken.value) return false

        try {
            const response = await $fetch<{ access: string }>(`${apiBase}/api/v1/dashboard/auth/refresh/`, {
                method: 'POST',
                body: {
                    refresh: refreshToken.value
                }
            })

            if (response.access) {
                accessToken.value = response.access

                if (process.client) {
                    localStorage.setItem('dashboard_access_token', response.access)
                }

                return true
            }
        } catch (error) {
            console.error('Token refresh error:', error)
            await logout()
        }

        return false
    }

    // Check if user is authenticated
    const isAuthenticated = (): boolean => {
        // Ensure we're initialized on client side
        if (process.client && !initialized.value) {
            initializeAuth()
        }
        return !!(user.value && accessToken.value)
    }

    // Get user profile
    const fetchUserProfile = async () => {
        if (!accessToken.value) return

        try {
            const response = await $fetch<{ error: boolean; data: DashboardUser }>(`${apiBase}/api/v1/dashboard/auth/profile/`, {
                headers: {
                    'Authorization': `Bearer ${accessToken.value}`
                }
            })

            if (!response.error) {
                user.value = response.data
                permissions.value = response.data.permissions

                if (process.client) {
                    localStorage.setItem('dashboard_user', JSON.stringify(response.data))
                }
            }
        } catch (error) {
            console.error('Profile fetch error:', error)
        }
    }

    // Check permission
    const hasPermission = (permission: keyof DashboardPermissions): boolean => {
        if (user.value?.is_superuser) return true
        return permissions.value?.[permission] || false
    }

    return {
        user: readonly(user),
        permissions: readonly(permissions),
        accessToken: readonly(accessToken),
        initialized: readonly(initialized),
        login,
        logout,
        refreshAccessToken,
        isAuthenticated,
        fetchUserProfile,
        hasPermission,
        initializeAuth
    }
}