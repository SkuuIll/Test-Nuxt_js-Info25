import type { User, LoginCredentials, AuthTokens } from '~/types'
import { handleAuthError, handleValidationError, handleNetworkError } from '~/utils/errorHandling'

interface DashboardUser extends User {
    permissions: DashboardPermissions
    dashboard_profile?: DashboardProfile
}

interface DashboardPermissions {
    can_manage_posts: boolean
    can_manage_users: boolean
    can_manage_comments: boolean
    can_view_stats: boolean
    can_moderate_content: boolean
    can_access_analytics: boolean
    can_manage_categories: boolean
    can_manage_media: boolean
    can_export_data: boolean
    can_manage_settings: boolean
}

interface DashboardProfile {
    role: string
    department?: string
    last_login: string
    login_count: number
    preferences: Record<string, any>
}

interface DashboardAuthState {
    user: DashboardUser | null
    isAuthenticated: boolean
    loading: boolean
    error: string | null
    permissions: DashboardPermissions | null
    sessionInfo: DashboardSessionInfo
}

interface DashboardSessionInfo {
    loginTime: number
    lastActivity: number
    sessionTimeout: number
    warningShown: boolean
    autoRefreshEnabled: boolean
    refreshAttempts: number
    maxRefreshAttempts: number
}

interface DashboardAuthError {
    type: 'auth' | 'permission' | 'session' | 'network'
    message: string
    code?: string | number
    timestamp: Date
    details?: any
}

