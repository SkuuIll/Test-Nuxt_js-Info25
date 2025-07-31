/**
 * Dashboard authentication middleware
 * Ensures user is authenticated for dashboard access
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
    const {
        isAuthenticated,
        initializeDashboardAuth,
        checkDashboardAuthStatus,
        requireDashboardAuth
    } = useDashboardAuth()

    // Initialize dashboard auth on client side if not already done
    if (import.meta.client && !isAuthenticated.value) {
        try {
            await initializeDashboardAuth()
        } catch (error) {
            console.warn('Dashboard auth initialization failed in middleware:', error)
        }
    }

    // Check dashboard authentication status
    const authStatus = checkDashboardAuthStatus()

    if (!isAuthenticated.value || !authStatus.hasValidTokens) {
        console.log('🔒 Dashboard authentication required, redirecting to dashboard login')

        // Store the intended destination
        const redirectTo = to.fullPath !== '/dashboard/login' ? to.fullPath : undefined

        return navigateTo({
            path: '/dashboard/login',
            query: redirectTo ? { redirect: redirectTo } : undefined
        })
    }

    // Ensure authentication is still valid
    try {
        await requireDashboardAuth()
    } catch (error) {
        console.error('Dashboard authentication validation failed:', error)
        return navigateTo('/dashboard/login')
    }
})