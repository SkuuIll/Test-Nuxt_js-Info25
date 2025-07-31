/**
 * Authentication middleware for protected routes
 * Ensures user is authenticated before accessing protected pages
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
  const { isAuthenticated, initializeAuth, getAuthStatus } = useAuth()

  // Initialize auth on client side if not already done
  if (import.meta.client && !isAuthenticated.value) {
    try {
      await initializeAuth()
    } catch (error) {
      console.warn('Auth initialization failed in middleware:', error)
    }
  }

  // Check authentication status
  const authStatus = getAuthStatus()

  if (!isAuthenticated.value || !authStatus.hasValidTokens) {
    console.log('🔒 Authentication required, redirecting to login')

    // Store the intended destination
    const redirectTo = to.fullPath !== '/login' ? to.fullPath : undefined

    return navigateTo({
      path: '/login',
      query: redirectTo ? { redirect: redirectTo } : undefined
    })
  }
})