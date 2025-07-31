/**
 * Dashboard authentication plugin for client-side initialization
 * Automatically initializes dashboard authentication state on app startup
 */
export default defineNuxtPlugin(async () => {
    const {
        initializeDashboardAuth,
        isAuthenticated,
        user,
        checkDashboardAuthStatus
    } = useDashboardAuth()

    // Only initialize if we're on a dashboard route
    const route = useRoute()
    const isDashboardRoute = route.path.startsWith('/dashboard')

    if (isDashboardRoute) {
        try {
            console.log('🚀 Initializing dashboard authentication plugin...')

            await initializeDashboardAuth()

            const authStatus = checkDashboardAuthStatus()

            if (isAuthenticated.value && authStatus.hasValidTokens) {
                console.log('✅ Dashboard user authenticated on startup:', {
                    username: user.value?.username,
                    isStaff: user.value?.is_staff,
                    permissions: user.value?.permissions
                })
            } else {
                console.log('ℹ️ No authenticated dashboard user on startup')
            }
        } catch (error) {
            console.warn('⚠️ Dashboard authentication initialization failed:', error)
        }
    }
})