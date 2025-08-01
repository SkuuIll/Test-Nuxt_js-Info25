/**
 * Authentication middleware for protected routes
 * Redirects unauthenticated users to login page
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only run on client side
  if (!import.meta.client) return

  try {
    const authStore = useAuthStore()
    const api = useApi()

    // Check if user has valid tokens
    const tokens = api.tokenUtils.getTokens()

    if (!tokens.access || api.tokenUtils.isTokenExpired(tokens.access)) {
      console.log('🔒 No valid tokens, redirecting to login')

      // Store the intended route for redirect after login
      const redirectPath = to.fullPath !== '/login' ? to.fullPath : '/'

      return navigateTo(`/login?redirect=${encodeURIComponent(redirectPath)}`)
    }

    // If tokens exist but user is not authenticated in store, try to initialize
    if (!authStore.isAuthenticated) {
      try {
        await authStore.initializeAuth()

        // After initialization, check if user is authenticated
        if (!authStore.isAuthenticated) {
          console.log('🔒 Authentication initialization failed, redirecting to login')

          // Clear invalid tokens
          api.tokenUtils.clearTokens()

          const redirectPath = to.fullPath !== '/login' ? to.fullPath : '/'
          return navigateTo(`/login?redirect=${encodeURIComponent(redirectPath)}`)
        }
      } catch (error) {
        console.warn('Auth initialization failed in auth middleware:', error)

        // Clear invalid tokens
        api.tokenUtils.clearTokens()

        const redirectPath = to.fullPath !== '/login' ? to.fullPath : '/'
        return navigateTo(`/login?redirect=${encodeURIComponent(redirectPath)}`)
      }
    }

    console.log('✅ User authenticated, allowing access to protected route')

  } catch (error) {
    console.error('Error in auth middleware:', error)

    // On error, redirect to login
    const redirectPath = to.fullPath !== '/login' ? to.fullPath : '/'
    return navigateTo(`/login?redirect=${encodeURIComponent(redirectPath)}`)
  }
})