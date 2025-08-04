/**
 * Consolidated Authentication Plugin
 * Handles both regular and dashboard authentication initialization
 */
export default defineNuxtPlugin(async () => {
    const { initializeAuth, getAuthStatus, checkAuthHealth } = useAuth()
    const route = useRoute()

    try {
        // Initialize main authentication
        await initializeAuth({
            enableAutoRefresh: true,
            sessionTimeout: 30 * 60 * 1000 // 30 minutes
        })

        // Get authentication status
        const authStatus = getAuthStatus()
        const healthCheck = await checkAuthHealth()

        // Handle dashboard-specific authentication if on dashboard route
        const isDashboardRoute = route.path.startsWith('/dashboard') || route.path.startsWith('/admin')

        if (isDashboardRoute) {
            // Additional dashboard auth checks can be added here if needed
            if (authStatus.isAuthenticated && !authStatus.user?.is_staff) {
                // Redirect non-staff users away from dashboard
                await navigateTo('/')
                return
            }
        }

        // Log authentication status (only in development)
        if (process.dev) {
            if (authStatus.isAuthenticated) {
                console.log('✅ User authenticated:', {
                    username: authStatus.user?.username,
                    isStaff: authStatus.user?.is_staff,
                    route: route.path
                })
            }

            if (healthCheck.status === 'warning') {
                console.warn('⚠️ Authentication warnings:', healthCheck.issues)
            }
        }

    } catch (error) {
        // Don't throw error to prevent app from breaking
        if (process.dev) {
            console.warn('⚠️ Authentication initialization failed:', error)
        }
    }
})