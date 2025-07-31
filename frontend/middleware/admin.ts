/**
 * Admin middleware for admin-only routes
 * Ensures user is authenticated and has admin privileges
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
  const { isAuthenticated, isAdmin, initializeAuth, getAuthStatus } = useAuth()

  // Initialize auth on client side if not already done
  if (import.meta.client && !isAuthenticated.value) {
    try {
      await initializeAuth()
    } catch (error) {
      console.warn('Auth initialization failed in admin middleware:', error)
    }
  }

  // Check authentication status
  const authStatus = getAuthStatus()

  if (!isAuthenticated.value || !authStatus.hasValidTokens) {
    console.log('🔒 Authentication required for admin route, redirecting to login')

    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  }

  // Check admin privileges
  if (!isAdmin.value) {
    console.log('🚫 Admin privileges required, access denied')

    throw createError({
      statusCode: 403,
      statusMessage: 'Admin access required'
    })
  }
})