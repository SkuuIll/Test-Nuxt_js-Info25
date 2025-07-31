import type { User, LoginCredentials, AuthTokens } from '~/types'

interface DashboardUser extends User {
    permissions: DashboardPermissions
}

interface DashboardPermissions {
    can_manage_posts: boolean
    can_manage_users: boolean
    can_manage_comments: boolean
    can_view_stats: boolean
    can_moderate_content: boolean
    can_access_analytics: boolean
}

interface DashboardAuthState {
    user: DashboardUser | null
    isAuthenticated: boolean
    loading: boolean
    error: string | null
    permissions: DashboardPermissions | null
}

export const useDashboardAuth = () => {
    const { handleAuthError, handleValidationError } = useErrorHandler()
    const { dashboardLoading } = useLoading()
    const api = useApi()

    // State
    const user = ref<DashboardUser | null>(null)
    const permissions = ref<DashboardPermissions | null>(null)
    const isAuthenticated = ref(false)
    const error = ref<string | null>(null)
    const initialized = ref(false)

    // Computed
    const loading = computed(() => dashboardLoading.loading.value)
    const isAdmin = computed(() => user.value?.is_staff || false)
    const isSuperuser = computed(() => user.value?.is_superuser || false)

    // Dashboard-specific token key
    const DASHBOARD_TOKEN_KEY = 'dashboard_auth_tokens'

    // Helper function to clear dashboard auth state
    const clearDashboardAuthState = async () => {
        console.log('🧹 Clearing dashboard authentication state')

        // Clear tokens from localStorage
        if (import.meta.client) {
            localStorage.removeItem(DASHBOARD_TOKEN_KEY)
        }

        // Reset state
        user.value = null
        permissions.value = null
        isAuthenticated.value = false
        error.value = null

        console.log('✅ Dashboard authentication state cleared')
    }

    // Get dashboard tokens from localStorage
    const getDashboardTokens = (): AuthTokens | null => {
        if (!import.meta.client) return null

        try {
            const stored = localStorage.getItem(DASHBOARD_TOKEN_KEY)
            if (stored) {
                const tokens = JSON.parse(stored)
                return tokens
            }
        } catch (error) {
            console.error('Error parsing dashboard tokens:', error)
            localStorage.removeItem(DASHBOARD_TOKEN_KEY)
        }

        return null
    }

    // Set dashboard tokens in localStorage
    const setDashboardTokens = (tokens: AuthTokens) => {
        if (!import.meta.client) return

        try {
            const tokenData = {
                ...tokens,
                stored_at: Date.now(),
                expires_at: api.tokenUtils.getTokenExpiryTime(tokens.access)
            }
            localStorage.setItem(DASHBOARD_TOKEN_KEY, JSON.stringify(tokenData))
            console.log('💾 Dashboard tokens stored successfully')
        } catch (error) {
            console.error('Error storing dashboard tokens:', error)
        }
    }

    // Dashboard login
    const login = async (credentials: LoginCredentials) => {
        return await dashboardLoading.withLoading(async () => {
            try {
                error.value = null
                console.log('🔐 Starting dashboard login for:', credentials.username)

                // Use dashboard-specific login endpoint
                const response = await api.apiRequest<AuthTokens>('/dashboard/auth/login/', {
                    method: 'POST',
                    body: credentials
                })

                console.log('✅ Dashboard login successful, tokens received')

                // Store dashboard tokens
                setDashboardTokens(response)

                // Fetch dashboard user profile
                const profile = await fetchDashboardProfile()

                console.log('👤 Dashboard user profile fetched:', {
                    username: profile.username,
                    isStaff: profile.is_staff,
                    permissions: profile.permissions
                })

                // Set authentication state
                user.value = profile
                permissions.value = profile.permissions
                isAuthenticated.value = true

                console.log('🎉 Dashboard authentication completed successfully')
                return { tokens: response, user: profile }
            } catch (err: any) {
                console.error('❌ Dashboard login error:', err)

                // Handle auth error with enhanced error handler
                const errorInfo = handleAuthError(err, 'Dashboard Login Failed')
                error.value = errorInfo.message

                // Clear any existing auth state
                await clearDashboardAuthState()

                throw err
            }
        })
    }

    // Dashboard logout
    const logout = async (redirectTo: string = '/dashboard/login') => {
        return await dashboardLoading.withLoading(async () => {
            try {
                console.log('👋 Starting dashboard logout process')

                const tokens = getDashboardTokens()

                // Try to logout from backend
                if (tokens?.refresh) {
                    try {
                        await api.apiRequest('/dashboard/auth/logout/', {
                            method: 'POST',
                            body: { refresh: tokens.refresh },
                            headers: {
                                'Authorization': `Bearer ${tokens.access}`
                            }
                        })
                        console.log('✅ Dashboard backend logout successful')
                    } catch (logoutError) {
                        console.warn('⚠️ Dashboard backend logout error (continuing with local logout):', logoutError)
                    }
                }

                // Clear authentication state
                await clearDashboardAuthState()

                console.log('👋 Dashboard logout completed successfully')

                // Redirect to specified route
                if (redirectTo) {
                    await navigateTo(redirectTo)
                }

            } catch (err: any) {
                console.error('❌ Dashboard logout error:', err)

                // Even if logout fails, clear local state
                await clearDashboardAuthState()

                // Still redirect on error
                if (redirectTo) {
                    await navigateTo(redirectTo)
                }

                throw err
            }
        })
    }

    // Fetch dashboard user profile
    const fetchDashboardProfile = async (): Promise<DashboardUser> => {
        try {
            console.log('📡 Fetching dashboard user profile...')

            const tokens = getDashboardTokens()
            if (!tokens?.access) {
                throw new Error('No dashboard access token available')
            }

            const profile = await api.apiRequest<DashboardUser>('/dashboard/auth/profile/', {
                headers: {
                    'Authorization': `Bearer ${tokens.access}`
                }
            })

            console.log('✅ Dashboard profile fetched successfully')
            return profile
        } catch (err: any) {
            console.error('❌ Error fetching dashboard profile:', err)

            // Handle authentication errors
            if (err.statusCode === 401 || err.status === 401) {
                console.log('🔒 Invalid dashboard token, logging out...')
                await clearDashboardAuthState()

                const errorInfo = handleAuthError(err, 'Dashboard Profile Fetch Failed - Session Expired')
                error.value = errorInfo.message

                throw new Error('Dashboard session expired')
            } else {
                const errorInfo = handleAuthError(err, 'Dashboard Profile Fetch Failed')
                error.value = errorInfo.message

                throw err
            }
        }
    }

    // Refresh dashboard tokens
    const refreshDashboardTokens = async (): Promise<boolean> => {
        const tokens = getDashboardTokens()
        if (!tokens?.refresh) {
            console.log('🚫 No dashboard refresh token available')
            return false
        }

        try {
            console.log('🔄 Refreshing dashboard tokens...')

            const newTokens = await api.apiRequest<AuthTokens>('/dashboard/auth/refresh/', {
                method: 'POST',
                body: { refresh: tokens.refresh }
            })

            setDashboardTokens(newTokens)
            console.log('✅ Dashboard tokens refreshed successfully')
            return true
        } catch (error) {
            console.error('❌ Dashboard token refresh failed:', error)
            await clearDashboardAuthState()
            return false
        }
    }

    // Initialize dashboard authentication
    const initializeDashboardAuth = async () => {
        if (!import.meta.client || initialized.value) return

        try {
            console.log('🔄 Initializing dashboard authentication...')

            const tokens = getDashboardTokens()
            if (!tokens?.access) {
                console.log('ℹ️ No dashboard tokens found, user not authenticated')
                await clearDashboardAuthState()
                initialized.value = true
                return
            }

            console.log('🔍 Found existing dashboard tokens, validating...')

            // Check if access token is expired
            if (api.tokenUtils.isTokenExpired(tokens.access)) {
                console.log('⏰ Dashboard access token expired, attempting refresh...')

                if (tokens.refresh && !api.tokenUtils.isTokenExpired(tokens.refresh)) {
                    const refreshed = await refreshDashboardTokens()
                    if (!refreshed) {
                        initialized.value = true
                        return
                    }
                } else {
                    console.log('🚫 Dashboard refresh token also expired')
                    await clearDashboardAuthState()
                    initialized.value = true
                    return
                }
            }

            // Try to fetch profile to validate token and get user data
            try {
                const profile = await fetchDashboardProfile()
                user.value = profile
                permissions.value = profile.permissions
                isAuthenticated.value = true
                console.log('✅ Dashboard authentication initialized successfully')
            } catch (profileError: any) {
                console.warn('⚠️ Dashboard profile fetch error during initialization:', profileError)

                // If it's an authentication error, clear state
                if (profileError.statusCode === 401 || profileError.status === 401) {
                    console.log('🔒 Dashboard authentication failed, clearing state')
                    await clearDashboardAuthState()
                } else {
                    // For other errors, log but don't clear authentication
                    console.log('ℹ️ Maintaining dashboard authenticated state despite profile error')
                    isAuthenticated.value = true
                }
            }
        } catch (err) {
            console.error('❌ Dashboard authentication initialization error:', err)
            await clearDashboardAuthState()
        } finally {
            initialized.value = true
        }
    }

    // Check if user has specific dashboard permission
    const hasPermission = (permission: keyof DashboardPermissions): boolean => {
        if (!permissions.value) return false
        return permissions.value[permission] || false
    }

    // Check if user has any of the specified permissions
    const hasAnyPermission = (permissionList: (keyof DashboardPermissions)[]): boolean => {
        return permissionList.some(permission => hasPermission(permission))
    }

    // Check if user has all specified permissions
    const hasAllPermissions = (permissionList: (keyof DashboardPermissions)[]): boolean => {
        return permissionList.every(permission => hasPermission(permission))
    }

    // Dashboard-specific API call with automatic token refresh
    const dashboardApiCall = async <T>(endpoint: string, options: any = {}): Promise<T> => {
        const tokens = getDashboardTokens()
        if (!tokens?.access) {
            throw new Error('No dashboard access token available')
        }

        try {
            return await api.apiRequest<T>(endpoint, {
                ...options,
                headers: {
                    ...options.headers,
                    'Authorization': `Bearer ${tokens.access}`
                }
            })
        } catch (error: any) {
            // If 401 error, try to refresh token and retry
            if (error.statusCode === 401 || error.status === 401) {
                console.log('🔄 Dashboard token expired during API call, attempting refresh...')

                const refreshed = await refreshDashboardTokens()
                if (refreshed) {
                    const newTokens = getDashboardTokens()
                    if (newTokens?.access) {
                        console.log('✅ Dashboard token refreshed, retrying API call')
                        return await api.apiRequest<T>(endpoint, {
                            ...options,
                            headers: {
                                ...options.headers,
                                'Authorization': `Bearer ${newTokens.access}`
                            }
                        })
                    }
                }

                // If refresh failed, logout and redirect
                console.log('❌ Dashboard token refresh failed, logging out')
                await logout('/dashboard/login')
            }

            throw error
        }
    }

    // Check dashboard authentication status
    const checkDashboardAuthStatus = () => {
        const tokens = getDashboardTokens()
        const hasValidTokens = tokens?.access && !api.tokenUtils.isTokenExpired(tokens.access)

        return {
            hasTokens: !!tokens,
            hasValidTokens,
            isExpired: tokens?.access ? api.tokenUtils.isTokenExpired(tokens.access) : true,
            expiryTime: tokens?.access ? api.tokenUtils.getTokenExpiryTime(tokens.access) : 0,
            isInitialized: initialized.value
        }
    }

    // Require dashboard authentication
    const requireDashboardAuth = async () => {
        if (!initialized.value) {
            await initializeDashboardAuth()
        }

        if (!isAuthenticated.value) {
            await navigateTo('/dashboard/login')
            throw new Error('Dashboard authentication required')
        }

        // Check if token needs refresh
        const tokens = getDashboardTokens()
        if (tokens?.access && api.tokenUtils.isTokenExpired(tokens.access)) {
            const refreshed = await refreshDashboardTokens()
            if (!refreshed) {
                await navigateTo('/dashboard/login')
                throw new Error('Dashboard authentication expired')
            }
        }
    }

    // Require specific dashboard permission
    const requirePermission = async (permission: keyof DashboardPermissions) => {
        await requireDashboardAuth()

        if (!hasPermission(permission)) {
            throw createError({
                statusCode: 403,
                statusMessage: `Dashboard permission required: ${permission}`
            })
        }
    }

    return {
        // State
        user: readonly(user),
        permissions: readonly(permissions),
        isAuthenticated: readonly(isAuthenticated),
        loading: readonly(loading),
        error: readonly(error),
        initialized: readonly(initialized),

        // Computed
        isAdmin: readonly(isAdmin),
        isSuperuser: readonly(isSuperuser),

        // Actions
        login,
        logout,
        fetchDashboardProfile,
        refreshDashboardTokens,
        initializeDashboardAuth,

        // Permission checking
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,

        // Utilities
        dashboardApiCall,
        checkDashboardAuthStatus,
        requireDashboardAuth,
        requirePermission,
        clearDashboardAuthState,

        // Token management
        getDashboardTokens,
        setDashboardTokens
    }
}