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
    const initializeAuth = async () => {
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
            const response = await $fetch<any>(`${apiBase}/api/v1/dashboard/auth/login/`, {
                method: 'POST',
                body: credentials
            })

            // Handle standardized response format
            if (response.success && response.data) {
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

                return {
                    error: false,
                    message: response.message || 'Login successful',
                    data: response.data
                }
            } else {
                return {
                    error: true,
                    message: response.message || response.error || 'Login failed'
                }
            }
        } catch (error: any) {
            console.error('Login error:', error)

            let errorMessage = 'Error de conexión'
            if (error.data) {
                if (error.data.error) {
                    errorMessage = error.data.error
                } else if (error.data.message) {
                    errorMessage = error.data.message
                }
            } else if (error.message) {
                errorMessage = error.message
            }

            return {
                error: true,
                message: errorMessage
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
            const response = await $fetch<any>(`${apiBase}/api/v1/dashboard/auth/refresh/`, {
                method: 'POST',
                body: {
                    refresh: refreshToken.value
                }
            })

            // Handle standardized response format
            if (response.success && response.data && response.data.access) {
                accessToken.value = response.data.access

                if (process.client) {
                    localStorage.setItem('dashboard_access_token', response.data.access)
                }

                console.log('✅ Dashboard token refreshed successfully')
                return true
            } else if (response.access) {
                // Handle direct access token response (fallback)
                accessToken.value = response.access

                if (process.client) {
                    localStorage.setItem('dashboard_access_token', response.access)
                }

                console.log('✅ Dashboard token refreshed successfully (fallback)')
                return true
            }
        } catch (error: any) {
            console.error('❌ Dashboard token refresh error:', error)

            // If refresh fails, logout user
            await logout(false)
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
            const response = await $fetch<any>(`${apiBase}/api/v1/dashboard/auth/profile/`, {
                headers: {
                    'Authorization': `Bearer ${accessToken.value}`
                }
            })

            // Handle standardized response format
            if (response.success && response.data) {
                user.value = response.data
                permissions.value = response.data.permissions

                if (process.client) {
                    localStorage.setItem('dashboard_user', JSON.stringify(response.data))
                }

                console.log('✅ Dashboard profile fetched successfully')
            } else if (response.data && !response.error) {
                // Handle direct data response (fallback)
                user.value = response.data
                permissions.value = response.data.permissions

                if (process.client) {
                    localStorage.setItem('dashboard_user', JSON.stringify(response.data))
                }

                console.log('✅ Dashboard profile fetched successfully (fallback)')
            }
        } catch (error: any) {
            console.error('❌ Dashboard profile fetch error:', error)

            // If it's a 401, the token is invalid
            if (error.status === 401 || error.statusCode === 401) {
                await logout(false)
            }
        }
    }

    // Check permission
    const hasPermission = (permission: keyof DashboardPermissions): boolean => {
        if (user.value?.is_superuser) return true
        return permissions.value?.[permission] || false
    }

    // Get access token (for API calls)
    const getAccessToken = (): string | null => {
        return accessToken.value
    }

    // API call with automatic token refresh
    const apiCall = async (url: string, options: any = {}) => {
        const makeRequest = async (token: string) => {
            return await $fetch(url, {
                ...options,
                headers: {
                    ...options.headers,
                    'Authorization': `Bearer ${token}`
                }
            })
        }

        try {
            if (!accessToken.value) {
                throw new Error('No access token available')
            }

            const response = await makeRequest(accessToken.value)

            // Handle standardized response format
            if (response && typeof response === 'object' && 'success' in response) {
                if (!response.success) {
                    throw createError({
                        statusCode: 400,
                        statusMessage: response.error || response.message || 'API Error',
                        data: response
                    })
                }
                // Return the data field if it exists
                return response.data !== undefined ? response.data : response
            }

            return response
        } catch (error: any) {
            // If 401 error, try to refresh token
            if (error.status === 401 || error.statusCode === 401) {
                console.log('🔄 Dashboard token expired, trying to refresh...')
                const refreshed = await refreshAccessToken()
                if (refreshed && accessToken.value) {
                    console.log('✅ Dashboard token refreshed, retrying request...')
                    const response = await makeRequest(accessToken.value)

                    // Handle standardized response format for retry
                    if (response && typeof response === 'object' && 'success' in response) {
                        if (!response.success) {
                            throw createError({
                                statusCode: 400,
                                statusMessage: response.error || response.message || 'API Error',
                                data: response
                            })
                        }
                        return response.data !== undefined ? response.data : response
                    }

                    return response
                } else {
                    // Refresh failed, redirect to login
                    console.log('❌ Dashboard token refresh failed, redirecting to login')
                    await logout(false)
                    await navigateTo('/dashboard/login')
                    throw error
                }
            }
            throw error
        }
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
        initializeAuth,
        getAccessToken,
        apiCall
    }
}