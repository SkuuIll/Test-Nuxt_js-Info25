/**
 * Enhanced authentication middleware for protected routes
 * Ensures user is authenticated and has valid tokens before accessing protected pages
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
  const {
    isAuthenticated,
    initializeAuth,
    getAuthStatus,
    ensureAuthenticated,
    checkAuthHealth,
    updateActivity
  } = useAuth()

  try {
    // Update activity for session tracking
    updateActivity()

    // Initialize auth on client side if not already done
    if (import.meta.client && !isAuthenticated.value) {
      console.log('🔄 Initializing authentication in middleware...')
      try {
        await initializeAuth()
      } catch (error) {
        console.warn('⚠️ Auth initialization failed in middleware:', error)
      }
    }

    // Perform comprehensive authentication check
    const authStatus = getAuthStatus()
    const healthCheck = await checkAuthHealth()

    // Log authentication status for debugging
    console.log('🔍 Auth middleware check:', {
      isAuthenticated: isAuthenticated.value,
      hasValidTokens: authStatus.hasValidTokens,
      healthStatus: healthCheck.status,
      route: to.path
    })

    // If authentication is critical (not healthy), redirect to login
    if (healthCheck.status === 'critical' || !isAuthenticated.value) {
      console.log('🔒 Authentication required, redirecting to login')
      console.log('Issues:', healthCheck.issues)

      // Store the intended destination for post-login redirect
      const redirectTo = to.fullPath !== '/login' ? to.fullPath : undefined

      return navigateTo({
        path: '/login',
        query: redirectTo ? { redirect: redirectTo } : undefined
      })
    }

    // If authentication has warnings, try to resolve them
    if (healthCheck.status === 'warning') {
      console.log('⚠️ Authentication warnings detected:', healthCheck.issues)

      try {
        // Attempt to ensure authentication is fully valid
        await ensureAuthenticated({
          forceRefresh: false,
          checkSession: true,
          maxRetries: 2,
          validateWithBackend: false
        })
        console.log('✅ Authentication warnings resolved')
      } catch (error) {
        console.error('❌ Failed to resolve authentication warnings:', error)

        // If we can't resolve warnings, redirect to login
        const redirectTo = to.fullPath !== '/login' ? to.fullPath : undefined
        return navigateTo({
          path: '/login',
          query: redirectTo ? { redirect: redirectTo } : undefined
        })
      }
    }

    // Authentication is healthy, allow navigation
    console.log('✅ Authentication verified, allowing navigation to:', to.path)

  } catch (error) {
    console.error('❌ Authentication middleware error:', error)

    // On any error, redirect to login for safety
    const redirectTo = to.fullPath !== '/login' ? to.fullPath : undefined
    return navigateTo({
      path: '/login',
      query: redirectTo ? { redirect: redirectTo } : undefined
    })
  }
})