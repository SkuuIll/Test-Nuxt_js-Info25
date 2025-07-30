export default defineNuxtPlugin(async () => {
    const { initializeAuth } = useAuth()

    // Initialize authentication state on app startup
    try {
        await initializeAuth()
    } catch (error) {
        console.error('Error initializing auth on startup:', error)
    }
})