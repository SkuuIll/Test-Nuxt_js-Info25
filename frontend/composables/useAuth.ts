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

interface AuthErrorInfo {
  message: string
  type: 'auth' | 'validation' | 'network' | 'server'
  code?: string | number
  details?: any
  userFriendly: boolean
}

interface AuthRedirectOptions {
  message?: string
  storeRoute?: boolean
  loginUrl?: string
}

interface PermissionRedirectOptions {
  message?: string
  requiredPermissions?: string[]
  redirectUrl?: string
}

export const useAuth = () => {
  const authStore = useAuthStore()
  const api = useApi()
  const router = useRouter()



  const handleValidationError = (error: any, context?: string) => {
    console.error('📝 Validation Error:', context || 'Unknown context', error)

    // Extract validation errors for display
    const validationErrors = error?.data?.errors || error?.errors || {}
    console.log('Validation errors:', validationErrors)
  }

  const handleNetworkError = (error: any, context?: string) => {
    console.error('🌐 Network Error:', context || 'Unknown context', error)

    // Handle network connectivity issues
    if (import.meta.client && navigator.onLine === false) {
      console.warn('🔌 Device appears to be offline')
    }
  }

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
  const login = async (credentials: LoginCredentials) => {
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

      // Use consolidated error handling
      const errorInfo = handleLoginError(error)

      addAuthError({
        type: errorInfo.type as AuthError['type'],
        message: errorInfo.message,
        code: errorInfo.code,
        details: errorInfo.details
      })

      throw error
    }
  }

  // Enhanced register with comprehensive error handling
  const register = async (data: RegisterData) => {
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

      // Use consolidated error handling
      const errorInfo = handleRegistrationError(error)

      addAuthError({
        type: errorInfo.type as AuthError['type'],
        message: errorInfo.message,
        code: errorInfo.code,
        details: errorInfo.details
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

  const getSessionInfo = () => {
    const timeSinceLastActivity = getTimeSinceLastActivity()
    const timeUntilExpiry = Math.max(0, authState.value.sessionTimeout - timeSinceLastActivity)

    return {
      isActive: isSessionActive(),
      timeSinceLastActivity,
      timeUntilExpiry,
      sessionTimeout: authState.value.sessionTimeout,
      lastActivity: new Date(authState.value.lastActivity),
      expiresAt: new Date(authState.value.lastActivity + authState.value.sessionTimeout),
      willExpireAt: new Date(authState.value.lastActivity + authState.value.sessionTimeout),
      isExpiringSoon: timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0,
      isExpired: timeUntilExpiry <= 0
    }
  }

  // Enhanced logout with comprehensive cleanup
  const logout = async (options: {
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

      // Show appropriate message using consolidated functions
      if (showMessage) {
        switch (reason) {
          case 'session_expired':
            await handleSessionExpired()
            return // handleSessionExpired already handles navigation
          case 'token_invalid':
            const { warning } = useToast()
            warning('Error de Autenticación', 'Tu sesión ya no es válida. Por favor inicia sesión nuevamente.')
            break
          case 'security':
            const { info } = useToast()
            info('Logout de Seguridad', 'Has sido desconectado por razones de seguridad.')
            break
          case 'user':
          default:
            await handleLogout(redirectTo)
            return // handleLogout already handles navigation
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
      clearAuthErrors()
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

  // Global cleanup function
  const cleanup = () => {
    if (authState.value.cleanup) {
      authState.value.cleanup()
    }
    clearAuthErrors()
  }





  // Auto-initialize on client side (only if we're in a component context)
  if (import.meta.client && getCurrentInstance()) {
    onMounted(() => {
      initializeAuth()
    })

    onUnmounted(() => {
      cleanup()
    })
  }

  // ===== ERROR HANDLING FUNCTIONS (from useAuthErrorHandler) =====

  const categorizeError = (error: any): AuthErrorInfo['type'] => {
    const status = error?.status || error?.statusCode

    if (!status || status === 0) {
      return 'network'
    }

    if (status === 401 || status === 403) {
      return 'auth'
    }

    if (status === 422 || status === 400) {
      return 'validation'
    }

    if (status >= 500) {
      return 'server'
    }

    return 'auth'
  }

  const getErrorMessage = (error: any, type: AuthErrorInfo['type']): string => {
    // Handle Django API error format
    if (error?.data?.success === false) {
      if (error.data.message) {
        return error.data.message
      }
      if (error.data.error) {
        return error.data.error
      }
    }

    // Handle validation errors
    if (type === 'validation' && error?.data?.errors) {
      const errors = error.data.errors
      if (typeof errors === 'object') {
        const errorMessages = Object.entries(errors).map(([field, messages]) => {
          const messageArray = Array.isArray(messages) ? messages : [messages]
          return `${field}: ${messageArray.join(', ')}`
        })
        return errorMessages.join('; ')
      }
    }

    // Handle standard error formats
    if (error?.message) {
      return error.message
    }

    if (error?.data?.detail) {
      return error.data.detail
    }

    // Default messages by type
    const defaultMessages = {
      auth: 'Error de autenticación. Verifica tus credenciales.',
      validation: 'Los datos ingresados no son válidos.',
      network: 'Error de conexión. Verifica tu conexión a internet.',
      server: 'Error del servidor. Intenta nuevamente más tarde.'
    }

    return defaultMessages[type]
  }

  const handleAuthError = (error: any, context?: string): AuthErrorInfo => {
    const type = categorizeError(error)
    const message = getErrorMessage(error, type)

    const errorInfo: AuthErrorInfo = {
      message,
      type,
      code: error?.status || error?.statusCode,
      details: error,
      userFriendly: true
    }

    // Log technical details for debugging
    console.error(`🔐 Auth Error [${type.toUpperCase()}]:`, {
      context: context || 'Unknown',
      message: errorInfo.message,
      code: errorInfo.code,
      originalError: error
    })

    return errorInfo
  }

  const handleLoginError = (error: any): AuthErrorInfo => {
    const errorInfo = handleAuthError(error, 'Login')

    // Customize login-specific messages
    if (errorInfo.type === 'auth') {
      if (errorInfo.code === 401) {
        errorInfo.message = 'Usuario o contraseña incorrectos'
      } else if (errorInfo.code === 403) {
        errorInfo.message = 'Tu cuenta está desactivada. Contacta al administrador.'
      }
    }

    return errorInfo
  }

  const handleRegistrationError = (error: any): AuthErrorInfo => {
    const errorInfo = handleAuthError(error, 'Registration')

    // Customize registration-specific messages
    if (errorInfo.type === 'validation') {
      // Keep the detailed validation message for registration
      return errorInfo
    }

    if (errorInfo.type === 'auth' && errorInfo.code === 409) {
      errorInfo.message = 'Ya existe un usuario con este email o nombre de usuario'
    }

    return errorInfo
  }

  const handleTokenError = (error: any): AuthErrorInfo => {
    const errorInfo = handleAuthError(error, 'Token')

    if (errorInfo.type === 'auth') {
      errorInfo.message = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'
    }

    return errorInfo
  }

  const isRetryableError = (errorInfo: AuthErrorInfo): boolean => {
    return errorInfo.type === 'network' || errorInfo.type === 'server'
  }

  const shouldClearAuth = (errorInfo: AuthErrorInfo): boolean => {
    return errorInfo.type === 'auth' && (errorInfo.code === 401 || errorInfo.code === 403)
  }

  const getErrorActions = (errorInfo: AuthErrorInfo) => {
    const actions = []

    if (isRetryableError(errorInfo)) {
      actions.push({
        label: 'Reintentar',
        action: 'retry'
      })
    }

    if (shouldClearAuth(errorInfo)) {
      actions.push({
        label: 'Iniciar Sesión',
        action: 'login'
      })
    }

    if (errorInfo.type === 'network') {
      actions.push({
        label: 'Verificar Conexión',
        action: 'check_network'
      })
    }

    return actions
  }

  // ===== REDIRECT FUNCTIONS (from useAuthRedirect) =====

  const handleAuthRequired = async (options: AuthRedirectOptions = {}) => {
    const {
      message = 'Debes iniciar sesión para acceder a esta página',
      storeRoute = true,
      loginUrl = '/login'
    } = options

    // Show error message
    const { authError } = useToast()
    authError(message)

    // Store current route for redirect after login
    let redirectUrl = loginUrl
    if (storeRoute && router.currentRoute.value.fullPath !== loginUrl) {
      redirectUrl = `${loginUrl}?redirect=${encodeURIComponent(router.currentRoute.value.fullPath)}`
    }

    // Navigate to login
    await navigateTo(redirectUrl)
  }

  const handleInsufficientPermissions = async (options: PermissionRedirectOptions = {}) => {
    const {
      message = 'No tienes permisos para acceder a esta página',
      requiredPermissions = [],
      redirectUrl = '/unauthorized'
    } = options

    // Show error message with permission details
    const permissionText = requiredPermissions.length > 0
      ? ` Permisos requeridos: ${requiredPermissions.join(', ')}`
      : ''

    const { authError } = useToast()
    authError(message + permissionText)

    // Navigate to unauthorized page or specified redirect
    await navigateTo(redirectUrl)
  }

  const handleSessionExpired = async () => {
    const { warning } = useToast()

    warning(
      'Sesión Expirada',
      'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'
    )

    // Store current route for redirect after login
    const currentPath = router.currentRoute.value.fullPath
    const redirectUrl = currentPath !== '/login'
      ? `/login?redirect=${encodeURIComponent(currentPath)}`
      : '/login'

    await navigateTo(redirectUrl)
  }

  const handleSuccessfulAuth = async (redirectTo?: string) => {
    const { authSuccess } = useToast()

    authSuccess('¡Bienvenido! Has iniciado sesión correctamente')

    // Get redirect from query params or use provided redirect
    const targetUrl = redirectTo ||
      (router.currentRoute.value.query.redirect as string) ||
      '/'

    // Ensure we navigate to the home page by default
    console.log('🔄 Redirecting after successful auth to:', targetUrl)

    await navigateTo(targetUrl, { replace: true })
  }

  const handleSuccessfulRegistration = async (redirectTo?: string) => {
    const { authSuccess } = useToast()

    authSuccess('¡Cuenta creada exitosamente! Bienvenido al blog')

    // Get redirect from query params or use provided redirect
    const targetUrl = redirectTo ||
      (router.currentRoute.value.query.redirect as string) ||
      '/'

    await navigateTo(targetUrl)
  }

  const handleLogout = async (redirectTo: string = '/') => {
    const { success } = useToast()

    success('Sesión Cerrada', 'Has cerrado sesión exitosamente')

    await navigateTo(redirectTo)
  }

  const getRedirectUrl = (): string => {
    return (router.currentRoute.value.query.redirect as string) || '/'
  }

  const storeCurrentRoute = (): string => {
    return router.currentRoute.value.fullPath
  }

  return {
    // Enhanced State
    isAuthenticated: computed(() => authStore.isAuthenticated),
    user: computed(() => authStore.user),
    isAdmin: computed(() => authStore.isAdmin),
    isLoading: computed(() => authStore.isLoading),
    loading: computed(() => authStore.isLoading), // Alias for compatibility
    error: computed(() => authStore.error),

    // Enhanced Auth State
    authState: readonly(authState),
    authErrors: readonly(authErrors),
    isSessionExpired: readonly(isSessionExpired),
    sessionWarningShown: readonly(sessionWarningShown),

    // Enhanced Authentication Methods
    login,
    register,
    logout,
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

    // Error Handling Functions
    categorizeError,
    handleAuthError,
    handleLoginError,
    handleRegistrationError,
    handleTokenError,
    isRetryableError,
    shouldClearAuth,
    getErrorActions,

    // Redirect Functions
    handleAuthRequired,
    handleInsufficientPermissions,
    handleSessionExpired,
    handleSuccessfulAuth,
    handleSuccessfulRegistration,
    handleLogout,
    getRedirectUrl,
    storeCurrentRoute,

    // Cleanup
    cleanup
  }
}