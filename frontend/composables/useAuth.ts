import type { LoginCredentials, RegisterData, User, AuthTokens } from '~/types'

interface AuthState {
  isInitialized: boolean
  lastActivity: number
  sessionTimeout: number
  autoRefreshEnabled: boolean
  cleanup?: () => void
}

interface AuthError {
  type: 'auth' | 'validation' | 'network' | 'session'
  message: string
  code?: string | number
  details?: any
  timestamp: Date
}

export const useAuth = () => {
  const authStore = useAuthStore()
  const { handleAuthError, handleValidationError, handleNetworkError } = useErrorHandler()
  const api = useApi()
  const router = useRouter()

  // Enhanced authentication state management
  const authState = ref<AuthState>({
    isInitialized: false,
    lastActivity: Date.now(),
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    autoRefreshEnabled: true
  })

  const authErrors = ref<AuthError[]>([])
  const isSessionExpired = ref(false)
  const sessionWarningShown = ref(false)

  // Enhanced role checking with more granular permissions
  const hasRole = (role: string): boolean => {
    if (!authStore.user) return false

    switch (role) {
      case 'admin':
      case 'superuser':
        return authStore.user.is_staff || false
      case 'staff':
        return authStore.user.is_staff || false
      case 'user':
        return authStore.isAuthenticated
      case 'guest':
        return true
      default:
        return false
    }
  }

  // Enhanced permission checking with backend integration
  const hasPermission = (permission: string): boolean => {
    if (!authStore.user) return false

    // Check basic permissions
    const basicPermissions = {
      'can_view_posts': true,
      'can_create_posts': authStore.user.is_staff || false,
      'can_edit_posts': authStore.user.is_staff || false,
      'can_delete_posts': authStore.user.is_staff || false,
      'can_moderate_comments': authStore.user.is_staff || false,
      'can_manage_users': authStore.user.is_staff || false,
      'can_view_dashboard': authStore.user.is_staff || false,
      'can_view_analytics': authStore.user.is_staff || false
    }

    // Check if permission exists in basic permissions
    if (permission in basicPermissions) {
      return basicPermissions[permission as keyof typeof basicPermissions]
    }

    // For complex permissions, check user object for additional permission data
    // This would be extended based on your backend permission system
    if (authStore.user && typeof authStore.user === 'object' && 'permissions' in authStore.user) {
      const userPermissions = (authStore.user as any).permissions
      if (userPermissions && typeof userPermissions === 'object') {
        return userPermissions[permission] || false
      }
    }

    return false
  }

  // Enhanced permission checking with multiple permissions
  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission))
  }

  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission))
  }

  // Enhanced error handling utilities
  const addAuthError = (error: Partial<AuthError>) => {
    const authError: AuthError = {
      type: 'auth',
      message: 'Authentication error',
      timestamp: new Date(),
      ...error
    }

    authErrors.value.unshift(authError)

    // Keep only last 10 errors
    if (authErrors.value.length > 10) {
      authErrors.value = authErrors.value.slice(0, 10)
    }

    return authError
  }

  const clearAuthErrors = () => {
    authErrors.value = []
  }

  const getLastAuthError = (): AuthError | null => {
    return authErrors.value[0] || null
  }

  // Enhanced login with comprehensive error handling
  const loginWithErrorHandling = async (credentials: LoginCredentials) => {
    try {
      clearAuthErrors()
      updateActivity()

      console.log('🔐 Starting enhanced login process...')
      const result = await authStore.login(credentials)

      // Mark as initialized after successful login
      authState.value.isInitialized = true
      isSessionExpired.value = false
      sessionWarningShown.value = false

      console.log('✅ Enhanced login completed successfully')
      return result
    } catch (error: any) {
      console.error('❌ Enhanced login failed:', error)

      // Categorize and handle different types of errors
      let errorType: AuthError['type'] = 'auth'
      let errorMessage = 'Login failed'

      if (error?.status === 401 || error?.statusCode === 401) {
        errorType = 'auth'
        errorMessage = 'Invalid username or password'
      } else if (error?.status === 422 || error?.statusCode === 422) {
        errorType = 'validation'
        errorMessage = 'Please check your input and try again'
      } else if (error?.status >= 500 || error?.statusCode >= 500) {
        errorType = 'network'
        errorMessage = 'Server error. Please try again later'
      } else if (!error?.status && !error?.statusCode) {
        errorType = 'network'
        errorMessage = 'Network error. Please check your connection'
      }

      addAuthError({
        type: errorType,
        message: errorMessage,
        code: error?.status || error?.statusCode,
        details: error
      })

      throw error
    }
  }

  // Enhanced register with comprehensive error handling
  const registerWithErrorHandling = async (data: RegisterData) => {
    try {
      clearAuthErrors()
      updateActivity()

      console.log('📝 Starting enhanced registration process...')
      const result = await authStore.register(data)

      // Mark as initialized after successful registration
      authState.value.isInitialized = true
      isSessionExpired.value = false
      sessionWarningShown.value = false

      console.log('✅ Enhanced registration completed successfully')
      return result
    } catch (error: any) {
      console.error('❌ Enhanced registration failed:', error)

      // Handle registration-specific errors
      let errorType: AuthError['type'] = 'validation'
      let errorMessage = 'Registration failed'

      if (error?.data?.errors) {
        errorType = 'validation'
        const errors = error.data.errors
        const errorMessages = Object.values(errors).flat()
        errorMessage = errorMessages.join(', ')
      } else if (error?.status >= 500 || error?.statusCode >= 500) {
        errorType = 'network'
        errorMessage = 'Server error. Please try again later'
      } else if (!error?.status && !error?.statusCode) {
        errorType = 'network'
        errorMessage = 'Network error. Please check your connection'
      }

      addAuthError({
        type: errorType,
        message: errorMessage,
        code: error?.status || error?.statusCode,
        details: error
      })

      throw error
    }
  }

  // Activity tracking for session management
  const updateActivity = () => {
    authState.value.lastActivity = Date.now()
  }

  const getTimeSinceLastActivity = (): number => {
    return Date.now() - authState.value.lastActivity
  }

  const isSessionActive = (): boolean => {
    return getTimeSinceLastActivity() < authState.value.sessionTimeout
  }

  // Enhanced logout with comprehensive cleanup
  const safeLogout = async (options: {
    redirectTo?: string
    reason?: 'user' | 'session_expired' | 'token_invalid' | 'security'
    showMessage?: boolean
  } = {}) => {
    const { redirectTo = '/', reason = 'user', showMessage = true } = options

    try {
      console.log(`👋 Starting enhanced logout (reason: ${reason})...`)

      // Clear auth errors
      clearAuthErrors()

      // Mark session as expired if applicable
      if (reason === 'session_expired' || reason === 'token_invalid') {
        isSessionExpired.value = true
      }

      // Attempt backend logout
      try {
        await authStore.logout(redirectTo)
        console.log('✅ Backend logout successful')
      } catch (logoutError) {
        console.warn('⚠️ Backend logout error (continuing with local cleanup):', logoutError)

        // Still perform local cleanup
        await authStore.clearAuthState()
      }

      // Reset auth state
      authState.value.isInitialized = false
      sessionWarningShown.value = false

      // Show appropriate message
      if (showMessage) {
        const { success, warning, info } = useToast()

        switch (reason) {
          case 'session_expired':
            warning('Session Expired', 'Your session has expired. Please log in again.')
            break
          case 'token_invalid':
            warning('Authentication Error', 'Your session is no longer valid. Please log in again.')
            break
          case 'security':
            info('Security Logout', 'You have been logged out for security reasons.')
            break
          case 'user':
          default:
            success('Logged Out', 'You have been successfully logged out.')
            break
        }
      }

      console.log('✅ Enhanced logout completed successfully')

    } catch (error: any) {
      console.error('❌ Enhanced logout error:', error)

      // Even if logout fails, ensure local state is cleared
      try {
        await authStore.clearAuthState()
        authState.value.isInitialized = false
        sessionWarningShown.value = false
      } catch (clearError) {
        console.error('❌ Failed to clear auth state:', clearError)
      }

      addAuthError({
        type: 'auth',
        message: 'Logout error occurred',
        details: error
      })

      // Still redirect on error
      if (redirectTo && redirectTo !== window.location.pathname) {
        await navigateTo(redirectTo)
      }
    }
  }

  // Force logout (for security or admin actions)
  const forceLogout = async (reason: string = 'Security logout') => {
    console.log(`🚨 Force logout initiated: ${reason}`)

    await safeLogout({
      redirectTo: '/login',
      reason: 'security',
      showMessage: true
    })
  }

  // Enhanced token storage and retrieval with validation
  const getTokenInfo = () => {
    try {
      const tokens = api.tokenUtils.getTokens()
      if (!tokens) return null

      // Validate token structure
      if (!tokens.access) {
        console.warn('Invalid token structure: missing access token')
        return null
      }

      return {
        hasTokens: true,
        accessToken: tokens.access,
        refreshToken: tokens.refresh,
        isAccessExpired: api.tokenUtils.isTokenExpired(tokens.access),
        isRefreshExpired: tokens.refresh ? api.tokenUtils.isTokenExpired(tokens.refresh) : true,
        accessExpiryTime: api.tokenUtils.getTokenExpiryTime(tokens.access),
        refreshExpiryTime: tokens.refresh ? api.tokenUtils.getTokenExpiryTime(tokens.refresh) : 0,
        timeUntilExpiry: api.tokenUtils.getTokenExpiryTime(tokens.access) - Date.now(),
        isValid: !api.tokenUtils.isTokenExpired(tokens.access),
        needsRefresh: api.tokenUtils.getTokenExpiryTime(tokens.access) - Date.now() < 5 * 60 * 1000 // 5 minutes
      }
    } catch (error) {
      console.error('Error getting token info:', error)
      return null
    }
  }

  // Enhanced token validation
  const validateTokens = async (): Promise<boolean> => {
    try {
      const tokenInfo = getTokenInfo()
      if (!tokenInfo) {
        console.log('No tokens available for validation')
        return false
      }

      // If access token is expired, try to refresh
      if (tokenInfo.isAccessExpired) {
        if (!tokenInfo.isRefreshExpired) {
          console.log('Access token expired, attempting refresh...')
          const refreshed = await authStore.refreshAuthIfNeeded()
          return refreshed
        } else {
          console.log('Both tokens expired, validation failed')
          return false
        }
      }

      // Validate token with backend if needed
      if (authStore.isAuthenticated) {
        try {
          await authStore.fetchProfile()
          return true
        } catch (error: any) {
          if (error.status === 401 || error.statusCode === 401) {
            console.log('Token validation failed with backend')
            return false
          }
          // For other errors, assume token is still valid
          console.warn('Profile fetch failed but token might still be valid:', error)
          return true
        }
      }

      return true
    } catch (error) {
      console.error('Token validation error:', error)
      return false
    }
  }

  // Enhanced token refresh with retry logic
  const refreshTokenWithRetry = async (maxRetries: number = 3): Promise<boolean> => {
    let attempts = 0

    while (attempts < maxRetries) {
      try {
        console.log(`Token refresh attempt ${attempts + 1}/${maxRetries}`)

        const refreshed = await authStore.refreshAuthIfNeeded()
        if (refreshed) {
          console.log('Token refresh successful')
          updateActivity()
          return true
        }

        attempts++
        if (attempts < maxRetries) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000))
        }
      } catch (error) {
        console.error(`Token refresh attempt ${attempts + 1} failed:`, error)
        attempts++

        // If it's an authentication error, don't retry
        if (error?.status === 401 || error?.statusCode === 401) {
          break
        }

        if (attempts < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000))
        }
      }
    }

    console.log('All token refresh attempts failed')
    return false
  }

  const isTokenValid = (): boolean => {
    const tokenInfo = getTokenInfo()
    return tokenInfo ? !tokenInfo.isAccessExpired : false
  }

  const canRefreshToken = (): boolean => {
    const tokenInfo = getTokenInfo()
    return tokenInfo ? !tokenInfo.isRefreshExpired : false
  }

  // Enhanced authentication status checking with comprehensive health check
  const getAuthStatus = () => {
    const storeStatus = authStore.checkAuthStatus()
    const tokenInfo = getTokenInfo()
    const sessionActive = isSessionActive()
    const sessionInfo = getSessionInfo()

    return {
      // Store status
      ...storeStatus,

      // Token information
      tokenInfo,
      hasValidTokens: tokenInfo?.isValid || false,
      canRefresh: canRefreshToken(),
      needsRefresh: tokenInfo?.needsRefresh || false,

      // Session information
      sessionActive,
      sessionInfo,
      timeSinceLastActivity: getTimeSinceLastActivity(),

      // State information
      isInitialized: authState.value.isInitialized,
      autoRefreshEnabled: authState.value.autoRefreshEnabled,

      // Error information
      errors: authErrors.value,
      lastError: getLastAuthError(),

      // Health indicators
      isHealthy: storeStatus.isAuthenticated &&
        sessionActive &&
        (tokenInfo?.isValid || false) &&
        authState.value.isInitialized,

      // Warnings
      warnings: [
        ...(tokenInfo?.needsRefresh ? ['Token needs refresh'] : []),
        ...(sessionInfo.timeUntilExpiry < 10 * 60 * 1000 ? ['Session expiring soon'] : []),
        ...(!sessionActive ? ['Session inactive'] : []),
        ...(authErrors.value.length > 0 ? ['Authentication errors present'] : [])
      ]
    }
  }

  // Enhanced health check function
  const checkAuthHealth = async (): Promise<{
    isHealthy: boolean
    status: 'healthy' | 'warning' | 'critical'
    issues: string[]
    recommendations: string[]
  }> => {
    const issues: string[] = []
    const recommendations: string[] = []

    try {
      // Check basic authentication
      if (!authStore.isAuthenticated) {
        issues.push('User not authenticated')
        recommendations.push('Please log in')
        return {
          isHealthy: false,
          status: 'critical',
          issues,
          recommendations
        }
      }

      // Check token status
      const tokenInfo = getTokenInfo()
      if (!tokenInfo) {
        issues.push('No token information available')
        recommendations.push('Please log in again')
      } else {
        if (tokenInfo.isAccessExpired) {
          issues.push('Access token expired')
          if (tokenInfo.isRefreshExpired) {
            issues.push('Refresh token also expired')
            recommendations.push('Please log in again')
          } else {
            recommendations.push('Token will be refreshed automatically')
          }
        } else if (tokenInfo.needsRefresh) {
          issues.push('Token needs refresh soon')
          recommendations.push('Token will be refreshed proactively')
        }
      }

      // Check session status
      if (!isSessionActive()) {
        issues.push('Session expired due to inactivity')
        recommendations.push('Please log in again')
      } else {
        const sessionInfo = getSessionInfo()
        if (sessionInfo.timeUntilExpiry < 10 * 60 * 1000) {
          issues.push('Session expiring soon')
          recommendations.push('Please interact with the page to extend session')
        }
      }

      // Check for authentication errors
      if (authErrors.value.length > 0) {
        issues.push(`${authErrors.value.length} authentication errors`)
        recommendations.push('Check error details and consider re-authentication')
      }

      // Determine overall status
      const criticalIssues = issues.some(issue =>
        issue.includes('not authenticated') ||
        issue.includes('expired') ||
        issue.includes('Session expired')
      )

      const warningIssues = issues.some(issue =>
        issue.includes('needs refresh') ||
        issue.includes('expiring soon') ||
        issue.includes('errors')
      )

      let status: 'healthy' | 'warning' | 'critical' = 'healthy'
      if (criticalIssues) {
        status = 'critical'
      } else if (warningIssues) {
        status = 'warning'
      }

      return {
        isHealthy: status === 'healthy',
        status,
        issues,
        recommendations
      }
    } catch (error) {
      console.error('Auth health check failed:', error)
      return {
        isHealthy: false,
        status: 'critical',
        issues: ['Health check failed'],
        recommendations: ['Please refresh the page and try again']
      }
    }
  }

  // Enhanced authentication refresh with session management and retry logic
  const ensureAuthenticated = async (options: {
    forceRefresh?: boolean
    checkSession?: boolean
    maxRetries?: number
    validateWithBackend?: boolean
  } = {}) => {
    const {
      forceRefresh = false,
      checkSession = true,
      maxRetries = 3,
      validateWithBackend = false
    } = options

    updateActivity()

    // Check if user is authenticated
    if (!authStore.isAuthenticated) {
      addAuthError({
        type: 'auth',
        message: 'User not authenticated',
        code: 401
      })
      throw new Error('User not authenticated')
    }

    // Check session activity if enabled
    if (checkSession && !isSessionActive()) {
      console.log('🕐 Session inactive, logging out...')

      addAuthError({
        type: 'session',
        message: 'Session expired due to inactivity',
        code: 'SESSION_EXPIRED'
      })

      await safeLogout({
        reason: 'session_expired',
        redirectTo: '/login'
      })
      throw new Error('Session expired due to inactivity')
    }

    // Validate tokens
    const isValid = await validateTokens()
    if (!isValid) {
      console.log('🚫 Token validation failed, logging out...')

      addAuthError({
        type: 'auth',
        message: 'Token validation failed',
        code: 'TOKEN_INVALID'
      })

      await safeLogout({
        reason: 'token_invalid',
        redirectTo: '/login'
      })
      throw new Error('Token validation failed')
    }

    // Check token validity and refresh if needed
    const tokenInfo = getTokenInfo()
    if (!tokenInfo) {
      addAuthError({
        type: 'auth',
        message: 'No token information available',
        code: 'NO_TOKENS'
      })
      throw new Error('No token information available')
    }

    // Handle expired tokens
    if (tokenInfo.isAccessExpired) {
      if (!canRefreshToken()) {
        console.log('🚫 Cannot refresh token, logging out...')

        addAuthError({
          type: 'auth',
          message: 'Cannot refresh expired token',
          code: 'REFRESH_UNAVAILABLE'
        })

        await safeLogout({
          reason: 'token_invalid',
          redirectTo: '/login'
        })
        throw new Error('Token cannot be refreshed')
      }

      // Attempt to refresh token with retry logic
      try {
        console.log('🔄 Refreshing expired token...')
        const refreshed = await refreshTokenWithRetry(maxRetries)
        if (!refreshed) {
          throw new Error('Token refresh failed after retries')
        }
        console.log('✅ Token refreshed successfully')
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError)

        addAuthError({
          type: 'auth',
          message: 'Token refresh failed',
          code: 'REFRESH_FAILED',
          details: refreshError
        })

        await safeLogout({
          reason: 'token_invalid',
          redirectTo: '/login'
        })
        throw new Error('Authentication refresh failed')
      }
    }
    // Handle proactive refresh
    else if (forceRefresh || tokenInfo.needsRefresh) {
      try {
        console.log('🔄 Proactively refreshing token...')
        const refreshed = await refreshTokenWithRetry(Math.min(maxRetries, 2)) // Fewer retries for proactive refresh
        if (refreshed) {
          console.log('✅ Token proactively refreshed')
        } else {
          console.warn('⚠️ Proactive refresh failed, but token still valid')
        }
      } catch (refreshError) {
        console.warn('⚠️ Proactive refresh failed, but token still valid:', refreshError)
        // Don't throw error for proactive refresh failures
      }
    }

    // Optional backend validation
    if (validateWithBackend) {
      try {
        await authStore.fetchProfile()
        console.log('✅ Backend validation successful')
      } catch (validationError: any) {
        if (validationError.status === 401 || validationError.statusCode === 401) {
          console.log('❌ Backend validation failed - token invalid')

          addAuthError({
            type: 'auth',
            message: 'Backend token validation failed',
            code: 401,
            details: validationError
          })

          await safeLogout({
            reason: 'token_invalid',
            redirectTo: '/login'
          })
          throw new Error('Backend authentication validation failed')
        }
        // For other errors, log but don't fail
        console.warn('⚠️ Backend validation error (non-auth):', validationError)
      }
    }

    return true
  }

  // Enhanced guard functions with better error handling
  const requireAuth = async (options: {
    redirectTo?: string
    message?: string
    checkSession?: boolean
  } = {}) => {
    const { redirectTo = '/login', message = 'Authentication required', checkSession = true } = options
    const { handleAuthRequired } = useAuthRedirect()

    try {
      updateActivity()

      if (!authStore.isAuthenticated) {
        console.log('🔒 Authentication required, redirecting to login...')

        await handleAuthRequired({
          message,
          storeRoute: true,
          loginUrl: redirectTo
        })

        throw createError({
          statusCode: 401,
          statusMessage: message
        })
      }

      await ensureAuthenticated({ checkSession })
      console.log('✅ Authentication verified')

    } catch (error: any) {
      console.error('❌ Authentication guard failed:', error)

      if (error.statusCode !== 401) {
        // If it's not already a 401 error, handle auth required
        await handleAuthRequired({
          message,
          storeRoute: true,
          loginUrl: redirectTo
        })
      }

      throw error
    }
  }

  // Enhanced admin guard with role checking
  const requireAdmin = async (options: {
    redirectTo?: string
    message?: string
  } = {}) => {
    const { redirectTo = '/unauthorized', message = 'Admin access required' } = options
    const { handleInsufficientPermissions } = useAuthRedirect()

    // First ensure user is authenticated
    await requireAuth()

    if (!authStore.isAdmin && !hasRole('admin')) {
      console.log('🚫 Admin access denied')

      addAuthError({
        type: 'auth',
        message: 'Insufficient permissions',
        code: 403
      })

      await handleInsufficientPermissions({
        message,
        requiredPermissions: ['admin'],
        redirectUrl: redirectTo
      })

      throw createError({
        statusCode: 403,
        statusMessage: message
      })
    }

    console.log('✅ Admin access verified')
  }

  // Role-based guard function
  const requireRole = async (role: string, options: {
    redirectTo?: string
    message?: string
  } = {}) => {
    const { redirectTo = '/unauthorized', message = `${role} role required` } = options

    // First ensure user is authenticated
    await requireAuth()

    if (!hasRole(role)) {
      console.log(`🚫 Role '${role}' access denied`)

      addAuthError({
        type: 'auth',
        message: `Insufficient permissions: ${role} role required`,
        code: 403
      })

      await navigateTo(redirectTo)

      throw createError({
        statusCode: 403,
        statusMessage: message
      })
    }

    console.log(`✅ Role '${role}' access verified`)
  }

  // Permission-based guard function
  const requirePermission = async (permission: string, options: {
    redirectTo?: string
    message?: string
  } = {}) => {
    const { redirectTo = '/unauthorized', message = `Permission '${permission}' required` } = options
    const { handleInsufficientPermissions } = useAuthRedirect()

    // First ensure user is authenticated
    await requireAuth()

    if (!hasPermission(permission)) {
      console.log(`🚫 Permission '${permission}' denied`)

      addAuthError({
        type: 'auth',
        message: `Insufficient permissions: ${permission} required`,
        code: 403
      })

      await handleInsufficientPermissions({
        message,
        requiredPermissions: [permission],
        redirectUrl: redirectTo
      })

      throw createError({
        statusCode: 403,
        statusMessage: message
      })
    }

    console.log(`✅ Permission '${permission}' verified`)
  }

  // Enhanced initialization with session management
  const initializeAuth = async (options: {
    enableAutoRefresh?: boolean
    sessionTimeout?: number
  } = {}) => {
    const { enableAutoRefresh = true, sessionTimeout = 30 * 60 * 1000 } = options

    if (!import.meta.client) return

    try {
      console.log('🔄 Initializing enhanced authentication...')

      // Configure auth state
      authState.value.autoRefreshEnabled = enableAutoRefresh
      authState.value.sessionTimeout = sessionTimeout

      // Initialize store authentication
      await authStore.initializeAuth()

      // Mark as initialized
      authState.value.isInitialized = true
      updateActivity()

      // Set up session monitoring if authenticated
      if (authStore.isAuthenticated) {
        setupSessionMonitoring()
      }

      console.log('✅ Enhanced authentication initialized successfully')

    } catch (error) {
      console.error('❌ Enhanced authentication initialization failed:', error)
      authState.value.isInitialized = false

      addAuthError({
        type: 'auth',
        message: 'Authentication initialization failed',
        details: error
      })
    }
  }

  // Session monitoring setup
  const setupSessionMonitoring = () => {
    if (!import.meta.client || !authState.value.autoRefreshEnabled) return

    // Set up activity listeners
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']

    const handleActivity = () => {
      updateActivity()

      // Reset session expired state if user becomes active
      if (isSessionExpired.value) {
        isSessionExpired.value = false
        sessionWarningShown.value = false
      }
    }

    // Add event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    // Set up periodic session check
    const sessionCheckInterval = setInterval(() => {
      if (!authStore.isAuthenticated) {
        clearInterval(sessionCheckInterval)
        return
      }

      const timeSinceActivity = getTimeSinceLastActivity()
      const warningTime = authState.value.sessionTimeout - (5 * 60 * 1000) // 5 minutes before expiry

      // Show warning if session will expire soon
      if (timeSinceActivity > warningTime && !sessionWarningShown.value) {
        sessionWarningShown.value = true

        const { warning } = useToast()
        warning(
          'Session Expiring',
          'Your session will expire in 5 minutes due to inactivity. Please interact with the page to extend it.'
        )
      }

      // Auto logout if session expired
      if (timeSinceActivity > authState.value.sessionTimeout) {
        clearInterval(sessionCheckInterval)
        safeLogout({
          reason: 'session_expired',
          redirectTo: '/login'
        })
      }
    }, 60000) // Check every minute

    // Cleanup function
    const cleanup = () => {
      clearInterval(sessionCheckInterval)
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
    }

    // Store cleanup function for later use
    authState.value.cleanup = cleanup
  }

  // Session extension function
  const extendSession = () => {
    updateActivity()
    isSessionExpired.value = false
    sessionWarningShown.value = false

    const { success } = useToast()
    success('Session Extended', 'Your session has been extended.')
  }

  // Get session information
  const getSessionInfo = () => {
    const timeSinceActivity = getTimeSinceLastActivity()
    const timeUntilExpiry = authState.value.sessionTimeout - timeSinceActivity

    return {
      isActive: isSessionActive(),
      timeSinceLastActivity,
      timeUntilExpiry: Math.max(0, timeUntilExpiry),
      sessionTimeout: authState.value.sessionTimeout,
      lastActivity: new Date(authState.value.lastActivity),
      willExpireAt: new Date(authState.value.lastActivity + authState.value.sessionTimeout),
      isExpiringSoon: timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0,
      isExpired: timeUntilExpiry <= 0
    }
  }

  // Cleanup function
  const cleanup = () => {
    if (authState.value.cleanup) {
      authState.value.cleanup()
    }
    clearAuthErrors()
  }

  // Auto-initialize on client side
  if (import.meta.client) {
    onMounted(() => {
      initializeAuth()
    })

    onUnmounted(() => {
      cleanup()
    })
  }

  return {
    // Enhanced State
    isAuthenticated: computed(() => authStore.isAuthenticated),
    user: computed(() => authStore.user),
    isAdmin: computed(() => authStore.isAdmin),
    isLoading: computed(() => authStore.isLoading),
    error: computed(() => authStore.error),

    // Enhanced Auth State
    authState: readonly(authState),
    authErrors: readonly(authErrors),
    isSessionExpired: readonly(isSessionExpired),
    sessionWarningShown: readonly(sessionWarningShown),

    // Enhanced Authentication Methods
    login: loginWithErrorHandling,
    register: registerWithErrorHandling,
    logout: safeLogout,
    forceLogout,
    fetchProfile: authStore.fetchProfile,
    updateProfile: authStore.updateProfile,
    changePassword: authStore.changePassword,
    requestPasswordReset: authStore.requestPasswordReset,
    resetPassword: authStore.resetPassword,
    initializeAuth,

    // Enhanced Permission System
    hasRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,

    // Enhanced Guards
    requireAuth,
    requireAdmin,
    requireRole,
    requirePermission,

    // Enhanced Token Management
    getTokenInfo,
    isTokenValid,
    canRefreshToken,
    validateTokens,
    refreshTokenWithRetry,

    // Enhanced Session Management
    updateActivity,
    extendSession,
    getSessionInfo,
    isSessionActive,

    // Enhanced Status and Utilities
    getAuthStatus,
    checkAuthHealth,
    ensureAuthenticated,
    getLastAuthError,
    clearAuthErrors,
    addAuthError,

    // Store Utilities (Enhanced)
    clearAuthState: authStore.clearAuthState,
    refreshAuthIfNeeded: authStore.refreshAuthIfNeeded,

    // Cleanup
    cleanup
  }
}ue

