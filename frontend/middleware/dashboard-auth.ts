export default defineNuxtRouteMiddleware((to) => {
    // Skip middleware on server-side rendering to prevent hydration issues
    if (process.server) return

    // Wait for client-side hydration
    if (process.client) {
        const { isAuthenticated } = useDashboardAuth()

        // Check if user is authenticated
        if (!isAuthenticated()) {
            // Only redirect if not already on login page
            if (to.path !== '/dashboard/login') {
                return navigateTo('/dashboard/login')
            }
        }

        // Check if trying to access login page while authenticated
        if (to.path === '/dashboard/login' && isAuthenticated()) {
            return navigateTo('/dashboard')
        }
    }
})