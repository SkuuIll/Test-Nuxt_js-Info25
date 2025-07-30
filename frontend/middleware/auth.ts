export default defineNuxtRouteMiddleware(async (to) => {
  // Skip on server-side to prevent hydration issues
  if (process.server) return

  const { isAuthenticated, initializeAuth } = useAuth()

  // Initialize auth state if not already done
  if (process.client) {
    await initializeAuth()
  }

  // Check if user is authenticated
  if (!isAuthenticated.value) {
    // Store the intended destination
    const redirectTo = to.fullPath

    // Redirect to login with return URL
    return navigateTo({
      path: '/login',
      query: { redirect: redirectTo }
    })
  }
})