/**
 * Guest middleware for guest-only routes (login, register)
 * Redirects authenticated users away from auth pages
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only run on client side
  if (!import.meta.client) return

  try {
    const authStore = useAuthStore()
    const api = useApi()

    // Check if user has valid tokens
    const tokens = api.tokenUtils.getTokens()

    if (tokens.access && !api.tokenUtils.isTokenExpired(tokens.access)) {
      // User has valid tokens, check if authenticated in store
      if (authStore.isAuthenticated) {
        console.log('👤 User already authenticated, redirecting from guest route')

        // Check if there's a redirect query parameter
        const redirectTo = to.query.redirect as string

        return navigateTo(redirectTo || '/')
      }
    }

    // If tokens exist but user is not authenticated in store, try to initialize
    if (tokens.access && !authStore.isAuthenticated) {
      try {
        await authStore.initializeAuth()

        // After initialization, check again
        if (authStore.isAuthenticated) {
          console.log('👤 User authenticated after initialization, redirecting from guest route')
          const redirectTo = to.query.redirect as string
          return navigateTo(redirectTo || '/')
        }
      } catch (error) {
        console.warn('Auth initialization failed in guest middleware:', error)
        // Clear invalid tokens
        api.tokenUtils.clearTokens()
      }
    }

  } catch (error) {
    console.error('Error in guest middleware:', error)
  }
})