const { warning } = useToast()
warning(
  'Session Expiring',
  'Your session will expire in 5 minutes due to inactivity. Please interact with the page to extend your session.'
)
      }

// Auto-logout if session expired
if (timeSinceActivity > authState.value.sessionTimeout) {
  clearInterval(sessionCheckInterval)
  safeLogout({
    reason: 'session_expired',
    redirectTo: '/login'
  })
}
    }, 60000) // Check every minute

// Cleanup function
const cleanup = () => {
  activityEvents.forEach(event => {
    document.removeEventListener(event, handleActivity)
  })
  clearInterval(sessionCheckInterval)
}

// Store cleanup function for later use
if (!window.__authCleanup) {
  window.__authCleanup = cleanup
}
  }

// Session management utilities
const extendSession = () => {
  updateActivity()
  isSessionExpired.value = false
  sessionWarningShown.value = false
  console.log('🔄 Session extended')
}

const getSessionInfo = () => {
  return {
    isActive: isSessionActive(),
    timeSinceLastActivity: getTimeSinceLastActivity(),
    timeUntilExpiry: Math.max(0, authState.value.sessionTimeout - getTimeSinceLastActivity()),
    isExpired: isSessionExpired.value,
    warningShown: sessionWarningShown.value
  }
}

// Cleanup function for component unmounting
const cleanup = () => {
  if (window.__authCleanup) {
    window.__authCleanup()
    delete window.__authCleanup
  }
}

