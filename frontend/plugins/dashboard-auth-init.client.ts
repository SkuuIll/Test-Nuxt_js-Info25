export default defineNuxtPlugin(async () => {
    const { initializeAuth } = useDashboardAuth()

    // Initialize dashboard authentication state on app startup
    try {
        await initializeAuth()
    } catch (error) {
        console.error('Error initializing dashboard auth on startup:', error)
    }
})