/**
 * Authentication initialization plugin
 * Automatically initializes authentication on client-side app startup
 */
export default defineNuxtPlugin(async () => {
    const { initializeAuth, getAuthStatus, checkAuthHealth } = useAuth()

    try {
        console.log('🚀 Starting authentication initialization plugin...')

        // Initialize authentication
        await initializeAuth({
            enableAutoRefresh: true,
            sessionTimeout: 30 * 60 * 1000 // 30 minutes
        })

        // Get initial status
        const authStatus = getAuthStatus()
        const healthCheck = await checkAuthHealth()

        console.log('📊 Initial authentication status:', {
            isAuthenticated: authStatus.isAuthenticated,
            hasValidTokens: authStatus.hasValidTokens,
            healthStatus: healthCheck.status,
            warnings: healthCheck.issues
        })

        // Log any warnings
        if (healthCheck.status === 'warning') {
            console.warn('⚠️ Authentication warnings:', healthCheck.issues)
            console.log('💡 Recommendations:', healthCheck.recommendations)
        }

        console.log('✅ Authentication initialization plugin completed')

    } catch (error) {
        console.error('❌ Authentication initialization plugin failed:', error)

        // Don't throw error to prevent app from breaking
        // The auth system will handle authentication as needed
    }
})