// Auto-initialize on client side
if (import.meta.client) {
  onMounted(() => {
    initializeAuth()
  })

  onUnmounted(() => {
    cleanup()
  })
}

return {
  // Enhanced State
  user: readonly(authStore.user),
  isAuthenticated: readonly(authStore.isAuthenticated),
  loading: readonly(authStore.loading),
  error: readonly(authStore.error),
  authState: readonly(authState),
  authErrors: readonly(authErrors),
  isSessionExpired: readonly(isSessionExpired),

  // Enhanced Getters
  isAdmin: readonly(authStore.isAdmin),
  userInitials: readonly(authStore.userInitials),

  // Enhanced Authentication Actions
  login: loginWithErrorHandling,
  register: registerWithErrorHandling,
  logout: safeLogout,
  forceLogout,
  fetchProfile: authStore.fetchProfile,
  updateProfile: authStore.updateProfile,
  changePassword: authStore.changePassword,
  requestPasswordReset: authStore.requestPasswordReset,
  resetPassword: authStore.resetPassword,
  initializeAuth,

  // Enhanced Permission System
  hasRole,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,

  // Enhanced Guards
  requireAuth,
  requireAdmin,
  requireRole,
  requirePermission,

  // Enhanced Token Management
  getTokenInfo,
  isTokenValid,
  canRefreshToken,
  validateTokens,
  refreshTokenWithRetry,

  // Enhanced Session Management
  updateActivity,
  extendSession,
  getSessionInfo,
  isSessionActive,

  // Enhanced Status and Utilities
  getAuthStatus,
  checkAuthHealth,
  ensureAuthenticated,
  getLastAuthError,
  clearAuthErrors,
  addAuthError,

  // Store Utilities (Enhanced)
  clearAuthState: authStore.clearAuthState,
  refreshAuthIfNeeded: authStore.refreshAuthIfNeeded,

  // Cleanup
  cleanup
}
}