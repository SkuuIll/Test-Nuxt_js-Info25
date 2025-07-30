export default defineNuxtRouteMiddleware(async (to) => {
    // Skip middleware on server-side rendering to prevent hydration issues
    if (process.server) return

    // Wait for client-side hydration
    if (process.client) {
        const { isAuthenticated, initializeAuth, refreshAccessToken, logout } = useDashboardAuth()

        // Initialize auth state if not already done
        await initializeAuth()

        // Check if user is authenticated
        if (!isAuthenticated()) {
            // Only redirect if not already on login page
            if (to.path !== '/dashboard/login') {
                return navigateTo({
                    path: '/dashboard/login',
                    query: { redirect: to.fullPath }
                })
            }
        } else {
            // User is authenticated, try to refresh token if needed
            try {
                await refreshAccessToken()
            } catch (error) {
                console.error('Token refresh failed:', error)
                await logout(false)
                return navigateTo('/dashboard/login')
            }

            // Check if trying to access login page while authenticated
            if (to.path === '/dashboard/login') {
                return navigateTo('/dashboard')
            }
        }
    }
})