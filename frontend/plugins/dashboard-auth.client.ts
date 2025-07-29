export default defineNuxtPlugin(() => {
    const { refreshAccessToken, isAuthenticated, initializeAuth } = useDashboardAuth()

    // Initialize auth on plugin load
    initializeAuth()

    // Provide auth methods globally
    return {
        provide: {
            auth: {
                isAuthenticated,
                refreshAccessToken,
                initializeAuth
            }
        }
    }
})