/**
 * Enhanced admin authentication middleware
 * Ensures user is authenticated and has admin privileges
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
  const {
    isAuthenticated,
    isAdmin,
    hasRole,
    requireAdmin,
    updateActivity,
    getAuthStatus,
    checkAuthHealth
  } = useAuth()

  try {
    // Update activity for session tracking
    updateActivity()

    // First ensure basic authentication
    if (!isAuthenticated.value) {
      console.log('🔒 Admin route requires authentication, redirecting to login')

      const redirectTo = to.fullPath !== '/login' ? to.fullPath : undefined
      return navigateTo({
        path: '/login',
        query: redirectTo ? { redirect: redirectTo } : undefined
      })
    }

    // Check authentication health
    const healthCheck = await checkAuthHealth()
    if (healthCheck.status === 'critical') {
      console.log('🚨 Critical authentication issues for admin route:', healthCheck.issues)

      const redirectTo = to.fullPath !== '/login' ? to.fullPath : undefined
      return navigateTo({
        path: '/login',
        query: redirectTo ? { redirect: redirectTo } : undefined
      })
    }

    // Check admin privileges
    if (!isAdmin.value && !hasRole('admin') && !hasRole('staff')) {
      console.log('🚫 Admin access denied - insufficient privileges')

      // Redirect to unauthorized page or dashboard
      return navigateTo('/unauthorized')
    }

    // Use the enhanced requireAdmin function for comprehensive checking
    try {
      await requireAdmin({
        redirectTo: '/unauthorized',
        message: 'Administrator access required'
      })

      console.log('✅ Admin access verified for route:', to.path)
    } catch (error) {
      console.error('❌ Admin verification failed:', error)

      // The requireAdmin function handles redirection, but we catch any errors
      if (!error.statusCode) {
        return navigateTo('/unauthorized')
      }
    }

  } catch (error) {
    console.error('❌ Admin middleware error:', error)

    // On any error, redirect to unauthorized page
    return navigateTo('/unauthorized')
  }
})