export const useDashboardAuth = () => {
    // Error handlers are now imported from utils to avoid circular dependencies
    const { authLoading } = useLoading()

    // Defer api and router initialization
    let api: ReturnType<typeof useApi>;
    let router: ReturnType<typeof useRouter>;

    const getApi = () => {
        if (!api) {
            api = useApi();
        }
        return api;
    };

    const getRouter = () => {
        if (!router) {
            router = useRouter();
        }
        return router;
    };

    // Enhanced State
    const user = ref<DashboardUser | null>(null)
    const permissions = ref<DashboardPermissions | null>(null)
    const isAuthenticated = ref(false)
    const error = ref<string | null>(null)
    const initialized = ref(false)
    const authErrors = ref<DashboardAuthError[]>([])

    // Enhanced session management
    const sessionInfo = ref<DashboardSessionInfo>({
        loginTime: 0,
        lastActivity: Date.now(),
        sessionTimeout: 2 * 60 * 60 * 1000, // 2 hours for dashboard (extended)
        warningShown: false,
        autoRefreshEnabled: true,
        refreshAttempts: 0,
        maxRefreshAttempts: 5 // Increased retry attempts
    })

    // Computed
    const loading = computed(() => authLoading.loading.value)
    const isAdmin = computed(() => user.value?.is_staff || false)
    const isSuperuser = computed(() => user.value?.is_superuser || false)
    const isSessionActive = computed(() => {
        const timeSinceActivity = Date.now() - sessionInfo.value.lastActivity
        return timeSinceActivity < sessionInfo.value.sessionTimeout
    })
    const timeUntilSessionExpiry = computed(() => {
        const timeSinceActivity = Date.now() - sessionInfo.value.lastActivity
        return Math.max(0, sessionInfo.value.sessionTimeout - timeSinceActivity)
    })

    // Dashboard-specific token key
    const DASHBOARD_TOKEN_KEY = 'dashboard_auth_tokens'
    const DASHBOARD_SESSION_KEY = 'dashboard_session_info'

    // Enhanced error handling
    const addDashboardError = (error: Partial<DashboardAuthError>) => {
        const dashboardError: DashboardAuthError = {
            type: 'auth',
            message: 'Dashboard authentication error',
            timestamp: new Date(),
            ...error
        }

        authErrors.value.unshift(dashboardError)

        // Keep only last 10 errors
        if (authErrors.value.length > 10) {
            authErrors.value = authErrors.value.slice(0, 10)
        }

        return dashboardError
    }

    const clearDashboardErrors = () => {
        authErrors.value = []
    }

    const getLastDashboardError = (): DashboardAuthError | null => {
        return authErrors.value[0] || null
    }

    // Activity tracking for dashboard session
    const updateDashboardActivity = () => {
        sessionInfo.value.lastActivity = Date.now()
        sessionInfo.value.warningShown = false

        // Save session info to localStorage
        if (import.meta.client) {
            try {
                localStorage.setItem(DASHBOARD_SESSION_KEY, JSON.stringify(sessionInfo.value))
            } catch (error) {
                console.warn('Failed to save dashboard session info:', error)
            }
        }
    }

    // Load session info from localStorage
    const loadSessionInfo = () => {
        if (!import.meta.client) return

        try {
            const stored = localStorage.getItem(DASHBOARD_SESSION_KEY)
            if (stored) {
                const savedSession = JSON.parse(stored)
                sessionInfo.value = { ...sessionInfo.value, ...savedSession }
            }
        } catch (error) {
            console.warn('Failed to load dashboard session info:', error)
        }
    }

    // Enhanced function to clear dashboard auth state
    const clearDashboardAuthState = async () => {
        console.log('🧹 Clearing dashboard authentication state')

        // Clear tokens and session from localStorage
        if (import.meta.client) {
            localStorage.removeItem(DASHBOARD_TOKEN_KEY)
            localStorage.removeItem(DASHBOARD_SESSION_KEY)
        }

        // Reset state
        user.value = null
        permissions.value = null
        isAuthenticated.value = false
        error.value = null
        clearDashboardErrors()

        // Reset session info
        sessionInfo.value = {
            loginTime: 0,
            lastActivity: Date.now(),
            sessionTimeout: 60 * 60 * 1000,
            warningShown: false,
            autoRefreshEnabled: true,
            refreshAttempts: 0,
            maxRefreshAttempts: 3
        }

        console.log('✅ Dashboard authentication state cleared')
    }

    // Enhanced get dashboard tokens with validation
    const getDashboardTokens = (): AuthTokens | null => {
        if (!import.meta.client) return null

        try {
            const stored = localStorage.getItem(DASHBOARD_TOKEN_KEY)
            if (stored) {
                const tokens = JSON.parse(stored)

                // Validate token structure
                if (tokens.access && tokens.refresh) {
                    return tokens
                } else {
                    console.warn('Invalid dashboard token structure, clearing...')
                    localStorage.removeItem(DASHBOARD_TOKEN_KEY)
                }
            }
        } catch (error) {
            console.error('Error parsing dashboard tokens:', error)
            localStorage.removeItem(DASHBOARD_TOKEN_KEY)
        }

        return null
    }

    // Enhanced set dashboard tokens with session tracking
    const setDashboardTokens = (tokens: AuthTokens) => {
        if (!import.meta.client) return

        try {
            const tokenData = {
                ...tokens,
                stored_at: Date.now(),
                expires_at: getApi().tokenUtils.getTokenExpiryTime(tokens.access)
            }
            localStorage.setItem(DASHBOARD_TOKEN_KEY, JSON.stringify(tokenData))

            // Update session info
            sessionInfo.value.loginTime = Date.now()
            sessionInfo.value.refreshAttempts = 0
            updateDashboardActivity()

            console.log('💾 Dashboard tokens stored successfully')
        } catch (error) {
            console.error('Error storing dashboard tokens:', error)
            addDashboardError({
                type: 'auth',
                message: 'Failed to store dashboard tokens',
                details: error
            })
        }
    }

    // Get detailed token information
    const getDashboardTokenInfo = () => {
        const tokens = getDashboardTokens()
        if (!tokens) return null

        return {
            hasTokens: true,
            accessToken: tokens.access,
            refreshToken: tokens.refresh,
            isAccessExpired: getApi().tokenUtils.isTokenExpired(tokens.access),
            isRefreshExpired: tokens.refresh ? getApi().tokenUtils.isTokenExpired(tokens.refresh) : true,
            accessExpiryTime: getApi().tokenUtils.getTokenExpiryTime(tokens.access),
            refreshExpiryTime: tokens.refresh ? getApi().tokenUtils.getTokenExpiryTime(tokens.refresh) : 0,
            timeUntilExpiry: getApi().tokenUtils.getTokenExpiryTime(tokens.access) - Date.now(),
            storedAt: tokens.stored_at || 0
        }
    }

    // Enhanced dashboard login with comprehensive error handling
    const login = async (credentials: LoginCredentials) => {
        return await authLoading.withLoading(async () => {
            try {
                error.value = null
                clearDashboardErrors()
                updateDashboardActivity()

                console.log('🔐 Starting enhanced dashboard login for:', credentials.email || credentials.username)

                // Validate credentials before sending
                if ((!credentials.email?.trim() && !credentials.username?.trim()) || !credentials.password?.trim()) {
                    throw new Error('Email/username and password are required')
                }

                // Use dashboard-specific login endpoint
                const response = await getApi().apiRequest<AuthTokens>('/dashboard/auth/login/', {
                    method: 'POST',
                    body: JSON.stringify(credentials)
                })

                console.log('✅ Dashboard login successful, tokens received')

                // Validate response structure
                if (!response.data?.access || !response.data?.refresh) {
                    throw new Error('Invalid token response from server')
                }

                // Store dashboard tokens and update session
                setDashboardTokens({
                    access: response.data.access,
                    refresh: response.data.refresh
                })

                // Use user data from login response instead of making additional request
                const userData = response.data.user

                console.log('👤 Dashboard user data from login:', {
                    username: userData.username,
                    isStaff: userData.is_staff,
                    isSuperuser: userData.is_superuser,
                    permissions: userData.permissions
                })

                // Validate user permissions for dashboard access
                if (!userData.is_superuser && !userData.is_staff) {
                    await clearDashboardAuthState()
                    throw new Error('Insufficient permissions for dashboard access')
                }

                // Create dashboard user object with permissions
                const dashboardUser: DashboardUser = {
                    ...userData,
                    permissions: userData.permissions || {
                        can_manage_posts: userData.is_superuser,
                        can_manage_users: userData.is_superuser,
                        can_manage_comments: userData.is_superuser,
                        can_view_stats: userData.is_superuser || userData.is_staff,
                        can_moderate_content: userData.is_superuser,
                        can_access_analytics: userData.is_superuser,
                        can_manage_categories: userData.is_superuser,
                        can_manage_media: userData.is_superuser,
                        can_export_data: userData.is_superuser,
                        can_manage_settings: userData.is_superuser
                    }
                }

                // Set authentication state
                user.value = dashboardUser
                permissions.value = dashboardUser.permissions
                isAuthenticated.value = true

                // Setup session monitoring
                setupDashboardSessionMonitoring()

                // Log successful login for audit
                console.log('🎉 Enhanced dashboard authentication completed successfully', {
                    userId: profile!.id,
                    username: profile!.username,
                    loginTime: new Date().toISOString(),
                    permissions: Object.keys(profile!.permissions).filter(key => profile!.permissions[key as keyof DashboardPermissions])
                })

                return { tokens: response, user: profile! }
            } catch (err: any) {
                console.error('❌ Enhanced dashboard login error:', err)

                // Categorize and handle different types of errors
                let errorType: DashboardAuthError['type'] = 'auth'
                let errorMessage = 'Dashboard login failed'

                if (err?.status === 401 || err?.statusCode === 401) {
                    errorType = 'auth'
                    errorMessage = 'Invalid dashboard credentials. Please check your username and password.'
                } else if (err?.status === 403 || err?.statusCode === 403) {
                    errorType = 'permission'
                    errorMessage = 'Insufficient permissions for dashboard access. Contact your administrator.'
                } else if (err?.status === 429 || err?.statusCode === 429) {
                    errorType = 'auth'
                    errorMessage = 'Too many login attempts. Please wait before trying again.'
                } else if (err?.status >= 500 || err?.statusCode >= 500) {
                    errorType = 'network'
                    errorMessage = 'Dashboard server error. Please try again later.'
                } else if (!err?.status && !err?.statusCode) {
                    errorType = 'network'
                    errorMessage = 'Network error. Please check your connection and try again.'
                } else if (err.message?.includes('permissions')) {
                    errorType = 'permission'
                    errorMessage = err.message
                } else if (err.message?.includes('required')) {
                    errorType = 'auth'
                    errorMessage = err.message
                }

                addDashboardError({
                    type: errorType,
                    message: errorMessage,
                    code: err?.status || err?.statusCode,
                    details: err
                })

                // Handle auth error with enhanced error handler
                const errorInfo = handleAuthError(err, 'Dashboard Login Failed')
                error.value = errorInfo.message

                // Clear any existing auth state
                await clearDashboardAuthState()

                throw err
            }
        })
    }

    // Enhanced dashboard logout with comprehensive cleanup
    const logout = async (options: {
        redirectTo?: string
        reason?: 'user' | 'session_expired' | 'token_invalid' | 'permission_denied' | 'security'
        showMessage?: boolean
    } = {}) => {
        const { redirectTo = '/dashboard/login', reason = 'user', showMessage = true } = options

        return await authLoading.withLoading(async () => {
            try {
                console.log(`👋 Starting enhanced dashboard logout (reason: ${reason})...`)

                // Clear dashboard errors
                clearDashboardErrors()

                // Cleanup session monitoring
                cleanupDashboardSessionMonitoring()

                const tokens = getDashboardTokens()

                // Try to logout from backend
                if (tokens?.refresh) {
                    try {
                        await getApi().apiRequest('/dashboard/auth/logout/', {
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

                // Show appropriate message
                if (showMessage) {
                    const { success, warning, info } = useToast()

                    switch (reason) {
                        case 'session_expired':
                            warning('Dashboard Session Expired', 'Your dashboard session has expired. Please log in again.')
                            break
                        case 'token_invalid':
                            warning('Dashboard Authentication Error', 'Your dashboard session is no longer valid. Please log in again.')
                            break
                        case 'permission_denied':
                            warning('Access Denied', 'Your dashboard permissions have been revoked.')
                            break
                        case 'security':
                            info('Security Logout', 'You have been logged out of the dashboard for security reasons.')
                            break
                        case 'user':
                        default:
                            success('Dashboard Logout', 'You have been successfully logged out of the dashboard.')
                            break
                    }
                }

                console.log('👋 Enhanced dashboard logout completed successfully')

                // Redirect to specified route
                if (redirectTo && redirectTo !== getRouter().currentRoute.value.path) {
                    await navigateTo(redirectTo)
                }

            } catch (err: any) {
                console.error('❌ Enhanced dashboard logout error:', err)

                // Even if logout fails, ensure local state is cleared
                try {
                    await clearDashboardAuthState()
                    cleanupDashboardSessionMonitoring()
                } catch (clearError) {
                    console.error('❌ Failed to clear dashboard auth state:', clearError)
                }

                addDashboardError({
                    type: 'auth',
                    message: 'Dashboard logout error occurred',
                    details: err
                })

                // Still redirect on error
                if (redirectTo && redirectTo !== getRouter().currentRoute.value.path) {
                    await navigateTo(redirectTo)
                }

                throw err
            }
        })
    }

    // Force dashboard logout (for security or admin actions)
    const forceDashboardLogout = async (reason: string = 'Security logout') => {
        console.log(`🚨 Force dashboard logout initiated: ${reason}`)

        await logout({
            redirectTo: '/dashboard/login',
            reason: 'security',
            showMessage: true
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

            const profile = await getApi().apiRequest<DashboardUser>('/dashboard/auth/profile/', {
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

    // Enhanced dashboard token refresh with retry logic
    const refreshDashboardTokens = async (options: {
        force?: boolean
        retryOnFailure?: boolean
    } = {}): Promise<boolean> => {
        const { force = false, retryOnFailure = true } = options

        const tokens = getDashboardTokens()
        if (!tokens?.refresh) {
            console.log('🚫 No dashboard refresh token available')
            return false
        }

        // Check if refresh token is expired
        if (getApi().tokenUtils.isTokenExpired(tokens.refresh)) {
            console.log('🚫 Dashboard refresh token is expired')
            addDashboardError({
                type: 'session',
                message: 'Refresh token expired',
                code: 'REFRESH_TOKEN_EXPIRED'
            })
            await clearDashboardAuthState()
            return false
        }

        // Check if we've exceeded max refresh attempts (unless forced)
        if (!force && sessionInfo.value.refreshAttempts >= sessionInfo.value.maxRefreshAttempts) {
            console.log('🚫 Max dashboard token refresh attempts exceeded')
            addDashboardError({
                type: 'session',
                message: 'Maximum token refresh attempts exceeded',
                code: 'MAX_REFRESH_ATTEMPTS'
            })
            await clearDashboardAuthState()
            return false
        }

        try {
            console.log(`🔄 Refreshing dashboard tokens (attempt ${sessionInfo.value.refreshAttempts + 1}/${sessionInfo.value.maxRefreshAttempts})...`)

            sessionInfo.value.refreshAttempts++

            const newTokens = await getApi().apiRequest<AuthTokens>('/dashboard/auth/refresh/', {
                method: 'POST',
                body: { refresh: tokens.refresh },
                timeout: 10000 // 10 second timeout for refresh
            })

            // Validate new tokens
            if (!newTokens.access || !newTokens.refresh) {
                throw new Error('Invalid token response from refresh endpoint')
            }

            setDashboardTokens(newTokens)
            sessionInfo.value.refreshAttempts = 0 // Reset on success
            updateDashboardActivity()

            console.log('✅ Dashboard tokens refreshed successfully', {
                newAccessExpiry: getApi().tokenUtils.getTokenExpiryTime(newTokens.access),
                newRefreshExpiry: getApi().tokenUtils.getTokenExpiryTime(newTokens.refresh)
            })

            return true
        } catch (error: any) {
            console.error('❌ Dashboard token refresh failed:', error)

            const errorCode = error?.status || error?.statusCode
            let shouldClearState = false
            let errorMessage = 'Dashboard token refresh failed'

            // Categorize refresh errors
            if (errorCode === 401 || errorCode === 403) {
                shouldClearState = true
                errorMessage = 'Refresh token is invalid or expired'
            } else if (errorCode === 429) {
                errorMessage = 'Too many refresh attempts. Please wait before trying again.'
            } else if (errorCode >= 500) {
                errorMessage = 'Server error during token refresh'
            } else if (!errorCode) {
                errorMessage = 'Network error during token refresh'
            }

            addDashboardError({
                type: 'session',
                message: errorMessage,
                code: errorCode,
                details: error
            })

            // Clear state for authentication errors
            if (shouldClearState) {
                console.log('🚫 Dashboard refresh token invalid, clearing state')
                await clearDashboardAuthState()
                return false
            }

            // For network errors, we might retry later if enabled
            if (retryOnFailure && sessionInfo.value.refreshAttempts < sessionInfo.value.maxRefreshAttempts) {
                console.log('🔄 Will retry token refresh later due to network error')
                return false
            }

            // If we've exhausted retries, clear state
            if (sessionInfo.value.refreshAttempts >= sessionInfo.value.maxRefreshAttempts) {
                console.log('🚫 Max refresh attempts reached, clearing state')
                await clearDashboardAuthState()
            }

            return false
        }
    }

    // Dashboard session monitoring setup
    let sessionMonitoringInterval: NodeJS.Timeout | null = null
    let activityListeners: (() => void)[] = []

    const setupDashboardSessionMonitoring = () => {
        if (!import.meta.client || !sessionInfo.value.autoRefreshEnabled) return

        console.log('🔄 Setting up dashboard session monitoring...')

        // Set up activity listeners
        const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']

        const handleActivity = () => {
            updateDashboardActivity()
        }

        // Add event listeners
        activityEvents.forEach(event => {
            const listener = () => handleActivity()
            document.addEventListener(event, listener, { passive: true })
            activityListeners.push(() => document.removeEventListener(event, listener))
        })

        // Set up periodic session check
        sessionMonitoringInterval = setInterval(async () => {
            if (!isAuthenticated.value) {
                cleanupDashboardSessionMonitoring()
                return
            }

            const timeSinceActivity = Date.now() - sessionInfo.value.lastActivity
            const warningTime = sessionInfo.value.sessionTimeout - (10 * 60 * 1000) // 10 minutes before expiry

            // Show warning if session will expire soon
            if (timeSinceActivity > warningTime && !sessionInfo.value.warningShown) {
                sessionInfo.value.warningShown = true

                const { warning } = useToast()
                warning(
                    'Dashboard Session Expiring',
                    'Your dashboard session will expire in 10 minutes due to inactivity. Please interact with the page to extend your session.'
                )
            }

            // Auto-logout if session expired
            if (timeSinceActivity > sessionInfo.value.sessionTimeout) {
                cleanupDashboardSessionMonitoring()
                await logout({
                    reason: 'session_expired',
                    redirectTo: '/dashboard/login'
                })
                return
            }

            // Check if token needs refresh (5 minutes before expiry)
            const tokenInfo = getDashboardTokenInfo()
            if (tokenInfo && tokenInfo.timeUntilExpiry < 5 * 60 * 1000 && tokenInfo.timeUntilExpiry > 0) {
                console.log('🔄 Dashboard token expiring soon, attempting refresh...')
                const refreshed = await refreshDashboardTokens()
                if (!refreshed) {
                    console.log('❌ Dashboard token refresh failed, logging out...')
                    cleanupDashboardSessionMonitoring()
                    await logout({
                        reason: 'token_invalid',
                        redirectTo: '/dashboard/login'
                    })
                }
            }
        }, 60000) // Check every minute

        console.log('✅ Dashboard session monitoring setup complete')
    }

    const cleanupDashboardSessionMonitoring = () => {
        console.log('🧹 Cleaning up dashboard session monitoring...')

        // Clear interval
        if (sessionMonitoringInterval) {
            clearInterval(sessionMonitoringInterval)
            sessionMonitoringInterval = null
        }

        // Remove event listeners
        activityListeners.forEach(cleanup => cleanup())
        activityListeners = []

        console.log('✅ Dashboard session monitoring cleanup complete')
    }

    // Extend dashboard session
    const extendDashboardSession = () => {
        updateDashboardActivity()
        sessionInfo.value.warningShown = false
        console.log('🔄 Dashboard session extended')
    }

    // Get dashboard session information
    const getDashboardSessionInfo = () => {
        const timeSinceActivity = Date.now() - sessionInfo.value.lastActivity
        return {
            isActive: timeSinceActivity < sessionInfo.value.sessionTimeout,
            timeSinceLastActivity: timeSinceActivity,
            timeUntilExpiry: Math.max(0, sessionInfo.value.sessionTimeout - timeSinceActivity),
            loginTime: sessionInfo.value.loginTime,
            warningShown: sessionInfo.value.warningShown,
            refreshAttempts: sessionInfo.value.refreshAttempts,
            autoRefreshEnabled: sessionInfo.value.autoRefreshEnabled
        }
    }

    // Enhanced dashboard authentication initialization
    const initializeDashboardAuth = async (options: {
        enableSessionMonitoring?: boolean
        sessionTimeout?: number
        skipProfileFetch?: boolean
        retryOnError?: boolean
    } = {}) => {
        if (!import.meta.client || initialized.value) return

        const {
            enableSessionMonitoring = true,
            sessionTimeout = 2 * 60 * 60 * 1000, // 2 hours
            skipProfileFetch = false,
            retryOnError = true
        } = options

        try {
            console.log('🔄 Initializing enhanced dashboard authentication...')

            // Clear any existing errors
            clearDashboardErrors()

            // Load session info from localStorage
            loadSessionInfo()

            // Configure session timeout
            sessionInfo.value.sessionTimeout = sessionTimeout
            sessionInfo.value.autoRefreshEnabled = enableSessionMonitoring

            const tokens = getDashboardTokens()
            if (!tokens?.access) {
                console.log('ℹ️ No dashboard tokens found, user not authenticated')
                await clearDashboardAuthState()
                initialized.value = true
                return
            }

            console.log('🔍 Found existing dashboard tokens, validating...', {
                accessExpired: getApi().tokenUtils.isTokenExpired(tokens.access),
                refreshExpired: tokens.refresh ? getApi().tokenUtils.isTokenExpired(tokens.refresh) : true,
                accessExpiry: getApi().tokenUtils.getTokenExpiryTime(tokens.access),
                refreshExpiry: tokens.refresh ? getApi().tokenUtils.getTokenExpiryTime(tokens.refresh) : 0
            })

            // Check if access token is expired
            if (getApi().tokenUtils.isTokenExpired(tokens.access)) {
                console.log('⏰ Dashboard access token expired, attempting refresh...')

                if (tokens.refresh && !getApi().tokenUtils.isTokenExpired(tokens.refresh)) {
                    const refreshed = await refreshDashboardTokens({ force: true })
                    if (!refreshed) {
                        console.log('❌ Token refresh failed during initialization')
                        await clearDashboardAuthState()
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

            // Skip profile fetch if requested (for performance)
            if (skipProfileFetch) {
                console.log('⏭️ Skipping profile fetch as requested')
                isAuthenticated.value = true
                initialized.value = true

                if (enableSessionMonitoring) {
                    setupDashboardSessionMonitoring()
                }
                return
            }

            // Try to fetch profile to validate token and get user data
            let profileAttempts = 0
            const maxProfileAttempts = retryOnError ? 3 : 1

            while (profileAttempts < maxProfileAttempts) {
                try {
                    console.log(`📡 Fetching dashboard profile (attempt ${profileAttempts + 1}/${maxProfileAttempts})...`)

                    const profile = await fetchDashboardProfile()

                    // Validate profile data
                    if (!profile.id || !profile.username) {
                        throw new Error('Invalid profile data received')
                    }

                    user.value = profile
                    permissions.value = profile.permissions
                    isAuthenticated.value = true

                    // Setup session monitoring if authenticated
                    if (enableSessionMonitoring) {
                        setupDashboardSessionMonitoring()
                    }

                    console.log('✅ Enhanced dashboard authentication initialized successfully', {
                        userId: profile.id,
                        username: profile.username,
                        isStaff: profile.is_staff,
                        permissionCount: Object.keys(profile.permissions || {}).length
                    })

                    break // Success, exit retry loop
                } catch (profileError: any) {
                    profileAttempts++
                    console.warn(`⚠️ Dashboard profile fetch attempt ${profileAttempts} failed:`, profileError)

                    // If it's an authentication error, clear state immediately
                    if (profileError.statusCode === 401 || profileError.status === 401) {
                        console.log('🔒 Dashboard authentication failed, clearing state')
                        await clearDashboardAuthState()

                        addDashboardError({
                            type: 'auth',
                            message: 'Dashboard session expired during initialization',
                            code: profileError.statusCode || profileError.status
                        })

                        initialized.value = true
                        return
                    }

                    // For other errors, retry if attempts remain
                    if (profileAttempts < maxProfileAttempts) {
                        console.log(`🔄 Retrying profile fetch in ${profileAttempts * 1000}ms...`)
                        await new Promise(resolve => setTimeout(resolve, profileAttempts * 1000))
                        continue
                    }

                    // If all attempts failed and it's not an auth error
                    console.warn('⚠️ All profile fetch attempts failed, but maintaining auth state')

                    // For network errors, maintain authenticated state but log error
                    isAuthenticated.value = true

                    addDashboardError({
                        type: 'network',
                        message: 'Profile fetch failed during initialization',
                        details: profileError
                    })

                    // Still setup session monitoring
                    if (enableSessionMonitoring) {
                        setupDashboardSessionMonitoring()
                    }
                }
            }
        } catch (err: any) {
            console.error('❌ Enhanced dashboard authentication initialization error:', err)

            addDashboardError({
                type: 'auth',
                message: 'Dashboard authentication initialization failed',
                details: err
            })

            await clearDashboardAuthState()
        } finally {
            initialized.value = true
            console.log('🏁 Dashboard authentication initialization completed', {
                isAuthenticated: isAuthenticated.value,
                hasUser: !!user.value,
                hasPermissions: !!permissions.value,
                errorCount: authErrors.value.length
            })
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
            return await getApi().apiRequest<T>(endpoint, {
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
                        return await getApi().apiRequest<T>(endpoint, {
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
        const hasValidTokens = tokens?.access && !getApi().tokenUtils.isTokenExpired(tokens.access)

        return {
            hasTokens: !!tokens,
            hasValidTokens,
            isExpired: tokens?.access ? getApi().tokenUtils.isTokenExpired(tokens.access) : true,
            expiryTime: tokens?.access ? getApi().tokenUtils.getTokenExpiryTime(tokens.access) : 0,
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
        if (tokens?.access && getApi().tokenUtils.isTokenExpired(tokens.access)) {
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

    // Enhanced dashboard health check
    const checkDashboardHealth = async (): Promise<{
        isHealthy: boolean
        tokenStatus: 'valid' | 'expired' | 'missing' | 'invalid'
        profileStatus: 'valid' | 'invalid' | 'unreachable'
        sessionStatus: 'active' | 'expired' | 'warning'
        errors: DashboardAuthError[]
    }> => {
        const result = {
            isHealthy: false,
            tokenStatus: 'missing' as const,
            profileStatus: 'invalid' as const,
            sessionStatus: 'expired' as const,
            errors: [...authErrors.value]
        }

        try {
            // Check token status
            const tokens = getDashboardTokens()
            if (!tokens?.access) {
                result.tokenStatus = 'missing'
            } else if (getApi().tokenUtils.isTokenExpired(tokens.access)) {
                result.tokenStatus = 'expired'
            } else {
                result.tokenStatus = 'valid'
            }

            // Check session status
            const sessionStatus = getDashboardSessionInfo()
            if (!sessionStatus.isActive) {
                result.sessionStatus = 'expired'
            } else if (sessionStatus.timeUntilExpiry < 10 * 60 * 1000) { // Less than 10 minutes
                result.sessionStatus = 'warning'
            } else {
                result.sessionStatus = 'active'
            }

            // Check profile status if we have valid tokens
            if (result.tokenStatus === 'valid') {
                try {
                    await fetchDashboardProfile()
                    result.profileStatus = 'valid'
                } catch (error) {
                    result.profileStatus = 'unreachable'
                }
            }

            // Overall health
            result.isHealthy = result.tokenStatus === 'valid' &&
                result.profileStatus === 'valid' &&
                result.sessionStatus !== 'expired'

        } catch (error) {
            console.error('Dashboard health check failed:', error)
        }

        return result
    }

    // Refresh dashboard session
    const refreshDashboardSession = async (): Promise<boolean> => {
        try {
            console.log('🔄 Refreshing dashboard session...')

            // Refresh tokens if needed
            const tokenInfo = getDashboardTokenInfo()
            if (tokenInfo && tokenInfo.timeUntilExpiry < 15 * 60 * 1000) { // Less than 15 minutes
                const refreshed = await refreshDashboardTokens()
                if (!refreshed) {
                    return false
                }
            }

            // Update activity and extend session
            updateDashboardActivity()

            // Optionally refresh profile data
            if (user.value) {
                try {
                    const profile = await fetchDashboardProfile()
                    user.value = profile
                    permissions.value = profile.permissions
                } catch (error) {
                    console.warn('Profile refresh failed during session refresh:', error)
                }
            }

            console.log('✅ Dashboard session refreshed successfully')
            return true
        } catch (error) {
            console.error('❌ Dashboard session refresh failed:', error)
            return false
        }
    }

    // Get comprehensive dashboard status
    const getDashboardStatus = () => {
        const tokenInfo = getDashboardTokenInfo()
        const sessionInfo = getDashboardSessionInfo()

        return {
            // Authentication status
            isAuthenticated: isAuthenticated.value,
            isInitialized: initialized.value,

            // User information
            user: user.value ? {
                id: user.value.id,
                username: user.value.username,
                email: user.value.email,
                isStaff: user.value.is_staff,
                isSuperuser: user.value.is_superuser
            } : null,

            // Permissions
            permissions: permissions.value,
            permissionCount: permissions.value ? Object.keys(permissions.value).filter(key =>
                permissions.value![key as keyof DashboardPermissions]
            ).length : 0,

            // Token information
            tokens: tokenInfo,

            // Session information
            session: sessionInfo,

            // Error information
            errors: authErrors.value,
            lastError: getLastDashboardError(),

            // Loading state
            loading: loading.value
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
        authErrors: readonly(authErrors),

        // Computed
        isAdmin: readonly(isAdmin),
        isSuperuser: readonly(isSuperuser),
        isSessionActive: readonly(isSessionActive),
        timeUntilSessionExpiry: readonly(timeUntilSessionExpiry),

        // Actions
        login,
        logout,
        fetchDashboardProfile,
        refreshDashboardTokens,
        initializeDashboardAuth,
        forceDashboardLogout,

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
        setDashboardTokens,
        getDashboardTokenInfo,

        // Session management
        updateDashboardActivity,
        extendDashboardSession,
        getDashboardSessionInfo,
        refreshDashboardSession,

        // Error management
        addDashboardError,
        clearDashboardErrors,
        getLastDashboardError,

        // Health and status
        checkDashboardHealth,
        getDashboardStatus
    }
}