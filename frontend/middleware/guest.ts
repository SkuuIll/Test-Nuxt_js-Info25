/**
 * Guest middleware for guest-only routes (login, register)
 * Redirects authenticated users away from auth pages
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
  const { isAuthenticated, initializeAuth, getAuthStatus } = useAuth()

  // Initialize auth on client side if not already done
  if (import.meta.client) {
    try {
      await initializeAuth()
    } catch (error) {
      console.warn('Auth initialization failed in guest middleware:', error)
    }
  }

  // Check authentication status
  const authStatus = getAuthStatus()

  if (isAuthenticated.value && authStatus.hasValidTokens) {
    console.log('👤 User already authenticated, redirecting from guest route')

    // Check if there's a redirect query parameter
    const redirectTo = to.query.redirect as string

    return navigateTo(redirectTo || '/')
  }
})