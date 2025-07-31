/**
 * Authentication plugin for client-side initialization
 * Automatically initializes authentication state on app startup
 */
export default defineNuxtPlugin(async () => {
    const { initializeAuth, isAuthenticated, user } = useAuth()

    // Initialize authentication on client startup
    try {
        console.log('🚀 Initializing authentication plugin...')
        await initializeAuth()

        if (isAuthenticated.value) {
            console.log('✅ User authenticated on startup:', {
                username: user.value?.username,
                isStaff: user.value?.is_staff
            })
        } else {
            console.log('ℹ️ No authenticated user on startup')
        }
    } catch (error) {
        console.warn('⚠️ Authentication initialization failed:', error)
    }
})